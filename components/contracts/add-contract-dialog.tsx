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

interface AddContractDialogProps {
  onContractAdded: () => void
  trigger?: React.ReactNode
}

function defaultValues(): ContractFormData {
  const year = new Date().getFullYear()
  return {
    vendorId: '',
    contractNumber: '',
    title: '',
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    renewalDate: '',
    contractValue: '' as unknown as number,
    paymentTerms: '',
    renewalTerms: '',
    status: 'ACTIVE',
    notes: ''
  }
}

export default function AddContractDialog({ onContractAdded, trigger }: AddContractDialogProps) {
  const [open, setOpen] = useState(false)
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
    defaultValues: defaultValues()
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

  const onSubmit = async (data: ContractFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error creating contract')
      }

      toast.success('Contract created successfully')
      reset(defaultValues())
      setOpen(false)
      onContractAdded()
    } catch (error) {
      console.error('Error creating contract:', error)
      toast.error(error instanceof Error ? error.message : 'Error creating contract')
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
            Add Contract
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Contract</DialogTitle>
          <DialogDescription>Create a real vendor contract record via the contracts API.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {vendorError && <div className="rounded-md border border-red-200 p-3 text-sm text-red-600">{vendorError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vendorId">Vendor *</Label>
              <select id="vendorId" {...register('vendorId')} disabled={loading || vendors.length === 0} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select vendor</option>
                {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
              </select>
              {vendors.length === 0 && !vendorError && <p className="text-sm text-muted-foreground">No vendors available.</p>}
              {errors.vendorId && <p className="text-sm text-red-500">{errors.vendorId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractNumber">Contract Number *</Label>
              <Input id="contractNumber" {...register('contractNumber')} disabled={loading} />
              {errors.contractNumber && <p className="text-sm text-red-500">{errors.contractNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title')} disabled={loading} />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" type="date" {...register('startDate')} disabled={loading} />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" type="date" {...register('endDate')} disabled={loading} />
              {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewalDate">Renewal Date</Label>
              <Input id="renewalDate" type="date" {...register('renewalDate')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractValue">Contract Value *</Label>
              <Input id="contractValue" type="number" step="0.01" min="0" {...register('contractValue')} disabled={loading} />
              {errors.contractValue && <p className="text-sm text-red-500">{errors.contractValue.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select id="status" {...register('status')} disabled={loading} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
              {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input id="paymentTerms" {...register('paymentTerms')} disabled={loading} placeholder="Net 30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewalTerms">Renewal Terms</Label>
              <Input id="renewalTerms" {...register('renewalTerms')} disabled={loading} placeholder="Annual" />
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
            <Button type="submit" disabled={loading || vendors.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Contract'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
