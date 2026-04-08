'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Settings, User, Bell, Shield, Database, Save, Download, Upload, FileJson, CheckCircle, AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'

export default function SettingsPageClient() {
  // User profile state
  const [firstName, setFirstName] = useState('Admin')
  const [lastName, setLastName] = useState('User')
  const [email, setEmail] = useState('admin@company.com')

  // Notification settings state
  const [licenseExpiry, setLicenseExpiry] = useState(true)
  const [complianceAlerts, setComplianceAlerts] = useState(true)
  const [budgetOverruns, setBudgetOverruns] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(false)

  // Security state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // System settings state
  const [currency, setCurrency] = useState('EUR')
  const [timezone, setTimezone] = useState('Europe/Berlin')
  const [autoBackup, setAutoBackup] = useState(true)
  const [dataRetention, setDataRetention] = useState('24')

  const handleSaveProfile = () => {
    if (!firstName || !lastName || !email) {
      toast.error('Please fill in all profile fields')
      return
    }
    toast.success('Profile saved successfully')
  }

  const handleSaveNotifications = () => {
    toast.success('Notification settings saved')
  }

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    toast.success('Password changed successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSaveSystemSettings = () => {
    toast.success('System settings saved')
  }

  // Export/Import state
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/export')
      if (!response.ok) throw new Error('Export failed')
      const data = await response.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sam-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success(`Export successful! ${data.counts.vendors} vendors, ${data.counts.software} software, ${data.counts.licenses} licenses, ${data.counts.costs} costs exported.`)
    } catch (error) {
      toast.error('Export failed')
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResults(null)
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data?.data || !data?.version) {
        toast.error('Invalid file format. Please select a SAM export file.')
        return
      }

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      setImportResults(result.results)
      toast.success('Import completed successfully!')
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON file')
      } else {
        toast.error(error instanceof Error ? error.message : 'Import failed')
      }
      console.error('Import error:', error)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Settings className="w-8 h-8 mr-3" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage system configuration and user settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              User Profile
            </CardTitle>
            <CardDescription>
              Personal information and credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">IT Administrator</Badge>
                <span className="text-sm text-muted-foreground">Full Access</span>
              </div>
            </div>
            <Button onClick={handleSaveProfile}>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure alerts and reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>License Expiration Warnings</Label>
                <p className="text-sm text-muted-foreground">
                  Notification 30 days before license expiration
                </p>
              </div>
              <Switch 
                checked={licenseExpiry} 
                onCheckedChange={setLicenseExpiry}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compliance Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Warnings for license violations
                </p>
              </div>
              <Switch 
                checked={complianceAlerts} 
                onCheckedChange={setComplianceAlerts}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Budget Overruns</Label>
                <p className="text-sm text-muted-foreground">
                  Notification for cost overruns
                </p>
              </div>
              <Switch 
                checked={budgetOverruns} 
                onCheckedChange={setBudgetOverruns}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Automatic reports via email
                </p>
              </div>
              <Switch 
                checked={weeklyReports} 
                onCheckedChange={setWeeklyReports}
              />
            </div>
            <Button onClick={handleSaveNotifications}>
              <Save className="w-4 h-4 mr-2" />
              Save Notifications
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Password and security options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Change Password</Label>
              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="Current Password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input 
                  type="password" 
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input 
                  type="password" 
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangePassword} className="mt-2">
                Change Password
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Additional security for your account
                </p>
              </div>
              <Switch 
                checked={twoFactorEnabled} 
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              System Settings
            </CardTitle>
            <CardDescription>
              General system configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                    <SelectItem value="CHF">Swiss Franc (CHF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="America/New_York">America/New York</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los Angeles</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoBackup">Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">Daily at 2:00 AM</p>
              </div>
              <Switch 
                id="autoBackup" 
                checked={autoBackup} 
                onCheckedChange={setAutoBackup}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataRetention">Data Retention</Label>
              <Select value={dataRetention} onValueChange={setDataRetention}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 Months</SelectItem>
                  <SelectItem value="24">24 Months</SelectItem>
                  <SelectItem value="36">36 Months</SelectItem>
                  <SelectItem value="60">5 Years</SelectItem>
                  <SelectItem value="120">10 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveSystemSettings}>
              <Save className="w-4 h-4 mr-2" />
              Save System Settings
            </Button>
          </CardContent>
        </Card>

        {/* Data Export/Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileJson className="w-5 h-5 mr-2" />
              Data Export &amp; Import
            </CardTitle>
            <CardDescription>
              Transfer data between SAM installations (cloud ↔ local)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold">Export All Data</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Download all vendors, software, licenses, costs, alerts, and contracts as a JSON file.
                </p>
              </div>
              <Button onClick={handleExport} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>

            <Separator />

            {/* Import */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold">Import Data</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Import data from a SAM export file. Existing records will be updated, new records will be created.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importing ? 'Importing...' : 'Select Import File'}
                </Button>
              </div>
            </div>

            {/* Import Results */}
            {importResults && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Import Results</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(importResults).map(([key, val]: [string, any]) => (
                      <div key={key} className="border rounded-lg p-3 space-y-1">
                        <p className="text-sm font-medium capitalize">{key}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          <span>{val.imported} imported</span>
                        </div>
                        {val.skipped > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>↷ {val.skipped} skipped</span>
                          </div>
                        )}
                        {val.errors > 0 && (
                          <div className="flex items-center gap-2 text-sm text-red-500">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{val.errors} errors</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
