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
const numberFromInput = (fieldName: string) => z.preprocess(
  (value) => value === '' || value === null || value === undefined ? undefined : Number(value),
  z.number({ required_error: `${fieldName} is required`, invalid_type_error: `${fieldName} must be a valid number` }).min(0, `${fieldName} must be at least 0`)
)

const contractSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  contractNumber: z.string().trim().min(1, 'Contract number is required'),
  title: z.string().trim().min(1, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  renewalDate: optionalDate,
  contractValue: numberFromInput('Contract value'),
  paymentTerms: optionalText,
  renewalTerms: optionalText,
  status: z.string().min(1, 'Status is required'),
  notes: optionalText
}).refine((data) => data.startDate <= data.endDate, {
  message: 'End date must be on or after start date',
  path: ['endDate']
})

type ContractFormData = z.infer<typeof contractSchema>

type VendorOption = {
  id: string
  name: string
  isActive?: boolean
}

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

interface EditContractDialogProps {
  contract: Contract | null
  open: boolean
  onClose: () => void
  onContractUpdated: () => void
}

const toDateInput = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 10) : ''

export default function EditContractDialog({ contract, open, onClose, onContractUpdated }: EditContractDialogProps) {
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<VendorOption[]>([])
  const [vendorError, setVendorError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      vendorId: '',
      contractNumber: '',
      title: '',
      startDate: '',
      endDate: '',
      renewalDate: '',
      contractValue: 0,
      paymentTerms: '',
      renewalTerms: '',
      status: 'ACTIVE',
      notes: ''
    }
  })

  useEffect(() => {
    if (!open) return

    const loadVendors = async () => {
      setVendorError(null)
      try {
        const response = await fetch('/api/vendors')
        if (!response.ok) throw new Error('Failed to load vendors')
        const data = await response.json()
        setVendors(Array.isArray(data) ? data : [])
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load vendors'
        setVendorError(message)
        setVendors([])
      }
    }

    loadVendors()
  }, [open])

  useEffect(() => {
    if (contract) {
      reset({
        vendorId: contract.vendorId || contract.vendor?.id || '',
        contractNumber: contract.contractNumber || '',
        title: contract.title || '',
        startDate: toDateInput(contract.startDate),
        endDate: toDateInput(contract.endDate),
        renewalDate: toDateInput(contract.renewalDate),
        contractValue: contract.contractValue || 0,
        paymentTerms: contract.paymentTerms || '',
        renewalTerms: contract.renewalTerms || '',
        status: contract.status || 'ACTIVE',
        notes: contract.notes || ''
      })
    }
  }, [contract, reset])

  const onSubmit = async (data: ContractFormData) => {
    if (!contract) return

    setLoading(true)
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error updating contract')
      }

      toast.success('Contract updated successfully')
      onClose()
      onContractUpdated()
    } catch (error) {
      console.error('Error updating contract:', error)
      toast.error(error instanceof Error ? error.message : 'Error updating contract')
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
          <DialogTitle>Edit Contract</DialogTitle>
          <DialogDescription>Update {contract?.contractNumber} using the contracts API.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {vendorError && <div className="rounded-md border border-red-200 p-3 text-sm text-red-600">{vendorError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-vendorId">Vendor *</Label>
              <select id="edit-vendorId" {...register('vendorId')} disabled={loading || vendors.length === 0} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select vendor</option>
                {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
              </select>
              {vendors.length === 0 && !vendorError && <p className="text-sm text-muted-foreground">No vendors available.</p>}
              {errors.vendorId && <p className="text-sm text-red-500">{errors.vendorId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contractNumber">Contract Number *</Label>
              <Input id="edit-contractNumber" {...register('contractNumber')} disabled={loading} />
              {errors.contractNumber && <p className="text-sm text-red-500">{errors.contractNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input id="edit-title" {...register('title')} disabled={loading} />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-startDate">Start Date *</Label>
              <Input id="edit-startDate" type="date" {...register('startDate')} disabled={loading} />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endDate">End Date *</Label>
              <Input id="edit-endDate" type="date" {...register('endDate')} disabled={loading} />
              {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-renewalDate">Renewal Date</Label>
              <Input id="edit-renewalDate" type="date" {...register('renewalDate')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contractValue">Contract Value *</Label>
              <Input id="edit-contractValue" type="number" step="0.01" min="0" {...register('contractValue')} disabled={loading} />
              {errors.contractValue && <p className="text-sm text-red-500">{errors.contractValue.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <select id="edit-status" {...register('status')} disabled={loading} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
              {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-paymentTerms">Payment Terms</Label>
              <Input id="edit-paymentTerms" {...register('paymentTerms')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-renewalTerms">Renewal Terms</Label>
              <Input id="edit-renewalTerms" {...register('renewalTerms')} disabled={loading} />
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
            <Button type="submit" disabled={loading || vendors.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
