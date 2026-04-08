'use client'

import { useEffect, useState } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { CostOverviewChart } from '@/components/dashboard/cost-overview-chart'
import { LicenseComplianceChart } from '@/components/dashboard/license-compliance-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Calendar, TrendingUp, RefreshCw, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Alert {
  id: string
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  alertType: string
  isResolved: boolean
  createdAt: string
}

interface License {
  id: string
  software: {
    name: string
  }
  totalLicenses: number
  usedLicenses: number
  expirationDate: string
  complianceStatus: string
}

interface Software {
  id: string
  name: string
  category: string
}

export default function DashboardPageClient() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [licenses, setLicenses] = useState<License[]>([])
  const [software, setSoftware] = useState<Software[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch alerts
      const alertsRes = await fetch('/api/alerts')
      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts(Array.isArray(data) ? data.filter((a: Alert) => !a.isResolved).slice(0, 5) : [])
      }

      // Fetch licenses
      const licensesRes = await fetch('/api/licenses')
      if (licensesRes.ok) {
        const data = await licensesRes.json()
        setLicenses(Array.isArray(data) ? data : [])
      }

      // Fetch software
      const softwareRes = await fetch('/api/software')
      if (softwareRes.ok) {
        const data = await softwareRes.json()
        setSoftware(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate category distribution from real data
  const getCategoryDistribution = () => {
    if (software.length === 0) return []
    const categories: Record<string, number> = {}
    software.forEach(sw => {
      const cat = sw.category || 'OTHER'
      categories[cat] = (categories[cat] || 0) + 1
    })
    const total = software.length
    return Object.entries(categories).map(([name, count]) => ({
      name: formatCategory(name),
      count,
      percentage: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count).slice(0, 5)
  }

  const formatCategory = (cat: string) => {
    const mapping: Record<string, string> = {
      'DESKTOP': 'Desktop Software',
      'SAAS': 'SaaS Applications',
      'SERVER': 'Server Software',
      'MOBILE': 'Mobile Apps',
      'WEB': 'Web Applications',
      'CLOUD': 'Cloud Services',
      'OTHER': 'Other'
    }
    return mapping[cat] || cat
  }

  const getCategoryColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500']
    return colors[index % colors.length]
  }

  // Get expiring licenses (within 90 days)
  const getExpiringLicenses = () => {
    const now = new Date()
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    return licenses.filter(l => {
      const expDate = new Date(l.expirationDate)
      return expDate <= ninetyDaysFromNow && expDate >= now
    }).slice(0, 3)
  }

  // Get over-used licenses
  const getOverusedLicenses = () => {
    return licenses.filter(l => l.usedLicenses > l.totalLicenses).slice(0, 3)
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive">Critical</Badge>
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case 'MEDIUM':
        return <Badge variant="secondary">Medium</Badge>
      default:
        return <Badge variant="outline">Low</Badge>
    }
  }

  const categoryData = getCategoryDistribution()
  const expiringLicenses = getExpiringLicenses()
  const overusedLicenses = getOverusedLicenses()

  // Combine alerts with license warnings for "Upcoming Actions"
  const upcomingActions = [
    ...expiringLicenses.map(l => ({
      id: `exp-${l.id}`,
      type: 'expiry',
      title: `${l.software?.name || 'License'} Renewal`,
      description: `Expires on ${new Date(l.expirationDate).toLocaleDateString('en-US')}`,
      severity: 'CRITICAL' as const
    })),
    ...overusedLicenses.map(l => ({
      id: `over-${l.id}`,
      type: 'overuse',
      title: `${l.software?.name || 'License'} Over-utilized`,
      description: `${l.usedLicenses} of ${l.totalLicenses} licenses used`,
      severity: 'HIGH' as const
    })),
    ...alerts.slice(0, 3).map(a => ({
      id: a.id,
      type: 'alert',
      title: a.title,
      description: a.description,
      severity: a.severity
    }))
  ].slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your software assets and their management
          </p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <StatsCards />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <CostOverviewChart />
        <LicenseComplianceChart />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Upcoming Actions
            </CardTitle>
            <CardDescription>
              Important tasks and reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading...
              </div>
            ) : upcomingActions.length > 0 ? (
              <div className="space-y-3">
                {upcomingActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {action.type === 'expiry' ? (
                        <Calendar className="w-4 h-4 text-orange-500" />
                      ) : action.type === 'overuse' ? (
                        <TrendingUp className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    {getSeverityBadge(action.severity)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No pending actions
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => router.push('/alerts')}
            >
              View All Alerts
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Software Categories</CardTitle>
            <CardDescription>
              Distribution by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading...
              </div>
            ) : categoryData.length > 0 ? (
              <div className="space-y-4">
                {categoryData.map((cat, index) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${getCategoryColor(index)} rounded-full`}></div>
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <span className="text-sm font-medium">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No software data available
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => router.push('/software')}
            >
              View All Software
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
