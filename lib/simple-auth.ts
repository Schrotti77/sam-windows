
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

export async function requireApiAuth(): Promise<NextResponse | null> {
  // SAM is normally deployed as an internal Windows/LAN tool without a login flow.
  // Keep API auth opt-in for future hardened deployments, but do not block writes by default.
  if (process.env.SAM_REQUIRE_AUTH !== 'true') {
    return null
  }

  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
