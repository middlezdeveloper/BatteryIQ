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
  console.log('\n=== Eligibility Information ===\n')

  // Check top-level eligibility
  if (rawData.eligibility) {
    console.log('Top-level eligibility:')
    console.log(JSON.stringify(rawData.eligibility, null, 2))
  }

  // Check contract-level eligibility
  const contract = rawData.electricityContract
  if (contract?.eligibility) {
    console.log('\nContract eligibility:')
    console.log(JSON.stringify(contract.eligibility, null, 2))
  }

  // Check for any eligibility criteria
  if (contract?.additionalFeeInformation) {
    console.log('\nAdditional Fee Information:')
    console.log(contract.additionalFeeInformation)
  }

  // Check terms and conditions
  if (contract?.termsUri) {
    console.log('\nTerms URI:', contract.termsUri)
  }

  // Check description fields
  if (rawData.description) {
    console.log('\nDescription:', rawData.description)
  }

  if (rawData.additionalInformation) {
    console.log('\nAdditional Information:')
    console.log(JSON.stringify(rawData.additionalInformation, null, 2))
  }
}

await prisma.$disconnect()
