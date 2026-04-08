'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface License {
  id: string
  software: {
    name: string
    version: string
  }
  licenseType: string
  totalLicenses: number
}

interface DeleteLicenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  license: License | null
  onSuccess: () => void
}

export function DeleteLicenseDialog({ open, onOpenChange, license, onSuccess }: DeleteLicenseDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!license) return

    setLoading(true)
    try {
      const response = await fetch(`/api/licenses/${license.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('License deleted successfully')
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete license')
      }
    } catch (error) {
      console.error('Error deleting license:', error)
      toast.error('Failed to delete license')
    } finally {
      setLoading(false)
    }
  }

  const formatLicenseType = (type: string) => {
    const types: Record<string, string> = {
      'PERPETUAL': 'Perpetual',
      'SUBSCRIPTION': 'Subscription',
      'VOLUME': 'Volume License',
      'OEM': 'OEM',
      'OPEN_SOURCE': 'Open Source',
      'TRIAL': 'Trial'
    }
    return types[type] || type
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Delete License
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this license? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {license && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p><strong>Software:</strong> {license.software?.name}</p>
            <p><strong>License Type:</strong> {formatLicenseType(license.licenseType)}</p>
            <p><strong>Total Licenses:</strong> {license.totalLicenses}</p>
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
            {loading ? 'Deleting...' : 'Delete License'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
