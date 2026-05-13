'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Save, X } from 'lucide-react'
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

interface AddAssignmentDialogProps {
  onAssignmentAdded: () => void
  trigger?: React.ReactNode
}

function defaultValues(): AssignmentFormData {
  return {
    softwareId: '',
    userId: '',
    assignedBy: '',
    assignedAt: '',
    status: 'ACTIVE',
    notes: ''
  }
}

const optionLabel = (item: SoftwareOption) => item.vendor?.name ? `${item.name} (${item.vendor.name})` : item.name

export default function AddAssignmentDialog({ onAssignmentAdded, trigger }: AddAssignmentDialogProps) {
  const [open, setOpen] = useState(false)
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
    defaultValues: defaultValues()
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

  const onSubmit = async (data: AssignmentFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error creating assignment')
      }

      toast.success('Assignment created successfully')
      reset(defaultValues())
      setOpen(false)
      onAssignmentAdded()
    } catch (error) {
      console.error('Error creating assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Error creating assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    reset(defaultValues())
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Assignment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Assignment</DialogTitle>
          <DialogDescription>Create a persisted software-to-user assignment.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {softwareError && <div className="rounded-md border border-red-200 p-3 text-sm text-red-600">{softwareError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="softwareId">Software *</Label>
              <select id="softwareId" {...register('softwareId')} disabled={loading || softwareOptions.length === 0} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select software</option>
                {softwareOptions.map((item) => <option key={item.id} value={item.id}>{optionLabel(item)}</option>)}
              </select>
              {softwareOptions.length === 0 && !softwareError && <p className="text-sm text-muted-foreground">No software available.</p>}
              {errors.softwareId && <p className="text-sm text-red-500">{errors.softwareId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">User ID *</Label>
              <Input id="userId" {...register('userId')} disabled={loading} placeholder="user@example.com or employee id" />
              {errors.userId && <p className="text-sm text-red-500">{errors.userId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedBy">Assigned By</Label>
              <Input id="assignedBy" {...register('assignedBy')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedAt">Assigned At</Label>
              <Input id="assignedAt" type="date" {...register('assignedAt')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select id="status" {...register('status')} disabled={loading} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="REVOKED">REVOKED</option>
              </select>
              {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register('notes')} disabled={loading} rows={3} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || softwareOptions.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
