import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/locations - Search locations by postcode
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postcode = searchParams.get('postcode')
    const query = searchParams.get('q')

    if (!postcode && !query) {
      return NextResponse.json(
        { error: 'Postcode or query parameter required' },
        { status: 400 }
      )
    }

    let locations

    if (postcode) {
      // Exact postcode match
      locations = await prisma.location.findMany({
        where: {
          postcode: postcode
        },
        take: 10
      })
    } else if (query) {
      // Search by suburb or postcode
      locations = await prisma.location.findMany({
        where: {
          OR: [
            { suburb: { contains: query, mode: 'insensitive' } },
            { postcode: { contains: query } }
          ]
        },
        take: 10
      })
    }

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Location search error:', error)
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    )
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postcode, suburb, state, latitude, longitude, solarZone, gridRegion } = body

    const location = await prisma.location.create({
      data: {
        postcode,
        suburb,
        state,
        latitude,
        longitude,
        solarZone,
        gridRegion
      }
    })

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error('Location creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}