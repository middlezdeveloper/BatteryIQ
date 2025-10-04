import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// GET /api/energy-plans/distributor-by-address?address=123 Main St&suburb=Melbourne&postcode=3000
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const suburb = searchParams.get('suburb')
    const postcodeParam = searchParams.get('postcode')

    if (!address || !suburb || !postcodeParam) {
      return NextResponse.json({
        success: false,
        error: 'Address, suburb, and postcode are required'
      }, { status: 400 })
    }

    const postcode = parseInt(postcodeParam)

    // First, check if we have location data for this postcode
    const location = await prisma.location.findFirst({
      where: {
        postcode: postcodeParam
      }
    })

    if (!location) {
      return NextResponse.json({
        success: false,
        error: `Location data not found for postcode ${postcode}`,
        message: 'We don\'t have detailed location data for this area yet'
      }, { status: 404 })
    }

    // Get all distributors for this postcode
    const postcodeDistributors = await prisma.postcodeDistributor.findMany({
      where: {
        postcode
      },
      include: {
        distributor: true
      }
    })

    if (postcodeDistributors.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No distributors found for postcode ${postcode}`
      }, { status: 404 })
    }

    // For now, return the primary distributor or the first one
    // In a production system, you would integrate with a geocoding service
    // or NMI lookup API to determine the exact distributor
    const primaryDistributor = postcodeDistributors.find(pd => pd.isPrimary)
    const selectedDistributor = primaryDistributor || postcodeDistributors[0]

    return NextResponse.json({
      success: true,
      postcode,
      address: {
        street: address,
        suburb,
        postcode: postcodeParam,
        state: location.state
      },
      distributor: {
        id: selectedDistributor.distributor.id,
        code: selectedDistributor.distributor.code,
        name: selectedDistributor.distributor.name,
        state: selectedDistributor.distributor.state,
        isPrimary: selectedDistributor.isPrimary,
        confidence: selectedDistributor.isPrimary ? 'high' : 'medium'
      },
      allDistributors: postcodeDistributors.map(pd => ({
        id: pd.distributor.id,
        code: pd.distributor.code,
        name: pd.distributor.name,
        isPrimary: pd.isPrimary
      })),
      message: postcodeDistributors.length > 1
        ? 'Multiple distributors service this area. The selected distributor is our best estimate based on the postcode.'
        : 'Single distributor confirmed for this area.'
    })

  } catch (error) {
    console.error('Address-to-distributor lookup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to determine distributor from address',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
