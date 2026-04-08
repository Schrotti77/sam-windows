export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


export async function GET() {
  try {
    // Export all data in parallel
    const [vendors, software, licenses, costs, alerts, contracts, users] = await Promise.all([
      prisma.vendor.findMany({ orderBy: { name: 'asc' } }),
      prisma.software.findMany({ orderBy: { name: 'asc' } }),
      prisma.license.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.softwareCost.findMany({ orderBy: { costDate: 'asc' } }),
      prisma.complianceAlert.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.contract.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'asc' }
      })
    ])

    const exportData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      data: {
        vendors,
        software,
        licenses,
        costs,
        alerts,
        contracts,
        users
      },
      counts: {
        vendors: vendors.length,
        software: software.length,
        licenses: licenses.length,
        costs: costs.length,
        alerts: alerts.length,
        contracts: contracts.length,
        users: users.length
      }
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sam-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
