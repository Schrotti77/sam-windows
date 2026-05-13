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


export async function GET() {
  try {
    const licenses = await prisma.license.findMany({
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
        createdAt: 'desc'
      }
    })

    return NextResponse.json(licenses)

  } catch (error) {
    console.error('Licenses API error:', error)
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
      licenseType, 
      totalLicenses,
      usedLicenses,
      costPerLicense,
      purchaseDate,
      expirationDate,
      renewalDate,
      isAutoRenewal,
      notes 
    } = await request.json()

    if (!softwareId || !licenseType || totalLicenses === undefined || totalLicenses === null || totalLicenses === '') {
      return NextResponse.json(
        { error: 'Software ID, license type and quantity are required' },
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
    type ComplianceStatusType = 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK' | 'UNKNOWN'
    let complianceStatus: ComplianceStatusType = 'COMPLIANT'
    if (available < 0) {
      complianceStatus = 'NON_COMPLIANT'
    } else if (available <= total * 0.1) {
      complianceStatus = 'AT_RISK'
    }

    const license = await prisma.license.create({
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
        complianceStatus,
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

    return NextResponse.json(license, { status: 201 })

  } catch (error) {
    if (isInputValidationError(error)) {
      return validationErrorResponse(error)
    }

    console.error('License creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
