'use client'

import { useEffect, useState, type ChangeEventHandler } from 'react'
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

type Budget = {
  id: string
  name: string
  department?: string | null
  category?: string | null
  budgetAmount: number
  spentAmount: number
  fiscalYear: number
  startDate: string
  endDate: string
  notes?: string | null
}

interface EditBudgetDialogProps {
  budget: Budget | null
  open: boolean
  onClose: () => void
  onBudgetUpdated: () => void
}

const toDateInput = (value: string) => value ? new Date(value).toISOString().slice(0, 10) : ''

export default function EditBudgetDialog({ budget, open, onClose, onBudgetUpdated }: EditBudgetDialogProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      department: '',
      category: '',
      budgetAmount: 0,
      spentAmount: 0,
      fiscalYear: new Date().getFullYear(),
      startDate: '',
      endDate: '',
      notes: ''
    }
  })

  useEffect(() => {
    if (budget) {
      reset({
        name: budget.name || '',
        department: budget.department || '',
        category: budget.category || '',
        budgetAmount: budget.budgetAmount || 0,
        spentAmount: budget.spentAmount || 0,
        fiscalYear: budget.fiscalYear || new Date().getFullYear(),
        startDate: toDateInput(budget.startDate),
        endDate: toDateInput(budget.endDate),
        notes: budget.notes || ''
      })
    }
  }, [budget, reset])

  const onSubmit = async (data: BudgetFormData) => {
    if (!budget) return

    setLoading(true)
    try {
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error updating budget')
      }

      toast.success('Budget updated successfully')
      onClose()
      onBudgetUpdated()
    } catch (error) {
      console.error('Error updating budget:', error)
      toast.error(error instanceof Error ? error.message : 'Error updating budget')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    reset()
    onClose()
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
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Update {budget?.name}. The API recalculates derived totals.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input id="edit-name" {...register('name')} disabled={loading} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Input id="edit-department" {...register('department')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input id="edit-category" {...register('category')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-budgetAmount">Budget Amount *</Label>
              <Input id="edit-budgetAmount" type="number" step="0.01" min="0" {...register('budgetAmount')} disabled={loading} />
              {errors.budgetAmount && <p className="text-sm text-red-500">{errors.budgetAmount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-spentAmount">Spent Amount</Label>
              <Input id="edit-spentAmount" type="number" step="0.01" min="0" {...register('spentAmount')} disabled={loading} />
              {errors.spentAmount && <p className="text-sm text-red-500">{errors.spentAmount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fiscalYear">Fiscal Year *</Label>
              <Input id="edit-fiscalYear" type="number" min="1970" {...fiscalYearRegistration} onChange={handleFiscalYearChange} disabled={loading} />
              {errors.fiscalYear && <p className="text-sm text-red-500">{errors.fiscalYear.message}</p>}
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
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
