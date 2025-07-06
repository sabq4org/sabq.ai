import { Redis } from '@upstash/redis'

// إنشاء عميل Redis/Upstash
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// مدة التخزين المؤقت الافتراضية (بالثواني)
const DEFAULT_TTL = {
  ARTICLES_LIST: 300,      // 5 دقائق
  ARTICLE_DETAIL: 600,     // 10 دقائق
  CATEGORIES: 3600,        // ساعة واحدة
  USER_DATA: 300,          // 5 دقائق
  ANALYTICS: 900,          // 15 دقيقة
  TRENDING: 300,           // 5 دقائق
  SEARCH_RESULTS: 180,     // 3 دقائق
};

// دالة مساعدة لإنشاء مفتاح التخزين المؤقت
export function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `sabq:${prefix}:${parts.join(':')}`;
}

// دالة للحصول على البيانات من التخزين المؤقت
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const data = await redis.get(key);
    return data as T;
  } catch (error) {
    console.error('[Cache] Error getting from cache:', error);
    return null;
  }
}

// دالة لحفظ البيانات في التخزين المؤقت
export async function setInCache<T>(
  key: string, 
  data: T, 
  ttl?: number
): Promise<void> {
  if (!redis) return;
  
  try {
    if (ttl) {
      await redis.setex(key, ttl, JSON.stringify(data));
    } else {
      await redis.set(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error('[Cache] Error setting in cache:', error);
  }
}

// دالة لحذف البيانات من التخزين المؤقت
export async function deleteFromCache(key: string | string[]): Promise<void> {
  if (!redis) return;
  
  try {
    if (Array.isArray(key)) {
      await Promise.all(key.map(k => redis.del(k)));
    } else {
      await redis.del(key);
    }
  } catch (error) {
    console.error('[Cache] Error deleting from cache:', error);
  }
}

// دالة لحذف جميع المفاتيح بنمط معين
export async function invalidateCachePattern(pattern: string): Promise<void> {
  if (!redis) return;
  
  try {
    // في Upstash، نحتاج لاستخدام scan للبحث عن المفاتيح
    let cursor = 0;
    const keys: string[] = [];
    
    do {
      const result = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== 0);
    
    if (keys.length > 0) {
      await deleteFromCache(keys);
    }
  } catch (error) {
    console.error('[Cache] Error invalidating cache pattern:', error);
  }
}

// Decorator للتخزين المؤقت للدوال
export function cached(ttl: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = getCacheKey(propertyKey, ...args.map(arg => JSON.stringify(arg)));
      
      // محاولة الحصول على البيانات من التخزين المؤقت
      const cachedData = await getFromCache(cacheKey);
      if (cachedData !== null) {
        return cachedData;
      }
      
      // تنفيذ الدالة الأصلية
      const result = await originalMethod.apply(this, args);
      
      // حفظ النتيجة في التخزين المؤقت
      await setInCache(cacheKey, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}

// دوال مساعدة للتخزين المؤقت حسب النوع
export const cache = {
  // مقالات
  articles: {
    list: (params: any) => getCacheKey('articles:list', JSON.stringify(params)),
    detail: (id: string) => getCacheKey('articles:detail', id),
    byCategory: (categoryId: string, page: number) => getCacheKey('articles:category', categoryId, page),
    trending: () => getCacheKey('articles:trending'),
    invalidate: () => invalidateCachePattern('sabq:articles:*'),
  },
  
  // تصنيفات
  categories: {
    all: () => getCacheKey('categories:all'),
    bySlug: (slug: string) => getCacheKey('categories:slug', slug),
    invalidate: () => invalidateCachePattern('sabq:categories:*'),
  },
  
  // مستخدمون
  users: {
    profile: (id: string) => getCacheKey('users:profile', id),
    preferences: (id: string) => getCacheKey('users:preferences', id),
    invalidate: (id: string) => invalidateCachePattern(`sabq:users:*:${id}`),
  },
  
  // تحليلات
  analytics: {
    dashboard: () => getCacheKey('analytics:dashboard'),
    articleStats: (id: string) => getCacheKey('analytics:article', id),
    invalidate: () => invalidateCachePattern('sabq:analytics:*'),
  },
};

// تصدير TTL values
export { DEFAULT_TTL };

// تحقق من توفر Redis
export const isCacheAvailable = () => !!redis; 