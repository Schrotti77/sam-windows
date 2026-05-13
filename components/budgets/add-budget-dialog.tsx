'use client'

import { useState, type ChangeEventHandler } from 'react'
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
const numberFromInput = (fieldName: string, min = 0) => z.preprocess(
  (value) => value === '' || value === null || value === undefined ? undefined : Number(value),
  z.number({ required_error: `${fieldName} is required`, invalid_type_error: `${fieldName} must be a valid number` }).min(min, `${fieldName} must be at least ${min}`)
)
const dateInputYear = (value: string) => {
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(value)
  return match ? Number(match[1]) : new Date(value).getFullYear()
}

const budgetSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  department: optionalText,
  category: optionalText,
  budgetAmount: numberFromInput('Budget amount'),
  spentAmount: z.preprocess(
    (value) => value === '' || value === null || value === undefined ? 0 : Number(value),
    z.number({ invalid_type_error: 'Spent amount must be a valid number' }).min(0, 'Spent amount must be at least 0')
  ),
  fiscalYear: z.preprocess(
    (value) => value === '' || value === null || value === undefined ? undefined : Number(value),
    z.number({ required_error: 'Fiscal year is required', invalid_type_error: 'Fiscal year must be a valid number' }).int('Fiscal year must be a whole number').min(1970, 'Fiscal year must be at least 1970')
  ),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  notes: optionalText
}).refine((data) => data.spentAmount <= data.budgetAmount, {
  message: 'Spent amount cannot exceed budget amount',
  path: ['spentAmount']
}).refine((data) => data.startDate <= data.endDate, {
  message: 'End date must be on or after start date',
  path: ['endDate']
}).refine((data) => dateInputYear(data.startDate) === data.fiscalYear && dateInputYear(data.endDate) === data.fiscalYear, {
  message: 'Fiscal year must match the budget date range',
  path: ['fiscalYear']
})

type BudgetFormData = z.infer<typeof budgetSchema>

interface AddBudgetDialogProps {
  onBudgetAdded: () => void
  trigger?: React.ReactNode
}

function currentYearDefaults() {
  const fiscalYear = new Date().getFullYear()
  return {
    name: '',
    department: '',
    category: '',
    budgetAmount: '' as unknown as number,
    spentAmount: 0,
    fiscalYear,
    startDate: `${fiscalYear}-01-01`,
    endDate: `${fiscalYear}-12-31`,
    notes: ''
  }
}

export default function AddBudgetDialog({ onBudgetAdded, trigger }: AddBudgetDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: currentYearDefaults()
  })

  const onSubmit = async (data: BudgetFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error creating budget')
      }

      toast.success('Budget created successfully')
      reset(currentYearDefaults())
      setOpen(false)
      onBudgetAdded()
    } catch (error) {
      console.error('Error creating budget:', error)
      toast.error(error instanceof Error ? error.message : 'Error creating budget')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    reset(currentYearDefaults())
    setOpen(false)
  }

  const fiscalYearRegistration = register('fiscalYear')

  const handleFiscalYearChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    fiscalYearRegistration.onChange(event)
    const fiscalYear = Number(event.target.value)
    if (Number.isInteger(fiscalYear) && fiscalYear >= 1970) {
      setValue('startDate', `${fiscalYear}-01-01`, { shouldValidate: true })
      setValue('endDate', `${fiscalYear}-12-31`, { shouldValidate: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Budget
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Budget</DialogTitle>
          <DialogDescription>Create a real budget record. Remaining amount is calculated by the API.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register('name')} disabled={loading} placeholder="Software Licenses 2026" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register('department')} disabled={loading} placeholder="IT" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register('category')} disabled={loading} placeholder="Licenses" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetAmount">Budget Amount *</Label>
              <Input id="budgetAmount" type="number" step="0.01" min="0" {...register('budgetAmount')} disabled={loading} />
              {errors.budgetAmount && <p className="text-sm text-red-500">{errors.budgetAmount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="spentAmount">Spent Amount</Label>
              <Input id="spentAmount" type="number" step="0.01" min="0" {...register('spentAmount')} disabled={loading} />
              {errors.spentAmount && <p className="text-sm text-red-500">{errors.spentAmount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal Year *</Label>
              <Input id="fiscalYear" type="number" min="1970" {...fiscalYearRegistration} onChange={handleFiscalYearChange} disabled={loading} />
              {errors.fiscalYear && <p className="text-sm text-red-500">{errors.fiscalYear.message}</p>}
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
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
