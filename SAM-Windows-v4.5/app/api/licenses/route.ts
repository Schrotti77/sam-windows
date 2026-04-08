export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


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

    if (!softwareId || !licenseType || !totalLicenses) {
      return NextResponse.json(
        { error: 'Software ID, license type and quantity are required' },
        { status: 400 }
      )
    }

    const total = parseInt(totalLicenses)
    const used = parseInt(usedLicenses) || 0
    const available = total - used

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
        costPerLicense: costPerLicense ? parseFloat(costPerLicense) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
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
    console.error('License creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
