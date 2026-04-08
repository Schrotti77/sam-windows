import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || ''

  // For SQLite: resolve relative paths to absolute based on CWD
  // This prevents path resolution issues in Next.js production server
  if (dbUrl.startsWith('file:')) {
    const filePath = dbUrl.replace('file:', '')
    if (!path.isAbsolute(filePath)) {
      // Resolve relative to CWD (project root), then into prisma/ directory
      const absolutePath = path.resolve(process.cwd(), 'prisma', filePath).replace(/\\/g, '/')
      const resolvedUrl = `file:${absolutePath}`
      console.log('[Prisma] Resolved SQLite path:', resolvedUrl)
      return new PrismaClient({
        datasources: {
          db: { url: resolvedUrl }
        }
      })
    }
    // Already absolute - pass through
    return new PrismaClient({
      datasources: {
        db: { url: dbUrl }
      }
    })
  }

  // PostgreSQL or other: use default
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Always cache - critical for SQLite which can't handle multiple connections
globalForPrisma.prisma = prisma
