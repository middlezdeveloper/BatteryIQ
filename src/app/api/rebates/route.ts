import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/rebates - Get available rebates by state
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    const batteryCapacity = parseFloat(searchParams.get('capacity') || '0')

    const where = {
      isActive: true,
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        },
        {
          startDate: { lte: new Date() }
        }
      ]
    }

    // Add state filter if provided
    if (state) {
      Object.assign(where, {
        OR: [
          { type: 'FEDERAL' },
          { state: state }
        ]
      })
    }

    const rebates = await prisma.rebate.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { amount: 'desc' }
      ]
    })

    // Calculate rebate amounts for given battery capacity
    const rebatesWithCalculations = rebates.map(rebate => {
      let eligibleAmount = 0
      let maxRebate = 0

      if (batteryCapacity > 0) {
        const eligibleCapacity = Math.min(batteryCapacity, rebate.maxCapacity)
        eligibleAmount = eligibleCapacity * rebate.amount

        if (rebate.maxAmount) {
          eligibleAmount = Math.min(eligibleAmount, rebate.maxAmount)
        }

        maxRebate = rebate.maxAmount || rebate.maxCapacity * rebate.amount
      }

      return {
        ...rebate,
        eligibleAmount,
        maxRebate,
        eligibleCapacity: batteryCapacity > 0 ? Math.min(batteryCapacity, rebate.maxCapacity) : 0
      }
    })

    return NextResponse.json({
      rebates: rebatesWithCalculations,
      totalEligible: rebatesWithCalculations.reduce((sum, r) => sum + r.eligibleAmount, 0)
    })
  } catch (error) {
    console.error('Rebate fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rebates' },
      { status: 500 }
    )
  }
}

// POST /api/rebates - Create new rebate program
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const rebate = await prisma.rebate.create({
      data: body
    })

    return NextResponse.json({ rebate }, { status: 201 })
  } catch (error) {
    console.error('Rebate creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create rebate' },
      { status: 500 }
    )
  }
}