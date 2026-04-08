export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


// GET single alert
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const alert = await prisma.complianceAlert.findUnique({
      where: { id: params.id }
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Alert GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE alert (resolve/unresolve)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existingAlert = await prisma.complianceAlert.findUnique({
      where: { id: params.id }
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { isResolved, title, description, severity } = body

    const updateData: any = {}
    
    if (typeof isResolved === 'boolean') {
      updateData.isResolved = isResolved
      if (isResolved) {
        updateData.resolvedAt = new Date()
      } else {
        updateData.resolvedAt = null
        updateData.resolvedBy = null
      }
    }
    
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (severity) updateData.severity = severity

    const alert = await prisma.complianceAlert.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Alert UPDATE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE alert
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existingAlert = await prisma.complianceAlert.findUnique({
      where: { id: params.id }
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    await prisma.complianceAlert.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Alert deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Alert DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
