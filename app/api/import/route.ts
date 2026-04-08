export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


// Convert ISO date strings to Date objects, return null for invalid/empty
function toDate(val: any): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

// Strip relation/computed fields and auto-managed timestamps
function cleanRecord(record: any, stripFields: string[] = []) {
  const cleaned = { ...record }
  // Always remove relation/computed fields that Prisma doesn't accept
  const alwaysStrip = ['_count', 'vendor', 'software', 'licenses', 'assignments', 'costs', 'contracts', 'accounts', 'sessions', 'user', 'softwareAssignments']
  for (const f of [...alwaysStrip, ...stripFields]) {
    delete cleaned[f]
  }
  return cleaned
}

export async function POST(request: Request) {
  try {
    const importData = await request.json()

    if (!importData?.data || !importData?.version) {
      return NextResponse.json(
        { error: 'Invalid import file format. Expected SAM export file.' },
        { status: 400 }
      )
    }

    const { data } = importData
    const results = {
      vendors: { imported: 0, skipped: 0, errors: 0, errorMessages: [] as string[] },
      software: { imported: 0, skipped: 0, errors: 0, errorMessages: [] as string[] },
      licenses: { imported: 0, skipped: 0, errors: 0, errorMessages: [] as string[] },
      costs: { imported: 0, skipped: 0, errors: 0, errorMessages: [] as string[] },
      alerts: { imported: 0, skipped: 0, errors: 0, errorMessages: [] as string[] },
      contracts: { imported: 0, skipped: 0, errors: 0, errorMessages: [] as string[] },
    }

    // Build vendor ID mapping (old ID -> new ID) for cross-db transfers
    const vendorIdMap = new Map<string, string>()
    const softwareIdMap = new Map<string, string>()

    // 1. Import Vendors
    if (data.vendors?.length) {
      for (const vendor of data.vendors) {
        try {
          const vendorData = {
            name: vendor.name,
            contactEmail: vendor.contactEmail || null,
            contactPhone: vendor.contactPhone || null,
            website: vendor.website || null,
            address: vendor.address || null,
            supportEmail: vendor.supportEmail || null,
            supportPhone: vendor.supportPhone || null,
            accountManager: vendor.accountManager || null,
            notes: vendor.notes || null,
            isActive: vendor.isActive ?? true,
          }

          // Try to find existing vendor by name first
          const existing = await prisma.vendor.findUnique({ where: { name: vendor.name } })
          if (existing) {
            await prisma.vendor.update({ where: { id: existing.id }, data: vendorData })
            vendorIdMap.set(vendor.id, existing.id)
          } else {
            const created = await prisma.vendor.create({ data: vendorData })
            vendorIdMap.set(vendor.id, created.id)
          }
          results.vendors.imported++
        } catch (e: any) {
          console.error('Vendor import error:', vendor.name, e?.message)
          results.vendors.errors++
          results.vendors.errorMessages.push(`${vendor.name}: ${e?.message || 'Unknown error'}`)
        }
      }
    }

    // 2. Import Software
    if (data.software?.length) {
      for (const sw of data.software) {
        try {
          const cleaned = cleanRecord(sw)
          delete cleaned.createdAt
          delete cleaned.updatedAt

          // Remap vendor ID
          if (cleaned.vendorId) {
            const mappedVendorId = vendorIdMap.get(cleaned.vendorId)
            if (mappedVendorId) {
              cleaned.vendorId = mappedVendorId
            } else {
              // Vendor ID not in map, check if it exists directly
              const vendorExists = await prisma.vendor.findUnique({ where: { id: cleaned.vendorId } })
              if (!vendorExists) {
                results.software.skipped++
                results.software.errorMessages.push(`${sw.name}: Vendor not found`)
                continue
              }
            }
          }

          // Convert date fields
          const dateFields = ['releaseDate', 'installationDate', 'lastPatchDate', 'supportExpiry', 'plannedDecommission']
          for (const f of dateFields) {
            if (cleaned[f]) cleaned[f] = toDate(cleaned[f])
            else cleaned[f] = null
          }

          // Try find by name + vendor combo, or by assetId
          let existingSw = null
          if (cleaned.assetId) {
            existingSw = await prisma.software.findUnique({ where: { assetId: cleaned.assetId } })
          }
          if (!existingSw) {
            // Try to find by original ID
            try {
              existingSw = await prisma.software.findUnique({ where: { id: sw.id } })
            } catch (_e) { /* ID format mismatch */ }
          }

          if (existingSw) {
            const { id, ...updateData } = cleaned
            await prisma.software.update({ where: { id: existingSw.id }, data: updateData })
            softwareIdMap.set(sw.id, existingSw.id)
          } else {
            const { id, ...createData } = cleaned
            const created = await prisma.software.create({ data: createData })
            softwareIdMap.set(sw.id, created.id)
          }
          results.software.imported++
        } catch (e: any) {
          console.error('Software import error:', sw.name, e?.message)
          results.software.errors++
          results.software.errorMessages.push(`${sw.name}: ${e?.message || 'Unknown error'}`)
        }
      }
    }

    // 3. Import Licenses
    if (data.licenses?.length) {
      for (const lic of data.licenses) {
        try {
          const cleaned = cleanRecord(lic)
          delete cleaned.createdAt
          delete cleaned.updatedAt

          // Remap software ID
          if (cleaned.softwareId) {
            const mappedSwId = softwareIdMap.get(cleaned.softwareId)
            if (mappedSwId) {
              cleaned.softwareId = mappedSwId
            } else {
              const swExists = await prisma.software.findUnique({ where: { id: cleaned.softwareId } })
              if (!swExists) {
                results.licenses.skipped++
                continue
              }
            }
          }

          // Convert dates
          for (const f of ['purchaseDate', 'expirationDate', 'renewalDate']) {
            if (cleaned[f]) cleaned[f] = toDate(cleaned[f])
            else cleaned[f] = null
          }

          const { id, ...licData } = cleaned
          // Check if already exists by original ID
          let existing = null
          try { existing = await prisma.license.findUnique({ where: { id: lic.id } }) } catch (_e) {}

          if (existing) {
            await prisma.license.update({ where: { id: existing.id }, data: licData })
          } else {
            await prisma.license.create({ data: licData })
          }
          results.licenses.imported++
        } catch (e: any) {
          console.error('License import error:', e?.message)
          results.licenses.errors++
          results.licenses.errorMessages.push(e?.message || 'Unknown error')
        }
      }
    }

    // 4. Import Costs
    if (data.costs?.length) {
      for (const cost of data.costs) {
        try {
          const cleaned = cleanRecord(cost)
          delete cleaned.createdAt
          delete cleaned.updatedAt

          // Remap software ID
          if (cleaned.softwareId) {
            const mappedSwId = softwareIdMap.get(cleaned.softwareId)
            if (mappedSwId) {
              cleaned.softwareId = mappedSwId
            } else {
              const swExists = await prisma.software.findUnique({ where: { id: cleaned.softwareId } })
              if (!swExists) {
                results.costs.skipped++
                continue
              }
            }
          }

          // Convert date
          if (cleaned.costDate) cleaned.costDate = toDate(cleaned.costDate)
          if (cleaned.amount) cleaned.amount = parseFloat(String(cleaned.amount))

          const { id, ...costData } = cleaned
          let existing = null
          try { existing = await prisma.softwareCost.findUnique({ where: { id: cost.id } }) } catch (_e) {}

          if (existing) {
            await prisma.softwareCost.update({ where: { id: existing.id }, data: costData })
          } else {
            await prisma.softwareCost.create({ data: costData })
          }
          results.costs.imported++
        } catch (e: any) {
          console.error('Cost import error:', e?.message)
          results.costs.errors++
          results.costs.errorMessages.push(e?.message || 'Unknown error')
        }
      }
    }

    // 5. Import Alerts
    if (data.alerts?.length) {
      for (const alert of data.alerts) {
        try {
          const cleaned = cleanRecord(alert)
          delete cleaned.createdAt
          delete cleaned.updatedAt

          if (cleaned.resolvedAt) cleaned.resolvedAt = toDate(cleaned.resolvedAt)

          const { id, ...alertData } = cleaned
          let existing = null
          try { existing = await prisma.complianceAlert.findUnique({ where: { id: alert.id } }) } catch (_e) {}

          if (existing) {
            await prisma.complianceAlert.update({ where: { id: existing.id }, data: alertData })
          } else {
            await prisma.complianceAlert.create({ data: alertData })
          }
          results.alerts.imported++
        } catch (e: any) {
          console.error('Alert import error:', e?.message)
          results.alerts.errors++
          results.alerts.errorMessages.push(e?.message || 'Unknown error')
        }
      }
    }

    // 6. Import Contracts
    if (data.contracts?.length) {
      for (const contract of data.contracts) {
        try {
          const cleaned = cleanRecord(contract)
          delete cleaned.createdAt
          delete cleaned.updatedAt

          // Remap vendor ID
          if (cleaned.vendorId) {
            const mappedVendorId = vendorIdMap.get(cleaned.vendorId)
            if (mappedVendorId) {
              cleaned.vendorId = mappedVendorId
            } else {
              const vendorExists = await prisma.vendor.findUnique({ where: { id: cleaned.vendorId } })
              if (!vendorExists) {
                results.contracts.skipped++
                continue
              }
            }
          }

          // Convert dates
          for (const f of ['startDate', 'endDate', 'renewalDate']) {
            if (cleaned[f]) cleaned[f] = toDate(cleaned[f])
            else if (f !== 'renewalDate') {
              // startDate and endDate are required
              results.contracts.skipped++
              continue
            } else {
              cleaned[f] = null
            }
          }
          if (cleaned.contractValue) cleaned.contractValue = parseFloat(String(cleaned.contractValue))

          const { id, ...contractData } = cleaned
          // Find by contractNumber (unique) or original ID
          let existing = null
          if (cleaned.contractNumber) {
            existing = await prisma.contract.findUnique({ where: { contractNumber: cleaned.contractNumber } })
          }
          if (!existing) {
            try { existing = await prisma.contract.findUnique({ where: { id: contract.id } }) } catch (_e) {}
          }

          if (existing) {
            const { contractNumber, ...updateData } = contractData
            await prisma.contract.update({ where: { id: existing.id }, data: updateData })
          } else {
            await prisma.contract.create({ data: contractData })
          }
          results.contracts.imported++
        } catch (e: any) {
          console.error('Contract import error:', e?.message)
          results.contracts.errors++
          results.contracts.errorMessages.push(e?.message || 'Unknown error')
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Import completed',
      results
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import failed: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
