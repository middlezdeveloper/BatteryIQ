import { PrismaClient, BatteryChemistry, TariffType } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Seed Australian locations with solar zones
  const locations = [
    {
      postcode: '2000',
      suburb: 'Sydney',
      state: 'NSW',
      latitude: -33.8688,
      longitude: 151.2093,
      solarZone: 4,
      gridRegion: 'NSW1'
    },
    {
      postcode: '3000',
      suburb: 'Melbourne',
      state: 'VIC',
      latitude: -37.8136,
      longitude: 144.9631,
      solarZone: 4,
      gridRegion: 'VIC1'
    },
    {
      postcode: '4000',
      suburb: 'Brisbane',
      state: 'QLD',
      latitude: -27.4698,
      longitude: 153.0251,
      solarZone: 5,
      gridRegion: 'QLD1'
    },
    {
      postcode: '5000',
      suburb: 'Adelaide',
      state: 'SA',
      latitude: -34.9285,
      longitude: 138.6007,
      solarZone: 4,
      gridRegion: 'SA1'
    },
    {
      postcode: '6000',
      suburb: 'Perth',
      state: 'WA',
      latitude: -31.9505,
      longitude: 115.8605,
      solarZone: 5,
      gridRegion: 'WEM'
    },
    {
      postcode: '7000',
      suburb: 'Hobart',
      state: 'TAS',
      latitude: -42.8821,
      longitude: 147.3272,
      solarZone: 3,
      gridRegion: 'TAS1'
    }
  ]

  console.log('📍 Creating locations...')
  for (const location of locations) {
    await prisma.location.create({
      data: location
    })
  }

  // Seed Federal and State rebates
  console.log('💰 Creating rebate programs...')

  // Federal Cheaper Home Batteries Program
  await prisma.rebate.create({
    data: {
      name: 'Cheaper Home Batteries Program',
      type: 'FEDERAL',
      state: null,
      amount: 372, // $372 per kWh based on 9.3 STC × ~$40 STC price
      maxCapacity: 50, // 50 kWh maximum
      maxAmount: 4650, // Maximum rebate amount
      startDate: new Date('2025-07-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
      requirements: JSON.stringify([
        'Must be VPP-capable battery',
        'Installation after July 1, 2025',
        'Usable capacity applies for rebate calculation',
        'Cannot combine with NSW rebate during federal program period'
      ]),
      vppRequired: false,
      vppCapableRequired: true,
      declineRate: 9.7 // Annual decline rate percentage
    }
  })

  // NSW Battery Incentive (suspended during federal program)
  await prisma.rebate.create({
    data: {
      name: 'NSW Peak Demand Reduction Scheme',
      type: 'STATE',
      state: 'NSW',
      amount: 250, // Per kWh
      maxCapacity: 28, // 28 kWh maximum
      maxAmount: 7000, // Maximum rebate amount
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-06-30'), // Suspended when federal starts
      isActive: false,
      requirements: JSON.stringify([
        'VPP participation required',
        'Suspended during federal battery rebate period',
        'Cannot combine with federal rebate'
      ]),
      vppRequired: true,
      vppCapableRequired: true
    }
  })

  // WA Battery Scheme
  await prisma.rebate.create({
    data: {
      name: 'WA Distributed Energy Buyback Scheme',
      type: 'STATE',
      state: 'WA',
      amount: 300, // Per kWh
      maxCapacity: 20, // 20 kWh maximum
      maxAmount: 6000, // Maximum rebate amount
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
      requirements: JSON.stringify([
        'Can stack with federal rebate',
        'Western Power network area only',
        'VPP participation encouraged but not required'
      ]),
      vppRequired: false,
      vppCapableRequired: false
    }
  })

  // Victoria Interest-free loans
  await prisma.rebate.create({
    data: {
      name: 'Victoria Solar Battery Loan',
      type: 'STATE',
      state: 'VIC',
      amount: 8800, // Maximum loan amount
      maxCapacity: 999, // No specific capacity limit
      maxAmount: 8800,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      requirements: JSON.stringify([
        'Interest-free loan, not rebate',
        'Can combine with federal rebate',
        'Household income under $180,000'
      ]),
      vppRequired: false,
      vppCapableRequired: false
    }
  })

  // Seed popular battery models
  console.log('🔋 Creating battery models...')

  const batteries = [
    {
      brand: 'Tesla',
      model: 'Powerwall 3',
      nominalCapacity: 13.5,
      usableCapacity: 13.5,
      powerRating: 11.5,
      maxPowerRating: 20.5,
      efficiency: 90.0,
      warrantyYears: 10,
      warrantyThroughput: 37800,
      isVppCapable: true,
      price: 14000,
      installationCost: 3000,
      chemistry: BatteryChemistry.LITHIUM_ION,
      cycles: 6000
    },
    {
      brand: 'Enphase',
      model: 'IQ Battery 5P',
      nominalCapacity: 5.0,
      usableCapacity: 4.67,
      powerRating: 3.84,
      maxPowerRating: 7.68,
      efficiency: 96.0,
      warrantyYears: 15,
      isVppCapable: true,
      price: 8500,
      installationCost: 2000,
      chemistry: BatteryChemistry.LITHIUM_PHOSPHATE,
      cycles: 6000
    },
    {
      brand: 'BYD',
      model: 'Battery-Box Premium HVS',
      nominalCapacity: 10.24,
      usableCapacity: 9.22,
      powerRating: 5.0,
      efficiency: 93.0,
      warrantyYears: 10,
      isVppCapable: true,
      price: 12000,
      installationCost: 2500,
      chemistry: BatteryChemistry.LITHIUM_PHOSPHATE,
      cycles: 6000
    }
  ]

  for (const battery of batteries) {
    await prisma.battery.create({
      data: battery
    })
  }

  // Seed energy plans
  console.log('⚡ Creating energy plans...')

  const energyPlans = [
    {
      retailerId: 'AGL',
      retailerName: 'AGL Energy',
      planName: 'AGL Solar Plus',
      state: 'NSW',
      tariffType: TariffType.TIME_OF_USE,
      peakRate: 32.5,
      offPeakRate: 22.0,
      shoulderRate: 28.0,
      dailySupplyCharge: 95.0,
      feedInTariff: 8.0
    },
    {
      retailerId: 'ORIGIN',
      retailerName: 'Origin Energy',
      planName: 'Origin Solar Boost',
      state: 'VIC',
      tariffType: TariffType.TIME_OF_USE,
      peakRate: 30.8,
      offPeakRate: 20.5,
      shoulderRate: 26.0,
      dailySupplyCharge: 88.0,
      feedInTariff: 6.7
    },
    {
      retailerId: 'ENERGYAUSTRALIA',
      retailerName: 'Energy Australia',
      planName: 'No Worries Solar',
      state: 'QLD',
      tariffType: TariffType.FLAT,
      peakRate: 28.5,
      dailySupplyCharge: 92.0,
      feedInTariff: 7.2
    }
  ]

  for (const plan of energyPlans) {
    await prisma.energyPlan.create({
      data: plan
    })
  }

  console.log('✅ Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })