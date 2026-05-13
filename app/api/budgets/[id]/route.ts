export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'
import { budgetValidationResponse, isRecordNotFoundError, parseBudgetPayload } from '@/lib/budget-validation'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: params.id } })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Budget fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch budget' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const budget = await prisma.budget.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json(budget)
  } catch (error) {
    const handled = budgetValidationResponse(error)
    if (handled) return handled

    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    console.error('Budget update error:', error)
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const authError = await requireApiAuth()
  if (authError) return authError

  try {
    await prisma.budget.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    console.error('Budget deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}
