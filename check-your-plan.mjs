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
  console.log('Your EV plan (OVO704083MR@VEC) not found')
} else {
  console.log('✅ YOUR OVO EV PLAN FROM BILL')
  console.log('================================')
  console.log('Plan:', plan.planName)
  console.log('Daily Supply: $' + plan.dailySupplyCharge?.toFixed(2) + '/day')
  console.log('Solar FIT: $' + plan.feedInTariff?.toFixed(2) + '/kWh')
  console.log('\nTariff Periods:', plan.tariffPeriods.length, '(should be 4)\n')

  plan.tariffPeriods.forEach((p, i) => {
    console.log(`${i+1}. ${p.displayName} (${p.type})`)
    console.log(`   Rate: $${p.rate.toFixed(2)}/kWh`)
    if (Array.isArray(p.timeWindows) && p.timeWindows.length > 0) {
      p.timeWindows.forEach(w => {
        console.log(`   Time: ${w.startTime}-${w.endTime}`)
      })
    }
    console.log()
  })
}

await prisma.$disconnect()
