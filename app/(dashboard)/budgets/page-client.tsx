'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Plus, RefreshCw, Trash2, Wallet } from 'lucide-react'
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
import AddBudgetDialog from '@/components/budgets/add-budget-dialog'
import EditBudgetDialog from '@/components/budgets/edit-budget-dialog'
import DeleteBudgetDialog from '@/components/budgets/delete-budget-dialog'

type Budget = {
  id: string
  name: string
  department?: string | null
  category?: string | null
  budgetAmount: number
  spentAmount: number
  remainingAmount: number
  fiscalYear: number
  startDate: string
  endDate: string
  notes?: string | null
}

const formatDate = (value: string) => value ? new Date(value).toLocaleDateString() : '—'
const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value || 0)

export default function BudgetsPageClient() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const loadBudgets = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/budgets')
      if (!response.ok) throw new Error('Failed to load budgets')
      const data = await response.json()
      setBudgets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBudgets()
  }, [])

  const totalBudget = budgets.reduce((sum, budget) => sum + (Number(budget.budgetAmount) || 0), 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + (Number(budget.spentAmount) || 0), 0)
  const totalRemaining = budgets.reduce((sum, budget) => sum + (Number(budget.remainingAmount) || 0), 0)

  const columns: ColumnDef<Budget>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'department', header: 'Department', cell: ({ row }) => row.original.department || '—' },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => row.original.category || '—' },
    { accessorKey: 'fiscalYear', header: 'Fiscal Year' },
    { id: 'period', header: 'Period', cell: ({ row }) => `${formatDate(row.original.startDate)} – ${formatDate(row.original.endDate)}` },
    { id: 'budgetAmount', header: 'Budget', cell: ({ row }) => formatCurrency(row.original.budgetAmount) },
    { id: 'spentAmount', header: 'Spent', cell: ({ row }) => formatCurrency(row.original.spentAmount) },
    { id: 'remainingAmount', header: 'Remaining', cell: ({ row }) => <Badge variant={row.original.remainingAmount >= 0 ? 'secondary' : 'destructive'}>{formatCurrency(row.original.remainingAmount)}</Badge> },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const budget = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={`Actions for ${budget.name}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedBudget(budget)
                  setEditDialogOpen(true)
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setSelectedBudget(budget)
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
            <Wallet className="w-8 h-8 mr-3" />
            Budget Management
          </h1>
          <p className="text-muted-foreground">Manage fiscal budgets and spend using the budgets API.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadBudgets} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <AddBudgetDialog
            onBudgetAdded={loadBudgets}
            trigger={(
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Budget
              </Button>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total Budget</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Spent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Remaining</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalRemaining)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Budgets</CardTitle></CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-md border border-red-200 p-3 text-sm text-red-600">{error}</div>}
          {loading ? <div className="text-sm text-muted-foreground">Loading budgets...</div> : <DataTable columns={columns} data={budgets} />}
        </CardContent>
      </Card>

      <EditBudgetDialog
        budget={selectedBudget}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onBudgetUpdated={loadBudgets}
      />
      <DeleteBudgetDialog
        budget={selectedBudget}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onBudgetDeleted={loadBudgets}
      />
    </div>
  )
}
