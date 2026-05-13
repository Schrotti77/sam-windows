'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

type Assignment = {
  id: string
  userId: string
  status: string
  software?: { name?: string | null } | null
}

interface DeleteAssignmentDialogProps {
  assignment: Assignment | null
  open: boolean
  onClose: () => void
  onAssignmentDeleted: () => void
}

export default function DeleteAssignmentDialog({ assignment, open, onClose, onAssignmentDeleted }: DeleteAssignmentDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!assignment) return

    setLoading(true)
    try {
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error deleting assignment')
      }

      toast.success('Assignment deleted successfully')
      onClose()
      onAssignmentDeleted()
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Error deleting assignment')
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
            Delete Assignment
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <span>
              Do you want to permanently delete the assignment for <strong>{assignment?.userId}</strong>?
            </span>
            {assignment && (
              <span className="block rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                This removes the persisted assignment for {assignment.software?.name || 'the selected software'} with status {assignment.status}.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || !assignment}>
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? 'Deleting...' : 'Delete Assignment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
