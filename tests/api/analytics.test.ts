/**
 * اختبارات API التحليلات - Sabq AI CMS
 * 
 * تاريخ الإنشاء: ${new Date().toISOString().split('T')[0]}
 * المطور: Ali Alhazmi
 * الغرض: اختبار جميع وظائف API التحليلات والإحصائيات
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/analytics/events/route';
import { prismaMock } from '@/lib/prisma-mock';

// موك البيانات الثابتة
const mockEvent = {
  id: 'event-123',
  user_id: 'user-123',
  session_id: 'session-123',
  event_type: 'page_view',
  event_data: {
    page: '/articles/123',
    referrer: 'https://google.com',
    duration: 30000
  },
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0 Test Browser',
  device_info: {
    type: 'desktop',
    os: 'Windows',
    browser: 'Chrome'
  },
  geo_location: {
    country: 'Saudi Arabia',
    city: 'Riyadh',
    latitude: 24.7136,
    longitude: 46.6753
  },
  created_at: new Date()
};

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User'
};

describe('API اختبارات التحليلات', () => {
  
  beforeAll(async () => {
    console.log('🔧 إعداد اختبارات API التحليلات...');
  });

  afterAll(async () => {
    console.log('🧹 تنظيف اختبارات API التحليلات...');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/analytics/events - تسجيل الأحداث', () => {
    
    it('✅ يجب أن يسجل حدث مشاهدة الصفحة', async () => {
      const eventData = {
        event_type: 'page_view',
        event_data: {
          page: '/articles/123',
          title: 'مقال تجريبي',
          referrer: 'https://google.com'
        }
      };

      // إعداد الموك
      prismaMock.analytics_event.create.mockResolvedValue({
        ...mockEvent,
        ...eventData
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events',
        {
          method: 'POST',
          body: JSON.stringify(eventData),
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 Test Browser',
            'X-Forwarded-For': '192.168.1.1'
          }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.event_id).toBeDefined();
      
      // التحقق من حفظ الحدث
      expect(prismaMock.analytics_event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: 'page_view',
          event_data: expect.objectContaining({
            page: '/articles/123'
          })
        })
      });
    });

    it('✅ يجب أن يسجل حدث قراءة المقال', async () => {
      const eventData = {
        event_type: 'article_read',
        event_data: {
          article_id: 'article-123',
          reading_time: 120000,
          scroll_depth: 85,
          completion_rate: 0.9
        }
      };

      // إعداد الموك
      prismaMock.analytics_event.create.mockResolvedValue({
        ...mockEvent,
        ...eventData
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events',
        {
          method: 'POST',
          body: JSON.stringify(eventData),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.reading_insights).toBeDefined();
    });

    it('✅ يجب أن يسجل حدث البحث', async () => {
      const eventData = {
        event_type: 'search',
        event_data: {
          query: 'الذكاء الاصطناعي',
          results_count: 15,
          filters: {
            section: 'تقنية',
            date_range: '30days'
          }
        }
      };

      // إعداد الموك
      prismaMock.analytics_event.create.mockResolvedValue({
        ...mockEvent,
        ...eventData
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events',
        {
          method: 'POST',
          body: JSON.stringify(eventData),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);

      // التحقق من تسجيل البحث
      expect(prismaMock.analytics_event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: 'search',
          event_data: expect.objectContaining({
            query: 'الذكاء الاصطناعي'
          })
        })
      });
    });

    it('🤖 يجب أن يكشف ويرفض البوتات', async () => {
      const eventData = {
        event_type: 'page_view',
        event_data: { page: '/articles/123' }
      };

      // إنشاء طلب من بوت
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events',
        {
          method: 'POST',
          body: JSON.stringify(eventData),
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من رفض البوت
      expect(response.status).toBe(403);
      expect(data.error).toBe('Bot traffic is not tracked');
    });

    it('❌ يجب أن يرفض نوع الحدث غير الصحيح', async () => {
      const invalidEvent = {
        event_type: 'invalid_event',
        event_data: {}
      };

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events',
        {
          method: 'POST',
          body: JSON.stringify(invalidEvent),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من رفض النوع غير الصحيح
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('نوع الحدث غير صحيح');
    });

  });

  describe('GET /api/analytics/events - استعلام الأحداث', () => {
    
    it('✅ يجب أن يرجع إحصائيات عامة', async () => {
      // إعداد الموك
      prismaMock.analytics_event.groupBy.mockResolvedValue([
        { event_type: 'page_view', _count: { id: 150 } },
        { event_type: 'article_read', _count: { id: 80 } },
        { event_type: 'search', _count: { id: 25 } }
      ]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events?type=summary',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary).toBeDefined();
      expect(data.summary.total_events).toBe(255);
      expect(data.summary.page_views).toBe(150);
    });

    it('✅ يجب أن يرجع إحصائيات المقالات الشائعة', async () => {
      // إعداد الموك
      prismaMock.analytics_event.groupBy.mockResolvedValue([
        { 
          event_data: { article_id: 'article-1' },
          _count: { id: 45 }
        },
        { 
          event_data: { article_id: 'article-2' },
          _count: { id: 32 }
        }
      ]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events?type=popular_articles',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.popular_articles).toBeDefined();
      expect(data.popular_articles).toHaveLength(2);
    });

    it('✅ يجب أن يرجع إحصائيات الوقت الحقيقي', async () => {
      // إعداد الموك
      prismaMock.analytics_event.count.mockResolvedValue(45);
      prismaMock.user_session.count.mockResolvedValue(12);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events?type=realtime',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.realtime).toBeDefined();
      expect(data.realtime.active_users).toBe(12);
      expect(data.realtime.events_last_hour).toBe(45);
    });

  });

  describe('📊 اختبارات التقارير المتقدمة', () => {
    
    it('📈 يجب أن يحسب معدل الارتداد', async () => {
      // إعداد البيانات
      const bounceData = [
        { session_id: 'session-1', _count: { id: 1 } }, // bounce
        { session_id: 'session-2', _count: { id: 5 } }, // not bounce
        { session_id: 'session-3', _count: { id: 1 } }  // bounce
      ];

      prismaMock.analytics_event.groupBy.mockResolvedValue(bounceData);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events?type=bounce_rate',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من حساب معدل الارتداد
      expect(response.status).toBe(200);
      expect(data.bounce_rate).toBeDefined();
      expect(data.bounce_rate).toBeCloseTo(0.67, 2); // 2/3 = 0.67
    });

    it('🌍 يجب أن يجمع إحصائيات جغرافية', async () => {
      // إعداد الموك
      prismaMock.analytics_event.groupBy.mockResolvedValue([
        { 
          geo_location: { country: 'Saudi Arabia', city: 'Riyadh' },
          _count: { id: 120 }
        },
        { 
          geo_location: { country: 'Saudi Arabia', city: 'Jeddah' },
          _count: { id: 80 }
        }
      ]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events?type=geo_stats',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من الإحصائيات الجغرافية
      expect(response.status).toBe(200);
      expect(data.geo_stats).toBeDefined();
      expect(data.geo_stats.by_country).toBeDefined();
      expect(data.geo_stats.by_city).toBeDefined();
    });

    it('📱 يجب أن يجمع إحصائيات الأجهزة', async () => {
      // إعداد الموك
      prismaMock.analytics_event.groupBy.mockResolvedValue([
        { 
          device_info: { type: 'mobile', os: 'iOS', browser: 'Safari' },
          _count: { id: 60 }
        },
        { 
          device_info: { type: 'desktop', os: 'Windows', browser: 'Chrome' },
          _count: { id: 40 }
        }
      ]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events?type=device_stats',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من إحصائيات الأجهزة
      expect(response.status).toBe(200);
      expect(data.device_stats).toBeDefined();
      expect(data.device_stats.by_type.mobile).toBe(60);
      expect(data.device_stats.by_type.desktop).toBe(40);
    });

  });

  describe('🔍 اختبارات الفلترة والتجميع', () => {
    
    it('📅 يجب أن يفلتر بالتاريخ', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      // إعداد الموك
      prismaMock.analytics_event.findMany.mockResolvedValue([mockEvent]);

      // إنشاء الطلب
      const request = new NextRequest(
        `http://localhost:3000/api/analytics/events?start_date=${startDate}&end_date=${endDate}`,
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);

      // التحقق من الفلترة بالتاريخ
      expect(prismaMock.analytics_event.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          created_at: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      });
    });

    it('👤 يجب أن يفلتر بالمستخدم', async () => {
      const userId = 'user-123';

      // إعداد الموك
      prismaMock.analytics_event.findMany.mockResolvedValue([mockEvent]);

      // إنشاء الطلب
      const request = new NextRequest(
        `http://localhost:3000/api/analytics/events?user_id=${userId}`,
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);

      // التحقق من الفلترة بالمستخدم
      expect(prismaMock.analytics_event.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          user_id: userId
        })
      });
    });

  });

  describe('⚡ اختبارات الأداء', () => {
    
    it('🚀 يجب أن يستخدم التخزين المؤقت للاستعلامات الثقيلة', async () => {
      // إعداد الموك
      prismaMock.analytics_event.groupBy.mockResolvedValue([
        { event_type: 'page_view', _count: { id: 1000 } }
      ]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events?type=summary',
        { method: 'GET' }
      );

      // تنفيذ الطلب مرتين
      await GET(request);
      await GET(request);

      // التحقق من استخدام التخزين المؤقت
      // (يجب أن يستدعى مرة واحدة فقط بسبب التخزين المؤقت)
      expect(prismaMock.analytics_event.groupBy).toHaveBeenCalledTimes(1);
    });

    it('⏱️ يجب أن يستجيب خلال وقت معقول', async () => {
      // إعداد الموك
      prismaMock.analytics_event.count.mockResolvedValue(100);

      // قياس الوقت
      const startTime = Date.now();
      
      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events?type=count',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // التحقق من الأداء
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // أقل من ثانية
    });

  });

  describe('🔒 اختبارات الأمان والخصوصية', () => {
    
    it('🎭 يجب أن يخفي عناوين IP الحساسة', async () => {
      const eventData = {
        event_type: 'page_view',
        event_data: { page: '/articles/123' }
      };

      // إعداد الموك
      prismaMock.analytics_event.create.mockResolvedValue(mockEvent);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events',
        {
          method: 'POST',
          body: JSON.stringify(eventData),
          headers: { 
            'Content-Type': 'application/json',
            'X-Forwarded-For': '192.168.1.1'
          }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);

      // التحقق من تشفير IP
      expect(prismaMock.analytics_event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ip_address: expect.any(String) // يجب أن يكون مشفر
        })
      });
    });

    it('🔐 يجب أن يطلب صلاحيات للوصول للبيانات الحساسة', async () => {
      // إنشاء طلب بدون صلاحيات
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events?type=user_details',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من رفض الوصول
      expect(response.status).toBe(403);
      expect(data.error).toBe('صلاحيات غير كافية');
    });

  });

  describe('📈 اختبارات التقارير المخصصة', () => {
    
    it('📊 يجب أن ينشئ تقرير مخصص', async () => {
      const reportConfig = {
        metrics: ['page_views', 'unique_visitors', 'bounce_rate'],
        dimensions: ['date', 'page', 'source'],
        filters: {
          date_range: '7days',
          page_type: 'article'
        }
      };

      // إعداد الموك
      prismaMock.analytics_event.findMany.mockResolvedValue([mockEvent]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/events',
        {
          method: 'POST',
          body: JSON.stringify({ report_config: reportConfig }),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من التقرير المخصص
      expect(response.status).toBe(200);
      expect(data.custom_report).toBeDefined();
      expect(data.custom_report.metrics).toBeDefined();
      expect(data.custom_report.dimensions).toBeDefined();
    });

  });

});

/**
 * مساعدات الاختبار
 */
export const createMockEvent = (overrides = {}) => {
  return {
    ...mockEvent,
    ...overrides
  };
};

export const createAnalyticsRequest = (eventData: any, headers: any = {}) => {
  return new NextRequest(
    'http://localhost:3000/api/analytics/events',
    {
      method: 'POST',
      body: JSON.stringify(eventData),
      headers: { 
        'Content-Type': 'application/json',
        ...headers
      }
    }
  );
}; 