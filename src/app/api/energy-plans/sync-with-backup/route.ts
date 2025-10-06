import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

/**
 * POST /api/energy-plans/sync-with-backup
 *
 * Safe sync endpoint that:
 * 1. Creates database backup
 * 2. Triggers sync
 * 3. Validates results
 * 4. Sends email notification (future)
 *
 * Query params:
 * - forceSync: true/false (weekly full refresh)
 * - retailer: specific retailer slug
 * - chunkSize: number of plans per chunk
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const forceSync = searchParams.get('forceSync') === 'true'
  const retailer = searchParams.get('retailer')
  const chunkSize = searchParams.get('chunkSize') || '100'

  const startTime = new Date()
  let backupDir: string | null = null

  try {
    console.log('🔒 SAFE SYNC START:', {
      forceSync,
      retailer,
      timestamp: startTime.toISOString()
    })

    // STEP 1: Create backup
    console.log('\n📦 STEP 1: Creating database backup...')
    try {
      const { stdout, stderr } = await execAsync('npx tsx scripts/backup-db.ts', {
        cwd: process.cwd(),
        timeout: 300000 // 5 minute timeout
      })

      // Extract backup directory from output
      const match = stdout.match(/📁 Location: (.+)/)
      if (match) {
        backupDir = match[1].trim()
        console.log('✅ Backup created:', backupDir)
      }

      if (stderr) {
        console.warn('⚠️  Backup warnings:', stderr)
      }
    } catch (error) {
      console.error('❌ Backup failed:', error)
      return NextResponse.json({
        success: false,
        error: 'Database backup failed - sync aborted for safety',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    // STEP 2: Get pre-sync counts
    console.log('\n📊 STEP 2: Recording pre-sync state...')
    const preSync = {
      totalPlans: await prisma.energyPlan.count(),
      activePlans: await prisma.energyPlan.count({ where: { isActive: true } }),
      retailers: await prisma.energyPlan.groupBy({
        by: ['retailerId'],
        _count: true
      })
    }
    console.log('Pre-sync state:', preSync)

    // STEP 3: Trigger sync
    console.log('\n🔄 STEP 3: Triggering sync...')
    const syncUrl = new URL(`${request.nextUrl.origin}/api/energy-plans/sync-cdr`)
    if (forceSync) syncUrl.searchParams.set('forceSync', 'true')
    if (retailer) syncUrl.searchParams.set('retailer', retailer)
    syncUrl.searchParams.set('chunkSize', chunkSize)

    console.log('Sync URL:', syncUrl.toString())

    // Note: Sync uses SSE streaming, so we need to handle it differently
    // For now, we'll just trigger it and track it separately
    const syncResponse = await fetch(syncUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!syncResponse.ok) {
      throw new Error(`Sync failed: ${syncResponse.statusText}`)
    }

    // STEP 4: Wait a bit for sync to start, then get post-sync counts
    console.log('\n⏳ STEP 4: Waiting for sync to process...')
    await new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay

    const postSync = {
      totalPlans: await prisma.energyPlan.count(),
      activePlans: await prisma.energyPlan.count({ where: { isActive: true } }),
      retailers: await prisma.energyPlan.groupBy({
        by: ['retailerId'],
        _count: true
      })
    }

    // STEP 5: Validation
    console.log('\n✅ STEP 5: Validating sync results...')
    const validation = {
      plansAdded: postSync.totalPlans - preSync.totalPlans,
      activePlansChange: postSync.activePlans - preSync.activePlans,
      retailersWithData: postSync.retailers.length,
      passed: postSync.totalPlans >= preSync.totalPlans && postSync.activePlans > 0
    }

    console.log('Validation results:', validation)

    const endTime = new Date()
    const duration = (endTime.getTime() - startTime.getTime()) / 1000

    // STEP 6: Prepare notification summary
    const summary = {
      success: true,
      timestamp: startTime.toISOString(),
      duration: `${duration}s`,
      backup: {
        created: !!backupDir,
        location: backupDir
      },
      preSync,
      postSync,
      validation,
      syncMode: forceSync ? 'FULL REFRESH' : 'INCREMENTAL',
      retailer: retailer || 'ALL'
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 SAFE SYNC COMPLETE')
    console.log('='.repeat(60))
    console.log(JSON.stringify(summary, null, 2))

    // TODO: Send email notification
    // await sendEmailNotification(summary)

    return NextResponse.json(summary)

  } catch (error) {
    console.error('❌ Safe sync failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Safe sync failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      backup: backupDir ? {
        created: true,
        location: backupDir,
        note: 'Backup exists - database can be restored if needed'
      } : {
        created: false,
        note: 'No backup was created'
      }
    }, { status: 500 })

  } finally {
    await prisma.$disconnect()
  }
}
