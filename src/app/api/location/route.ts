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

// Map region to Australian state
const mapRegionToState = (region: string, postal: string): string => {
  if (!region) {
    return postal ? postcodeToState(postal) : 'VIC'
  }

  const regionUpper = region.toUpperCase()
  if (['NSW', 'NEW SOUTH WALES'].includes(regionUpper)) return 'NSW'
  if (['VIC', 'VICTORIA'].includes(regionUpper)) return 'VIC'
  if (['QLD', 'QUEENSLAND'].includes(regionUpper)) return 'QLD'
  if (['SA', 'SOUTH AUSTRALIA'].includes(regionUpper)) return 'SA'
  if (['WA', 'WESTERN AUSTRALIA'].includes(regionUpper)) return 'WA'
  if (['TAS', 'TASMANIA'].includes(regionUpper)) return 'TAS'
  if (['NT', 'NORTHERN TERRITORY'].includes(regionUpper)) return 'NT'
  if (['ACT', 'AUSTRALIAN CAPITAL TERRITORY'].includes(regionUpper)) return 'ACT'

  // Fallback to postcode mapping
  return postal ? postcodeToState(postal) : 'VIC'
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    let clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1'

    // If running locally (localhost IP), fetch external IP first
    if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')) {
      try {
        // Get external IP using ipapi.co without specifying an IP (gets caller's external IP)
        const externalIpResponse = await fetch('https://ipapi.co/json/', {
          headers: {
            'User-Agent': 'BatteryIQ/1.0'
          }
        })

        if (externalIpResponse.ok) {
          const externalData = await externalIpResponse.json()
          if (externalData.ip) {
            clientIp = externalData.ip
            console.log(`🌍 Detected external IP: ${clientIp} (was localhost)`)

            // Return the location data directly since we already have it
            const response = {
              success: true,
              location: {
                country: externalData.country_code,
                state: mapRegionToState(externalData.region, externalData.postal),
                region: externalData.region,
                city: externalData.city,
                postcode: externalData.postal,
                latitude: externalData.latitude,
                longitude: externalData.longitude
              },
              detectedIp: clientIp,
              isAustralian: externalData.country_code === 'AU'
            }
            return NextResponse.json(response)
          }
        }
      } catch (externalIpError) {
        console.warn('Failed to get external IP, using original IP:', externalIpError)
      }
    }

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

    // For non-Australian visitors, provide their actual location but flag as non-Australian
    const isAustralian = country_code === 'AU'

    const response = {
      success: true,
      location: {
        country: country_code,
        state: isAustralian ? mapRegionToState(region, postal) : 'NSW', // Default to NSW for international
        region: isAustralian ? region : 'New South Wales',
        city: city || 'Sydney',
        postcode: postal,
        latitude: latitude || -33.8688,
        longitude: longitude || 151.2093
      },
      detectedIp: clientIp,
      isAustralian
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