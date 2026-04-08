'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, AlertTriangle, CheckCircle, Filter, Download, MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AddLicenseDialog } from '@/components/licenses/add-license-dialog'
import { EditLicenseDialog } from '@/components/licenses/edit-license-dialog'
import { DeleteLicenseDialog } from '@/components/licenses/delete-license-dialog'
import toast from 'react-hot-toast'

interface License {
  id: string
  softwareId: string
  software: {
    name: string
    version: string
  }
  licenseType: string
  totalLicenses: number
  usedLicenses: number
  availableLicenses: number
  costPerLicense: number | null
  purchaseDate: string | null
  expirationDate: string | null
  renewalDate: string | null
  isAutoRenewal: boolean
  complianceStatus: string
  notes: string | null
}

export default function LicensesPageClient() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [complianceFilter, setComplianceFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)

  const columns: ColumnDef<License>[] = [
    {
      accessorKey: 'software.name',
      header: 'Software',
      cell: ({ row }: any) => {
        const software = row.original.software
        return (
          <div>
            <p className="font-medium">{software?.name}</p>
            {software?.version && (
              <p className="text-xs text-muted-foreground">v{software.version}</p>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: 'licenseType',
      header: 'License Type',
      cell: ({ row }: any) => {
        const type = row.getValue('licenseType')
        const typeLabels: Record<string, string> = {
          'PERPETUAL': 'Perpetual',
          'SUBSCRIPTION': 'Subscription',
          'VOLUME': 'Volume License',
          'OEM': 'OEM',
          'OPEN_SOURCE': 'Open Source',
          'TRIAL': 'Trial'
        }
        return <span>{typeLabels[type as string] || type}</span>
      }
    },
    {
      accessorKey: 'totalLicenses',
      header: 'Total',
    },
    {
      accessorKey: 'usedLicenses',
      header: 'Used',
    },
    {
      accessorKey: 'availableLicenses',
      header: 'Available',
      cell: ({ row }: any) => {
        const available = row.getValue('availableLicenses')
        const isNegative = (available as number) < 0
        return (
          <span className={isNegative ? 'text-red-500 font-semibold' : ''}>
            {available as number}
          </span>
        )
      },
    },
    {
      accessorKey: 'costPerLicense',
      header: 'Cost/License',
      cell: ({ row }: any) => {
        const cost = row.getValue('costPerLicense')
        return cost ? `€${(cost as number).toFixed(2)}` : '-'
      }
    },
    {
      accessorKey: 'complianceStatus',
      header: 'Compliance',
      cell: ({ row }: any) => {
        const status = row.getValue('complianceStatus')
        const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
          'COMPLIANT': 'default',
          'NON_COMPLIANT': 'destructive',
          'AT_RISK': 'secondary',
          'UNKNOWN': 'outline'
        }
        const labels: Record<string, string> = {
          'COMPLIANT': 'Compliant',
          'NON_COMPLIANT': 'Non-compliant',
          'AT_RISK': 'At Risk',
          'UNKNOWN': 'Unknown'
        }
        return (
          <Badge variant={variants[status as string] || 'outline'}>
            {labels[status as string] || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'expirationDate',
      header: 'Expiration',
      cell: ({ row }: any) => {
        const dateValue = row.getValue('expirationDate')
        if (!dateValue) return <span className="text-muted-foreground">-</span>
        
        const date = new Date(dateValue as string)
        const now = new Date()
        const diffTime = date.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        const isExpiringSoon = diffDays <= 30 && diffDays > 0
        const isExpired = diffDays <= 0
        
        return (
          <div className={isExpired ? 'text-red-600 font-semibold' : isExpiringSoon ? 'text-orange-500 font-semibold' : ''}>
            {date.toLocaleDateString('en-US')}
            {isExpired && (
              <div className="text-xs">Expired</div>
            )}
            {isExpiringSoon && !isExpired && (
              <div className="text-xs">({diffDays} days left)</div>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const license = row.original as License
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Actions menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(license)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete(license)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  useEffect(() => {
    fetchLicenses()
  }, [])

  const fetchLicenses = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/licenses')
      if (response.ok) {
        const data = await response.json()
        setLicenses(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching licenses:', error)
      toast.error('Failed to load licenses')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (license: License) => {
    setSelectedLicense(license)
    setEditDialogOpen(true)
  }

  const handleDelete = (license: License) => {
    setSelectedLicense(license)
    setDeleteDialogOpen(true)
  }

  const handleExport = () => {
    if (filteredLicenses.length === 0) {
      toast.error('No licenses to export')
      return
    }

    const headers = ['Software', 'License Type', 'Total', 'Used', 'Available', 'Cost/License', 'Compliance', 'Expiration Date', 'Auto-Renewal']
    const csvContent = [
      headers.join(','),
      ...filteredLicenses.map(license => [
        `"${license.software?.name || ''}"`,
        license.licenseType,
        license.totalLicenses,
        license.usedLicenses,
        license.availableLicenses,
        license.costPerLicense || '',
        license.complianceStatus,
        license.expirationDate ? new Date(license.expirationDate).toLocaleDateString('en-US') : '',
        license.isAutoRenewal ? 'Yes' : 'No'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `licenses-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Licenses exported successfully')
  }

  const filteredLicenses = licenses.filter(license => {
    const complianceMatch = complianceFilter === 'all' || license.complianceStatus === complianceFilter
    const typeMatch = typeFilter === 'all' || license.licenseType === typeFilter
    return complianceMatch && typeMatch
  })

  const totalLicenses = licenses.reduce((sum, license) => sum + license.totalLicenses, 0)
  const usedLicenses = licenses.reduce((sum, license) => sum + license.usedLicenses, 0)
  const availableLicenses = licenses.reduce((sum, license) => sum + license.availableLicenses, 0)
  const nonCompliantLicenses = licenses.filter(license => license.complianceStatus !== 'COMPLIANT').length
  const expiringLicenses = licenses.filter(license => {
    if (!license.expirationDate) return false
    const date = new Date(license.expirationDate)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }).length

  const utilizationRate = totalLicenses > 0 ? (usedLicenses / totalLicenses) * 100 : 0

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <FileText className="w-8 h-8 mr-3 text-blue-500" />
            License Management
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor all software licenses
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchLicenses}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add License
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalLicenses}</p>
                <p className="text-xs text-muted-foreground">Total Licenses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{usedLicenses}</p>
                <p className="text-xs text-muted-foreground">In Use</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{availableLicenses}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{nonCompliantLicenses}</p>
                <p className="text-xs text-muted-foreground">Non-compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{expiringLicenses}</p>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>License Utilization</CardTitle>
          <CardDescription>
            Overall usage: {utilizationRate.toFixed(1)}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={utilizationRate} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{usedLicenses} used</span>
            <span>{totalLicenses} total</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label>Compliance:</Label>
            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="COMPLIANT">Compliant</SelectItem>
                <SelectItem value="NON_COMPLIANT">Non-compliant</SelectItem>
                <SelectItem value="AT_RISK">At Risk</SelectItem>
                <SelectItem value="UNKNOWN">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label>License Type:</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PERPETUAL">Perpetual</SelectItem>
                <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                <SelectItem value="VOLUME">Volume License</SelectItem>
                <SelectItem value="OEM">OEM</SelectItem>
                <SelectItem value="OPEN_SOURCE">Open Source</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>License Details</CardTitle>
            <CardDescription>
              {filteredLicenses.length} of {licenses.length} licenses shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={filteredLicenses}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddLicenseDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchLicenses}
      />

      <EditLicenseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        license={selectedLicense}
        onSuccess={fetchLicenses}
      />

      <DeleteLicenseDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        license={selectedLicense}
        onSuccess={fetchLicenses}
      />
    </div>
  )
}
