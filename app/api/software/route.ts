export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


export async function GET() {
  try {
    const software = await prisma.software.findMany({
      include: {
        vendor: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            licenses: true,
            assignments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(software)

  } catch (error) {
    console.error('Software API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      // Required fields
      name, category, vendorId,
      // Optional basic fields
      version, releaseDate, description, functionality,
      deploymentType, assetId, serialNumber, licenseKey,
      dependencies, businessCriticality, dataPrivacySensitive,
      technologyPlatform, environment,
      // Installation & deployment
      installLocation, installationDate, configurationDetails,
      deploymentStatus, hardwareAssociations,
      // Maintenance & support
      updateStatus, lastPatchDate, maintenanceContract,
      supportLevel, supportExpiry, knownVulnerabilities,
      securityRisks, maintenanceHistory,
      // Financial
      acquisitionCost, budgetAllocation, roiCalculation,
      costPerUser, depreciationSchedule,
      // Compliance & risk
      regulatoryCompliance, complianceStatus, riskAssessment,
      auditHistory, shadowIT,
      // Lifecycle
      lifecycleStatus, needsAssessment, plannedDecommission,
      decommissionReason, reuseOptions,
      // Governance
      itAdministrator, businessOwner, procurementContact,
      vendorContact, governancePolicies, acceptableUsePolicy
    } = body

    if (!name || !category || !vendorId) {
      return NextResponse.json(
        { error: 'Name, category and vendor are required' },
        { status: 400 }
      )
    }

    const software = await prisma.software.create({
      data: {
        // Required fields
        name,
        category,
        vendorId,
        // Optional fields with proper defaults
        version: version || null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        description: description || null,
        functionality: functionality || null,
        deploymentType: deploymentType || null,
        assetId: assetId || null,
        serialNumber: serialNumber || null,
        licenseKey: licenseKey || null,
        dependencies: dependencies || null,
        businessCriticality: businessCriticality || 'LOW',
        dataPrivacySensitive: dataPrivacySensitive || false,
        technologyPlatform: technologyPlatform || null,
        environment: environment || null,
        installLocation: installLocation || null,
        installationDate: installationDate ? new Date(installationDate) : null,
        configurationDetails: configurationDetails || null,
        deploymentStatus: deploymentStatus || 'PLANNED',
        hardwareAssociations: hardwareAssociations || null,
        updateStatus: updateStatus || 'UP_TO_DATE',
        lastPatchDate: lastPatchDate ? new Date(lastPatchDate) : null,
        maintenanceContract: maintenanceContract || null,
        supportLevel: supportLevel || null,
        supportExpiry: supportExpiry ? new Date(supportExpiry) : null,
        knownVulnerabilities: knownVulnerabilities || null,
        securityRisks: securityRisks || null,
        maintenanceHistory: maintenanceHistory || null,
        acquisitionCost: acquisitionCost || null,
        budgetAllocation: budgetAllocation || null,
        roiCalculation: roiCalculation || null,
        costPerUser: costPerUser || null,
        depreciationSchedule: depreciationSchedule || null,
        regulatoryCompliance: regulatoryCompliance || null,
        complianceStatus: complianceStatus || 'COMPLIANT',
        riskAssessment: riskAssessment || null,
        auditHistory: auditHistory || null,
        shadowIT: shadowIT || false,
        lifecycleStatus: lifecycleStatus || 'IN_USE',
        needsAssessment: needsAssessment || null,
        plannedDecommission: plannedDecommission ? new Date(plannedDecommission) : null,
        decommissionReason: decommissionReason || null,
        reuseOptions: reuseOptions || null,
        itAdministrator: itAdministrator || null,
        businessOwner: businessOwner || null,
        procurementContact: procurementContact || null,
        vendorContact: vendorContact || null,
        governancePolicies: governancePolicies || null,
        acceptableUsePolicy: acceptableUsePolicy || null
      },
      include: {
        vendor: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            licenses: true,
            assignments: true
          }
        }
      }
    })

    return NextResponse.json(software, { status: 201 })

  } catch (error) {
    console.error('Software creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { 
      id,
      // All fields from the schema
      name, category, vendorId, version, releaseDate, description, functionality,
      deploymentType, assetId, serialNumber, licenseKey, dependencies, 
      businessCriticality, dataPrivacySensitive, technologyPlatform, environment,
      primaryLicenseType, deploymentLimits, installLocation, installationDate, 
      configurationDetails, deploymentStatus, hardwareAssociations, updateStatus,
      lastPatchDate, maintenanceContract, supportLevel, supportExpiry, 
      knownVulnerabilities, securityRisks, maintenanceHistory, acquisitionCost,
      budgetAllocation, roiCalculation, costPerUser, depreciationSchedule,
      regulatoryCompliance, complianceStatus, riskAssessment, auditHistory, shadowIT,
      lifecycleStatus, needsAssessment, plannedDecommission, decommissionReason,
      reuseOptions, itAdministrator, businessOwner, procurementContact,
      vendorContact, governancePolicies, acceptableUsePolicy, isActive
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Software ID is required' },
        { status: 400 }
      )
    }

    if (!name || !category || !vendorId) {
      return NextResponse.json(
        { error: 'Name, category and vendor are required' },
        { status: 400 }
      )
    }

    // Check if software exists
    const existingSoftware = await prisma.software.findUnique({
      where: { id }
    })

    if (!existingSoftware) {
      return NextResponse.json(
        { error: 'Software not found' },
        { status: 404 }
      )
    }

    // Update the software
    const software = await prisma.software.update({
      where: { id },
      data: {
        // Basic fields
        name,
        category,
        vendorId,
        version: version || null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        description: description || null,
        functionality: functionality || null,
        deploymentType: deploymentType || null,
        assetId: assetId || null,
        serialNumber: serialNumber || null,
        licenseKey: licenseKey || null,
        dependencies: dependencies || null,
        businessCriticality: businessCriticality || 'LOW',
        dataPrivacySensitive: dataPrivacySensitive || false,
        technologyPlatform: technologyPlatform || null,
        environment: environment || null,
        
        // License data
        primaryLicenseType: primaryLicenseType || null,
        deploymentLimits: deploymentLimits || null,
        
        // Installation data
        installLocation: installLocation || null,
        installationDate: installationDate ? new Date(installationDate) : null,
        configurationDetails: configurationDetails || null,
        deploymentStatus: deploymentStatus || 'PLANNED',
        hardwareAssociations: hardwareAssociations || null,
        
        // Maintenance data
        updateStatus: updateStatus || 'UP_TO_DATE',
        lastPatchDate: lastPatchDate ? new Date(lastPatchDate) : null,
        maintenanceContract: maintenanceContract || null,
        supportLevel: supportLevel || null,
        supportExpiry: supportExpiry ? new Date(supportExpiry) : null,
        knownVulnerabilities: knownVulnerabilities || null,
        securityRisks: securityRisks || null,
        maintenanceHistory: maintenanceHistory || null,
        
        // Financial data
        acquisitionCost: acquisitionCost || null,
        budgetAllocation: budgetAllocation || null,
        roiCalculation: roiCalculation || null,
        costPerUser: costPerUser || null,
        depreciationSchedule: depreciationSchedule || null,
        
        // Compliance data
        regulatoryCompliance: regulatoryCompliance || null,
        complianceStatus: complianceStatus || 'COMPLIANT',
        riskAssessment: riskAssessment || null,
        auditHistory: auditHistory || null,
        shadowIT: shadowIT || false,
        
        // Lifecycle data
        lifecycleStatus: lifecycleStatus || 'IN_USE',
        needsAssessment: needsAssessment || null,
        plannedDecommission: plannedDecommission ? new Date(plannedDecommission) : null,
        decommissionReason: decommissionReason || null,
        reuseOptions: reuseOptions || null,
        
        // Governance data
        itAdministrator: itAdministrator || null,
        businessOwner: businessOwner || null,
        procurementContact: procurementContact || null,
        vendorContact: vendorContact || null,
        governancePolicies: governancePolicies || null,
        acceptableUsePolicy: acceptableUsePolicy || null,
        
        // Status
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        vendor: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            licenses: true,
            assignments: true
          }
        }
      }
    })

    return NextResponse.json(software)

  } catch (error) {
    console.error('Software update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
