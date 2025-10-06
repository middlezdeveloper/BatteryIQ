import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

// Check one of the NSW EV plans
const plan = await prisma.energyPlan.findUnique({
  where: { id: 'OVO723752MRE15@EME' },
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
  console.log('Tariff Periods:', plan.tariffPeriods.length, '\n')

  plan.tariffPeriods.forEach((p, i) => {
    console.log(`${i+1}. ${p.displayName}`)
    console.log(`   Type: ${p.type}`)
    console.log(`   Rate: $${p.rate.toFixed(2)}/kWh`)
    const firstWindow = p.timeWindows[0]
    if (firstWindow) {
      console.log(`   Time: ${firstWindow.startTime}-${firstWindow.endTime}`)
    }
    console.log()
  })
}

await prisma.$disconnect()
