
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, FileText, Building, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StatsData {
  totalSoftware: number
  totalLicenses: number
  totalVendors: number
  totalCosts: number
  complianceRate: number
  alertCount: number
}

export function StatsCards() {
  const [stats, setStats] = useState<StatsData>({
    totalSoftware: 0,
    totalLicenses: 0,
    totalVendors: 0,
    totalCosts: 0,
    complianceRate: 0,
    alertCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const cards = [
    {
      title: 'Software Assets',
      value: stats.totalSoftware || 0,
      description: 'Managed software solutions',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Active Licenses',
      value: stats.totalLicenses || 0,
      description: 'Valid software licenses',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      title: 'Vendor Partners',
      value: stats.totalVendors || 0,
      description: 'Software Providers',
      icon: Building,
      color: 'text-purple-600'
    },
    {
      title: 'Total Costs',
      value: `€${(stats.totalCosts || 0).toLocaleString('en-US')}`,
      description: 'Software Expenses (Monthly)',
      icon: DollarSign,
      color: 'text-orange-600'
    },
    {
      title: 'Compliance Rate',
      value: `${stats.complianceRate || 0}%`,
      description: 'License Compliance',
      icon: TrendingUp,
      color: 'text-emerald-600'
    },
    {
      title: 'Open Alerts',
      value: stats.alertCount || 0,
      description: 'Action Required',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : card.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
