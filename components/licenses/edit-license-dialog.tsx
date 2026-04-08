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

interface License {
  id: string
  softwareId: string
  software: {
    name: string
    version: string
  }
  licenseType: string
  totalLicenses: number
  usedLicenses: number
  availableLicenses: number
  costPerLicense: number | null
  purchaseDate: string | null
  expirationDate: string | null
  renewalDate: string | null
  isAutoRenewal: boolean
  complianceStatus: string
  notes: string | null
}

interface Software {
  id: string
  name: string
  version: string
}

interface EditLicenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  license: License | null
  onSuccess: () => void
}

export function EditLicenseDialog({ open, onOpenChange, license, onSuccess }: EditLicenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [software, setSoftware] = useState<Software[]>([])
  const [formData, setFormData] = useState({
    softwareId: '',
    licenseType: '',
    totalLicenses: '',
    usedLicenses: '',
    costPerLicense: '',
    purchaseDate: '',
    expirationDate: '',
    renewalDate: '',
    isAutoRenewal: false,
    complianceStatus: '',
    notes: ''
  })

  useEffect(() => {
    if (open) {
      fetchSoftware()
    }
  }, [open])

  useEffect(() => {
    if (license) {
      setFormData({
        softwareId: license.softwareId || '',
        licenseType: license.licenseType || '',
        totalLicenses: license.totalLicenses?.toString() || '',
        usedLicenses: license.usedLicenses?.toString() || '0',
        costPerLicense: license.costPerLicense?.toString() || '',
        purchaseDate: license.purchaseDate ? new Date(license.purchaseDate).toISOString().split('T')[0] : '',
        expirationDate: license.expirationDate ? new Date(license.expirationDate).toISOString().split('T')[0] : '',
        renewalDate: license.renewalDate ? new Date(license.renewalDate).toISOString().split('T')[0] : '',
        isAutoRenewal: license.isAutoRenewal || false,
        complianceStatus: license.complianceStatus || 'COMPLIANT',
        notes: license.notes || ''
      })
    }
  }, [license])

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
    
    if (!license) return

    if (!formData.softwareId || !formData.licenseType || !formData.totalLicenses) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/licenses/${license.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalLicenses: parseInt(formData.totalLicenses),
          usedLicenses: parseInt(formData.usedLicenses) || 0,
          costPerLicense: formData.costPerLicense ? parseFloat(formData.costPerLicense) : null
        })
      })

      if (response.ok) {
        toast.success('License updated successfully')
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update license')
      }
    } catch (error) {
      console.error('Error updating license:', error)
      toast.error('Failed to update license')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit License</DialogTitle>
          <DialogDescription>
            Update the license details for {license?.software?.name}.
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complianceStatus">Compliance Status</Label>
              <Select
                value={formData.complianceStatus}
                onValueChange={(value) => setFormData({ ...formData, complianceStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLIANT">Compliant</SelectItem>
                  <SelectItem value="NON_COMPLIANT">Non-compliant</SelectItem>
                  <SelectItem value="AT_RISK">At Risk</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown</SelectItem>
                </SelectContent>
              </Select>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
