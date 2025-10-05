import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function clearOvoPlans() {
  console.log('🗑️  Clearing OVO Energy plans...')

  const result = await prisma.energyPlan.deleteMany({
    where: {
      retailerId: 'ovo-energy'
    }
  })

  console.log(`✅ Deleted ${result.count} OVO Energy plans`)

  await prisma.$disconnect()
}

clearOvoPlans()
