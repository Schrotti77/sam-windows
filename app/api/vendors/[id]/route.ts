export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return String(value)
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function internalError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : undefined
  return NextResponse.json(
    {
      error: 'Internal server error',
      detail: code ? `${code}: ${message}` : message
    },
    { status: 500 }
  )
}


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            software: true,
            contracts: true
          }
        },
        software: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        contracts: {
          select: {
            id: true,
            title: true,
            status: true,
            contractValue: true
          }
        }
      }
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(vendor)

  } catch (error) {
    console.error('Vendor GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authError = await requireApiAuth()
  if (authError) return authError
  try {
    const { 
      name,
      contactEmail,
      contactPhone,
      website,
      address,
      supportEmail,
      supportPhone,
      accountManager,
      notes,
      isActive
    } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Vendor name is required' },
        { status: 400 }
      )
    }

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id: params.id }
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Check if name is already taken by another vendor
    const nameConflict = await prisma.vendor.findFirst({
      where: { 
        name,
        id: { not: params.id }
      }
    })

    if (nameConflict) {
      return NextResponse.json(
        { error: 'Vendor name is already in use' },
        { status: 400 }
      )
    }

    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        name,
        contactEmail: optionalString(contactEmail),
        contactPhone: optionalString(contactPhone),
        website: optionalString(website),
        address: optionalString(address),
        supportEmail: optionalString(supportEmail),
        supportPhone: optionalString(supportPhone),
        accountManager: optionalString(accountManager),
        notes: optionalString(notes),
        isActive: isActive !== undefined ? isActive : existingVendor.isActive
      },
      include: {
        _count: {
          select: {
            software: true,
            contracts: true
          }
        }
      }
    })

    return NextResponse.json(vendor)

  } catch (error) {
    console.error('Vendor update error:', error)
    return internalError(error)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authError = await requireApiAuth()
  if (authError) return authError
  try {
    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            software: true,
            contracts: true
          }
        }
      }
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Check if vendor has any software or contracts
    if (existingVendor._count.software > 0 || existingVendor._count.contracts > 0) {
      return NextResponse.json(
        { 
          error: `Vendor cannot be deleted. There are ${existingVendor._count.software} software entries and ${existingVendor._count.contracts} contracts associated.`,
          canDelete: false,
          counts: {
            software: existingVendor._count.software,
            contracts: existingVendor._count.contracts
          }
        },
        { status: 400 }
      )
    }

    await prisma.vendor.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'Vendor successfully deleted' 
    })

  } catch (error) {
    console.error('Vendor deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
