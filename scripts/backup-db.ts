import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`)

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  console.log(`📦 Creating database backup: ${backupDir}`)

  try {
    // 1. Backup _prisma_migrations table (critical for recovery)
    console.log('📋 Backing up migration history...')
    const migrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations ORDER BY started_at
    `
    fs.writeFileSync(
      path.join(backupDir, 'migrations.json'),
      JSON.stringify(migrations, null, 2)
    )
    console.log(`✅ Saved ${Array.isArray(migrations) ? migrations.length : 0} migration records`)

    // 2. List all tables
    console.log('\n📊 Listing database tables...')
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    fs.writeFileSync(
      path.join(backupDir, 'tables.json'),
      JSON.stringify(tables, null, 2)
    )
    console.log(`✅ Found ${tables.length} tables`)

    // 3. Get schema info for each table
    console.log('\n🏗️  Capturing schema structure...')
    const schemaInfo: Record<string, any> = {}

    for (const { tablename } of tables) {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tablename}
        ORDER BY ordinal_position
      `
      schemaInfo[tablename] = columns
    }

    fs.writeFileSync(
      path.join(backupDir, 'schema.json'),
      JSON.stringify(schemaInfo, null, 2)
    )
    console.log('✅ Schema structure captured')

    // 4. Count records in key tables
    console.log('\n📈 Counting records...')
    const counts: Record<string, number> = {}

    for (const { tablename } of tables) {
      try {
        const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM "${tablename}"`
        )
        counts[tablename] = Number(result[0].count)
      } catch (e) {
        counts[tablename] = -1 // Error counting
      }
    }

    fs.writeFileSync(
      path.join(backupDir, 'record-counts.json'),
      JSON.stringify(counts, null, 2)
    )
    console.log('✅ Record counts saved')

    // 5. Backup energy_plans data (if exists)
    if (tables.some(t => t.tablename === 'energy_plans')) {
      console.log('\n💾 Backing up energy_plans table...')
      try {
        const planCount = await prisma.energyPlan.count()
        console.log(`   Found ${planCount} plans`)

        if (planCount > 0) {
          // Export in chunks to avoid memory issues
          const chunkSize = 1000
          let offset = 0
          let chunk = 0

          while (offset < planCount) {
            const plans = await prisma.energyPlan.findMany({
              skip: offset,
              take: chunkSize,
            })

            fs.writeFileSync(
              path.join(backupDir, `energy_plans_chunk_${chunk}.json`),
              JSON.stringify(plans, null, 2)
            )

            console.log(`   ✅ Saved chunk ${chunk} (${plans.length} plans)`)
            offset += chunkSize
            chunk++
          }
        }
      } catch (e) {
        console.log(`   ⚠️  Could not backup energy_plans: ${e}`)
      }
    }

    // 6. Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ BACKUP COMPLETE')
    console.log('='.repeat(60))
    console.log(`📁 Location: ${backupDir}`)
    console.log('\nBackup includes:')
    console.log('  - migrations.json: Migration history')
    console.log('  - tables.json: List of all tables')
    console.log('  - schema.json: Table structures')
    console.log('  - record-counts.json: Row counts per table')
    if (tables.some(t => t.tablename === 'energy_plans')) {
      console.log('  - energy_plans_chunk_*.json: Energy plan data')
    }
    console.log('\n💡 To restore, use the migration records and data files')

    return backupDir

  } catch (error) {
    console.error('❌ Backup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

backupDatabase()
  .then((dir) => {
    console.log(`\n🎉 Backup saved to: ${dir}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
