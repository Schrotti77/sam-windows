export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'
import {
  isInputValidationError,
  parseOptionalDate,
  parseOptionalNumber,
  parseRequiredNumber,
  validationErrorResponse
} from '@/lib/api-validation'


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
  const authError = await requireApiAuth()
  if (authError) return authError
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

    if (!softwareId || !licenseType || totalLicenses === undefined || totalLicenses === null || totalLicenses === '') {
      return NextResponse.json(
        { error: 'Software ID, license type and total licenses are required' },
        { status: 400 }
      )
    }

    const total = parseRequiredNumber(totalLicenses, 'Total licenses', { min: 1, integer: true })
    const used = parseOptionalNumber(usedLicenses, 'Used licenses', { min: 0, integer: true }) || 0
    const available = total - used
    const parsedCostPerLicense = parseOptionalNumber(costPerLicense, 'Cost per license', { min: 0 })
    const parsedPurchaseDate = parseOptionalDate(purchaseDate, 'Purchase date')
    const parsedExpirationDate = parseOptionalDate(expirationDate, 'Expiration date')
    const parsedRenewalDate = parseOptionalDate(renewalDate, 'Renewal date')

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
        costPerLicense: parsedCostPerLicense,
        purchaseDate: parsedPurchaseDate,
        expirationDate: parsedExpirationDate,
        renewalDate: parsedRenewalDate,
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
    if (isInputValidationError(error)) {
      return validationErrorResponse(error)
    }

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
  const authError = await requireApiAuth()
  if (authError) return authError
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
