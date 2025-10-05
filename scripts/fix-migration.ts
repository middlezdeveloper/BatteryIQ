import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function fixMigration() {
  console.log('🔧 Deleting failed migration record...')

  try {
    // Delete the failed migration record completely
    const result = await prisma.$executeRaw`
      DELETE FROM _prisma_migrations
      WHERE migration_name = '20251003061145_add_energy_plans_models'
    `

    console.log(`✅ Deleted ${result} migration record(s)`)

    // Verify the deletion
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, started_at
      FROM _prisma_migrations
      ORDER BY started_at
    `

    console.log('\n📋 Remaining migrations:')
    console.log(migrations)

    console.log('\n✅ Failed migration record deleted')
    console.log('💡 Next step: Trigger Vercel deployment to apply PostgreSQL migrations')

  } catch (error) {
    console.error('❌ Failed to fix migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixMigration()
  .catch(console.error)
  .finally(() => process.exit(0))
