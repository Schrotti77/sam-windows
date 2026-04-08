export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


export async function GET() {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const costs = await prisma.softwareCost.findMany({
      where: {
        costDate: {
          gte: sixMonthsAgo
        }
      },
      select: {
        amount: true,
        costType: true,
        costDate: true
      }
    })

    // Group costs by month and type
    const monthlyData = costs.reduce((acc: any, cost: any) => {
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

    const result = Object.values(monthlyData)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Dashboard costs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
