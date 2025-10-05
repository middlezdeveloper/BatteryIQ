import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function fixMigration() {
  console.log('🔧 Fixing failed migration state...')

  try {
    // Mark the failed migration as rolled back
    const result = await prisma.$executeRaw`
      UPDATE _prisma_migrations
      SET rolled_back_at = NOW(),
          finished_at = NULL
      WHERE migration_name = '20251003061145_add_energy_plans_models'
    `

    console.log(`✅ Updated ${result} migration record(s)`)

    // Verify the update
    const migration = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, rolled_back_at
      FROM _prisma_migrations
      WHERE migration_name = '20251003061145_add_energy_plans_models'
    `

    console.log('\n📋 Migration status:')
    console.log(migration)

    console.log('\n✅ Migration marked as rolled back')
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
