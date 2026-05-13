'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

type Contract = {
  id: string
  contractNumber: string
  title: string
  contractValue: number
}

interface DeleteContractDialogProps {
  contract: Contract | null
  open: boolean
  onClose: () => void
  onContractDeleted: () => void
}

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value || 0)

export default function DeleteContractDialog({ contract, open, onClose, onContractDeleted }: DeleteContractDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!contract) return

    setLoading(true)
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error deleting contract')
      }

      toast.success('Contract deleted successfully')
      onClose()
      onContractDeleted()
    } catch (error) {
      console.error('Error deleting contract:', error)
      toast.error(error instanceof Error ? error.message : 'Error deleting contract')
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
            Delete Contract
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <span>
              Do you want to permanently delete contract <strong>{contract?.contractNumber}</strong> ({contract?.title})?
            </span>
            {contract && (
              <span className="block rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                This removes a real persisted contract record with value {formatCurrency(contract.contractValue)}.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || !contract}>
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? 'Deleting...' : 'Delete Contract'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
