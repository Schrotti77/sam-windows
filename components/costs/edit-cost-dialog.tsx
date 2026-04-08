'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

interface Software {
  id: string
  name: string
  version: string
}

interface SoftwareCost {
  id: string
  softwareId: string
  software: {
    name: string
  }
  costType: string
  amount: number
  currency: string
  billingPeriod: string
  costDate: string
  description: string | null
  category: string | null
  department: string | null
}

interface EditCostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cost: SoftwareCost | null
  onSuccess: () => void
}

export function EditCostDialog({ open, onOpenChange, cost, onSuccess }: EditCostDialogProps) {
  const [loading, setLoading] = useState(false)
  const [software, setSoftware] = useState<Software[]>([])
  const [formData, setFormData] = useState({
    softwareId: '',
    costType: '',
    amount: '',
    currency: 'EUR',
    billingPeriod: '',
    costDate: '',
    description: '',
    category: '',
    department: ''
  })

  useEffect(() => {
    if (open) {
      fetchSoftware()
    }
  }, [open])

  useEffect(() => {
    if (cost) {
      setFormData({
        softwareId: cost.softwareId || '',
        costType: cost.costType || '',
        amount: cost.amount?.toString() || '',
        currency: cost.currency || 'EUR',
        billingPeriod: cost.billingPeriod || '',
        costDate: cost.costDate ? new Date(cost.costDate).toISOString().split('T')[0] : '',
        description: cost.description || '',
        category: cost.category || '',
        department: cost.department || ''
      })
    }
  }, [cost])

  const fetchSoftware = async () => {
    try {
      const response = await fetch('/api/software')
      if (response.ok) {
        const data = await response.json()
        setSoftware(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching software:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cost) return

    if (!formData.softwareId || !formData.costType || !formData.amount || !formData.billingPeriod || !formData.costDate) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/costs/${cost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      })

      if (response.ok) {
        toast.success('Cost entry updated successfully')
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update cost entry')
      }
    } catch (error) {
      console.error('Error updating cost:', error)
      toast.error('Failed to update cost entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Cost Entry</DialogTitle>
          <DialogDescription>
            Update the cost details for {cost?.software?.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="softwareId">Software *</Label>
            <Select
              value={formData.softwareId}
              onValueChange={(value) => setFormData({ ...formData, softwareId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select software" />
              </SelectTrigger>
              <SelectContent>
                {software.map((sw) => (
                  <SelectItem key={sw.id} value={sw.id}>
                    {sw.name} {sw.version && `(${sw.version})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costType">Cost Type *</Label>
              <Select
                value={formData.costType}
                onValueChange={(value) => setFormData({ ...formData, costType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LICENSE">License</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                  <SelectItem value="TRAINING">Training</SelectItem>
                  <SelectItem value="IMPLEMENTATION">Implementation</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingPeriod">Billing Period *</Label>
              <Select
                value={formData.billingPeriod}
                onValueChange={(value) => setFormData({ ...formData, billingPeriod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUALLY">Annually</SelectItem>
                  <SelectItem value="ONE_TIME">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costDate">Cost Date *</Label>
            <Input
              id="costDate"
              type="date"
              value={formData.costDate}
              onChange={(e) => setFormData({ ...formData, costDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Cloud Services"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about this cost..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
