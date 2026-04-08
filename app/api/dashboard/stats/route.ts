export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


export async function GET() {
  try {
    // Run all independent queries in parallel
    const [
      totalSoftware,
      totalLicenses,
      totalVendors,
      monthlyCosts,
      compliantLicenses,
      alertCount
    ] = await Promise.all([
      prisma.software.count({ where: { isActive: true } }),
      prisma.license.count(),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.softwareCost.aggregate({
        _sum: { amount: true },
        where: {
          billingPeriod: 'MONTHLY',
          costDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.license.count({ where: { complianceStatus: 'COMPLIANT' } }),
      prisma.complianceAlert.count({ where: { isResolved: false } })
    ])

    const complianceRate = totalLicenses > 0 
      ? Math.round((compliantLicenses / totalLicenses) * 100)
      : 100

    return NextResponse.json({
      totalSoftware,
      totalLicenses,
      totalVendors,
      totalCosts: monthlyCosts._sum.amount || 0,
      complianceRate,
      alertCount
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
