import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

// Check VIC EV plan
const plan = await prisma.energyPlan.findFirst({
  where: {
    planName: { contains: 'The EV Plan' },
    state: 'VIC'
  },
  include: {
    tariffPeriods: {
      orderBy: { sequenceOrder: 'asc' }
    }
  }
})

if (!plan) {
  console.log('VIC EV plan not found')
} else {
  console.log('Plan:', plan.planName, `(${plan.state})`)
  console.log('ID:', plan.id)
  console.log('Daily Supply: $' + plan.dailySupplyCharge?.toFixed(2))
  console.log('Solar FIT: $' + plan.feedInTariff?.toFixed(2))
  console.log('\nTariff Periods:', plan.tariffPeriods.length, '\n')

  plan.tariffPeriods.forEach((p, i) => {
    console.log(`${i+1}. ${p.displayName} (${p.type})`)
    console.log(`   Rate: $${p.rate.toFixed(2)}/kWh`)
    console.log(`   Sequence: ${p.sequenceOrder}`)
    if (Array.isArray(p.timeWindows) && p.timeWindows.length > 0) {
      p.timeWindows.forEach(w => {
        console.log(`   Time: ${w.startTime}-${w.endTime}`)
      })
    }
    console.log()
  })
}

await prisma.$disconnect()
