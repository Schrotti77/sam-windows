'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Download, FileText, TrendingUp, RefreshCw, AlertTriangle, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import toast from 'react-hot-toast'

interface Software {
  id: string
  name: string
  category: string
  activeUsers?: number
}

interface License {
  id: string
  softwareId: string
  software: {
    name: string
  }
  licenseType: string
  totalLicenses: number
  usedLicenses: number
  availableLicenses: number
  complianceStatus: string
  expirationDate: string
}

interface Cost {
  id: string
  software: {
    name: string
  }
  costType: string
  amount: number
  billingPeriod: string
}

export default function ReportsPageClient() {
  const [loading, setLoading] = useState(true)
  const [softwareData, setSoftwareData] = useState<Software[]>([])
  const [licenseData, setLicenseData] = useState<License[]>([])
  const [costData, setCostData] = useState<any[]>([])
  const [costsRaw, setCostsRaw] = useState<Cost[]>([])
  const [complianceData, setComplianceData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState('6months')
  const [activeTab, setActiveTab] = useState('overview')

  // Calculate real statistics
  const totalSoftware = softwareData.length
  const totalLicenses = licenseData.reduce((sum, l) => sum + l.totalLicenses, 0)
  const usedLicenses = licenseData.reduce((sum, l) => sum + l.usedLicenses, 0)
  const licenseUtilization = totalLicenses > 0 ? Math.round((usedLicenses / totalLicenses) * 100) : 0
  
  const monthlyCosts = costsRaw
    .filter(c => c.billingPeriod === 'MONTHLY')
    .reduce((sum, c) => sum + c.amount, 0)
  
  const now = new Date()
  const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const expiringLicenses = licenseData.filter(l => {
    const expDate = new Date(l.expirationDate)
    return expDate <= threeMonthsFromNow && expDate >= now
  }).length

  const nonCompliantCount = licenseData.filter(l => l.complianceStatus === 'NON_COMPLIANT').length

  useEffect(() => {
    fetchReportData()
  }, [timeRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Fetch software data
      const softwareResponse = await fetch('/api/software')
      if (softwareResponse.ok) {
        const software = await softwareResponse.json()
        setSoftwareData(Array.isArray(software) ? software : [])
      }

      // Fetch license data
      const licenseResponse = await fetch('/api/licenses')
      if (licenseResponse.ok) {
        const licenses = await licenseResponse.json()
        setLicenseData(Array.isArray(licenses) ? licenses : [])
      }

      // Fetch costs data
      const costsResponse = await fetch('/api/costs')
      if (costsResponse.ok) {
        const costs = await costsResponse.json()
        setCostsRaw(Array.isArray(costs) ? costs : [])
      }

      // Fetch cost chart data
      const costChartResponse = await fetch('/api/dashboard/costs')
      if (costChartResponse.ok) {
        const costs = await costChartResponse.json()
        setCostData(costs.chartData || [])
      }

      // Fetch compliance data
      const complianceResponse = await fetch('/api/dashboard/compliance')
      if (complianceResponse.ok) {
        const compliance = await complianceResponse.json()
        setComplianceData(compliance.complianceStats || [])
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate category distribution from real data
  const getCategoryData = () => {
    const categories: Record<string, number> = {}
    softwareData.forEach(sw => {
      const cat = sw.category || 'Other'
      categories[cat] = (categories[cat] || 0) + 1
    })
    return Object.entries(categories).map(([name, value]) => ({ name, value }))
  }

  // Prepare license usage data
  const getLicenseUsageData = () => {
    return licenseData.slice(0, 8).map(l => ({
      name: l.software?.name || 'Unknown',
      total: l.totalLicenses,
      used: l.usedLicenses,
      available: l.availableLicenses
    }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c43']

  const handleExport = () => {
    try {
      let csvContent = ''
      
      if (activeTab === 'overview' || activeTab === 'licenses') {
        // Export license data
        csvContent = [
          ['Software', 'License Type', 'Total Licenses', 'Used', 'Available', 'Compliance Status', 'Expiration Date'],
          ...licenseData.map(l => [
            `"${l.software?.name || 'Unknown'}"`,
            l.licenseType,
            l.totalLicenses.toString(),
            l.usedLicenses.toString(),
            l.availableLicenses.toString(),
            l.complianceStatus,
            l.expirationDate ? new Date(l.expirationDate).toLocaleDateString('en-US') : 'N/A'
          ])
        ].map(row => row.join(',')).join('\n')
      } else if (activeTab === 'costs') {
        // Export cost data
        csvContent = [
          ['Software', 'Cost Type', 'Amount', 'Billing Period'],
          ...costsRaw.map(c => [
            `"${c.software?.name || 'Unknown'}"`,
            c.costType,
            c.amount.toString(),
            c.billingPeriod
          ])
        ].map(row => row.join(',')).join('\n')
      } else if (activeTab === 'compliance') {
        // Export compliance data
        csvContent = [
          ['Status', 'Count'],
          ...complianceData.map(c => [
            c.name,
            c.value.toString()
          ])
        ].map(row => row.join(',')).join('\n')
      }

      if (!csvContent) {
        toast.error('No data to export')
        return
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `report-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-purple-500" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Detailed insights into your software assets
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label>Time Period:</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="12months">12 Months</SelectItem>
                <SelectItem value="24months">24 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => fetchReportData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalSoftware}</p>
                    <p className="text-xs text-muted-foreground">Active Software</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{licenseUtilization}%</p>
                    <p className="text-xs text-muted-foreground">License Utilization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0
                      }).format(monthlyCosts)}
                    </p>
                    <p className="text-xs text-muted-foreground">Monthly Costs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{expiringLicenses}</p>
                    <p className="text-xs text-muted-foreground">Expiring Licenses (90 days)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Software Categories</CardTitle>
                <CardDescription>Distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {getCategoryData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getCategoryData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getCategoryData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No software data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Software by Usage</CardTitle>
                <CardDescription>Most actively used software</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {softwareData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={softwareData.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          interval={0}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="activeUsers" fill="#8884d8" name="Active Users" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No software data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0
                      }).format(costsRaw.reduce((sum, c) => sum + c.amount, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Costs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0
                      }).format(monthlyCosts)}
                    </p>
                    <p className="text-xs text-muted-foreground">Monthly Recurring</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0
                      }).format(costsRaw.filter(c => c.billingPeriod === 'ANNUALLY').reduce((sum, c) => sum + c.amount, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Annual Costs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Trend</CardTitle>
              <CardDescription>
                Development of software costs over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {costData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={costData}>
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
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No cost data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost by Type</CardTitle>
              <CardDescription>Breakdown of costs by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {costsRaw.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const byType: Record<string, number> = {}
                          costsRaw.forEach(c => {
                            byType[c.costType] = (byType[c.costType] || 0) + c.amount
                          })
                          return Object.entries(byType).map(([name, value]) => ({ name, value }))
                        })()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {costsRaw.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No cost data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalLicenses}</p>
                    <p className="text-xs text-muted-foreground">Total Licenses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{usedLicenses}</p>
                    <p className="text-xs text-muted-foreground">In Use</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalLicenses - usedLicenses}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{nonCompliantCount}</p>
                    <p className="text-xs text-muted-foreground">Non-Compliant</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>License Usage</CardTitle>
              <CardDescription>
                Overview of license utilization by software
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {getLicenseUsageData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getLicenseUsageData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#8884d8" name="Total" />
                      <Bar dataKey="used" fill="#82ca9d" name="Used" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No license data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {licenseData.filter(l => l.complianceStatus === 'COMPLIANT').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Compliant</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {licenseData.filter(l => l.complianceStatus === 'AT_RISK').length}
                    </p>
                    <p className="text-xs text-muted-foreground">At Risk</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{nonCompliantCount}</p>
                    <p className="text-xs text-muted-foreground">Non-Compliant</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>
                Distribution of compliance status across licenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {complianceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={complianceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {complianceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No compliance data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
