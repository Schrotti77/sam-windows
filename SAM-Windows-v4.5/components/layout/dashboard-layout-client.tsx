
'use client'

import { BasicHeader } from '@/components/layout/basic-header'
import { Sidebar } from '@/components/layout/sidebar'

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden border-r bg-muted/40 md:block w-64">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1">
        <BasicHeader />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
