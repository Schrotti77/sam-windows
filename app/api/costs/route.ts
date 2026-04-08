export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


export async function GET() {
  try {
    const costs = await prisma.softwareCost.findMany({
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
      },
      orderBy: {
        costDate: 'desc'
      }
    })

    return NextResponse.json(costs)

  } catch (error) {
    console.error('Costs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
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

    const cost = await prisma.softwareCost.create({
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

    return NextResponse.json(cost, { status: 201 })

  } catch (error) {
    console.error('Cost creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
