export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'
import { contractValidationResponse, isRecordNotFoundError, parseContractPayload } from '@/lib/contract-validation'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: { vendor: true }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Contract fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
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

    const data = parseContractPayload(body)

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data,
      include: { vendor: true }
    })

    return NextResponse.json(contract)
  } catch (error) {
    const handled = contractValidationResponse(error)
    if (handled) return handled

    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    console.error('Contract update error:', error)
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const authError = await requireApiAuth()
  if (authError) return authError

  try {
    await prisma.contract.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    console.error('Contract deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
  }
}
