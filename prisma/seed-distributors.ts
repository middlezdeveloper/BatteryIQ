import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding distributors and postcode mappings...')

  // Victoria
  const powercor = await prisma.distributor.upsert({
    where: { code: 'POWERCOR' },
    update: {},
    create: {
      code: 'POWERCOR',
      name: 'Powercor Australia',
      state: 'VIC',
      nmiPrefixes: JSON.stringify(['NMI6', 'NMI7'])
    }
  })

  const ausnet = await prisma.distributor.upsert({
    where: { code: 'AUSNET' },
    update: {},
    create: {
      code: 'AUSNET',
      name: 'AusNet Services',
      state: 'VIC',
      nmiPrefixes: JSON.stringify(['NMI4'])
    }
  })

  const united = await prisma.distributor.upsert({
    where: { code: 'UNITED' },
    update: {},
    create: {
      code: 'UNITED',
      name: 'United Energy',
      state: 'VIC',
      nmiPrefixes: JSON.stringify(['NMI8'])
    }
  })

  const citipower = await prisma.distributor.upsert({
    where: { code: 'CITIPOWER' },
    update: {},
    create: {
      code: 'CITIPOWER',
      name: 'CitiPower',
      state: 'VIC',
      nmiPrefixes: JSON.stringify(['NMI9'])
    }
  })

  const jemena = await prisma.distributor.upsert({
    where: { code: 'JEMENA' },
    update: {},
    create: {
      code: 'JEMENA',
      name: 'Jemena Electricity Networks',
      state: 'VIC',
      nmiPrefixes: JSON.stringify(['NMI5'])
    }
  })

  // NSW
  const ausgrid = await prisma.distributor.upsert({
    where: { code: 'AUSGRID' },
    update: {},
    create: {
      code: 'AUSGRID',
      name: 'Ausgrid',
      state: 'NSW',
      nmiPrefixes: JSON.stringify(['NMI1'])
    }
  })

  const endeavour = await prisma.distributor.upsert({
    where: { code: 'ENDEAVOUR' },
    update: {},
    create: {
      code: 'ENDEAVOUR',
      name: 'Endeavour Energy',
      state: 'NSW',
      nmiPrefixes: JSON.stringify(['NMI2'])
    }
  })

  const essential = await prisma.distributor.upsert({
    where: { code: 'ESSENTIAL' },
    update: {},
    create: {
      code: 'ESSENTIAL',
      name: 'Essential Energy',
      state: 'NSW',
      nmiPrefixes: JSON.stringify(['NMI3'])
    }
  })

  // QLD
  const energex = await prisma.distributor.upsert({
    where: { code: 'ENERGEX' },
    update: {},
    create: {
      code: 'ENERGEX',
      name: 'Energex',
      state: 'QLD',
      nmiPrefixes: JSON.stringify(['NMIQ'])
    }
  })

  const ergon = await prisma.distributor.upsert({
    where: { code: 'ERGON' },
    update: {},
    create: {
      code: 'ERGON',
      name: 'Ergon Energy',
      state: 'QLD',
      nmiPrefixes: JSON.stringify(['NMIE'])
    }
  })

  // SA
  const sapn = await prisma.distributor.upsert({
    where: { code: 'SAPN' },
    update: {},
    create: {
      code: 'SAPN',
      name: 'SA Power Networks',
      state: 'SA',
      nmiPrefixes: JSON.stringify(['NMIS'])
    }
  })

  console.log('✅ Created distributors')

  // Map postcodes to distributors
  const postcodeMap = [
    // Melbourne metro
    { postcode: 3000, distributorId: citipower.id, isPrimary: true }, // Melbourne CBD
    { postcode: 3001, distributorId: citipower.id, isPrimary: true },
    { postcode: 3002, distributorId: citipower.id, isPrimary: true },
    { postcode: 3003, distributorId: citipower.id, isPrimary: true },
    { postcode: 3004, distributorId: united.id, isPrimary: true }, // South Melbourne
    { postcode: 3005, distributorId: united.id, isPrimary: true },
    { postcode: 3006, distributorId: united.id, isPrimary: true },
    { postcode: 3008, distributorId: citipower.id, isPrimary: true }, // Docklands
    { postcode: 3050, distributorId: jemena.id, isPrimary: true }, // Royal Park
    { postcode: 3051, distributorId: jemena.id, isPrimary: true }, // North Melbourne
    { postcode: 3052, distributorId: jemena.id, isPrimary: true }, // Parkville
    { postcode: 3053, distributorId: jemena.id, isPrimary: true }, // Carlton
    { postcode: 3054, distributorId: jemena.id, isPrimary: true },
    { postcode: 3055, distributorId: jemena.id, isPrimary: true },
    { postcode: 3056, distributorId: jemena.id, isPrimary: true },
    { postcode: 3057, distributorId: jemena.id, isPrimary: true },
    { postcode: 3058, distributorId: jemena.id, isPrimary: true },
    { postcode: 3144, distributorId: united.id, isPrimary: true }, // Malvern
    { postcode: 3145, distributorId: united.id, isPrimary: true },
    { postcode: 3146, distributorId: united.id, isPrimary: true },
    { postcode: 3147, distributorId: united.id, isPrimary: true },
    { postcode: 3148, distributorId: united.id, isPrimary: true },
    { postcode: 3149, distributorId: united.id, isPrimary: true },
    { postcode: 3150, distributorId: united.id, isPrimary: true },
    { postcode: 3151, distributorId: united.id, isPrimary: true },
    { postcode: 3152, distributorId: united.id, isPrimary: true }, // Wantirna South
    { postcode: 3153, distributorId: united.id, isPrimary: true },
    { postcode: 3154, distributorId: united.id, isPrimary: true },
    { postcode: 3155, distributorId: united.id, isPrimary: true },
    { postcode: 3156, distributorId: united.id, isPrimary: true },
    { postcode: 3178, distributorId: united.id, isPrimary: true }, // Rowville
    { postcode: 3190, distributorId: united.id, isPrimary: true },
    { postcode: 3191, distributorId: united.id, isPrimary: true },
    { postcode: 3192, distributorId: united.id, isPrimary: true },
    { postcode: 3193, distributorId: united.id, isPrimary: true },
    { postcode: 3194, distributorId: united.id, isPrimary: true },
    { postcode: 3195, distributorId: united.id, isPrimary: true },
    { postcode: 3196, distributorId: united.id, isPrimary: true },
    { postcode: 3197, distributorId: united.id, isPrimary: true },
    { postcode: 3198, distributorId: united.id, isPrimary: true },
    { postcode: 3199, distributorId: united.id, isPrimary: true },
    { postcode: 3200, distributorId: united.id, isPrimary: true },

    // Sydney metro
    { postcode: 2000, distributorId: ausgrid.id, isPrimary: true }, // Sydney CBD
    { postcode: 2001, distributorId: ausgrid.id, isPrimary: true },
    { postcode: 2006, distributorId: ausgrid.id, isPrimary: true },
    { postcode: 2007, distributorId: ausgrid.id, isPrimary: true },
    { postcode: 2008, distributorId: ausgrid.id, isPrimary: true },
    { postcode: 2009, distributorId: ausgrid.id, isPrimary: true },
    { postcode: 2010, distributorId: ausgrid.id, isPrimary: true },

    // Brisbane metro
    { postcode: 4000, distributorId: energex.id, isPrimary: true }, // Brisbane CBD
    { postcode: 4001, distributorId: energex.id, isPrimary: true },
    { postcode: 4101, distributorId: energex.id, isPrimary: true },
    { postcode: 4102, distributorId: energex.id, isPrimary: true },

    // Adelaide metro
    { postcode: 5000, distributorId: sapn.id, isPrimary: true }, // Adelaide CBD
    { postcode: 5001, distributorId: sapn.id, isPrimary: true },
  ]

  for (const mapping of postcodeMap) {
    await prisma.postcodeDistributor.upsert({
      where: {
        postcode_distributorId: {
          postcode: mapping.postcode,
          distributorId: mapping.distributorId
        }
      },
      update: {},
      create: mapping
    })
  }

  console.log(`✅ Created ${postcodeMap.length} postcode-distributor mappings`)
  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
