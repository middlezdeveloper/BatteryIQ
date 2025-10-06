import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

const plan = await prisma.energyPlan.findUnique({
  where: { id: 'OVO704083MR@VEC' },
  include: {
    tariffPeriods: {
      orderBy: { sequenceOrder: 'asc' }
    }
  }
})

if (!plan) {
  console.log('EV plan not found')
} else {
  console.log('Plan:', plan.planName)
  console.log('Tariff Periods:', plan.tariffPeriods.length, '\n')

  plan.tariffPeriods.forEach((p, i) => {
    console.log(`${i+1}. ${p.displayName}`)
    console.log(`   Type: ${p.type}`)
    console.log(`   Rate: $${p.rate.toFixed(2)}/kWh`)
    console.log(`   Time Windows:`, JSON.stringify(p.timeWindows, null, 2))
    console.log()
  })
}

await prisma.$disconnect()
