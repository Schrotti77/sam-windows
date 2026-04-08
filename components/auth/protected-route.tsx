
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/session-storage-auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authed = isAuthenticated()
      console.log('Client-side auth check:', authed)
      
      if (!authed) {
        console.log('Not authenticated, redirecting to login')
        router.push('/login')
      } else {
        setIsAuthed(true)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthed) {
    return null
  }

  return <>{children}</>
}
