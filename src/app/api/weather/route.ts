import { NextRequest, NextResponse } from 'next/server'
import { weatherAPI } from '@/lib/weather-api'

// POST /api/weather - Get current weather and solar data for a location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { latitude, longitude } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required parameters: latitude and longitude' },
        { status: 400 }
      )
    }

    const weatherData = await weatherAPI.getWeatherData(latitude, longitude)

    return NextResponse.json({
      success: true,
      data: weatherData,
      dataSource: 'Open-Meteo',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weather data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/weather - Same as POST but with query parameters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = parseFloat(searchParams.get('latitude') || '0')
    const longitude = parseFloat(searchParams.get('longitude') || '0')

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required parameters: latitude and longitude' },
        { status: 400 }
      )
    }

    const weatherData = await weatherAPI.getWeatherData(latitude, longitude)

    return NextResponse.json({
      success: true,
      data: weatherData,
      dataSource: 'Open-Meteo',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weather data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
