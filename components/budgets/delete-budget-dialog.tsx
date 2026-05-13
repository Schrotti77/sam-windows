'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

type Budget = {
  id: string
  name: string
  fiscalYear: number
  budgetAmount: number
  spentAmount: number
}

interface DeleteBudgetDialogProps {
  budget: Budget | null
  open: boolean
  onClose: () => void
  onBudgetDeleted: () => void
}

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value || 0)

export default function DeleteBudgetDialog({ budget, open, onClose, onBudgetDeleted }: DeleteBudgetDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!budget) return

    setLoading(true)
    try {
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error deleting budget')
      }

      toast.success('Budget deleted successfully')
      onClose()
      onBudgetDeleted()
    } catch (error) {
      console.error('Error deleting budget:', error)
      toast.error(error instanceof Error ? error.message : 'Error deleting budget')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Delete Budget
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <span>
              Do you want to permanently delete <strong>{budget?.name}</strong> for fiscal year {budget?.fiscalYear}?
            </span>
            {budget && (
              <span className="block rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                This removes a real persisted budget record: {formatCurrency(budget.budgetAmount)} budget, {formatCurrency(budget.spentAmount)} spent.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || !budget}>
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? 'Deleting...' : 'Delete Budget'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
