export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        _count: {
          select: {
            software: true,
            contracts: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(vendors)

  } catch (error) {
    console.error('Vendors API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    // Check if vendor already exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { name }
    })

    if (existingVendor) {
      return NextResponse.json(
        { error: 'Vendor already exists' },
        { status: 400 }
      )
    }

    const vendor = await prisma.vendor.create({
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
        isActive: isActive !== undefined ? isActive : true
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

    return NextResponse.json(vendor, { status: 201 })

  } catch (error) {
    console.error('Vendor creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
