import { PrismaClient } from './src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Deleting all energy plans...')

  const result = await prisma.energyPlan.deleteMany({})

  console.log(`✅ Deleted ${result.count} plans`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
