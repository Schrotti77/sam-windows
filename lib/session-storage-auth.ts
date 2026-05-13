
'use client'

export interface AuthUser {
  userId: string
  email: string
  name: string
  role: string
}

const AUTH_KEY = 'sam_auth_user'

export function saveAuth(user: AuthUser): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(user))
  } catch (error) {
    console.error('Failed to save auth:', error)
  }
}

export function getAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem(AUTH_KEY)
    if (stored) {
      return JSON.parse(stored)
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
