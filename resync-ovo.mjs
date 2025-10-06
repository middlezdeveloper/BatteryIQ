import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

console.log('🗑️  Deleting all OVO Energy plans...')

// Delete all plans where retailerName contains "OVO"
const result = await prisma.energyPlan.deleteMany({
  where: {
    retailerName: {
      contains: 'OVO'
    }
  }
})

console.log(`✅ Deleted ${result.count} OVO Energy plans`)
console.log('\n📡 Now trigger the sync via the API:')
console.log('   curl -X POST "http://localhost:3000/api/energy-plans/sync-cdr?retailer=ovo-energy&chunkSize=100"')

await prisma.$disconnect()
