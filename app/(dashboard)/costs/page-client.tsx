'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Calendar, Download, Plus, RefreshCw, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AddCostDialog } from '@/components/costs/add-cost-dialog'
import { EditCostDialog } from '@/components/costs/edit-cost-dialog'
import { DeleteCostDialog } from '@/components/costs/delete-cost-dialog'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

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

export default function CostsPageClient() {
  const [costs, setCosts] = useState<SoftwareCost[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCost, setSelectedCost] = useState<SoftwareCost | null>(null)

  const formatCostType = (type: string) => {
    const types: Record<string, string> = {
      'LICENSE': 'License',
      'MAINTENANCE': 'Maintenance',
      'SUPPORT': 'Support',
      'TRAINING': 'Training',
      'IMPLEMENTATION': 'Implementation',
      'OTHER': 'Other'
    }
    return types[type] || type
  }

  const formatBillingPeriod = (period: string) => {
    const periods: Record<string, string> = {
      'MONTHLY': 'Monthly',
      'QUARTERLY': 'Quarterly',
      'ANNUALLY': 'Annually',
      'ONE_TIME': 'One-time'
    }
    return periods[period] || period
  }

  const columns: ColumnDef<SoftwareCost>[] = [
    {
      accessorKey: 'software.name',
      header: 'Software',
      cell: ({ row }: any) => {
        return <span className="font-medium">{row.original.software?.name || 'Unknown'}</span>
      }
    },
    {
      accessorKey: 'costType',
      header: 'Type',
      cell: ({ row }: any) => {
        const type = row.getValue('costType')
        const colors: Record<string, string> = {
          'LICENSE': 'bg-blue-100 text-blue-800',
          'MAINTENANCE': 'bg-green-100 text-green-800',
          'SUPPORT': 'bg-yellow-100 text-yellow-800',
          'TRAINING': 'bg-purple-100 text-purple-800',
          'IMPLEMENTATION': 'bg-orange-100 text-orange-800',
          'OTHER': 'bg-gray-100 text-gray-800'
        }
        return (
          <Badge variant="outline" className={colors[type as string] || 'bg-gray-100'}>
            {formatCostType(type as string)}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: any) => {
        const amount = row.getValue('amount')
        const currency = row.original.currency
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'EUR',
        }).format(amount as number)
      },
    },
    {
      accessorKey: 'billingPeriod',
      header: 'Billing Period',
      cell: ({ row }: any) => formatBillingPeriod(row.getValue('billingPeriod'))
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }: any) => row.getValue('department') || '-'
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }: any) => {
        const desc = row.getValue('description')
        return desc ? (
          <span className="truncate max-w-[200px] block" title={desc as string}>
            {desc as string}
          </span>
        ) : '-'
      }
    },
    {
      accessorKey: 'costDate',
      header: 'Date',
      cell: ({ row }: any) => {
        const date = new Date(row.getValue('costDate'))
        return date.toLocaleDateString('en-US')
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const cost = row.original as SoftwareCost
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Actions menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(cost)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete(cost)}
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
    fetchCosts()
    fetchChartData()
  }, [])

  const fetchCosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/costs')
      if (response.ok) {
        const data = await response.json()
        setCosts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching costs:', error)
      toast.error('Failed to load cost data')
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/dashboard/costs')
      if (response.ok) {
        const data = await response.json()
        setChartData(data.chartData || [])
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  const handleEdit = (cost: SoftwareCost) => {
    setSelectedCost(cost)
    setEditDialogOpen(true)
  }

  const handleDelete = (cost: SoftwareCost) => {
    setSelectedCost(cost)
    setDeleteDialogOpen(true)
  }

  const handleRefresh = () => {
    fetchCosts()
    fetchChartData()
  }

  const filteredCosts = costs.filter(cost => {
    const departmentMatch = departmentFilter === 'all' || cost.department === departmentFilter
    const periodMatch = periodFilter === 'all' || cost.billingPeriod === periodFilter
    const typeMatch = typeFilter === 'all' || cost.costType === typeFilter
    return departmentMatch && periodMatch && typeMatch
  })

  const totalCosts = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0)
  const monthlyCosts = filteredCosts.filter(cost => cost.billingPeriod === 'MONTHLY')
  const annuallyCosts = filteredCosts.filter(cost => cost.billingPeriod === 'ANNUALLY')
  const avgCostPerEntry = costs.length > 0 ? totalCosts / filteredCosts.length : 0

  const handleExport = () => {
    if (filteredCosts.length === 0) {
      toast.error('No cost entries to export')
      return
    }

    const csvContent = [
      ['Software', 'Cost Type', 'Amount', 'Currency', 'Billing Period', 'Department', 'Category', 'Description', 'Date'],
      ...filteredCosts.map(cost => [
        `"${cost.software?.name || 'Unknown'}"`,
        cost.costType,
        cost.amount.toString(),
        cost.currency || 'EUR',
        cost.billingPeriod,
        cost.department || '',
        cost.category || '',
        `"${cost.description || ''}"`,
        new Date(cost.costDate).toLocaleDateString('en-US')
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `software-costs-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Cost data exported successfully')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <DollarSign className="w-8 h-8 mr-3 text-green-500" />
            Cost Monitoring
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze your software costs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Cost
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(totalCosts)}
                </p>
                <p className="text-xs text-muted-foreground">Total Costs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(monthlyCosts.reduce((sum, cost) => sum + cost.amount, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Monthly Costs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(annuallyCosts.reduce((sum, cost) => sum + cost.amount, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Annual Costs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(avgCostPerEntry || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Avg. Cost per Entry</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Development</CardTitle>
          <CardDescription>
            Software costs over time by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="license" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Licenses"
                />
                <Line 
                  type="monotone" 
                  dataKey="maintenance" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Maintenance"
                />
                <Line 
                  type="monotone" 
                  dataKey="support" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  name="Support"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label>Cost Type:</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="LICENSE">License</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
                <SelectItem value="TRAINING">Training</SelectItem>
                <SelectItem value="IMPLEMENTATION">Implementation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label>Department:</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
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

          <div className="flex items-center space-x-2">
            <Label>Billing Period:</Label>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="ANNUALLY">Annually</SelectItem>
                <SelectItem value="ONE_TIME">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cost Details</CardTitle>
            <CardDescription>
              {filteredCosts.length} of {costs.length} cost entries shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={filteredCosts}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddCostDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleRefresh}
      />

      <EditCostDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        cost={selectedCost}
        onSuccess={handleRefresh}
      />

      <DeleteCostDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        cost={selectedCost}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
