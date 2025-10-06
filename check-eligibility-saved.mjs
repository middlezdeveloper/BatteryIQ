import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

// Check if we have any plans with eligibility criteria
const plansWithEligibility = await prisma.energyPlan.findMany({
  where: {
    eligibilityCriteria: {
      not: null
    }
  },
  select: {
    id: true,
    planName: true,
    state: true,
    eligibilityCriteria: true
  },
  take: 5
})

console.log('Found', plansWithEligibility.length, 'plans with eligibility criteria:\n')

plansWithEligibility.forEach(p => {
  console.log(`Plan: ${p.planName} (${p.state})`)
  const criteria = JSON.parse(p.eligibilityCriteria)
  criteria.forEach((c, i) => {
    console.log(`  ${i+1}. ${c.description}`)
    if (c.information) console.log(`     Info: ${c.information}`)
  })
  console.log()
})

await prisma.$disconnect()
