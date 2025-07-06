import { PrismaClient } from '@prisma/client'
import { setupPrismaProtection } from './database-protection'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// إنشاء PrismaClient مع معالجة الأخطاء
function createPrismaClient() {
  try {
    console.log('[Prisma] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('[Prisma] DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    
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

    console.log('[Prisma] Client created successfully');
    return client;
  } catch (error) {
    console.error('[Prisma] Failed to create client:', error);
    return null;
  }
}

const prismaClient = globalForPrisma.prisma ?? createPrismaClient();

let prismaInstance: PrismaClient & {
  article?: any;
  category?: any;
  user?: any;
  comment?: any;
};

if (!prismaClient) {
  console.error('[Prisma] Failed to initialize Prisma Client');
  // إنشاء كائن وهمي لتجنب أخطاء البناء
  prismaInstance = new Proxy({} as any, {
    get: () => {
      throw new Error('Prisma Client is not initialized. Please check your DATABASE_URL.');
    }
  });
} else {
  console.log('[Prisma] Using existing or new client');
  prismaInstance = prismaClient as any;
  
  // إضافة تحويل أسماء النماذج من المفرد إلى الجمع
  if (!prismaInstance.article) {
    Object.defineProperty(prismaInstance, 'article', {
      get() { return prismaInstance.articles; }
    });
  }
  
  if (!prismaInstance.category) {
    Object.defineProperty(prismaInstance, 'category', {
      get() { return prismaInstance.categories; }
    });
  }
  
  if (!prismaInstance.user) {
    Object.defineProperty(prismaInstance, 'user', {
      get() { return prismaInstance.users; }
    });
  }
  
  if (!prismaInstance.comment) {
    Object.defineProperty(prismaInstance, 'comment', {
      get() { return prismaInstance.comments; }
    });
  }
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient;
  }
}

export const prisma = prismaInstance;
export default prismaInstance; 