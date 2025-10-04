import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// GET /api/energy-plans/search?postcode=3000&distributorCode=POWERCOR&hasBattery=true&hasVPP=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postcodeParam = searchParams.get('postcode')
    const distributorCode = searchParams.get('distributorCode')
    const hasBatteryIncentive = searchParams.get('hasBattery') === 'true'
    const hasVPP = searchParams.get('hasVPP') === 'true'
    const minFeedInTariff = searchParams.get('minFeedIn') ? parseFloat(searchParams.get('minFeedIn')!) : null
    const tariffType = searchParams.get('tariffType')
    const state = searchParams.get('state')

    // Build where clause
    const where: any = {
      isActive: true,
      fuelType: 'ELECTRICITY'
    }

    // Filter by state
    if (state) {
      where.state = state
    }

    // Filter by distributor if provided
    // Map distributor codes to possible CDR API names (case-insensitive matching)
    if (distributorCode) {
      const distributorNameMap: Record<string, string> = {
        'AUSNET': 'AusNet',
        'CITIPOWER': 'Citipower',
        'JEMENA': 'Jemena',
        'POWERCOR': 'Powercor',
        'UNITED': 'United',
        'AUSGRID': 'Ausgrid',
        'ENDEAVOUR': 'Endeavour',
        'ESSENTIAL': 'Essential',
        'ENERGEX': 'Energex',
        'ERGON': 'Ergon',
        'SAPN': 'Power Networks'
      }

      const searchTerm = distributorNameMap[distributorCode] || distributorCode

      where.distributors = {
        contains: searchTerm
      }
    }

    // Filter by battery incentive
    if (hasBatteryIncentive) {
      where.hasBatteryIncentive = true
    }

    // Filter by VPP
    if (hasVPP) {
      where.hasVPP = true
    }

    // Filter by tariff type
    if (tariffType) {
      where.tariffType = tariffType
    }

    // Filter by minimum feed-in tariff
    if (minFeedInTariff !== null) {
      where.feedInTariff = {
        gte: minFeedInTariff
      }
    }

    // Execute query
    console.log('🔍 Search query:', JSON.stringify(where, null, 2))

    const plans = await prisma.energyPlan.findMany({
      where,
      orderBy: [
        { hasBatteryIncentive: 'desc' },
        { hasVPP: 'desc' },
        { feedInTariff: 'desc' },
        { retailerName: 'asc' }
      ],
      take: 100 // Limit to 100 plans
    })

    console.log(`📊 Found ${plans.length} plans before postcode filtering`)

    if (plans.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        plans: [],
        message: 'No plans found matching your criteria. Try adjusting your filters.'
      })
    }

    // Transform plans for client
    const transformedPlans = plans.map(plan => {
      // Parse JSON fields
      const distributors = plan.distributors ? JSON.parse(plan.distributors) : []
      const includedPostcodes = plan.includedPostcodes ? JSON.parse(plan.includedPostcodes) : []
      const excludedPostcodes = plan.excludedPostcodes ? JSON.parse(plan.excludedPostcodes) : []
      const peakTimes = plan.peakTimes ? JSON.parse(plan.peakTimes) : []
      const shoulderTimes = plan.shoulderTimes ? JSON.parse(plan.shoulderTimes) : []
      const offPeakTimes = plan.offPeakTimes ? JSON.parse(plan.offPeakTimes) : []

      // Check postcode eligibility if provided
      let isEligible = true
      if (postcodeParam) {
        const postcode = postcodeParam
        if (includedPostcodes.length > 0) {
          isEligible = includedPostcodes.includes(postcode)
        }
        if (excludedPostcodes.length > 0 && excludedPostcodes.includes(postcode)) {
          isEligible = false
        }
      }

      return {
        id: plan.id,
        retailerId: plan.retailerId,
        retailerName: plan.retailerName,
        planName: plan.planName,
        state: plan.state,
        fuelType: plan.fuelType,
        tariffType: plan.tariffType,
        planType: plan.planType,

        // Geographic
        distributors,
        isEligible,

        // Supply & Usage
        dailySupplyCharge: plan.dailySupplyCharge,
        singleRate: plan.singleRate,
        peakRate: plan.peakRate,
        peakTimes,
        shoulderRate: plan.shoulderRate,
        shoulderTimes,
        offPeakRate: plan.offPeakRate,
        offPeakTimes,

        // Solar & Battery
        feedInTariff: plan.feedInTariff,
        hasBatteryIncentive: plan.hasBatteryIncentive,
        batteryIncentiveValue: plan.batteryIncentiveValue,
        hasVPP: plan.hasVPP,
        vppCreditPerYear: plan.vppCreditPerYear,

        // Discounts
        payOnTimeDiscount: plan.payOnTimeDiscount,
        directDebitDiscount: plan.directDebitDiscount,

        // Fees
        connectionFee: plan.connectionFee,
        disconnectionFee: plan.disconnectionFee,
        latePaymentFee: plan.latePaymentFee,
        paperBillFee: plan.paperBillFee,

        // Contract
        contractLength: plan.contractLength,
        exitFees: plan.exitFees,

        // Features
        greenPower: plan.greenPower,
        carbonNeutral: plan.carbonNeutral,
        isEVFriendly: plan.isEVFriendly,

        // Tracking
        validFrom: plan.validFrom,
        validTo: plan.validTo,
        lastUpdated: plan.lastUpdated
      }
    })

    // Filter out ineligible plans if postcode was provided
    const eligiblePlans = postcodeParam
      ? transformedPlans.filter(p => p.isEligible)
      : transformedPlans

    console.log(`✅ Eligible plans after postcode filter: ${eligiblePlans.length}/${transformedPlans.length}`)

    return NextResponse.json({
      success: true,
      count: eligiblePlans.length,
      totalCount: plans.length,
      filters: {
        postcode: postcodeParam,
        distributorCode,
        hasBatteryIncentive,
        hasVPP,
        minFeedInTariff,
        tariffType,
        state
      },
      plans: eligiblePlans
    })

  } catch (error) {
    console.error('Energy plans search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search energy plans',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
