'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, AlertCircle, Info, CheckCircle, Bell, Download, RefreshCw, MoreHorizontal, Check, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

interface ComplianceAlert {
  id: string
  title: string
  description: string
  alertType: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  isResolved: boolean
  relatedEntity: string
  entityType: string
  createdAt: string
  resolvedAt: string | null
}

export default function AlertsPageClient() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlert | null>(null)

  const formatAlertType = (type: string) => {
    const types: Record<string, string> = {
      'LICENSE_EXPIRY': 'License Expiry',
      'OVER_USAGE': 'Over Usage',
      'COMPLIANCE_VIOLATION': 'Compliance Violation',
      'BUDGET_EXCEEDED': 'Budget Exceeded',
      'CONTRACT_RENEWAL': 'Contract Renewal',
      'SECURITY_ISSUE': 'Security Issue'
    }
    return types[type] || type
  }

  const formatSeverity = (severity: string) => {
    const severities: Record<string, string> = {
      'CRITICAL': 'Critical',
      'HIGH': 'High',
      'MEDIUM': 'Medium',
      'LOW': 'Low'
    }
    return severities[severity] || severity
  }

  const columns: ColumnDef<ComplianceAlert>[] = [
    {
      accessorKey: 'title',
      header: 'Alert',
      cell: ({ row }: any) => {
        const alert = row.original as ComplianceAlert
        return (
          <div>
            <p className="font-medium">{alert.title}</p>
            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
              {alert.description}
            </p>
          </div>
        )
      }
    },
    {
      accessorKey: 'severity',
      header: 'Priority',
      cell: ({ row }: any) => {
        const severity = row.getValue('severity') as string
        const colors: Record<string, string> = {
          'CRITICAL': 'bg-red-100 text-red-800 border-red-200',
          'HIGH': 'bg-orange-100 text-orange-800 border-orange-200',
          'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-200',
          'LOW': 'bg-blue-100 text-blue-800 border-blue-200'
        }
        return (
          <Badge variant="outline" className={colors[severity]}>
            {formatSeverity(severity)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'alertType',
      header: 'Type',
      cell: ({ row }: any) => formatAlertType(row.getValue('alertType'))
    },
    {
      accessorKey: 'isResolved',
      header: 'Status',
      cell: ({ row }: any) => {
        const isResolved = row.getValue('isResolved')
        return (
          <Badge variant={isResolved ? 'default' : 'secondary'} className={isResolved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {isResolved ? 'Resolved' : 'Open'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: any) => {
        const date = new Date(row.getValue('createdAt'))
        return date.toLocaleDateString('en-US')
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const alert = row.original as ComplianceAlert
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Actions menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleToggleResolved(alert)}>
                {alert.isResolved ? (
                  <><X className="mr-2 h-4 w-4" /> Mark as Open</>
                ) : (
                  <><Check className="mr-2 h-4 w-4" /> Mark as Resolved</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteClick(alert)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleResolved = async (alert: ComplianceAlert) => {
    try {
      const response = await fetch(`/api/alerts/${alert.id}/resolve`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        toast.success(alert.isResolved ? 'Alert reopened' : 'Alert resolved')
        fetchAlerts()
      } else {
        toast.error('Failed to update alert')
      }
    } catch (error) {
      console.error('Error updating alert:', error)
      toast.error('Failed to update alert')
    }
  }

  const handleDeleteClick = (alert: ComplianceAlert) => {
    setSelectedAlert(alert)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAlert) return

    try {
      const response = await fetch(`/api/alerts/${selectedAlert.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Alert deleted successfully')
        setDeleteDialogOpen(false)
        setSelectedAlert(null)
        fetchAlerts()
      } else {
        toast.error('Failed to delete alert')
      }
    } catch (error) {
      console.error('Error deleting alert:', error)
      toast.error('Failed to delete alert')
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const statusMatch = statusFilter === 'all' || 
                        (statusFilter === 'open' && !alert.isResolved) ||
                        (statusFilter === 'resolved' && alert.isResolved)
    
    const severityMatch = severityFilter === 'all' || alert.severity === severityFilter
    const typeMatch = typeFilter === 'all' || alert.alertType === typeFilter
    
    return statusMatch && severityMatch && typeMatch
  })

  const handleMarkAllAsRead = async () => {
    const unresolvedCount = alerts.filter(a => !a.isResolved).length
    if (unresolvedCount === 0) {
      toast.error('No open alerts to resolve')
      return
    }

    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH'
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`${data.count} alerts marked as resolved`)
        fetchAlerts()
      } else {
        toast.error('Failed to resolve alerts')
      }
    } catch (error) {
      console.error('Error resolving alerts:', error)
      toast.error('Failed to resolve alerts')
    }
  }

  const handleExport = () => {
    if (filteredAlerts.length === 0) {
      toast.error('No alerts to export')
      return
    }

    const csvContent = [
      ['Title', 'Description', 'Type', 'Priority', 'Status', 'Created', 'Resolved At'],
      ...filteredAlerts.map(alert => [
        `"${alert.title}"`,
        `"${alert.description}"`,
        formatAlertType(alert.alertType),
        formatSeverity(alert.severity),
        alert.isResolved ? 'Resolved' : 'Open',
        new Date(alert.createdAt).toLocaleDateString('en-US'),
        alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString('en-US') : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `compliance-alerts-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Alerts exported successfully')
  }

  // Statistics
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && !a.isResolved).length
  const highCount = alerts.filter(a => a.severity === 'HIGH' && !a.isResolved).length
  const mediumCount = alerts.filter(a => a.severity === 'MEDIUM' && !a.isResolved).length
  const resolvedCount = alerts.filter(a => a.isResolved).length
  const openCount = alerts.filter(a => !a.isResolved).length

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <AlertTriangle className="w-8 h-8 mr-3 text-yellow-500" />
            Compliance Alerts
          </h1>
          <p className="text-muted-foreground">
            Monitor critical license and compliance warnings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchAlerts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={handleMarkAllAsRead} disabled={openCount === 0}>
            <Bell className="w-4 h-4 mr-2" />
            Resolve All ({openCount})
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{highCount}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Info className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{mediumCount}</p>
                <p className="text-xs text-muted-foreground">Medium Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-xs text-muted-foreground">Open Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{resolvedCount}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label>Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label>Priority:</Label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label>Type:</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="LICENSE_EXPIRY">License Expiry</SelectItem>
                <SelectItem value="OVER_USAGE">Over Usage</SelectItem>
                <SelectItem value="COMPLIANCE_VIOLATION">Compliance Violation</SelectItem>
                <SelectItem value="BUDGET_EXCEEDED">Budget Exceeded</SelectItem>
                <SelectItem value="CONTRACT_RENEWAL">Contract Renewal</SelectItem>
                <SelectItem value="SECURITY_ISSUE">Security Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alert List</CardTitle>
            <CardDescription>
              {filteredAlerts.length} of {alerts.length} alerts shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={filteredAlerts}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Delete Alert
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this alert? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p><strong>Title:</strong> {selectedAlert.title}</p>
              <p><strong>Type:</strong> {formatAlertType(selectedAlert.alertType)}</p>
              <p><strong>Priority:</strong> {formatSeverity(selectedAlert.severity)}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Delete Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
