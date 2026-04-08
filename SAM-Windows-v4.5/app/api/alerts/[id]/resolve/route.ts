export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const existingAlert = await prisma.complianceAlert.findUnique({
      where: { id }
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    // Toggle resolved status
    const alert = await prisma.complianceAlert.update({
      where: { id },
      data: {
        isResolved: !existingAlert.isResolved,
        resolvedAt: !existingAlert.isResolved ? new Date() : null,
        resolvedBy: null
      }
    })

    return NextResponse.json(alert)

  } catch (error) {
    console.error('Alert resolve error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
