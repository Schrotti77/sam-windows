
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export interface AuthUser {
  userId: string
  email: string
  name: string
  role: string
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token.value, process.env.NEXTAUTH_SECRET || 'fallback-secret') as AuthUser
    return decoded
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
