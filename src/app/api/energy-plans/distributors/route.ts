import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// GET /api/energy-plans/distributors?postcode=3000
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postcodeParam = searchParams.get('postcode')

    if (!postcodeParam) {
      return NextResponse.json({
        success: false,
        error: 'Postcode parameter is required'
      }, { status: 400 })
    }

    const postcode = parseInt(postcodeParam)

    if (isNaN(postcode) || postcode < 200 || postcode > 9999) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Australian postcode'
      }, { status: 400 })
    }

    // Find all distributors for this postcode
    const postcodeDistributors = await prisma.postcodeDistributor.findMany({
      where: {
        postcode
      },
      include: {
        distributor: true
      },
      orderBy: [
        { isPrimary: 'desc' },
        { distributor: { name: 'asc' } }
      ]
    })

    if (postcodeDistributors.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No distributors found for postcode ${postcode}`,
        message: 'This postcode may not be serviced or data is not yet available'
      }, { status: 404 })
    }

    const distributors = postcodeDistributors.map(pd => ({
      id: pd.distributor.id,
      code: pd.distributor.code,
      name: pd.distributor.name,
      state: pd.distributor.state,
      isPrimary: pd.isPrimary,
      nmiPrefixes: pd.distributor.nmiPrefixes ? JSON.parse(pd.distributor.nmiPrefixes) : []
    }))

    return NextResponse.json({
      success: true,
      postcode,
      count: distributors.length,
      distributors,
      hasPrimary: distributors.some(d => d.isPrimary)
    })

  } catch (error) {
    console.error('Distributors lookup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch distributors',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
