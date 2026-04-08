
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Vendor {
  id: string
  name: string
  _count?: {
    software: number
    contracts: number
  }
}

interface DeleteVendorDialogProps {
  vendor: Vendor | null
  open: boolean
  onClose: () => void
  onVendorDeleted: () => void
}

export default function DeleteVendorDialog({ 
  vendor, 
  open, 
  onClose, 
  onVendorDeleted 
}: DeleteVendorDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!vendor) return

    setLoading(true)
    try {
      const response = await fetch(`/api/vendors/${vendor.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && !data.canDelete) {
          toast.error(`${data.error}`, {
            description: `Software entries: ${data.counts.software}, Contracts: ${data.counts.contracts}`,
            duration: 5000
          })
        } else {
          throw new Error(data.error || 'Error deleting vendor')
        }
        return
      }

      toast.success('Vendor successfully deleted')
      onClose()
      onVendorDeleted()
      
    } catch (error) {
      console.error('Error deleting vendor:', error)
      toast.error(error instanceof Error ? error.message : 'Error deleting vendor')
    } finally {
      setLoading(false)
    }
  }

  const hasAssociations = Boolean(vendor && vendor._count && (vendor._count.software > 0 || vendor._count.contracts > 0))

  return (
    <Dialog open={open} onOpenChange={onClose}>      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Delete Vendor
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <span>
              Do you want to delete vendor <strong>{vendor?.name}</strong> permanently?
            </span>
            
            {hasAssociations && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center text-yellow-800 font-medium">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Warning: Linked data exists
                </div>
                <div className="text-sm text-yellow-700 space-y-1">
                  {vendor?._count?.software && vendor._count.software > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Software entries:</span>
                      <Badge variant="outline" className="bg-yellow-100">
                        {vendor._count.software}
                      </Badge>
                    </div>
                  )}
                  {vendor?._count?.contracts && vendor._count.contracts > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Contracts:</span>
                      <Badge variant="outline" className="bg-yellow-100">
                        {vendor._count.contracts}
                      </Badge>
                    </div>
                  )}
                </div>
                <p className="text-xs text-yellow-600 mt-2">
                  The vendor can only be deleted if no software entries or contracts are assigned.
                </p>
              </div>
            )}
            
            {!hasAssociations && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  <strong>This action cannot be undone.</strong>
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || hasAssociations}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? 'Delete...' : 'Delete Permanently'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
