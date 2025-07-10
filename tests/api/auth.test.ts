/**
 * اختبارات API المصادقة - Sabq AI CMS
 * 
 * تاريخ الإنشاء: ${new Date().toISOString().split('T')[0]}
 * المطور: Ali Alhazmi
 * الغرض: اختبار جميع وظائف API المصادقة والأمان
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { prismaMock } from '@/lib/prisma-mock';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// موك البيانات الثابتة
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  password_hash: '$2b$10$hashedpassword',
  role: { name: 'user', permissions: ['read'] },
  is_active: true,
  email_verified: true,
  created_at: new Date(),
  updated_at: new Date()
};

const validCredentials = {
  email: 'test@example.com',
  password: 'password123'
};

const invalidCredentials = {
  email: 'test@example.com',
  password: 'wrongpassword'
};

describe('API اختبارات المصادقة', () => {
  
  beforeAll(async () => {
    console.log('🔧 إعداد اختبارات API المصادقة...');
  });

  afterAll(async () => {
    console.log('🧹 تنظيف اختبارات API المصادقة...');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // إعادة تعيين rate limiting
    jest.clearAllTimers();
  });

  describe('POST /api/auth/login - تسجيل الدخول', () => {
    
    it('✅ يجب أن يسجل الدخول بنجاح مع بيانات صحيحة', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      
      // موك bcrypt
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      
      // موك jwt
      jest.spyOn(jwt, 'sign').mockReturnValue('mock-jwt-token');

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(data.token).toBeDefined();
      expect(data.user.password_hash).toBeUndefined(); // لا يجب إرجاع كلمة المرور
    });

    it('❌ يجب أن يرفض البيانات الخاطئة', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      
      // موك bcrypt للمقارنة الفاشلة
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(invalidCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('بيانات الدخول غير صحيحة');
    });

    it('❌ يجب أن يرفض المستخدم غير الموجود', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(null);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('بيانات الدخول غير صحيحة');
    });

    it('❌ يجب أن يرفض المستخدم غير المفعل', async () => {
      // إعداد موك مستخدم غير مفعل
      const inactiveUser = {
        ...mockUser,
        is_active: false
      };

      prismaMock.user.findUnique.mockResolvedValue(inactiveUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('الحساب غير مفعل');
    });

    it('❌ يجب أن يرفض المستخدم غير المؤكد البريد', async () => {
      // إعداد موك مستخدم غير مؤكد البريد
      const unverifiedUser = {
        ...mockUser,
        email_verified: false
      };

      prismaMock.user.findUnique.mockResolvedValue(unverifiedUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('يجب تأكيد البريد الإلكتروني أولاً');
    });

  });

  describe('🔒 اختبارات الأمان', () => {
    
    it('🚫 يجب أن يطبق rate limiting', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(null);

      // محاولة تسجيل دخول متكررة
      const requests = Array.from({ length: 6 }, () => 
        new NextRequest(
          'http://localhost:3000/api/auth/login',
          {
            method: 'POST',
            body: JSON.stringify(invalidCredentials),
            headers: { 
              'Content-Type': 'application/json',
              'x-forwarded-for': '127.0.0.1'
            }
          }
        )
      );

      // تنفيذ الطلبات
      const responses = await Promise.all(
        requests.map(request => POST(request))
      );

      // التحقق من تطبيق rate limiting
      const lastResponse = responses[responses.length - 1];
      const data = await lastResponse.json();
      
      expect(lastResponse.status).toBe(429);
      expect(data.error).toBe('تم تجاوز حد المحاولات المسموح');
    });

    it('🛡️ يجب أن يسجل المحاولات المشبوهة', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.audit_log.create.mockResolvedValue({});

      // محاولة تسجيل دخول مشبوهة
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'admin@example.com',
            password: 'admin123'
          }),
          headers: { 
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
            'user-agent': 'Suspicious Bot'
          }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);

      // التحقق من تسجيل المحاولة المشبوهة
      expect(prismaMock.audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'suspicious_login_attempt',
          ip_address: expect.any(String),
          user_agent: 'Suspicious Bot'
        })
      });
    });

    it('🔐 يجب أن يستخدم CSRF protection', async () => {
      // إنشاء طلب بدون CSRF token
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);

      // التحقق من headers الأمان
      expect(response.headers.get('x-csrf-token')).toBeDefined();
      expect(response.headers.get('x-frame-options')).toBe('DENY');
    });

    it('📍 يجب أن يتحقق من الموقع الجغرافي', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user_session.findFirst.mockResolvedValue(null); // لا توجد جلسات سابقة
      
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // إنشاء طلب من موقع جديد
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 
            'Content-Type': 'application/json',
            'x-forwarded-for': '8.8.8.8' // Google DNS - موقع مختلف
          }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من تسجيل الموقع الجديد
      expect(data.location_alert).toBe(true);
    });

    it('🤖 يجب أن يكشف البوتات', async () => {
      // إنشاء طلب من بوت
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 
            'Content-Type': 'application/json',
            'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من رفض البوت
      expect(response.status).toBe(403);
      expect(data.error).toBe('غير مسموح للبوتات');
    });

  });

  describe('🔑 اختبارات JWT', () => {
    
    it('✅ يجب أن ينشئ JWT token صحيح', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من JWT token
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
      
      // التحقق من محتوى التوكن
      const decodedToken = jwt.decode(data.token);
      expect(decodedToken).toHaveProperty('user_id');
      expect(decodedToken).toHaveProperty('email');
    });

    it('⏰ يجب أن يحدد انتهاء صلاحية التوكن', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من انتهاء الصلاحية
      const decodedToken = jwt.decode(data.token);
      expect(decodedToken).toHaveProperty('exp');
      
      const expirationTime = decodedToken.exp * 1000;
      const now = Date.now();
      expect(expirationTime).toBeGreaterThan(now);
    });

  });

  describe('📊 اختبارات الجلسات', () => {
    
    it('💾 يجب أن يحفظ الجلسة في قاعدة البيانات', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user_session.create.mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        session_token: 'encrypted-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);

      // التحقق من حفظ الجلسة
      expect(prismaMock.user_session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-123',
          session_token: expect.any(String),
          expires_at: expect.any(Date)
        })
      });
    });

    it('🔄 يجب أن يحدث الجلسة الموجودة', async () => {
      // إعداد موك جلسة موجودة
      const existingSession = {
        id: 'session-123',
        user_id: 'user-123',
        session_token: 'old-token',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user_session.findFirst.mockResolvedValue(existingSession);
      prismaMock.user_session.update.mockResolvedValue({
        ...existingSession,
        session_token: 'new-token'
      });
      
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);

      // التحقق من تحديث الجلسة
      expect(prismaMock.user_session.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: expect.objectContaining({
          session_token: expect.any(String),
          last_activity: expect.any(Date)
        })
      });
    });

  });

  describe('🎯 اختبارات التحقق من صحة البيانات', () => {
    
    it('❌ يجب أن يرفض البريد الإلكتروني غير الصحيح', async () => {
      const invalidEmail = {
        email: 'invalid-email',
        password: 'password123'
      };

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(invalidEmail),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من رفض البريد غير الصحيح
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('البريد الإلكتروني غير صحيح');
    });

    it('❌ يجب أن يرفض كلمة المرور القصيرة', async () => {
      const shortPassword = {
        email: 'test@example.com',
        password: '123'
      };

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(shortPassword),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من رفض كلمة المرور القصيرة
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('كلمة المرور قصيرة جداً');
    });

    it('❌ يجب أن يرفض البيانات الفارغة', async () => {
      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من رفض البيانات الفارغة
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('البيانات مطلوبة');
    });

  });

  describe('🔍 اختبارات تسجيل الأنشطة', () => {
    
    it('📝 يجب أن يسجل محاولة تسجيل الدخول الناجحة', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.audit_log.create.mockResolvedValue({});
      
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);

      // التحقق من تسجيل النشاط
      expect(prismaMock.audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-123',
          action: 'login_success',
          ip_address: expect.any(String)
        })
      });
    });

    it('📝 يجب أن يسجل محاولة تسجيل الدخول الفاشلة', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.audit_log.create.mockResolvedValue({});
      
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(invalidCredentials),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);

      // التحقق من تسجيل المحاولة الفاشلة
      expect(prismaMock.audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'login_failed',
          details: expect.stringContaining('بيانات الدخول غير صحيحة')
        })
      });
    });

  });

  describe('🌐 اختبارات متعددة الأجهزة', () => {
    
    it('📱 يجب أن يدعم تسجيل الدخول من أجهزة متعددة', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user_session.findMany.mockResolvedValue([
        { id: 'session-1', device_info: { type: 'mobile' } },
        { id: 'session-2', device_info: { type: 'desktop' } }
      ]);
      
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(validCredentials),
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
          }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من معلومات الجهاز
      expect(data.device_info).toBeDefined();
      expect(data.active_sessions).toBeDefined();
    });

  });

});

/**
 * مساعدات الاختبار
 */
export const createMockUser = (overrides = {}) => {
  return {
    ...mockUser,
    ...overrides
  };
};

export const createAuthRequest = (credentials: any, headers: any = {}) => {
  return new NextRequest(
    'http://localhost:3000/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 
        'Content-Type': 'application/json',
        ...headers
      }
    }
  );
}; 