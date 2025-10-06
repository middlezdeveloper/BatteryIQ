import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

const plans = await prisma.energyPlan.findMany({
  where: {
    retailerName: { contains: 'OVO' },
    planName: { contains: 'EV' }
  },
  select: {
    id: true,
    planName: true,
    state: true
  }
})

console.log('Found', plans.length, 'EV plans:\n')
plans.forEach(p => {
  console.log(`- ${p.planName} (${p.state}) - ID: ${p.id}`)
})

await prisma.$disconnect()
