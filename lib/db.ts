import { PrismaClient } from '@prisma/client'
import * as path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || ''

  // For SQLite: resolve relative paths to the app root (CWD), not prisma/.
  // Production installs keep the database at C:\SAM\data\sam.db. If an older
  // .env contains DATABASE_URL="file:./data/sam.db", resolving via prisma/
  // silently writes to C:\SAM\prisma\data\sam.db instead of the live DB.
  if (dbUrl.startsWith('file:')) {
    const filePath = dbUrl.replace('file:', '')
    const isWindowsAbsolute = /^[A-Za-z]:[\\/]/.test(filePath)
    const resolvedUrl = (path.isAbsolute(filePath) || isWindowsAbsolute)
      ? dbUrl
      : `file:${path.resolve(process.cwd(), filePath).replace(/\\/g, '/')}`

    console.log('[Prisma] SQLite path:', resolvedUrl)
    return new PrismaClient({
      datasources: {
        db: { url: resolvedUrl }
      }
    })
  }

  // PostgreSQL or other: use default
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Always cache - critical for SQLite which can't handle multiple connections
globalForPrisma.prisma = prisma
