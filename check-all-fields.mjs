import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

// Check an EV plan
const plan = await prisma.energyPlan.findUnique({
  where: { id: 'OVO723752MRE15@EME' }
})

if (!plan) {
  console.log('Plan not found')
} else {
  const rawData = JSON.parse(plan.rawData)

  console.log('Plan:', plan.planName)
  console.log('\n=== Top-level keys ===')
  console.log(Object.keys(rawData))

  console.log('\n=== Description ===')
  console.log(rawData.description)

  console.log('\n=== Additional Information ===')
  if (rawData.additionalInformation) {
    console.log(JSON.stringify(rawData.additionalInformation, null, 2))
  }

  console.log('\n=== Contract keys ===')
  if (rawData.electricityContract) {
    console.log(Object.keys(rawData.electricityContract))
  }

  console.log('\n=== Searching for "EV" or "electric vehicle" in raw JSON ===')
  const rawStr = JSON.stringify(rawData, null, 2)
  const matches = rawStr.match(/.{0,100}(EV|electric vehicle|Electric Vehicle).{0,100}/gi)
  if (matches) {
    matches.forEach(m => console.log('  -', m.trim()))
  }
}

await prisma.$disconnect()
