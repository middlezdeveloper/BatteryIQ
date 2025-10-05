import { PrismaClient, TariffType, PlanType } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding sample energy plans...')

  const samplePlans = [
    {
      id: 'ORIGIN-BASIC-VIC',
      retailerId: 'ORIGIN',
      retailerName: 'Origin Energy',
      planName: 'Origin Basic',
      state: 'VIC',
      fuelType: 'ELECTRICITY',
      tariffType: TariffType.FLAT,
      planType: PlanType.MARKET,
      distributors: JSON.stringify(['UNITED', 'CITIPOWER', 'POWERCOR']),
      dailySupplyCharge: 110.0,
      singleRate: 28.5,
      feedInTariff: 5.2,
      payOnTimeDiscount: 3,
      directDebitDiscount: 2,
      contractLength: 0,
      greenPower: true,
      rawData: JSON.stringify({}),
    },
    {
      id: 'AGL-SOLAR-SAVERS-VIC',
      retailerId: 'AGL',
      retailerName: 'AGL Energy',
      planName: 'Solar Savers',
      state: 'VIC',
      fuelType: 'ELECTRICITY',
      tariffType: TariffType.FLAT,
      planType: PlanType.MARKET,
      distributors: JSON.stringify(['UNITED', 'CITIPOWER', 'POWERCOR']),
      dailySupplyCharge: 105.0,
      singleRate: 26.8,
      feedInTariff: 8.0,
      hasBatteryIncentive: true,
      batteryIncentiveValue: 100,
      payOnTimeDiscount: 5,
      contractLength: 12,
      greenPower: true,
      carbonNeutral: true,
      rawData: JSON.stringify({}),
    },
    {
      id: 'ENERGY-AUSTRALIA-TOU-VIC',
      retailerId: 'EA',
      retailerName: 'Energy Australia',
      planName: 'Time of Use Saver',
      state: 'VIC',
      fuelType: 'ELECTRICITY',
      tariffType: TariffType.TIME_OF_USE,
      planType: PlanType.MARKET,
      distributors: JSON.stringify(['UNITED', 'CITIPOWER', 'POWERCOR']),
      dailySupplyCharge: 115.0,
      peakRate: 32.5,
      peakTimes: JSON.stringify([{days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], startTime: '15:00', endTime: '21:00'}]),
      shoulderRate: 22.0,
      shoulderTimes: JSON.stringify([{days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], startTime: '07:00', endTime: '15:00'}, {days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], startTime: '21:00', endTime: '23:00'}]),
      offPeakRate: 15.5,
      offPeakTimes: JSON.stringify([{days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], startTime: '23:00', endTime: '07:00'}, {days: ['SAT', 'SUN'], startTime: '00:00', endTime: '23:59'}]),
      feedInTariff: 6.5,
      payOnTimeDiscount: 4,
      directDebitDiscount: 1,
      contractLength: 24,
      rawData: JSON.stringify({}),
    },
    {
      id: 'RED-ENERGY-BATTERY-VIC',
      retailerId: 'RED',
      retailerName: 'Red Energy',
      planName: 'Battery Boost',
      state: 'VIC',
      fuelType: 'ELECTRICITY',
      tariffType: TariffType.TIME_OF_USE,
      planType: PlanType.MARKET,
      distributors: JSON.stringify(['UNITED', 'CITIPOWER', 'POWERCOR']),
      dailySupplyCharge: 120.0,
      peakRate: 30.0,
      peakTimes: JSON.stringify([{days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], startTime: '15:00', endTime: '21:00'}]),
      offPeakRate: 14.0,
      offPeakTimes: JSON.stringify([{days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], startTime: '23:00', endTime: '07:00'}]),
      feedInTariff: 10.0,
      hasBatteryIncentive: true,
      batteryIncentiveValue: 200,
      hasVPP: true,
      vppCreditPerYear: 150,
      payOnTimeDiscount: 6,
      contractLength: 12,
      greenPower: true,
      rawData: JSON.stringify({}),
    },
    {
      id: 'SIMPLY-ENERGY-BASIC-VIC',
      retailerId: 'SIMPLY',
      retailerName: 'Simply Energy',
      planName: 'Simply Basic',
      state: 'VIC',
      fuelType: 'ELECTRICITY',
      tariffType: TariffType.FLAT,
      planType: PlanType.MARKET,
      distributors: JSON.stringify(['UNITED', 'CITIPOWER', 'POWERCOR']),
      dailySupplyCharge: 95.0,
      singleRate: 29.0,
      feedInTariff: 5.0,
      payOnTimeDiscount: 2,
      contractLength: 0,
      rawData: JSON.stringify({}),
    },
    {
      id: 'MOMENTUM-VPP-VIC',
      retailerId: 'MOMENTUM',
      retailerName: 'Momentum Energy',
      planName: 'VPP Plus',
      state: 'VIC',
      fuelType: 'ELECTRICITY',
      tariffType: TariffType.FLAT,
      planType: PlanType.MARKET,
      distributors: JSON.stringify(['UNITED', 'CITIPOWER', 'POWERCOR']),
      dailySupplyCharge: 100.0,
      singleRate: 27.5,
      feedInTariff: 7.5,
      hasBatteryIncentive: true,
      batteryIncentiveValue: 150,
      hasVPP: true,
      vppCreditPerYear: 300,
      payOnTimeDiscount: 4,
      directDebitDiscount: 2,
      contractLength: 12,
      carbonNeutral: true,
      rawData: JSON.stringify({}),
    },
  ]

  let count = 0
  for (const plan of samplePlans) {
    await prisma.energyPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    })
    count++
  }

  console.log(`✅ Created ${count} sample energy plans`)
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
