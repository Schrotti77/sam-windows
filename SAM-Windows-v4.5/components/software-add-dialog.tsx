

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Vendor {
  id: string
  name: string
}

interface NewSoftware {
  // I. Identification and Basic Data
  name: string
  version?: string
  releaseDate?: string
  description?: string
  functionality?: string
  category: string
  deploymentType?: string
  assetId?: string
  serialNumber?: string
  licenseKey?: string
  dependencies?: any
  businessCriticality: string
  dataPrivacySensitive: boolean
  technologyPlatform?: string
  environment?: string
  
  // II. License and Contract Data
  primaryLicenseType?: string
  deploymentLimits?: any
  
  // III. Installation and Deployment Data
  installLocation?: string
  installationDate?: string
  configurationDetails?: any
  deploymentStatus: string
  hardwareAssociations?: any
  
  // IV. Maintenance and Support Data
  updateStatus: string
  lastPatchDate?: string
  maintenanceContract?: string
  supportLevel?: string
  supportExpiry?: string
  knownVulnerabilities?: any
  securityRisks?: any
  maintenanceHistory?: any
  
  // V. Financial Data
  acquisitionCost?: number
  budgetAllocation?: string
  roiCalculation?: any
  costPerUser?: number
  depreciationSchedule?: any
  
  // VI. Compliance and Risk Data
  regulatoryCompliance?: any
  complianceStatus: string
  riskAssessment?: any
  auditHistory?: any
  shadowIT: boolean
  
  // VII. Lifecycle Management Data
  lifecycleStatus: string
  needsAssessment?: any
  plannedDecommission?: string
  decommissionReason?: string
  reuseOptions?: any
  
  // VIII. Responsibilities and Governance
  itAdministrator?: string
  businessOwner?: string
  procurementContact?: string
  vendorContact?: string
  governancePolicies?: any
  acceptableUsePolicy?: string
  
  // Required fields
  vendorId: string
  isActive: boolean
}

interface AddSoftwareDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (software: any) => void
}

