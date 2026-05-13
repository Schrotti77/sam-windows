'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { FileText, MoreHorizontal, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import AddContractDialog from '@/components/contracts/add-contract-dialog'
import EditContractDialog from '@/components/contracts/edit-contract-dialog'
import DeleteContractDialog from '@/components/contracts/delete-contract-dialog'

type Contract = {
  id: string
  vendorId?: string
  contractNumber: string
  title: string
  startDate: string
  endDate: string
  renewalDate?: string | null
  contractValue: number
  paymentTerms?: string | null
  renewalTerms?: string | null
  status: string
  notes?: string | null
  vendor?: { id?: string; name?: string | null } | null
}

const formatDate = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString() : '—'
const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value || 0)

export default function ContractsPageClient() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const loadContracts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/contracts')
      if (!response.ok) throw new Error('Failed to load contracts')
      const data = await response.json()
      setContracts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContracts()
  }, [])

  const activeContracts = contracts.filter((contract) => contract.status === 'ACTIVE').length
  const totalValue = contracts.reduce((sum, contract) => sum + (Number(contract.contractValue) || 0), 0)

  const columns: ColumnDef<Contract>[] = [
    { accessorKey: 'contractNumber', header: 'Contract #' },
    { accessorKey: 'title', header: 'Title' },
    { id: 'vendor', header: 'Vendor', cell: ({ row }) => row.original.vendor?.name || '—' },
    { id: 'period', header: 'Period', cell: ({ row }) => `${formatDate(row.original.startDate)} – ${formatDate(row.original.endDate)}` },
    { id: 'renewalDate', header: 'Renewal', cell: ({ row }) => formatDate(row.original.renewalDate) },
    { id: 'value', header: 'Value', cell: ({ row }) => formatCurrency(row.original.contractValue) },
    { id: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'ACTIVE' ? 'default' : 'secondary'}>{row.original.status}</Badge> },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const contract = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={`Actions for ${contract.contractNumber}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedContract(contract)
                  setEditDialogOpen(true)
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setSelectedContract(contract)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <FileText className="w-8 h-8 mr-3" />
            Contract Management
          </h1>
          <p className="text-muted-foreground">Manage vendor contracts using the contracts API.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadContracts} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <AddContractDialog
            onContractAdded={loadContracts}
            trigger={(
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Contract
              </Button>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total Contracts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{contracts.length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{activeContracts}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalValue)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Contracts</CardTitle></CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-md border border-red-200 p-3 text-sm text-red-600">{error}</div>}
          {loading ? <div className="text-sm text-muted-foreground">Loading contracts...</div> : <DataTable columns={columns} data={contracts} />}
        </CardContent>
      </Card>

      <EditContractDialog
        contract={selectedContract}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onContractUpdated={loadContracts}
      />
      <DeleteContractDialog
        contract={selectedContract}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onContractDeleted={loadContracts}
      />
    </div>
  )
}
