export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


// GET single license
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const license = await prisma.license.findUnique({
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

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(license)
  } catch (error) {
    console.error('License GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE license
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existingLicense = await prisma.license.findUnique({
      where: { id: params.id }
    })

    if (!existingLicense) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      )
    }

    const {
      softwareId,
      licenseType,
      totalLicenses,
      usedLicenses,
      costPerLicense,
      purchaseDate,
      expirationDate,
      renewalDate,
      isAutoRenewal,
      complianceStatus,
      notes
    } = await request.json()

    if (!softwareId || !licenseType || !totalLicenses) {
      return NextResponse.json(
        { error: 'Software ID, license type and total licenses are required' },
        { status: 400 }
      )
    }

    const total = parseInt(totalLicenses)
    const used = parseInt(usedLicenses) || 0
    const available = total - used

    // Auto-determine compliance status based on usage
    let finalComplianceStatus = complianceStatus
    if (!complianceStatus) {
      if (available < 0) {
        finalComplianceStatus = 'NON_COMPLIANT'
      } else if (available <= total * 0.1) {
        finalComplianceStatus = 'AT_RISK'
      } else {
        finalComplianceStatus = 'COMPLIANT'
      }
    }

    const license = await prisma.license.update({
      where: { id: params.id },
      data: {
        softwareId,
        licenseType,
        totalLicenses: total,
        usedLicenses: used,
        availableLicenses: available,
        costPerLicense: costPerLicense ? parseFloat(costPerLicense) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        isAutoRenewal: Boolean(isAutoRenewal),
        complianceStatus: finalComplianceStatus,
        notes
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

    return NextResponse.json(license)
  } catch (error) {
    console.error('License UPDATE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE license
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existingLicense = await prisma.license.findUnique({
      where: { id: params.id }
    })

    if (!existingLicense) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      )
    }

    await prisma.license.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'License deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('License DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
