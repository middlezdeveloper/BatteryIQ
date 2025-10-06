import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { TOP_RETAILERS } from '@/lib/cdr-retailers'

// GET /api/energy-plans/cron-sync - Automated CDR sync (called by Vercel cron)
// Syncs TOP_RETAILERS (Big 3 + major tier 2) - the most important retailers
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

    console.log('🤖 Starting automated CDR sync for TOP_RETAILERS...')
    console.log(`📊 Syncing ${TOP_RETAILERS.length} priority retailers`)

    const startTime = Date.now()

    // Sync all TOP_RETAILERS by calling the sync API without a specific retailer
    // This triggers the default behavior which syncs TOP_RETAILERS
    const syncUrl = `${request.nextUrl.origin}/api/energy-plans/sync-cdr`

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

    return NextResponse.json({
      success: true,
      duration,
      totalPlans,
      retailers: lastResult?.retailers || [],
      timestamp: new Date().toISOString(),
      messagesLogged: messageCount
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
