import { PrismaClient } from './generated/prisma'
import { setupPrismaProtection } from './database-protection'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// إنشاء PrismaClient مع معالجة الأخطاء
function createPrismaClient() {
  try {
    // في بيئة البناء، قد لا يكون DATABASE_URL موجوداً
    if (!process.env.DATABASE_URL) {
      console.warn('[Prisma] DATABASE_URL not found - using fallback mode');
      // إرجاع null بدلاً من client فارغ
      return null;
    }
    
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // تفعيل حماية قاعدة البيانات
    if (process.env.ENABLE_DB_PROTECTION === 'true') {
      setupPrismaProtection(client);
      console.log('🔒 تم تفعيل حماية قاعدة البيانات');
    }

    return client;
  } catch (error) {
    console.error('[Prisma] Failed to create client:', error);
    return null;
  }
}

const prismaClient = globalForPrisma.prisma ?? createPrismaClient();

let prisma: PrismaClient;

if (!prismaClient) {
  console.error('[Prisma] Failed to initialize Prisma Client');
  // إنشاء كائن وهمي لتجنب أخطاء البناء
  prisma = new Proxy({} as PrismaClient, {
    get: () => {
      throw new Error('Prisma Client is not initialized. Please check your DATABASE_URL.');
    }
  });
} else {
  prisma = prismaClient;
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient;
  }
}

export { prisma };
export default prisma; 