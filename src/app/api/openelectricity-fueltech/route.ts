import { NextRequest, NextResponse } from 'next/server'

// GET /api/openelectricity-fueltech - Get real fuel tech data from OpenElectricity v4 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'NSW1'

    const apiKey = 'oe_3ZcWbaVvfvsifQu6ePZEehas'
    const baseUrl = 'https://api.openelectricity.org.au/v4'

    // Fetch fuel tech breakdown and emissions for the region
    const powerUrl = `${baseUrl}/data/network/NEM?metrics=power&primary_grouping=network_region&secondary_grouping=fueltech&region=${region}&limit=1`
    const emissionsUrl = `${baseUrl}/data/network/NEM?metrics=emissions&primary_grouping=network_region&region=${region}&limit=1`

    console.log(`Fetching OpenElectricity power data from: ${powerUrl}`)
    console.log(`Fetching OpenElectricity emissions data from: ${emissionsUrl}`)

    // Fetch both power and emissions data in parallel
    const [powerResponse, emissionsResponse] = await Promise.all([
      fetch(powerUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'BatteryIQ/1.0 (https://batteryiq.com.au)'
        },
        cache: 'no-store'
      }),
      fetch(emissionsUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'BatteryIQ/1.0 (https://batteryiq.com.au)'
        },
        cache: 'no-store'
      })
    ])

    if (!powerResponse.ok) {
      const errorText = await powerResponse.text()
      console.error(`OpenElectricity API error: ${powerResponse.status} - ${errorText}`)
      return NextResponse.json({
        success: false,
        error: `API returned ${powerResponse.status}`
      }, { status: powerResponse.status })
    }

    const data = await powerResponse.json()
    const emissionsData = emissionsResponse.ok ? await emissionsResponse.json() : null

    if (!data.success || !data.data || data.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No data returned from API'
      }, { status: 500 })
    }

    // Extract fuel tech results
    const results = data.data[0].results
    const timestamp = data.data[0].date_end

    // Filter results for the specific region (format: "power_VIC1|battery")
    const regionPrefix = `power_${region}|`
    const regionResults = results.filter((r: any) => r.name.startsWith(regionPrefix))

    if (regionResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No data found for region ${region}`
      }, { status: 404 })
    }

    // Get latest value for each fuel type
    const fuelMix: Record<string, number> = {}
    let totalDemand = 0

    for (const result of regionResults) {
      const latestData = result.data[result.data.length - 1]
      const value = latestData[1] || 0
      // Remove the "power_VIC1|" prefix to get just the fuel type name
      const name = result.name.replace(regionPrefix, '')

      fuelMix[name] = value

      // Don't count charging or pumps in total demand (they're loads, not generation)
      if (!name.includes('charging') && !name.includes('pumps')) {
        totalDemand += value
      }
    }

    // Aggregate fuel types into categories
    const batteryCharging = (fuelMix['battery_charging'] || 0)
    const batteryDischarging = (fuelMix['battery_discharging'] || 0)
    const batteryNet = batteryDischarging - batteryCharging // Positive = discharging, Negative = charging

    // DEBUG: Log solar rooftop raw value
    console.log(`🔍 DEBUG Solar Rooftop for ${region}:`, {
      raw_value: fuelMix['solar_rooftop'],
      all_fuel_types: Object.keys(fuelMix),
      solar_related: Object.entries(fuelMix).filter(([key]) => key.includes('solar'))
    })

    const aggregated = {
      coal: Math.round((fuelMix['coal_black'] || 0) + (fuelMix['coal_brown'] || 0)),
      biomass: Math.round((fuelMix['bioenergy_biomass'] || 0)),
      gas: Math.round(
        (fuelMix['gas_ccgt'] || 0) +
        (fuelMix['gas_ocgt'] || 0) +
        (fuelMix['gas_recip'] || 0) +
        (fuelMix['gas_steam'] || 0) +
        (fuelMix['gas_wcmg'] || 0)
      ),
      hydro: Math.round((fuelMix['hydro'] || 0)),
      solar_utility: Math.round((fuelMix['solar_utility'] || 0)),
      solar_rooftop: Math.round((fuelMix['solar_rooftop'] || 0)),
      solar_total: Math.round((fuelMix['solar_utility'] || 0) + (fuelMix['solar_rooftop'] || 0)),
      wind: Math.round((fuelMix['wind'] || 0)),
      distillate: Math.round((fuelMix['distillate'] || 0)),
      grid_battery: Math.round(batteryNet),
      grid_battery_state: batteryNet > 0 ? 'discharging' : batteryNet < 0 ? 'charging' : 'idle',
      pumps: Math.round((fuelMix['pumps'] || 0)),
    }

    // Calculate renewable share
    const renewable = aggregated.solar_total + aggregated.wind + aggregated.hydro + aggregated.biomass
    const renewableShare = totalDemand > 0 ? (renewable / totalDemand) * 100 : 0

    // Calculate carbon intensity from emissions data
    let carbonIntensity = null
    if (emissionsData && emissionsData.success && emissionsData.data && emissionsData.data.length > 0) {
      const results = emissionsData.data[0].results
      if (results && Array.isArray(results)) {
        // Find the emissions result for this region
        const emissionsResult = results.find((r: any) =>
          r.name === `emissions_${region}`
        )

        if (emissionsResult && emissionsResult.data && emissionsResult.data.length > 0) {
          const latestEmissions = emissionsResult.data[emissionsResult.data.length - 1]
          const emissionsTonnes = latestEmissions[1] // tonnes of CO2 per 5 minutes
          const emissionsKg = emissionsTonnes * 1000 // convert to kg

          // Convert 5-minute demand (MW) to MWh: MW * (5/60) hours
          const demandMWh = totalDemand * (5 / 60)

          // Calculate intensity: kg CO2 / MWh
          if (demandMWh > 0) {
            carbonIntensity = Math.round(emissionsKg / demandMWh)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      region,
      timestamp,
      totalDemand: Math.round(totalDemand),
      renewableShare: Math.round(renewableShare * 10) / 10,
      carbonIntensity,
      fuels: aggregated,
      raw: fuelMix,
      dataSource: 'OpenElectricity v4 (Real fuel-tech data)',
      apiVersion: data.version
    })

  } catch (error) {
    console.error('OpenElectricity fuel tech error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch fuel tech data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
