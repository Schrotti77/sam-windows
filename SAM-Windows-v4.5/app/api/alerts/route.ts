export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


export async function GET() {
  try {
    const alerts = await prisma.complianceAlert.findMany({
      orderBy: [
        { isResolved: 'asc' },
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(alerts)

  } catch (error) {
    console.error('Alerts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { 
      title,
      description,
      alertType,
      severity,
      relatedEntity,
      entityType 
    } = await request.json()

    if (!title || !description || !alertType || !severity || !relatedEntity || !entityType) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const alert = await prisma.complianceAlert.create({
      data: {
        title,
        description,
        alertType,
        severity,
        relatedEntity,
        entityType
      }
    })

    return NextResponse.json(alert, { status: 201 })

  } catch (error) {
    console.error('Alert creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Bulk resolve all unresolved alerts
export async function PATCH() {
  try {
    const result = await prisma.complianceAlert.updateMany({
      where: { isResolved: false },
      data: {
        isResolved: true,
        resolvedAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: 'All alerts marked as resolved',
      count: result.count 
    })

  } catch (error) {
    console.error('Bulk resolve error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
