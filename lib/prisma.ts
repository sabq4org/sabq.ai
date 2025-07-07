import { PrismaClient } from '@/lib/generated/prisma'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

try {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({
      log: ['error'],
    })
  } else {
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
  prisma = new PrismaClient()
}

export default prisma
