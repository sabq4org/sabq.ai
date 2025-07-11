import { NextRequest } from 'next/server';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

interface RateLimitData {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockedUntil?: number;
}

class RateLimiter {
  private store: Map<string, RateLimitData> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // تنظيف البيانات القديمة كل 5 دقائق
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.resetTime < now && (!data.blocked || (data.blockedUntil && data.blockedUntil < now))) {
        this.store.delete(key);
      }
    }
  }

  private getClientIdentifier(req: NextRequest): string {
    // الحصول على IP من headers مختلفة
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    let ip = forwarded?.split(',')[0].trim() || realIp || cfConnectingIp || 'unknown';
    
    // إضافة User-Agent للتمييز بين الطلبات
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const userAgentHash = this.simpleHash(userAgent);
    
    return `${ip}:${userAgentHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async check(
    req: NextRequest,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const key = options.keyGenerator ? options.keyGenerator(req) : this.getClientIdentifier(req);
    const now = Date.now();
    
    let data = this.store.get(key);
    
    // إذا لم توجد بيانات أو انتهت المدة، أنشئ بيانات جديدة
    if (!data || data.resetTime <= now) {
      data = {
        count: 0,
        resetTime: now + options.windowMs,
        blocked: false,
      };
      this.store.set(key, data);
    }

    // تحقق من الحظر
    if (data.blocked && data.blockedUntil && data.blockedUntil > now) {
      return {
        success: false,
        limit: options.maxRequests,
        remaining: 0,
        reset: new Date(data.resetTime),
        retryAfter: Math.ceil((data.blockedUntil - now) / 1000),
      };
    }

    // إذا انتهى الحظر، أعد تعيين البيانات
    if (data.blocked && data.blockedUntil && data.blockedUntil <= now) {
      data.blocked = false;
      data.blockedUntil = undefined;
      data.count = 0;
      data.resetTime = now + options.windowMs;
    }

    // زيادة العداد
    data.count++;

    // تحقق من تجاوز الحد
    if (data.count > options.maxRequests) {
      // حظر لمدة ضعف النافذة الزمنية
      data.blocked = true;
      data.blockedUntil = now + (options.windowMs * 2);
      
      return {
        success: false,
        limit: options.maxRequests,
        remaining: 0,
        reset: new Date(data.resetTime),
        retryAfter: Math.ceil((data.blockedUntil - now) / 1000),
      };
    }

    return {
      success: true,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - data.count),
      reset: new Date(data.resetTime),
    };
  }

  // حظر مفتاح معين لمدة محددة
  async block(key: string, durationMs: number): Promise<void> {
    const now = Date.now();
    const data = this.store.get(key) || {
      count: 0,
      resetTime: now + durationMs,
      blocked: false,
    };

    data.blocked = true;
    data.blockedUntil = now + durationMs;
    this.store.set(key, data);
  }

  // إلغاء حظر مفتاح معين
  async unblock(key: string): Promise<void> {
    const data = this.store.get(key);
    if (data) {
      data.blocked = false;
      data.blockedUntil = undefined;
      this.store.set(key, data);
    }
  }

  // الحصول على حالة مفتاح معين
  async getStatus(key: string): Promise<RateLimitData | null> {
    return this.store.get(key) || null;
  }

  // مسح جميع البيانات
  async clear(): Promise<void> {
    this.store.clear();
  }

  // تدمير المؤقت
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// إنشاء مثيل واحد للتطبيق
const rateLimiter = new RateLimiter();

// تكوينات مختلفة لـ endpoints مختلفة
export const rateLimitConfigs = {
  // تسجيل الدخول: 5 محاولات كل 15 دقيقة
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول',
  },

  // التسجيل: 3 محاولات كل ساعة
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'تم تجاوز الحد الأقصى لمحاولات التسجيل',
  },

  // إعادة تعيين كلمة المرور: 3 محاولات كل ساعة
  forgotPassword: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'تم تجاوز الحد الأقصى لطلبات إعادة تعيين كلمة المرور',
  },

  // التحقق من البريد الإلكتروني: 10 محاولات كل ساعة
  verifyEmail: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'تم تجاوز الحد الأقصى لمحاولات التحقق من البريد الإلكتروني',
  },

  // تحديث الملف الشخصي: 20 محاولة كل ساعة
  updateProfile: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'تم تجاوز الحد الأقصى لمحاولات تحديث الملف الشخصي',
  },

  // تغيير كلمة المرور: 5 محاولات كل ساعة
  changePassword: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'تم تجاوز الحد الأقصى لمحاولات تغيير كلمة المرور',
  },

  // عام: 100 طلب كل 15 دقيقة
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'تم تجاوز الحد الأقصى للطلبات',
  },

  // APIs حساسة: 10 طلبات كل دقيقة
  sensitive: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'تم تجاوز الحد الأقصى للطلبات الحساسة',
  },
};

// دالة مساعدة لإنشاء middleware
export function createRateLimitMiddleware(config: RateLimitOptions) {
  return async (req: NextRequest) => {
    return await rateLimiter.check(req, config);
  };
}

// دالة للتحقق من Rate Limit مع تسجيل الأحداث
export async function checkRateLimit(
  req: NextRequest,
  type: keyof typeof rateLimitConfigs,
  customConfig?: Partial<RateLimitOptions>
): Promise<RateLimitResult> {
  const config = { ...rateLimitConfigs[type], ...customConfig };
  const result = await rateLimiter.check(req, config);

  // تسجيل محاولة تجاوز الحد
  if (!result.success) {
    console.warn(`Rate limit exceeded for ${type}:`, {
      ip: rateLimiter['getClientIdentifier'](req),
      limit: result.limit,
      retryAfter: result.retryAfter,
      timestamp: new Date().toISOString(),
    });
  }

  return result;
}

// دالة لحظر IP معين
export async function blockIP(ip: string, durationMs: number): Promise<void> {
  await rateLimiter.block(ip, durationMs);
}

// دالة لإلغاء حظر IP
export async function unblockIP(ip: string): Promise<void> {
  await rateLimiter.unblock(ip);
}

// دالة للحصول على حالة IP
export async function getIPStatus(ip: string): Promise<RateLimitData | null> {
  return await rateLimiter.getStatus(ip);
}

// Rate Limiter للاستخدام المباشر
export { rateLimiter };

// تنظيف الموارد عند إغلاق التطبيق
process.on('SIGINT', () => {
  rateLimiter.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  rateLimiter.destroy();
  process.exit(0);
});

export default rateLimiter; 