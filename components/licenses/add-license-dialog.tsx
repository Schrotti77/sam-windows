'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import toast from 'react-hot-toast'

interface Software {
  id: string
  name: string
  version: string
  vendor?: {
    name: string
  }
}

interface AddLicenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddLicenseDialog({ open, onOpenChange, onSuccess }: AddLicenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [software, setSoftware] = useState<Software[]>([])
  const [formData, setFormData] = useState({
    softwareId: '',
    licenseType: '',
    totalLicenses: '',
    usedLicenses: '0',
    costPerLicense: '',
    purchaseDate: '',
    expirationDate: '',
    renewalDate: '',
    isAutoRenewal: false,
    notes: ''
  })

  useEffect(() => {
    if (open) {
      fetchSoftware()
    }
  }, [open])

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
    
    if (!formData.softwareId || !formData.licenseType || !formData.totalLicenses) {
      toast.error('Please fill in all required fields (Software, License Type, Total Licenses)')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalLicenses: parseInt(formData.totalLicenses),
          usedLicenses: parseInt(formData.usedLicenses) || 0,
          costPerLicense: formData.costPerLicense ? parseFloat(formData.costPerLicense) : null
        })
      })

      if (response.ok) {
        toast.success('License added successfully')
        onSuccess()
        onOpenChange(false)
        resetForm()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add license')
      }
    } catch (error) {
      console.error('Error adding license:', error)
      toast.error('Failed to add license')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      softwareId: '',
      licenseType: '',
      totalLicenses: '',
      usedLicenses: '0',
      costPerLicense: '',
      purchaseDate: '',
      expirationDate: '',
      renewalDate: '',
      isAutoRenewal: false,
      notes: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New License</DialogTitle>
          <DialogDescription>
            Enter the license details for the software.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="licenseType">License Type *</Label>
              <Select
                value={formData.licenseType}
                onValueChange={(value) => setFormData({ ...formData, licenseType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERPETUAL">Perpetual</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  <SelectItem value="VOLUME">Volume License</SelectItem>
                  <SelectItem value="OEM">OEM</SelectItem>
                  <SelectItem value="OPEN_SOURCE">Open Source</SelectItem>
                  <SelectItem value="TRIAL">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalLicenses">Total Licenses *</Label>
              <Input
                id="totalLicenses"
                type="number"
                min="1"
                value={formData.totalLicenses}
                onChange={(e) => setFormData({ ...formData, totalLicenses: e.target.value })}
                placeholder="e.g., 100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usedLicenses">Used Licenses</Label>
              <Input
                id="usedLicenses"
                type="number"
                min="0"
                value={formData.usedLicenses}
                onChange={(e) => setFormData({ ...formData, usedLicenses: e.target.value })}
                placeholder="e.g., 50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerLicense">Cost per License (€)</Label>
              <Input
                id="costPerLicense"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPerLicense}
                onChange={(e) => setFormData({ ...formData, costPerLicense: e.target.value })}
                placeholder="e.g., 99.99"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewalDate">Renewal Date</Label>
              <Input
                id="renewalDate"
                type="date"
                value={formData.renewalDate}
                onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isAutoRenewal"
              checked={formData.isAutoRenewal}
              onCheckedChange={(checked) => setFormData({ ...formData, isAutoRenewal: checked })}
            />
            <Label htmlFor="isAutoRenewal">Auto-renewal enabled</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the license..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add License'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
