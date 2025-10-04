import { NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// GET /api/energy-plans/debug - Debug endpoint to see what's in the database
export async function GET() {
  try {
    // Get total count
    const totalCount = await prisma.energyPlan.count()

    // Get sample plans
    const samplePlans = await prisma.energyPlan.findMany({
      take: 5,
      select: {
        id: true,
        retailerName: true,
        planName: true,
        state: true,
        fuelType: true,
        tariffType: true,
        distributors: true,
        includedPostcodes: true,
        dailySupplyCharge: true,
        peakRate: true,
        singleRate: true,
        feedInTariff: true,
        hasBatteryIncentive: true,
        hasVPP: true,
        isActive: true
      }
    })

    // Get stats by state
    const byState = await prisma.energyPlan.groupBy({
      by: ['state'],
      _count: true
    })

    // Get stats by retailer
    const byRetailer = await prisma.energyPlan.groupBy({
      by: ['retailerName'],
      _count: true
    })

    // Get stats by tariff type
    const byTariffType = await prisma.energyPlan.groupBy({
      by: ['tariffType'],
      _count: true
    })

    // Get stats by fuel type
    const byFuelType = await prisma.energyPlan.groupBy({
      by: ['fuelType'],
      _count: true
    })

    return NextResponse.json({
      success: true,
      summary: {
        totalCount,
        byState: byState.map(s => ({ state: s.state, count: s._count })),
        byRetailer: byRetailer.map(r => ({ retailer: r.retailerName, count: r._count })),
        byTariffType: byTariffType.map(t => ({ tariffType: t.tariffType, count: t._count })),
        byFuelType: byFuelType.map(f => ({ fuelType: f.fuelType, count: f._count }))
      },
      samplePlans: samplePlans.map(plan => ({
        ...plan,
        distributors: plan.distributors ? JSON.parse(plan.distributors) : [],
        includedPostcodes: plan.includedPostcodes
          ? JSON.parse(plan.includedPostcodes).slice(0, 10) // First 10 postcodes
          : []
      }))
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch debug data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
