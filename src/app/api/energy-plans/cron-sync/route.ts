import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { ALL_RETAILERS } from '@/lib/cdr-retailers'

const prisma = new PrismaClient()

// GET /api/energy-plans/cron-sync - Automated CDR sync (called by Vercel cron or manual trigger)
// Requires secret token for security
export async function GET(request: NextRequest) {
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

    console.log('🤖 Starting automated CDR sync...')

    const startTime = Date.now()
    const results: { retailer: string; new: number; updated: number; errors: number }[] = []

    // Sync all top retailers (Big 3 + major retailers)
    // This includes: Origin, AGL, EnergyAustralia, Red Energy, Alinta, Momentum, Powershop, GloBird, CovaU, ENGIE
    const retailersToSync = TOP_RETAILERS

    for (const retailer of retailersToSync) {
      console.log(`\n📡 Syncing ${retailer.name}...`)

      try {
        let cursor = 0
        let totalNew = 0
        let totalUpdated = 0
        let hasMore = true

        // Process in chunks of 50 until complete
        while (hasMore) {
          const params = new URLSearchParams({
            retailer: retailer.slug,
            cursor: cursor.toString(),
            chunkSize: '50'
          })

          // Call our sync API internally
          const syncUrl = `${request.nextUrl.origin}/api/energy-plans/sync-cdr?${params}`
          const response = await fetch(syncUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })

          // Read SSE stream
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let lastData: any = null

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
                    lastData = JSON.parse(line.slice(6))
                  } catch (e) {
                    // Ignore parse errors
                  }
                }
              }
            }
          }

          // Check if we need to continue
          if (lastData && !lastData.done && lastData.nextCursor !== null) {
            cursor = lastData.nextCursor
            hasMore = true

            // Extract stats from this chunk
            if (lastData.retailers?.[0]) {
              totalNew += lastData.retailers[0].plans || 0
            }
          } else {
            hasMore = false

            // Final chunk stats
            if (lastData && lastData.retailers?.[0]) {
              totalUpdated += lastData.retailers[0].plans || 0
            }
          }

          // Small delay between chunks to be nice to the API
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        results.push({
          retailer: retailer.name,
          new: totalNew,
          updated: totalUpdated,
          errors: 0
        })

        console.log(`✅ ${retailer.name}: ${totalNew + totalUpdated} plans synced`)

      } catch (error) {
        console.error(`❌ Error syncing ${retailer.name}:`, error)
        results.push({
          retailer: retailer.name,
          new: 0,
          updated: 0,
          errors: 1
        })
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000)
    const totalPlans = results.reduce((sum, r) => sum + r.new + r.updated, 0)

    console.log(`\n✅ Cron sync complete! ${totalPlans} plans synced in ${duration}s`)

    // TODO: Send email notification with results summary
    // This would require email service integration (SendGrid, Resend, etc.)

    return NextResponse.json({
      success: true,
      duration,
      totalPlans,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Cron sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST endpoint for manual trigger from admin UI
export async function POST(request: NextRequest) {
  return GET(request)
}
