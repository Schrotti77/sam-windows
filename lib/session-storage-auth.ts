
'use client'

export interface AuthUser {
  userId: string
  email: string
  name: string
  role: string
  token: string
}

const AUTH_KEY = 'sam_auth_user'

export function saveAuth(user: AuthUser): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(user))
    // Set cookie without 'secure' flag for HTTP deployments on Windows Server
    document.cookie = `auth-token=${user.token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`
  } catch (error) {
    console.error('Failed to save auth:', error)
  }
}

export function getAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem(AUTH_KEY)
    if (stored) {
      const user = JSON.parse(stored)
      // Verify token is still in cookie
      const cookieToken = getCookieValue('auth-token')
      if (cookieToken && cookieToken === user.token) {
        return user
      }
    }
    return null
  } catch (error) {
    console.error('Failed to get auth:', error)
    return null
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(AUTH_KEY)
    document.cookie = 'auth-token=; path=/; max-age=0'
  } catch (error) {
    console.error('Failed to clear auth:', error)
  }
}

export function isAuthenticated(): boolean {
  return getAuth() !== null
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  const cookie = cookies.find(c => c.trim().startsWith(`${name}=`))
  return cookie ? cookie.split('=')[1] : null
}
