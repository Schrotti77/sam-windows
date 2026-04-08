
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { EditSoftwareDialog } from '@/components/software-edit-dialog'
import { AddSoftwareDialog } from '@/components/software-add-dialog'
import { Plus, Search, Filter, Package, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Software {
  id: string
  
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
  
  // IV. Wartungs- und Support-Daten
  updateStatus: string
  lastPatchDate?: string
  maintenanceContract?: string
  supportLevel?: string
  supportExpiry?: string
  knownVulnerabilities?: any
  securityRisks?: any
  maintenanceHistory?: any
  
  // V. Finanzielle Daten
  acquisitionCost?: number
  budgetAllocation?: string
  roiCalculation?: any
  costPerUser?: number
  depreciationSchedule?: any
  
  // VI. Compliance- und Risiko-Daten
  regulatoryCompliance?: any
  complianceStatus: string
  riskAssessment?: any
  auditHistory?: any
  shadowIT: boolean
  
  // VII. Lifecycle-Management-Daten
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
  
  // Existing fields
  vendor: { id: string; name: string }
  vendorId: string
  isActive: boolean
  createdAt: string
  _count: {
    licenses: number
    assignments: number
  }
}

export default function SoftwarePageClient() {
  const [software, setSoftware] = useState<Software[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingSoftware, setEditingSoftware] = useState<Software | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleEditSoftware = (softwareToEdit: Software) => {
    setEditingSoftware(softwareToEdit)
    setIsEditDialogOpen(true)
  }

  const handleDeleteSoftware = async (softwareToDelete: Software) => {
    if (confirm(`Are you sure you want to delete "${softwareToDelete.name}"?`)) {
      try {
        const response = await fetch(`/api/software/${softwareToDelete.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setSoftware(prev => prev.filter(s => s.id !== softwareToDelete.id))
        } else {
          alert('Error deleting software')
        }
      } catch (error) {
        console.error('Error deleting software:', error)
        alert('Error deleting software')
      }
    }
  }

  const handleAddSoftware = () => {
    setIsAddDialogOpen(true)
  }

  const handleSaveNewSoftware = (newSoftware: Software) => {
    setSoftware(prev => [newSoftware, ...prev])
    setIsAddDialogOpen(false)
  }

  const handleSaveSoftware = (updatedSoftware: Software) => {
    setSoftware(prev => 
      prev.map(s => s.id === updatedSoftware.id ? updatedSoftware : s)
    )
    setEditingSoftware(null)
    setIsEditDialogOpen(false)
  }

  const columns: ColumnDef<Software>[] = [
    {
      accessorKey: 'name',
      header: 'Software Name',
    },
    {
      accessorKey: 'version',
      header: 'Version',
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: any) => {
        const category = row.getValue('category') as string
        const categoryMap = {
          'DESKTOP': 'Desktop',
          'SAAS': 'SaaS',
          'SERVER': 'Server',
          'MOBILE': 'Mobile'
        }
        return <Badge variant="outline">{categoryMap[category as keyof typeof categoryMap] || category}</Badge>
      },
    },
    {
      accessorKey: 'deploymentType',
      header: 'Deployment',
      cell: ({ row }: any) => {
        const deploymentType = row.getValue('deploymentType') as string
        const typeMap = {
          'ON_PREMISES': 'On-Premises',
          'CLOUD_SAAS': 'Cloud/SaaS',
          'PAAS': 'PaaS',
          'IAAS': 'IaaS',
          'OPEN_SOURCE': 'Open Source',
          'HYBRID': 'Hybrid'
        }
        return deploymentType ? <Badge variant="secondary">{typeMap[deploymentType as keyof typeof typeMap] || deploymentType}</Badge> : '-'
      },
    },
    {
      accessorKey: 'businessCriticality',
      header: 'Criticality',
      cell: ({ row }: any) => {
        const criticality = row.getValue('businessCriticality') as string
        const criticalityColors = {
          'LOW': 'bg-green-100 text-green-800',
          'MEDIUM': 'bg-yellow-100 text-yellow-800', 
          'HIGH': 'bg-orange-100 text-orange-800',
          'CRITICAL': 'bg-red-100 text-red-800'
        }
        const criticalityLabels = {
          'LOW': 'Low',
          'MEDIUM': 'Medium',
          'HIGH': 'High', 
          'CRITICAL': 'Critical'
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${criticalityColors[criticality as keyof typeof criticalityColors] || 'bg-gray-100 text-gray-800'}`}>
            {criticalityLabels[criticality as keyof typeof criticalityLabels] || criticality}
          </span>
        )
      },
    },
    {
      accessorKey: 'lifecycleStatus',
      header: 'Lifecycle',
      cell: ({ row }: any) => {
        const status = row.getValue('lifecycleStatus') as string
        const statusMap = {
          'PLANNING': 'Planning',
          'PROCUREMENT': 'Procurement',
          'DEPLOYMENT': 'Deployment',
          'IN_USE': 'In Use',
          'MAINTENANCE': 'Maintenance',
          'DECOMMISSIONING': 'Decommissioning',
          'RETIRED': 'Retired'
        }
        return <Badge variant="outline">{statusMap[status as keyof typeof statusMap] || status}</Badge>
      },
    },
    {
      accessorKey: 'vendor.name',
      header: 'Vendor',
    },
    {
      accessorKey: '_count.licenses',
      header: 'Licenses',
    },
    {
      accessorKey: '_count.assignments',
      header: 'Assignments',
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: any) => {
        const isActive = row.getValue('isActive') as boolean
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const softwareItem = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Actions menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleEditSoftware(softwareItem)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteSoftware(softwareItem)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        const response = await fetch('/api/software')
        const data = await response.json()
        // Ensure data is always an array
        setSoftware(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching software:', error)
        setSoftware([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchSoftware()
  }, [])

  // Ensure software is always an array before filtering
  const safeSoftware = Array.isArray(software) ? software : []
  const filteredSoftware = safeSoftware.filter(item =>
    item?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() ?? '') ||
    item?.vendor?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() ?? '')
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Package className="w-8 h-8 mr-3 text-blue-600" />
            Software Inventory
          </h1>
          <p className="text-muted-foreground">
            Manage your entire software landscape
          </p>
        </div>
        <Button onClick={handleAddSoftware}>
          <Plus className="w-4 h-4 mr-2" />
          Add Software
        </Button>
      </div>

      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for software or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => alert('Filter function will be implemented')}>
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Software
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeSoftware.length}</div>
            <p className="text-xs text-muted-foreground">
              Managed Applications
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Software
            </CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeSoftware.filter(s => s?.businessCriticality === 'CRITICAL' || s?.businessCriticality === 'HIGH')?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Business-Critical Assets
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cloud/SaaS Software
            </CardTitle>
            <div className="h-4 w-4 bg-blue-500 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeSoftware.filter(s => s?.category === 'SAAS' || s?.deploymentType === 'CLOUD_SAAS')?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Cloud Applications
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Shadow IT
            </CardTitle>
            <div className="h-4 w-4 bg-yellow-500 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeSoftware.filter(s => s?.shadowIT === true)?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unauthorized Software
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              In Production
            </CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeSoftware.filter(s => s?.lifecycleStatus === 'IN_USE' || s?.deploymentStatus === 'PRODUCTION')?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Productively used
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Update Required
            </CardTitle>
            <div className="h-4 w-4 bg-orange-500 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeSoftware.filter(s => s?.updateStatus === 'UPDATE_AVAILABLE' || s?.updateStatus === 'CRITICAL_UPDATE_NEEDED')?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending updates
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              End-of-Support
            </CardTitle>
            <div className="h-4 w-4 bg-gray-500 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeSoftware.filter(s => s?.updateStatus === 'END_OF_SUPPORT' || s?.updateStatus === 'DEPRECATED')?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Support expired
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Risks
            </CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeSoftware.filter(s => s?.complianceStatus === 'NON_COMPLIANT' || s?.complianceStatus === 'AT_RISK')?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Compliance issues
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Software List</CardTitle>
          <CardDescription>
            All registered software assets in your environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div>Loading data...</div>
            </div>
          ) : (
            <DataTable columns={columns} data={filteredSoftware} />
          )}
        </CardContent>
      </Card>

      <EditSoftwareDialog
        software={editingSoftware}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingSoftware(null)
        }}
        onSave={handleSaveSoftware}
      />

      <AddSoftwareDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleSaveNewSoftware}
      />
    </div>
  )
}
