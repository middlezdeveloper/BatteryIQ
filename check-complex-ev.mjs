import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

// Check a plan with more tariff periods
const plan = await prisma.energyPlan.findUnique({
  where: { id: 'OVO723754MRE14@EME' },
  include: {
    tariffPeriods: {
      orderBy: { sequenceOrder: 'asc' }
    }
  }
})

if (!plan) {
  console.log('Plan not found')
} else {
  console.log('Plan:', plan.planName, `(${plan.state})`)
  console.log('Daily Supply: $' + plan.dailySupplyCharge?.toFixed(2) + '/day')
  console.log('Solar FIT: $' + plan.feedInTariff?.toFixed(2) + '/kWh')
  console.log('\nTariff Periods:', plan.tariffPeriods.length, '\n')

  plan.tariffPeriods.forEach((p, i) => {
    console.log(`${i+1}. ${p.displayName}`)
    console.log(`   Type: ${p.type}`)
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
