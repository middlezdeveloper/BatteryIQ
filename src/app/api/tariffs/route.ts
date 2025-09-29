import { NextRequest, NextResponse } from 'next/server'
import { TariffCalculator, getTariffsForState, ALL_TARIFFS } from '@/lib/dmo-vdo'
import { prisma } from '@/lib/prisma'

// GET /api/tariffs - Get tariffs for a state or compare tariffs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    const compare = searchParams.get('compare') === 'true'
    const annualUsage = parseFloat(searchParams.get('annualUsage') || '8000')
    const usagePattern = searchParams.get('usagePattern') as 'flat' | 'peak_heavy' | 'off_peak_heavy' || 'flat'
    const batteryCapacity = parseFloat(searchParams.get('batteryCapacity') || '13.5')

    if (!state) {
      return NextResponse.json(
        { error: 'State parameter required' },
        { status: 400 }
      )
    }

    // Get available tariffs for state
    const availableTariffs = getTariffsForState(state)

    if (availableTariffs.length === 0) {
      return NextResponse.json(
        { error: `No tariffs available for state: ${state}` },
        { status: 404 }
      )
    }

    if (compare) {
      // Compare all tariffs for the state
      const comparisons = availableTariffs.map(tariff => {
        const annualCost = TariffCalculator.calculateAnnualCost(tariff, annualUsage, usagePattern)
        const arbitrageValue = TariffCalculator.calculateArbitrageValue(tariff, batteryCapacity)
        const netCostWithBattery = annualCost - arbitrageValue

        return {
          tariff,
          costs: {
            annualCost: Math.round(annualCost),
            dailySupplyCharge: Math.round((tariff.dailySupplyCharge / 100) * 365),
            usageCharges: Math.round(annualCost - (tariff.dailySupplyCharge / 100) * 365),
            arbitrageValue: Math.round(arbitrageValue),
            netCostWithBattery: Math.round(netCostWithBattery)
          },
          savings: {
            withoutBattery: annualCost,
            withBattery: netCostWithBattery,
            batteryArbitrageSavings: arbitrageValue
          },
          recommendation: {
            isRecommended: arbitrageValue > 200, // Worthwhile if >$200/year arbitrage
            reason: arbitrageValue > 200
              ? `Excellent arbitrage potential: $${Math.round(arbitrageValue)}/year`
              : arbitrageValue > 50
              ? `Moderate arbitrage potential: $${Math.round(arbitrageValue)}/year`
              : 'Limited arbitrage potential with current usage pattern'
          }
        }
      })

      // Sort by best value (lowest net cost with battery)
      const sortedComparisons = comparisons.sort((a, b) =>
        a.costs.netCostWithBattery - b.costs.netCostWithBattery
      )

      const bestTariff = sortedComparisons[0]
      const worstTariff = sortedComparisons[sortedComparisons.length - 1]
      const potentialSavings = worstTariff.costs.netCostWithBattery - bestTariff.costs.netCostWithBattery

      return NextResponse.json({
        state,
        usageProfile: {
          annualUsage,
          usagePattern,
          batteryCapacity
        },
        comparison: sortedComparisons,
        summary: {
          bestTariff: bestTariff.tariff.planName,
          bestCost: bestTariff.costs.netCostWithBattery,
          worstCost: worstTariff.costs.netCostWithBattery,
          potentialSavings,
          averageArbitrageValue: Math.round(
            comparisons.reduce((sum, c) => sum + c.costs.arbitrageValue, 0) / comparisons.length
          )
        },
        recommendations: {
          switchTo: bestTariff.tariff.id !== sortedComparisons.find(c => c.tariff.planType === 'DMO' || c.tariff.planType === 'VDO')?.tariff.id
            ? bestTariff.tariff
            : null,
          batteryBenefit: comparisons.some(c => c.costs.arbitrageValue > 300)
            ? 'High benefit - Time-of-use tariffs provide excellent arbitrage opportunities'
            : comparisons.some(c => c.costs.arbitrageValue > 100)
            ? 'Moderate benefit - Some arbitrage value available'
            : 'Low benefit - Limited arbitrage opportunities with current tariffs'
        }
      })
    } else {
      // Return basic tariff information
      return NextResponse.json({
        state,
        tariffs: availableTariffs,
        count: availableTariffs.length
      })
    }

  } catch (error) {
    console.error('Tariff API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tariff data' },
      { status: 500 }
    )
  }
}

// POST /api/tariffs/seed - Seed database with DMO/VDO data
export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Seeding DMO/VDO tariff data...')

    // Clear existing plans
    await prisma.energyPlan.deleteMany({
      where: {
        planType: {
          in: ['DMO', 'VDO']
        }
      }
    })

    // Insert all tariff data
    const createdPlans = []

    for (const tariff of ALL_TARIFFS) {
      const energyPlan = await prisma.energyPlan.create({
        data: {
          retailerId: `${tariff.planType}_${tariff.state}_${tariff.distributor?.replace(/\s+/g, '_')}`,
          retailerName: `${tariff.planType} - ${tariff.distributor}`,
          planName: tariff.planName,
          state: tariff.state,
          distributor: tariff.distributor,
          tariffType: tariff.tariffType,
          planType: tariff.planType,

          // Pricing (convert c/kWh to $/kWh for consistency)
          peakRate: (tariff.peakRate || tariff.flatRate || 0) / 100,
          offPeakRate: tariff.offPeakRate ? tariff.offPeakRate / 100 : null,
          shoulderRate: tariff.shoulderRate ? tariff.shoulderRate / 100 : null,
          superOffPeakRate: tariff.superOffPeakRate ? tariff.superOffPeakRate / 100 : null,
          dailySupplyCharge: tariff.dailySupplyCharge / 100, // Convert c/day to $/day
          feedInTariff: tariff.feedInTariff / 100,

          // Schedule and features
          timeOfUseSchedule: tariff.timeOfUseSchedule ? JSON.stringify(tariff.timeOfUseSchedule) : undefined,
          isEVFriendly: tariff.isEVFriendly,

          // Validity
          validFrom: new Date(tariff.validFrom),
          validTo: new Date(tariff.validTo),
          isActive: true
        }
      })

      createdPlans.push(energyPlan)
    }

    console.log(`✅ Created ${createdPlans.length} tariff plans`)

    return NextResponse.json({
      message: 'DMO/VDO tariff data seeded successfully',
      count: createdPlans.length,
      plans: createdPlans.map(p => ({
        id: p.id,
        name: p.planName,
        state: p.state,
        type: p.planType
      }))
    })

  } catch (error) {
    console.error('Tariff seeding error:', error)
    return NextResponse.json(
      { error: 'Failed to seed tariff data' },
      { status: 500 }
    )
  }
}