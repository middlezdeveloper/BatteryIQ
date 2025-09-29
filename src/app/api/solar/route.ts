import { NextRequest, NextResponse } from 'next/server'
import { SolarCalculator, getSolarZoneInfo } from '@/lib/solar'

// GET /api/solar - Calculate solar output for given parameters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Required parameters
    const solarZone = parseInt(searchParams.get('solarZone') || '4')
    const panelCapacityKw = parseFloat(searchParams.get('panelCapacity') || '6.6')

    // Optional parameters
    const panelTilt = searchParams.get('panelTilt')
      ? parseFloat(searchParams.get('panelTilt')!)
      : undefined
    const panelAzimuth = searchParams.get('panelAzimuth')
      ? parseFloat(searchParams.get('panelAzimuth')!)
      : undefined
    const systemEfficiency = searchParams.get('systemEfficiency')
      ? parseFloat(searchParams.get('systemEfficiency')!)
      : undefined

    // Validate inputs
    if (solarZone < 1 || solarZone > 7) {
      return NextResponse.json(
        { error: 'Solar zone must be between 1 and 7' },
        { status: 400 }
      )
    }

    if (panelCapacityKw <= 0 || panelCapacityKw > 1000) {
      return NextResponse.json(
        { error: 'Panel capacity must be between 0 and 1000 kW' },
        { status: 400 }
      )
    }

    // Calculate solar output
    const solarOutput = SolarCalculator.calculateSolarOutput({
      solarZone,
      panelCapacityKw,
      panelTilt,
      panelAzimuth,
      systemEfficiency
    })

    // Get zone information
    const zoneInfo = getSolarZoneInfo(solarZone)

    // Calculate STC value
    const stcData = SolarCalculator.calculateSTCValue(panelCapacityKw, solarZone)

    // Calculate current generation (if requested)
    const includeCurrentGen = searchParams.get('includeCurrent') === 'true'
    let currentGeneration = 0
    if (includeCurrentGen) {
      const now = new Date()
      const currentHour = now.getHours()
      const month = now.getMonth() + 1

      currentGeneration = SolarCalculator.calculateCurrentGeneration(
        { solarZone, panelCapacityKw, panelTilt, panelAzimuth, systemEfficiency },
        currentHour,
        0.2, // Assume 20% cloud cover (could be from weather API)
        month
      )
    }

    // Financial calculations
    const averageElectricityPrice = 0.28 // $0.28/kWh average
    const feedInTariff = 0.08 // $0.08/kWh average feed-in tariff
    const annualSavings = solarOutput.annualGeneration * averageElectricityPrice

    return NextResponse.json({
      input: {
        solarZone,
        panelCapacityKw,
        panelTilt,
        panelAzimuth,
        systemEfficiency
      },
      zoneInfo,
      output: solarOutput,
      stc: stcData,
      currentGeneration: includeCurrentGen ? {
        currentKw: Math.round(currentGeneration * 100) / 100,
        timestamp: new Date().toISOString()
      } : undefined,
      financial: {
        annualSavings: Math.round(annualSavings),
        averageElectricityPrice,
        feedInTariff,
        stcValue: stcData.stcValue
      },
      recommendations: {
        optimalTilt: `${Math.round(25)}° (latitude-based)`,
        optimalAzimuth: '0° (north-facing)',
        capacityFactor: `${solarOutput.capacityFactor.toFixed(1)}%`,
        performance: solarOutput.capacityFactor > 18 ? 'Excellent' :
                   solarOutput.capacityFactor > 15 ? 'Good' :
                   solarOutput.capacityFactor > 12 ? 'Average' : 'Poor'
      }
    })

  } catch (error) {
    console.error('Solar calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate solar output' },
      { status: 500 }
    )
  }
}

// POST /api/solar/compare - Compare multiple solar configurations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { configurations } = body

    if (!Array.isArray(configurations)) {
      return NextResponse.json(
        { error: 'Configurations must be an array' },
        { status: 400 }
      )
    }

    const results = configurations.map((config, index) => {
      try {
        const solarOutput = SolarCalculator.calculateSolarOutput(config)
        const stcData = SolarCalculator.calculateSTCValue(
          config.panelCapacityKw,
          config.solarZone
        )

        return {
          id: index,
          config,
          output: solarOutput,
          stc: stcData,
          costPerKwh: (config.systemCost || 0) / solarOutput.annualGeneration,
          paybackYears: (config.systemCost || 0) /
            (solarOutput.annualGeneration * 0.28) // Assuming $0.28/kWh
        }
      } catch (error) {
        return {
          id: index,
          config,
          error: 'Invalid configuration parameters'
        }
      }
    })

    // Sort by annual generation (best performance first)
    const sortedResults = results
      .filter(r => !r.error && r.output)
      .sort((a, b) => (b.output?.annualGeneration || 0) - (a.output?.annualGeneration || 0))

    return NextResponse.json({
      results: sortedResults,
      comparison: {
        bestPerformance: sortedResults[0],
        bestValue: sortedResults.sort((a, b) => (a.costPerKwh || 0) - (b.costPerKwh || 0))[0],
        quickestPayback: sortedResults.sort((a, b) => (a.paybackYears || 0) - (b.paybackYears || 0))[0]
      }
    })

  } catch (error) {
    console.error('Solar comparison error:', error)
    return NextResponse.json(
      { error: 'Failed to compare solar configurations' },
      { status: 500 }
    )
  }
}