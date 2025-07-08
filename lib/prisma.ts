import { PrismaClient } from '@/lib/generated/prisma'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

// Special handling for Vercel and other serverless environments
if (typeof window === 'undefined') {
  try {
    if (process.env.NODE_ENV === 'production') {
      // In production (Vercel), create a new instance each time
      prisma = new PrismaClient({
        log: ['error'],
      })
    } else {
      // In development, use global instance
      if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient({
          log: ['query', 'error', 'warn'],
        })
      }
      prisma = globalForPrisma.prisma
    }
  } catch (error) {
    console.error('Failed to initialize Prisma Client:', error)
    // Fallback: create a new instance
    prisma = new PrismaClient({
      log: ['error'],
    })
  }
} else {
  // Client-side fallback (should not happen in API routes)
  prisma = new PrismaClient()
}

export default prisma
