export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


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
        contactEmail,
        contactPhone,
        website,
        address,
        supportEmail,
        supportPhone,
        accountManager,
        notes,
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
