'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const optionalText = z.preprocess((value) => value === '' ? undefined : value, z.string().optional())
const optionalDate = z.preprocess((value) => value === '' ? undefined : value, z.string().optional())

const assignmentSchema = z.object({
  softwareId: z.string().min(1, 'Software is required'),
  userId: z.string().trim().min(1, 'User ID is required'),
  assignedBy: optionalText,
  assignedAt: optionalDate,
  status: z.enum(['ACTIVE', 'INACTIVE', 'REVOKED']),
  notes: optionalText
})

type AssignmentFormData = z.infer<typeof assignmentSchema>

type SoftwareOption = {
  id: string
  name: string
  vendor?: { name?: string | null } | null
}

type Assignment = {
  id: string
  softwareId: string
  userId: string
  assignedBy?: string | null
  assignedAt: string
  status: string
  notes?: string | null
  software?: {
    id?: string
    name?: string | null
    vendor?: { name?: string | null } | null
  } | null
}

interface EditAssignmentDialogProps {
  assignment: Assignment | null
  open: boolean
  onClose: () => void
  onAssignmentUpdated: () => void
}

const toDateInput = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 10) : ''
const optionLabel = (item: SoftwareOption) => item.vendor?.name ? `${item.name} (${item.vendor.name})` : item.name

export default function EditAssignmentDialog({ assignment, open, onClose, onAssignmentUpdated }: EditAssignmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [softwareOptions, setSoftwareOptions] = useState<SoftwareOption[]>([])
  const [softwareError, setSoftwareError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      softwareId: '',
      userId: '',
      assignedBy: '',
      assignedAt: '',
      status: 'ACTIVE',
      notes: ''
    }
  })

  useEffect(() => {
    if (!open) return

    const loadSoftware = async () => {
      setSoftwareError(null)
      try {
        const response = await fetch('/api/software')
        if (!response.ok) throw new Error('Failed to load software')
        const data = await response.json()
        setSoftwareOptions(Array.isArray(data) ? data : [])
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load software'
        setSoftwareError(message)
        setSoftwareOptions([])
      }
    }

    loadSoftware()
  }, [open])

  useEffect(() => {
    if (assignment) {
      reset({
        softwareId: assignment.softwareId || assignment.software?.id || '',
        userId: assignment.userId || '',
        assignedBy: assignment.assignedBy || '',
        assignedAt: toDateInput(assignment.assignedAt),
        status: (assignment.status || 'ACTIVE') as AssignmentFormData['status'],
        notes: assignment.notes || ''
      })
    }
  }, [assignment, reset])

  const onSubmit = async (data: AssignmentFormData) => {
    if (!assignment) return

    setLoading(true)
    try {
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error updating assignment')
      }

      toast.success('Assignment updated successfully')
      onClose()
      onAssignmentUpdated()
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Error updating assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>Update assignment for {assignment?.userId}.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {softwareError && <div className="rounded-md border border-red-200 p-3 text-sm text-red-600">{softwareError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-softwareId">Software *</Label>
              <select id="edit-softwareId" {...register('softwareId')} disabled={loading || softwareOptions.length === 0} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select software</option>
                {softwareOptions.map((item) => <option key={item.id} value={item.id}>{optionLabel(item)}</option>)}
              </select>
              {softwareOptions.length === 0 && !softwareError && <p className="text-sm text-muted-foreground">No software available.</p>}
              {errors.softwareId && <p className="text-sm text-red-500">{errors.softwareId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-userId">User ID *</Label>
              <Input id="edit-userId" {...register('userId')} disabled={loading} />
              {errors.userId && <p className="text-sm text-red-500">{errors.userId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-assignedBy">Assigned By</Label>
              <Input id="edit-assignedBy" {...register('assignedBy')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-assignedAt">Assigned At</Label>
              <Input id="edit-assignedAt" type="date" {...register('assignedAt')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <select id="edit-status" {...register('status')} disabled={loading} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="REVOKED">REVOKED</option>
              </select>
              {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" {...register('notes')} disabled={loading} rows={3} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || softwareOptions.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
