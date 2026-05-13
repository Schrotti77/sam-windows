export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'
import {
  isInputValidationError,
  parseRequiredDate,
  parseRequiredNumber,
  validationErrorResponse
} from '@/lib/api-validation'


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
  const authError = await requireApiAuth()
  if (authError) return authError

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

    if (!softwareId || !costType || !billingPeriod || !costDate) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    const parsedAmount = parseRequiredNumber(amount, 'Amount', { min: 0 })
    const parsedCostDate = parseRequiredDate(costDate, 'Cost date')

    const cost = await prisma.softwareCost.create({
      data: {
        softwareId,
        costType,
        amount: parsedAmount,
        currency: currency || 'EUR',
        billingPeriod,
        costDate: parsedCostDate,
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
    if (isInputValidationError(error)) {
      return validationErrorResponse(error)
    }

    console.error('Cost creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
