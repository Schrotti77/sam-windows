
'use client'

import { useEffect, useState } from 'react'
import { Building, Plus, Mail, Phone, Globe, Filter, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import AddVendorDialog from '@/components/vendors/add-vendor-dialog'
import EditVendorDialog from '@/components/vendors/edit-vendor-dialog'
import DeleteVendorDialog from '@/components/vendors/delete-vendor-dialog'

interface Vendor {
  id: string
  name: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  accountManager?: string
  supportEmail?: string
  supportPhone?: string
  address?: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    software: number
    contracts: number
  }
}

export default function VendorsPageClient() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: 'name',
      header: 'Vendor',
    },
    {
      accessorKey: 'contactEmail',
      header: 'Email',
      cell: ({ row }: any) => {
        const email = row.getValue('contactEmail')
        return email ? (
          <a 
            href={`mailto:${email}`} 
            className="text-blue-600 hover:underline flex items-center"
          >
            <Mail className="w-4 h-4 mr-1" />
            {email}
          </a>
        ) : '-'
      },
    },
    {
      accessorKey: 'contactPhone',
      header: 'Phone',
      cell: ({ row }: any) => {
        const phone = row.getValue('contactPhone')
        return phone ? (
          <a 
            href={`tel:${phone}`} 
            className="text-blue-600 hover:underline flex items-center"
          >
            <Phone className="w-4 h-4 mr-1" />
            {phone}
          </a>
        ) : '-'
      },
    },
    {
      accessorKey: 'website',
      header: 'Website',
      cell: ({ row }: any) => {
        const website = row.getValue('website')
        return website ? (
          <a 
            href={website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline flex items-center"
          >
            <Globe className="w-4 h-4 mr-1" />
            Website
          </a>
        ) : '-'
      },
    },
    {
      accessorKey: '_count.contracts',
      header: 'Contracts',
      cell: ({ row }: any) => {
        const vendor = row.original as Vendor
        return vendor._count?.contracts || 0
      },
    },
    {
      accessorKey: '_count.software',
      header: 'Software',
      cell: ({ row }: any) => {
        const vendor = row.original as Vendor
        return vendor._count?.software || 0
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: any) => {
        const isActive = row.getValue('isActive')
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Aktiv' : 'Inaktiv'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => {
        const vendor = row.original as Vendor
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Actions menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleEditVendor(vendor)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteVendor(vendor)}
                className="cursor-pointer text-red-600"
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
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors')
      if (response.ok) {
        const data = await response.json()
        setVendors(data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.contactEmail && vendor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const activeVendors = vendors.filter(v => v.isActive).length
  const totalContracts = vendors.reduce((sum, v) => sum + (v._count?.contracts || 0), 0)
  const totalSoftware = vendors.reduce((sum, v) => sum + (v._count?.software || 0), 0)

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setEditDialogOpen(true)
  }

  const handleDeleteVendor = (vendor: Vendor) => {
    setDeletingVendor(vendor)
    setDeleteDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingVendor(null)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setDeletingVendor(null)
  }

  const handleFilter = () => {
    alert('Filter dialog would open')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Building className="w-8 h-8 mr-3 text-orange-500" />
            Vendor Management
          </h1>
          <p className="text-muted-foreground">
            Manage your software vendors and contract partners
          </p>
        </div>
        <AddVendorDialog onVendorAdded={fetchVendors} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{vendors.length}</p>
                <p className="text-xs text-muted-foreground">Gesamt Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeVendors}</p>
                <p className="text-xs text-muted-foreground">Aktive Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Badge className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalContracts}</p>
                <p className="text-xs text-muted-foreground">Active Contracts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalSoftware}</p>
                <p className="text-xs text-muted-foreground">Software entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Input
            placeholder="Vendors durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4"
          />
        </div>
        <Button variant="outline" onClick={handleFilter}>
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Overview</CardTitle>
          <CardDescription>
            {filteredVendors.length} of {vendors.length} Vendors shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={filteredVendors}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVendors.slice(0, 6).map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Building className="w-5 h-5 mr-2" />
                {vendor.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  <a href={`mailto:${vendor.contactEmail}`} className="text-blue-600 hover:underline">
                    {vendor.contactEmail}
                  </a>
                </div>
                
                {vendor.contactPhone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    <a href={`tel:${vendor.contactPhone}`} className="text-blue-600 hover:underline">
                      {vendor.contactPhone}
                    </a>
                  </div>
                )}
                
                {vendor.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                    <a 
                      href={vendor.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      Website besuchen
                    </a>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={vendor.isActive ? 'default' : 'secondary'}>
                      {vendor.isActive ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-muted-foreground">Contracts:</span>
                    <span>{vendor._count?.contracts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-muted-foreground">Software:</span>
                    <span>{vendor._count?.software || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Vendor Dialog */}
      <EditVendorDialog
        vendor={editingVendor}
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        onVendorUpdated={fetchVendors}
      />

      {/* Delete Vendor Dialog */}
      <DeleteVendorDialog
        vendor={deletingVendor}
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onVendorDeleted={fetchVendors}
      />
    </div>
  )
}
