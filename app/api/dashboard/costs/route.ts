export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function parseMonths(value: string | null): number {
  if (!value) return 6

  const parsed = Number.parseInt(value, 10)
  const allowedRanges = new Set([3, 6, 12, 24])
  return allowedRanges.has(parsed) ? parsed : 6
}

export async function GET(request: NextRequest) {
  try {
    const months = parseMonths(request.nextUrl.searchParams.get('months'))
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const costs = await prisma.softwareCost.findMany({
      where: {
        costDate: {
          gte: startDate
        }
      },
      select: {
        amount: true,
        costType: true,
        costDate: true
      },
      orderBy: {
        costDate: 'asc'
      }
    })

    // Group costs by month and type
    const monthlyData = costs.reduce((acc: Record<string, { month: string; license: number; maintenance: number; support: number }>, cost) => {
      const month = cost.costDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

      if (!acc[month]) {
        acc[month] = { month, license: 0, maintenance: 0, support: 0 }
      }

      switch (cost.costType) {
        case 'LICENSE':
          acc[month].license += cost.amount
          break
        case 'MAINTENANCE':
          acc[month].maintenance += cost.amount
          break
        case 'SUPPORT':
          acc[month].support += cost.amount
          break
      }

      return acc
    }, {})

    const chartData = Object.values(monthlyData)

    return NextResponse.json({ chartData, months })

  } catch (error) {
    console.error('Dashboard costs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
