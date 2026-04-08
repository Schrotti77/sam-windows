
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Building, 
  DollarSign, 
  BarChart3, 
  AlertTriangle,
  Settings
} from 'lucide-react'

const sidebarNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Software Inventory',
    href: '/software',
    icon: Package
  },
  {
    title: 'License Management',
    href: '/licenses',
    icon: FileText
  },
  {
    title: 'Vendor Management',
    href: '/vendors',
    icon: Building
  },
  {
    title: 'Cost Monitoring',
    href: '/costs',
    icon: DollarSign
  },
  {
    title: 'Reports & Analytics',
    href: '/reports',
    icon: BarChart3
  },
  {
    title: 'Compliance Alerts',
    href: '/alerts',
    icon: AlertTriangle
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn('pb-12 min-h-screen', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-xl font-semibold tracking-tight">
              Software Asset Management
            </h2>
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-1">
                {sidebarNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Link>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}
