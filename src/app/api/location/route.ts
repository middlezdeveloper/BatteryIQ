import { NextRequest, NextResponse } from 'next/server'

// Map postcodes to Australian states for AEMO regions
const postcodeToState = (postcode: string): string => {
  const pc = parseInt(postcode)
  if (pc >= 1000 && pc <= 2999) return 'NSW'
  if (pc >= 3000 && pc <= 3999) return 'VIC'
  if (pc >= 4000 && pc <= 4999) return 'QLD'
  if (pc >= 5000 && pc <= 5999) return 'SA'
  if (pc >= 6000 && pc <= 6999) return 'WA'
  if (pc >= 7000 && pc <= 7999) return 'TAS'
  if (pc >= 800 && pc <= 999) return 'NT'
  if (pc >= 200 && pc <= 299) return 'ACT'
  return 'NSW' // Default fallback
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1'

    // Use ipapi.co for free IP geolocation (no API key needed)
    const locationResponse = await fetch(`https://ipapi.co/${clientIp}/json/`, {
      headers: {
        'User-Agent': 'BatteryIQ/1.0'
      }
    })

    if (!locationResponse.ok) {
      throw new Error('Failed to fetch location data')
    }

    const locationData = await locationResponse.json()

    // Extract relevant data
    const {
      country_code,
      region,
      city,
      postal,
      latitude,
      longitude
    } = locationData

    // Default to VIC for Australian IPs if we can't determine state
    let detectedState = 'VIC'

    if (country_code === 'AU') {
      // Try to map by region name first
      const regionUpper = region?.toUpperCase()
      if (['NSW', 'NEW SOUTH WALES'].includes(regionUpper)) detectedState = 'NSW'
      else if (['VIC', 'VICTORIA'].includes(regionUpper)) detectedState = 'VIC'
      else if (['QLD', 'QUEENSLAND'].includes(regionUpper)) detectedState = 'QLD'
      else if (['SA', 'SOUTH AUSTRALIA'].includes(regionUpper)) detectedState = 'SA'
      else if (['WA', 'WESTERN AUSTRALIA'].includes(regionUpper)) detectedState = 'WA'
      else if (['TAS', 'TASMANIA'].includes(regionUpper)) detectedState = 'TAS'
      else if (['NT', 'NORTHERN TERRITORY'].includes(regionUpper)) detectedState = 'NT'
      else if (['ACT', 'AUSTRALIAN CAPITAL TERRITORY'].includes(regionUpper)) detectedState = 'ACT'
      // Fallback to postcode mapping if region name doesn't match
      else if (postal) {
        detectedState = postcodeToState(postal)
      }
    }

    const response = {
      success: true,
      location: {
        country: country_code,
        state: detectedState,
        region: region,
        city: city,
        postcode: postal,
        coordinates: {
          lat: latitude,
          lng: longitude
        }
      },
      detectedIp: clientIp,
      isAustralian: country_code === 'AU'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Location detection error:', error)

    // Fallback response for errors
    return NextResponse.json({
      success: false,
      location: {
        country: 'AU',
        state: 'VIC', // Default to VIC as requested
        region: 'Victoria',
        city: 'Melbourne',
        postcode: '3000',
        coordinates: {
          lat: -37.8136,
          lng: 144.9631
        }
      },
      detectedIp: '127.0.0.1',
      isAustralian: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}