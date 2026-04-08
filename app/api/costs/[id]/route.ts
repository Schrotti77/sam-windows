export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


// GET single cost entry
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cost = await prisma.softwareCost.findUnique({
      where: { id: params.id },
      include: {
        software: {
          include: {
            vendor: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!cost) {
      return NextResponse.json(
        { error: 'Cost entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cost)
  } catch (error) {
    console.error('Cost GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE cost entry
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existingCost = await prisma.softwareCost.findUnique({
      where: { id: params.id }
    })

    if (!existingCost) {
      return NextResponse.json(
        { error: 'Cost entry not found' },
        { status: 404 }
      )
    }

    const {
      softwareId,
      costType,
      amount,
      currency,
      billingPeriod,
      costDate,
      description,
      category,
      department
    } = await request.json()

    if (!softwareId || !costType || !amount || !billingPeriod || !costDate) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    const cost = await prisma.softwareCost.update({
      where: { id: params.id },
      data: {
        softwareId,
        costType,
        amount: parseFloat(amount),
        currency: currency || 'EUR',
        billingPeriod,
        costDate: new Date(costDate),
        description,
        category,
        department
      },
      include: {
        software: {
          include: {
            vendor: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(cost)
  } catch (error) {
    console.error('Cost UPDATE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE cost entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existingCost = await prisma.softwareCost.findUnique({
      where: { id: params.id }
    })

    if (!existingCost) {
      return NextResponse.json(
        { error: 'Cost entry not found' },
        { status: 404 }
      )
    }

    await prisma.softwareCost.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Cost entry deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Cost DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
