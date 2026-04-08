'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface SoftwareCost {
  id: string
  software: {
    name: string
  }
  costType: string
  amount: number
  currency: string
  billingPeriod: string
}

interface DeleteCostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cost: SoftwareCost | null
  onSuccess: () => void
}

export function DeleteCostDialog({ open, onOpenChange, cost, onSuccess }: DeleteCostDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!cost) return

    setLoading(true)
    try {
      const response = await fetch(`/api/costs/${cost.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Cost entry deleted successfully')
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete cost entry')
      }
    } catch (error) {
      console.error('Error deleting cost:', error)
      toast.error('Failed to delete cost entry')
    } finally {
      setLoading(false)
    }
  }

  const formatCostType = (type: string) => {
    const types: Record<string, string> = {
      'LICENSE': 'License',
      'MAINTENANCE': 'Maintenance',
      'SUPPORT': 'Support',
      'TRAINING': 'Training',
      'IMPLEMENTATION': 'Implementation',
      'OTHER': 'Other'
    }
    return types[type] || type
  }

  const formatBillingPeriod = (period: string) => {
    const periods: Record<string, string> = {
      'MONTHLY': 'Monthly',
      'QUARTERLY': 'Quarterly',
      'ANNUALLY': 'Annually',
      'ONE_TIME': 'One-time'
    }
    return periods[period] || period
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Delete Cost Entry
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this cost entry? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {cost && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p><strong>Software:</strong> {cost.software?.name}</p>
            <p><strong>Cost Type:</strong> {formatCostType(cost.costType)}</p>
            <p><strong>Amount:</strong> {formatCurrency(cost.amount, cost.currency)}</p>
            <p><strong>Billing Period:</strong> {formatBillingPeriod(cost.billingPeriod)}</p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Cost'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
