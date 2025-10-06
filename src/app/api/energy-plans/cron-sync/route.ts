import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { ALL_RETAILERS, CDR_CONFIG, getRetailerEndpoint, type CDRRetailer } from '@/lib/cdr-retailers'

// Helper function to generate coverage report
async function generateCoverageReport(prisma: PrismaClient) {
  // Get DB counts
  const totalPlansInDB = await prisma.energyPlan.count()
  const byRetailer = await prisma.energyPlan.groupBy({
    by: ['retailerName'],
    _count: { id: true }
  })

  const dbCountMap = new Map(
    byRetailer.map(r => [r.retailerName.toLowerCase(), r._count.id])
  )

  // Check each retailer
  const retailersWithZeroPlans: { name: string; reason: string }[] = []
  let tier1000Plus = 0
  let tier500to999 = 0
  let tier100to499 = 0
  let tierUnder100 = 0

  for (const retailer of ALL_RETAILERS) {
    const dbCount = dbCountMap.get(retailer.name.toLowerCase()) || 0

    if (dbCount >= 1000) tier1000Plus++
    else if (dbCount >= 500) tier500to999++
    else if (dbCount >= 100) tier100to499++
    else if (dbCount >= 1) tierUnder100++
    else {
      // Check API to see why 0 plans
      try {
        const endpoint = `${getRetailerEndpoint(retailer)}&page=1`
        const response = await fetch(endpoint, {
          headers: CDR_CONFIG.headers,
          signal: AbortSignal.timeout(5000)
        })

        if (!response.ok) {
          retailersWithZeroPlans.push({
            name: retailer.name,
            reason: `API error ${response.status}`
          })
          continue
        }

        const data = await response.json()
        const plans = data.data?.plans || []
        const meta = data.meta || {}

        if (plans.length === 0) {
          retailersWithZeroPlans.push({
            name: retailer.name,
            reason: 'No plans available in API'
          })
        } else {
          // Check if all plans are gas
          const electricityPlans = plans.filter((p: any) =>
            p.fuelType === 'ELECTRICITY' || p.fuelType === 'DUAL'
          )

          if (electricityPlans.length === 0) {
            retailersWithZeroPlans.push({
              name: retailer.name,
              reason: `Gas only (${plans.length} gas plans)`
            })
          } else {
            retailersWithZeroPlans.push({
              name: retailer.name,
              reason: `Not synced yet (${electricityPlans.length} electricity plans available)`
            })
          }
        }
      } catch (error) {
        retailersWithZeroPlans.push({
          name: retailer.name,
          reason: 'API timeout or error'
        })
      }
    }
  }

  return {
    totalPlansInDB,
    retailersWithPlans: ALL_RETAILERS.length - retailersWithZeroPlans.length,
    retailersWithZeroPlans,
    tier1000Plus,
    tier500to999,
    tier100to499,
    tierUnder100
  }
}

// GET /api/energy-plans/cron-sync - Automated CDR sync (called by Vercel cron)
// Syncs ALL_RETAILERS with comprehensive reporting
// Uses the new parallel chunk infrastructure for fast syncing
export async function GET(request: NextRequest) {
  const prisma = new PrismaClient()

  try {
    // Security: Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'batteryiq-cron-2025'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - invalid cron secret'
      }, { status: 401 })
    }

    console.log('🤖 Starting automated CDR sync for ALL_RETAILERS...')
    console.log(`📊 Syncing ${ALL_RETAILERS.length} retailers`)

    const startTime = Date.now()

    // Sync ALL_RETAILERS by calling the sync API without a specific retailer
    // Setting priorityOnly=false to sync all retailers
    const syncUrl = `${request.nextUrl.origin}/api/energy-plans/sync-cdr?priorityOnly=false`

    console.log(`🔗 Calling sync API: ${syncUrl}`)

    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/event-stream'
      }
    })

    if (!response.ok) {
      throw new Error(`Sync API returned ${response.status}`)
    }

    // Read and log the SSE stream
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let lastResult: any = null
    let messageCount = 0

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              // Log progress messages
              if (data.message) {
                console.log(data.message)
                messageCount++
              }

              // Capture final result
              if (data.done) {
                lastResult = data
              }
            } catch (e) {
              // Ignore parse errors for non-JSON lines
            }
          }
        }
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000)
    const totalPlans = lastResult?.totalPlans || 0

    console.log(`\n✅ Cron sync complete!`)
    console.log(`   Duration: ${duration}s (${Math.round(duration / 60)}m)`)
    console.log(`   Total plans processed: ${totalPlans}`)
    console.log(`   Messages logged: ${messageCount}`)

    // PHASE 2: Generate comprehensive report
    console.log('\n📊 Generating comprehensive coverage report...')

    const report = await generateCoverageReport(prisma)

    console.log('\n📋 SYNC REPORT:')
    console.log('='.repeat(80))
    console.log(`Database Total: ${report.totalPlansInDB} plans`)
    console.log(`Retailers with plans: ${report.retailersWithPlans}/${ALL_RETAILERS.length}`)
    console.log(`Retailers with 0 plans: ${report.retailersWithZeroPlans.length}`)
    console.log('='.repeat(80))

    if (report.retailersWithZeroPlans.length > 0) {
      console.log('\n⚠️  Retailers with 0 plans:')
      report.retailersWithZeroPlans.forEach(r => {
        console.log(`   - ${r.name}: ${r.reason}`)
      })
    }

    console.log(`\n📈 Coverage by tier:`)
    console.log(`   1000+ plans: ${report.tier1000Plus} retailers`)
    console.log(`   500-999 plans: ${report.tier500to999} retailers`)
    console.log(`   100-499 plans: ${report.tier100to499} retailers`)
    console.log(`   1-99 plans: ${report.tierUnder100} retailers`)
    console.log(`   0 plans: ${report.retailersWithZeroPlans.length} retailers`)

    return NextResponse.json({
      success: true,
      duration,
      totalPlans,
      retailers: lastResult?.retailers || [],
      timestamp: new Date().toISOString(),
      messagesLogged: messageCount,
      report
    })

  } catch (error) {
    console.error('❌ Cron sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST endpoint for manual trigger from admin UI
export async function POST(request: NextRequest) {
  return GET(request)
}
