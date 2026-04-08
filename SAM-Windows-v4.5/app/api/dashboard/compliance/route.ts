export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


export async function GET() {
  try {
    const complianceStats = await prisma.license.groupBy({
      by: ['complianceStatus'],
      _count: {
        complianceStatus: true
      }
    })

    const result = complianceStats.map((stat: any) => ({
      name: getComplianceStatusLabel(stat.complianceStatus),
      value: stat._count.complianceStatus
    }))

    if (result.length === 0) {
      return NextResponse.json([
        { name: 'Compliant', value: 0 },
        { name: 'Non-Compliant', value: 0 },
        { name: 'At Risk', value: 0 },
        { name: 'Unknown', value: 0 }
      ])
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Dashboard compliance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getComplianceStatusLabel(status: string): string {
  switch (status) {
    case 'COMPLIANT':
      return 'Compliant'
    case 'NON_COMPLIANT':
      return 'Non-Compliant'
    case 'AT_RISK':
      return 'At Risk'
    case 'UNKNOWN':
      return 'Unknown'
    default:
      return status
  }
}
