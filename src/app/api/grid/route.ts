import { NextRequest, NextResponse } from 'next/server'
import { aemoAPI, getRegionFromState } from '@/lib/opennem'
import { prisma } from '@/lib/prisma'

// GET /api/grid - Get current grid mix and carbon intensity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    const region = searchParams.get('region')

    // Determine which region to query
    let targetRegion: string
    if (region) {
      targetRegion = region.toUpperCase()
    } else if (state) {
      targetRegion = getRegionFromState(state)
    } else {
      return NextResponse.json(
        { error: 'State or region parameter required' },
        { status: 400 }
      )
    }

    // Fetch current grid data from AEMO
    const gridMix = await aemoAPI.getCurrentGridMix(targetRegion)

    if (!gridMix) {
      return NextResponse.json(
        { error: 'Failed to fetch grid data' },
        { status: 500 }
      )
    }

    // Price is already included in AEMO grid mix data

    // Store in database for historical tracking
    try {
      await prisma.gridData.upsert({
        where: {
          region_timestamp: {
            region: targetRegion,
            timestamp: new Date(gridMix.timestamp)
          }
        },
        update: {
          price: gridMix.price,
          demand: gridMix.totalDemand,
          renewableShare: gridMix.renewableShare,
          carbonIntensity: gridMix.carbonIntensity
        },
        create: {
          region: targetRegion,
          timestamp: new Date(gridMix.timestamp),
          price: gridMix.price,
          demand: gridMix.totalDemand,
          renewableShare: gridMix.renewableShare,
          carbonIntensity: gridMix.carbonIntensity
        }
      })
    } catch (dbError) {
      // Log but don't fail the request if database storage fails
      console.error('Failed to store grid data:', dbError)
    }

    // Add recommendation based on carbon intensity
    const recommendation = getChargingRecommendation(gridMix.carbonIntensity)

    return NextResponse.json({
      ...gridMix,
      recommendation
    })

  } catch (error) {
    console.error('Grid API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grid data' },
      { status: 500 }
    )
  }
}

// GET /api/grid/all - Get grid data for all NEM regions
export async function POST() {
  try {
    const allRegionsData = await aemoAPI.getAllRegionsGridMix()

    // Add recommendations to each region
    const enrichedData = allRegionsData.map(gridMix => ({
      ...gridMix,
      recommendation: getChargingRecommendation(gridMix.carbonIntensity)
    }))

    return NextResponse.json({
      regions: enrichedData,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('All regions grid API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grid data for all regions' },
      { status: 500 }
    )
  }
}

function getChargingRecommendation(carbonIntensity: number): {
  action: 'charge' | 'hold' | 'discharge'
  priority: 'low' | 'medium' | 'high'
  message: string
} {
  if (carbonIntensity < 100) {
    return {
      action: 'charge',
      priority: 'high',
      message: 'Grid is very clean - excellent time to charge your battery'
    }
  } else if (carbonIntensity < 300) {
    return {
      action: 'charge',
      priority: 'medium',
      message: 'Grid is clean - good time to charge your battery'
    }
  } else if (carbonIntensity < 600) {
    return {
      action: 'hold',
      priority: 'low',
      message: 'Grid carbon intensity is moderate - hold current charge'
    }
  } else if (carbonIntensity < 800) {
    return {
      action: 'discharge',
      priority: 'medium',
      message: 'Grid is dirty - consider using battery power'
    }
  } else {
    return {
      action: 'discharge',
      priority: 'high',
      message: 'Grid is very dirty - maximize battery discharge'
    }
  }
}