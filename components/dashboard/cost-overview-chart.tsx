
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useEffect, useState } from 'react'

interface CostData {
  month: string
  license: number
  maintenance: number
  support: number
}

export function CostOverviewChart() {
  const [data, setData] = useState<CostData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/costs')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching cost data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Cost Development</CardTitle>
        <CardDescription>
          Monthly software costs by category
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="h-[350px] flex items-center justify-center">
            <div>Loading data...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickLine={false}
                label={{ value: 'Costs (€)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
              />
              <Tooltip />
              <Legend 
                verticalAlign="top" 
                wrapperStyle={{ fontSize: 11 }}
              />
              <Line 
                type="monotone" 
                dataKey="license" 
                stroke="#60B5FF" 
                strokeWidth={2}
                name="Licenses"
              />
              <Line 
                type="monotone" 
                dataKey="maintenance" 
                stroke="#FF9149" 
                strokeWidth={2}
                name="Maintenance"
              />
              <Line 
                type="monotone" 
                dataKey="support" 
                stroke="#FF9898" 
                strokeWidth={2}
                name="Support"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
