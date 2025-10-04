import { NextRequest, NextResponse } from 'next/server'

// GET /api/energy-plans/fetch-cdr - Fetch energy plans from CDR API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fuelType = searchParams.get('fuelType') || 'ELECTRICITY'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '100')

    const cdrApiUrl = 'https://cdr.energymadeeasy.gov.au/cds-au/v1/energy/plans'

    const params = new URLSearchParams({
      'fuel-type': fuelType,
      page: page.toString(),
      'page-size': pageSize.toString(),
    })

    console.log(`Fetching CDR energy plans: ${cdrApiUrl}?${params}`)

    const response = await fetch(`${cdrApiUrl}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'x-v': '1',
        'User-Agent': 'BatteryIQ/1.0 (https://batteryiq.com.au)',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`CDR API error: ${response.status} - ${errorText}`)
      return NextResponse.json({
        success: false,
        error: `CDR API returned ${response.status}`,
        details: errorText
      }, { status: response.status })
    }

    const data = await response.json()

    if (!data.data || !data.data.plans) {
      return NextResponse.json({
        success: false,
        error: 'No plans returned from CDR API'
      }, { status: 500 })
    }

    // Parse and transform CDR plans to our schema format
    const transformedPlans = data.data.plans.map((plan: any) => {
      const electricityContract = plan.electricityContract || {}
      const tariffPeriod = electricityContract.tariffPeriod?.[0] || {}

      // Extract time-of-use rates
      let peakRate = null, shoulderRate = null, offPeakRate = null
      let peakTimes = null, shoulderTimes = null, offPeakTimes = null
      let singleRate = null

      if (tariffPeriod.rateBlockUType === 'timeOfUseRates') {
        const touRates = tariffPeriod.timeOfUseRates || []

        touRates.forEach((rate: any) => {
          const rateAmount = rate.rates?.[0]?.unitPrice
          const timeOfUse = rate.timeOfUse || []

          if (rate.type === 'PEAK') {
            peakRate = rateAmount
            peakTimes = JSON.stringify(timeOfUse)
          } else if (rate.type === 'SHOULDER') {
            shoulderRate = rateAmount
            shoulderTimes = JSON.stringify(timeOfUse)
          } else if (rate.type === 'OFF_PEAK') {
            offPeakRate = rateAmount
            offPeakTimes = JSON.stringify(timeOfUse)
          }
        })
      } else if (tariffPeriod.rateBlockUType === 'singleRate') {
        const singleRateData = tariffPeriod.singleRate
        singleRate = singleRateData?.rates?.[0]?.unitPrice
      }

      // Extract supply charge
      const dailySupplyCharge = electricityContract.dailySupplyCharges || 0

      // Extract solar feed-in tariff
      const solarFeedInTariff = electricityContract.solarFeedInTariff?.[0]?.payerType === 'RETAILER'
        ? electricityContract.solarFeedInTariff[0].tariff?.singleTariff?.rates?.[0]?.unitPrice
        : null

      // Determine tariff type
      let tariffType = 'FLAT'
      if (peakRate || shoulderRate || offPeakRate) {
        tariffType = 'TIME_OF_USE'
      } else if (tariffPeriod.demandCharges && tariffPeriod.demandCharges.length > 0) {
        tariffType = 'DEMAND'
      }

      return {
        id: plan.planId,
        retailerId: plan.brand || 'UNKNOWN',
        retailerName: plan.brandName || 'Unknown Retailer',
        planName: plan.displayName || plan.planId,
        state: plan.geography?.includedPostcodes?.[0]?.substring(0, 1) || 'UNKNOWN', // Rough estimate from postcode
        fuelType: plan.fuelType || 'ELECTRICITY',
        tariffType,
        planType: 'MARKET',

        // Geographic eligibility
        distributors: JSON.stringify(plan.geography?.distributors || []),
        includedPostcodes: plan.geography?.includedPostcodes ? JSON.stringify(plan.geography.includedPostcodes) : null,
        excludedPostcodes: plan.geography?.excludedPostcodes ? JSON.stringify(plan.geography.excludedPostcodes) : null,

        // Charges
        dailySupplyCharge,
        peakRate,
        peakTimes,
        shoulderRate,
        shoulderTimes,
        offPeakRate,
        offPeakTimes,
        singleRate,

        // Solar
        feedInTariff: solarFeedInTariff,

        // Discounts
        payOnTimeDiscount: electricityContract.discounts?.find((d: any) => d.type === 'PAY_ON_TIME')?.percentage,
        directDebitDiscount: electricityContract.discounts?.find((d: any) => d.type === 'DIRECT_DEBIT')?.percentage,

        // Contract
        contractLength: electricityContract.terms?.contractLength,
        exitFees: electricityContract.terms?.exitFees,

        // Features
        greenPower: electricityContract.greenPowerCharges && electricityContract.greenPowerCharges.length > 0,

        // Raw data
        rawData: JSON.stringify(plan),

        isActive: true,
        validFrom: plan.effectiveFrom || new Date().toISOString(),
        validTo: plan.effectiveTo || null,
        lastUpdated: new Date().toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      count: transformedPlans.length,
      totalPages: data.meta?.totalPages || 1,
      totalRecords: data.meta?.totalRecords || transformedPlans.length,
      page,
      pageSize,
      plans: transformedPlans,
      links: data.links
    })

  } catch (error) {
    console.error('CDR API fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch energy plans from CDR API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
