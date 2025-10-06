import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

const plan = await prisma.energyPlan.findUnique({
  where: { id: 'OVO704083MR@VEC' }
})

if (!plan) {
  console.log('EV plan not found')
} else {
  const rawData = JSON.parse(plan.rawData)

  console.log('Plan:', plan.planName)
  console.log('\nRaw CDR API tariff period data:\n')

  const tariffPeriod = rawData.electricityContract?.tariffPeriod?.[0]
  const touRates = tariffPeriod?.timeOfUseRates || []

  touRates.forEach((rate, i) => {
    console.log(`${i+1}. Display Name: "${rate.displayName}"`)
    console.log(`   Type: ${rate.type}`)
    console.log(`   Description: ${rate.description || 'N/A'}`)
    console.log(`   Rate: $${rate.rates?.[0]?.unitPrice || 'N/A'}/kWh`)
    console.log()
  })
}

await prisma.$disconnect()
