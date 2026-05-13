export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'
import { budgetValidationResponse, parseBudgetPayload } from '@/lib/budget-validation'

export async function GET() {
  try {
    const budgets = await prisma.budget.findMany({
      orderBy: [
        { fiscalYear: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(budgets)
  } catch (error) {
    console.error('Budgets fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAuth()
  if (authError) return authError

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch (_error) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const data = parseBudgetPayload(body)

    const budget = await prisma.budget.create({ data })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    const handled = budgetValidationResponse(error)
    if (handled) return handled

    console.error('Budget creation error:', error)
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}
