
'use client'

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='))
  
  if (!authCookie) return null
  
  return authCookie.split('=')[1]
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}

export function logout() {
  // Clear the auth cookie
  document.cookie = 'auth-token=; Max-Age=0; path=/'
  window.location.href = '/login'
}
