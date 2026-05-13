export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'


export async function GET() {
  const authError = await requireApiAuth()
  if (authError) return authError

  try {
    // Export all data in parallel
    const [vendors, software, licenses, costs, alerts, contracts, budgets, assignments, users] = await Promise.all([
      prisma.vendor.findMany({ orderBy: { name: 'asc' } }),
      prisma.software.findMany({ orderBy: { name: 'asc' } }),
      prisma.license.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.softwareCost.findMany({ orderBy: { costDate: 'asc' } }),
      prisma.complianceAlert.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.contract.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.budget.findMany({ orderBy: [{ fiscalYear: 'desc' }, { name: 'asc' }] }),
      prisma.softwareAssignment.findMany({ orderBy: { assignedAt: 'desc' } }),
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
      version: '3.1',
      exportedAt: new Date().toISOString(),
      data: {
        vendors,
        software,
        licenses,
        costs,
        alerts,
        contracts,
        budgets,
        assignments,
        users
      },
      counts: {
        vendors: vendors.length,
        software: software.length,
        licenses: licenses.length,
        costs: costs.length,
        alerts: alerts.length,
        contracts: contracts.length,
        budgets: budgets.length,
        assignments: assignments.length,
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
