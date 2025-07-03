import { PrismaClient } from './generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// إنشاء PrismaClient مع معالجة الأخطاء
function createPrismaClient() {
  try {
    // في بيئة البناء، قد لا يكون DATABASE_URL موجوداً
    if (!process.env.DATABASE_URL) {
      console.warn('[Prisma] DATABASE_URL not found - using fallback mode');
    }
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('[Prisma] Failed to create client:', error);
    // في حالة الفشل، نعيد كائن بسيط لتجنب فشل البناء
    return new PrismaClient({});
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma 