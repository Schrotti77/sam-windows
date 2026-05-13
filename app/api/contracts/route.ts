export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'
import { contractValidationResponse, parseContractPayload } from '@/lib/contract-validation'

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      include: { vendor: true },
      orderBy: { endDate: 'asc' }
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error('Contracts fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
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

    const data = parseContractPayload(body)

    const contract = await prisma.contract.create({
      data,
      include: { vendor: true }
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    const handled = contractValidationResponse(error)
    if (handled) return handled

    console.error('Contract creation error:', error)
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}
