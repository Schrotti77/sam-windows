
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Save, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const optionalEmail = z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().email('Valid email address required').optional()
)
const optionalUrl = z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().url('Valid URL required').optional()
)

const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(100),
  contactEmail: optionalEmail,
  contactPhone: z.string().optional(),
  website: optionalUrl,
  address: z.string().optional(),
  supportEmail: optionalEmail,
  supportPhone: z.string().optional(),
  accountManager: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true)
})

type VendorFormData = z.infer<typeof vendorSchema>

interface AddVendorDialogProps {
  onVendorAdded: () => void
  trigger?: React.ReactNode
}

export default function AddVendorDialog({ onVendorAdded, trigger }: AddVendorDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      address: '',
      supportEmail: '',
      supportPhone: '',
      accountManager: '',
      notes: '',
      isActive: true
    }
  })

  const isActive = watch('isActive')

  const onSubmit = async (data: VendorFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error creating vendor')
      }

      const newVendor = await response.json()
      toast.success('Vendor created successfully')
      
      reset()
      setOpen(false)
      onVendorAdded()
      
    } catch (error) {
      console.error('Error creating vendor:', error)
      toast.error(error instanceof Error ? error.message : 'Error creating vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Enter information for the new software vendor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Microsoft Corporation"
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  {...register('website')}
                  placeholder="https://www.vendor.com"
                  disabled={loading}
                />
                {errors.website && (
                  <p className="text-sm text-red-500">{errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Street, ZIP City, Country"
                rows={2}
                disabled={loading}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register('contactEmail')}
                  placeholder="contact@vendor.com"
                  disabled={loading}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-red-500">{errors.contactEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  {...register('contactPhone')}
                  placeholder="+49 123 456789"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountManager">Account Manager</Label>
              <Input
                id="accountManager"
                {...register('accountManager')}
                placeholder="Name of responsible Account Manager"
                disabled={loading}
              />
            </div>
          </div>

          {/* Support Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Support Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  {...register('supportEmail')}
                  placeholder="support@vendor.com"
                  disabled={loading}
                />
                {errors.supportEmail && (
                  <p className="text-sm text-red-500">{errors.supportEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input
                  id="supportPhone"
                  type="tel"
                  {...register('supportPhone')}
                  placeholder="+49 123 456789"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes about the vendor..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
                disabled={loading}
              />
              <Label htmlFor="isActive">Vendor Active</Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Save...' : 'Save Vendor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