export function AddSoftwareDialog({ 
  isOpen, 
  onClose, 
  onSave 
}: AddSoftwareDialogProps) {
  const [formData, setFormData] = useState<Partial<NewSoftware>>({
    name: '',
    category: '',
    vendorId: '',
    businessCriticality: 'LOW',
    dataPrivacySensitive: false,
    deploymentStatus: 'PLANNED',
    updateStatus: 'UP_TO_DATE',
    complianceStatus: 'COMPLIANT',
    shadowIT: false,
    lifecycleStatus: 'IN_USE',
    isActive: true
  })
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/vendors')
        const data = await response.json()
        setVendors(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching vendors:', error)
        setVendors([])
      }
    }

    fetchVendors()
  }, [])

  // Reset form data when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        category: '',
        vendorId: '',
        businessCriticality: 'LOW',
        dataPrivacySensitive: false,
        deploymentStatus: 'PLANNED',
        updateStatus: 'UP_TO_DATE',
        complianceStatus: 'COMPLIANT',
        shadowIT: false,
        lifecycleStatus: 'IN_USE',
        isActive: true
      })
    }
  }, [isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.vendorId) {
      alert('Please fill in all required fields (Name, Category, Vendor)')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/software', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newSoftware = await response.json()
        onSave(newSoftware)
        onClose()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating software:', error)
      alert('Error creating software')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add New Software</DialogTitle>
          <DialogDescription>
            Capture all relevant details for the new software
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="license">License</TabsTrigger>
            <TabsTrigger value="deployment">Deploy</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
          </TabsList>

          <div className="max-h-[500px] overflow-y-auto mt-4">
            {/* I. Basic Information */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Identification and Basic Data</CardTitle>
                  <CardDescription>
                    Basic software information (* = required fields)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Software Name *</Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Software Name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        value={formData.version || ''}
                        onChange={(e) => handleInputChange('version', e.target.value)}
                        placeholder="e.g., 2.1.3"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category || ''}
                        onValueChange={(value) => handleInputChange('category', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DESKTOP">Desktop</SelectItem>
                          <SelectItem value="SAAS">SaaS</SelectItem>
                          <SelectItem value="SERVER">Server</SelectItem>
                          <SelectItem value="MOBILE">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="vendor">Vendor *</Label>
                      <Select
                        value={formData.vendorId || ''}
                        onValueChange={(value) => handleInputChange('vendorId', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="releaseDate">Release Date</Label>
                      <Input
                        id="releaseDate"
                        type="date"
                        value={formData.releaseDate || ''}
                        onChange={(e) => handleInputChange('releaseDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deploymentType">Deployment Type</Label>
                      <Select
                        value={formData.deploymentType || ''}
                        onValueChange={(value) => handleInputChange('deploymentType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select deployment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ON_PREMISES">On-Premises</SelectItem>
                          <SelectItem value="CLOUD_SAAS">Cloud/SaaS</SelectItem>
                          <SelectItem value="PAAS">PaaS</SelectItem>
                          <SelectItem value="IAAS">IaaS</SelectItem>
                          <SelectItem value="OPEN_SOURCE">Open Source</SelectItem>
                          <SelectItem value="HYBRID">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Software description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="functionality">Functionality</Label>
                    <Textarea
                      id="functionality"
                      value={formData.functionality || ''}
                      onChange={(e) => handleInputChange('functionality', e.target.value)}
                      placeholder="Main functionalities"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assetId">Asset-ID</Label>
                      <Input
                        id="assetId"
                        value={formData.assetId || ''}
                        onChange={(e) => handleInputChange('assetId', e.target.value)}
                        placeholder="Asset identification"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        value={formData.serialNumber || ''}
                        onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                        placeholder="Serial number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessCriticality">Business Criticality</Label>
                      <Select
                        value={formData.businessCriticality || 'LOW'}
                        onValueChange={(value) => handleInputChange('businessCriticality', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="environment">Environment</Label>
                      <Select
                        value={formData.environment || ''}
                        onValueChange={(value) => handleInputChange('environment', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRODUCTION">Production</SelectItem>
                          <SelectItem value="STAGING">Staging</SelectItem>
                          <SelectItem value="DEVELOPMENT">Development</SelectItem>
                          <SelectItem value="TEST">Test</SelectItem>
                          <SelectItem value="SANDBOX">Sandbox</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="technologyPlatform">Technology Platform</Label>
                      <Input
                        id="technologyPlatform"
                        value={formData.technologyPlatform || ''}
                        onChange={(e) => handleInputChange('technologyPlatform', e.target.value)}
                        placeholder="e.g., .NET, Java, Python"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="dataPrivacySensitive"
                        checked={formData.dataPrivacySensitive || false}
                        onCheckedChange={(checked) => handleInputChange('dataPrivacySensitive', checked)}
                      />
                      <Label htmlFor="dataPrivacySensitive">Data Protection Sensitive Software</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* II. License Data */}
            <TabsContent value="license" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>License and Contract Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseKey">License Key</Label>
                      <Input
                        id="licenseKey"
                        type="password"
                        value={formData.licenseKey || ''}
                        onChange={(e) => handleInputChange('licenseKey', e.target.value)}
                        placeholder="License Key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="primaryLicenseType">Primary License Type</Label>
                      <Select
                        value={formData.primaryLicenseType || ''}
                        onValueChange={(value) => handleInputChange('primaryLicenseType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select license type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERPETUAL">Perpetual</SelectItem>
                          <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                          <SelectItem value="VOLUME">Volume</SelectItem>
                          <SelectItem value="OEM">OEM</SelectItem>
                          <SelectItem value="OPEN_SOURCE">Open Source</SelectItem>
                          <SelectItem value="TRIAL">Trial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* III. Installation & Deployment */}
            <TabsContent value="deployment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Installation and Deployment Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="installLocation">Installation Location</Label>
                      <Input
                        id="installLocation"
                        value={formData.installLocation || ''}
                        onChange={(e) => handleInputChange('installLocation', e.target.value)}
                        placeholder="e.g., Server-01, Workstation-A"
                      />
                    </div>
                    <div>
                      <Label htmlFor="installationDate">Installation Date</Label>
                      <Input
                        id="installationDate"
                        type="date"
                        value={formData.installationDate || ''}
                        onChange={(e) => handleInputChange('installationDate', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deploymentStatus">Deployment Status</Label>
                      <Select
                        value={formData.deploymentStatus || 'PLANNED'}
                        onValueChange={(value) => handleInputChange('deploymentStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLANNED">Planned</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="DEPLOYED">Deployed</SelectItem>
                          <SelectItem value="TESTING">Test</SelectItem>
                          <SelectItem value="PRODUCTION">Production</SelectItem>
                          <SelectItem value="RETIRED">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="configurationDetails">Configuration Details</Label>
                    <Textarea
                      id="configurationDetails"
                      value={typeof formData.configurationDetails === 'object' 
                        ? JSON.stringify(formData.configurationDetails, null, 2)
                        : formData.configurationDetails || ''}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          handleInputChange('configurationDetails', parsed)
                        } catch {
                          handleInputChange('configurationDetails', e.target.value)
                        }
                      }}
                      placeholder="Configuration settings (JSON or text)"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* IV. Maintenance & Support */}
            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance and Support Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="updateStatus">Update Status</Label>
                      <Select
                        value={formData.updateStatus || 'UP_TO_DATE'}
                        onValueChange={(value) => handleInputChange('updateStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UP_TO_DATE">Up to Date</SelectItem>
                          <SelectItem value="UPDATE_AVAILABLE">Update Available</SelectItem>
                          <SelectItem value="CRITICAL_UPDATE_NEEDED">Critical Update Required</SelectItem>
                          <SelectItem value="END_OF_SUPPORT">End of Support</SelectItem>
                          <SelectItem value="DEPRECATED">Deprecated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="lastPatchDate">Last Patch Date</Label>
                      <Input
                        id="lastPatchDate"
                        type="date"
                        value={formData.lastPatchDate || ''}
                        onChange={(e) => handleInputChange('lastPatchDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supportLevel">Support Level</Label>
                      <Select
                        value={formData.supportLevel || ''}
                        onValueChange={(value) => handleInputChange('supportLevel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select support level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BASIC">Basic</SelectItem>
                          <SelectItem value="STANDARD">Standard</SelectItem>
                          <SelectItem value="PREMIUM">Premium</SelectItem>
                          <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                          <SelectItem value="COMMUNITY">Community</SelectItem>
                          <SelectItem value="NO_SUPPORT">No Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="supportExpiry">Support Expiry</Label>
                      <Input
                        id="supportExpiry"
                        type="date"
                        value={formData.supportExpiry || ''}
                        onChange={(e) => handleInputChange('supportExpiry', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="maintenanceContract">Maintenance Contract</Label>
                    <Input
                      id="maintenanceContract"
                      value={formData.maintenanceContract || ''}
                      onChange={(e) => handleInputChange('maintenanceContract', e.target.value)}
                      placeholder="Contract ID or details"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* V. Financial Data */}
            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="acquisitionCost">Acquisition Cost (€)</Label>
                      <Input
                        id="acquisitionCost"
                        type="number"
                        step="0.01"
                        value={formData.acquisitionCost || ''}
                        onChange={(e) => handleInputChange('acquisitionCost', parseFloat(e.target.value) || null)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="costPerUser">Cost per User (€)</Label>
                      <Input
                        id="costPerUser"
                        type="number"
                        step="0.01"
                        value={formData.costPerUser || ''}
                        onChange={(e) => handleInputChange('costPerUser', parseFloat(e.target.value) || null)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="budgetAllocation">Budget Allocation</Label>
                    <Input
                      id="budgetAllocation"
                      value={formData.budgetAllocation || ''}
                      onChange={(e) => handleInputChange('budgetAllocation', e.target.value)}
                      placeholder="e.g., IT Budget 2024, Marketing Department"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* VI. Compliance & Risk */}
            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance and Risk Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="complianceStatus">Compliance Status</Label>
                      <Select
                        value={formData.complianceStatus || 'COMPLIANT'}
                        onValueChange={(value) => handleInputChange('complianceStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMPLIANT">Compliant</SelectItem>
                          <SelectItem value="NON_COMPLIANT">Non-Compliant</SelectItem>
                          <SelectItem value="AT_RISK">At Risk</SelectItem>
                          <SelectItem value="UNKNOWN">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="shadowIT"
                        checked={formData.shadowIT || false}
                        onCheckedChange={(checked) => handleInputChange('shadowIT', checked)}
                      />
                      <Label htmlFor="shadowIT">Shadow IT</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* VII. Lifecycle Management */}
            <TabsContent value="lifecycle" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lifecycle Management Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lifecycleStatus">Lifecycle Status</Label>
                      <Select
                        value={formData.lifecycleStatus || 'IN_USE'}
                        onValueChange={(value) => handleInputChange('lifecycleStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLANNING">Planning</SelectItem>
                          <SelectItem value="PROCUREMENT">Procurement</SelectItem>
                          <SelectItem value="DEPLOYMENT">Deployment</SelectItem>
                          <SelectItem value="IN_USE">In Use</SelectItem>
                          <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                          <SelectItem value="DECOMMISSIONING">Decommissioning</SelectItem>
                          <SelectItem value="RETIRED">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="plannedDecommission">Planned Decommission</Label>
                      <Input
                        id="plannedDecommission"
                        type="date"
                        value={formData.plannedDecommission || ''}
                        onChange={(e) => handleInputChange('plannedDecommission', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="decommissionReason">Decommission Reason</Label>
                    <Input
                      id="decommissionReason"
                      value={formData.decommissionReason || ''}
                      onChange={(e) => handleInputChange('decommissionReason', e.target.value)}
                      placeholder="Decommission Reason"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* VIII. Governance */}
            <TabsContent value="governance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Responsibilities and Governance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="itAdministrator">IT Administrator</Label>
                      <Input
                        id="itAdministrator"
                        value={formData.itAdministrator || ''}
                        onChange={(e) => handleInputChange('itAdministrator', e.target.value)}
                        placeholder="IT administrator name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessOwner">Business Owner</Label>
                      <Input
                        id="businessOwner"
                        value={formData.businessOwner || ''}
                        onChange={(e) => handleInputChange('businessOwner', e.target.value)}
                        placeholder="Business owner name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="procurementContact">Procurement Contact</Label>
                      <Input
                        id="procurementContact"
                        value={formData.procurementContact || ''}
                        onChange={(e) => handleInputChange('procurementContact', e.target.value)}
                        placeholder="Procurement contact person"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vendorContact">Vendor Contact</Label>
                      <Input
                        id="vendorContact"
                        value={formData.vendorContact || ''}
                        onChange={(e) => handleInputChange('vendorContact', e.target.value)}
                        placeholder="Vendor contact person"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="acceptableUsePolicy">Acceptable Use Policy</Label>
                    <Textarea
                      id="acceptableUsePolicy"
                      value={formData.acceptableUsePolicy || ''}
                      onChange={(e) => handleInputChange('acceptableUsePolicy', e.target.value)}
                      placeholder="Link or description of the acceptable use policy"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive !== false}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">Software Active</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Add Software'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
