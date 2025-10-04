import { NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// GET /api/energy-plans/stats - Get database statistics
export async function GET() {
  try {
    // Get total count
    const total = await prisma.energyPlan.count({
      where: { isActive: true }
    })

    // Get count by retailer
    const byRetailerRaw = await prisma.energyPlan.groupBy({
      by: ['retailerName'],
      where: { isActive: true },
      _count: true,
      orderBy: {
        _count: {
          retailerName: 'desc'
        }
      }
    })

    const byRetailer = byRetailerRaw.map(item => ({
      retailer: item.retailerName,
      count: item._count
    }))

    return NextResponse.json({
      success: true,
      total,
      byRetailer
    })

  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
