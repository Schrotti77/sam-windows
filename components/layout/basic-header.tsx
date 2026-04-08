
'use client'

import { useEffect, useState } from 'react'
import { ModeToggle } from '@/components/ui/mode-toggle'

export function BasicHeader() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-end">
        {mounted && <ModeToggle />}
      </div>
    </header>
  )
}
