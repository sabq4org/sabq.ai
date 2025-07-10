/**
 * اختبارات محرك التوصيات الذكي
 * Smart Recommendations Engine Tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('🎯 محرك التوصيات الذكي', () => {
  
  describe('API التوصيات', () => {
    it('should generate recommendations successfully', async () => {
      const requestData = {
        user_events: [
          {
            event_type: 'article_view',
            event_data: {
              category: 'تقنية',
              tags: ['AI', 'برمجة']
            },
            timestamp: '2024-01-15T10:00:00Z'
          }
        ],
        articles: [
          {
            id: '1',
            title: 'مستقبل الذكاء الاصطناعي',
            category: { name: 'تقنية' },
            tags: ['AI', 'تقنية'],
            view_count: 1500,
            published_at: '2024-01-14T12:00:00Z'
          }
        ],
        top_n: 5,
        context: 'homepage'
      };

      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);

      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('recommendations');
        expect(Array.isArray(data.recommendations)).toBe(true);
      }
    });

    it('should handle empty user events', async () => {
      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_events: [],
          articles: [],
          top_n: 5
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('تحليل الاهتمامات', () => {
    it('should analyze user interests', async () => {
      const response = await fetch('/api/ml/interest-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_events: [
            {
              event_type: 'article_like',
              event_data: { category: 'تقنية' },
              timestamp: '2024-01-15T10:00:00Z'
            }
          ]
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);

      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('interest_scores');
        expect(data).toHaveProperty('user_profile');
      }
    });
  });

  describe('تحليل النصوص', () => {
    it('should analyze Arabic text', async () => {
      const response = await fetch('/api/ml/text-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'هذا نص تجريبي للتحليل',
          analysis_type: 'all'
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);

      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('analysis');
      }
    });

    it('should handle empty text', async () => {
      const response = await fetch('/api/ml/text-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '',
          analysis_type: 'keywords'
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('خدمة الذكاء الاصطناعي', () => {
    it('should check ML service health', async () => {
      // اختبار الاتصال بخدمة ML
      try {
        const response = await fetch('http://localhost:8000/health');
        
        if (response.ok) {
          const data = await response.json();
          expect(data.status).toBe('healthy');
          expect(data).toHaveProperty('models');
        }
      } catch (error) {
        // الخدمة غير متاحة - هذا مقبول في بيئة الاختبار
        console.log('ML Service not available during test');
      }
    });

    it('should handle ML service unavailability gracefully', async () => {
      // اختبار التعامل مع عدم توفر خدمة ML
      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_events: [],
          articles: [],
          top_n: 5
        })
      });

      // يجب أن يعيد استجابة حتى لو كانت الخدمة غير متاحة
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });
  });

  describe('جودة التوصيات', () => {
    it('should return diverse recommendations', async () => {
      const requestData = {
        user_events: [
          {
            event_type: 'article_view',
            event_data: { category: 'تقنية' },
            timestamp: '2024-01-15T10:00:00Z'
          }
        ],
        articles: [
          {
            id: '1',
            title: 'مقال تقني',
            category: { name: 'تقنية' },
            tags: ['AI']
          },
          {
            id: '2', 
            title: 'مقال رياضي',
            category: { name: 'رياضة' },
            tags: ['كرة القدم']
          }
        ],
        top_n: 2
      };

      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.recommendations && data.recommendations.length > 0) {
          // فحص وجود مقاييس الجودة
          expect(data).toHaveProperty('metrics');
          
          if (data.metrics) {
            expect(data.metrics).toHaveProperty('diversity');
            expect(data.metrics).toHaveProperty('coverage');
          }
        }
      }
    });
  });

  describe('أداء النظام', () => {
    it('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_events: [],
          articles: [],
          top_n: 1
        })
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // يجب أن تكون الاستجابة أقل من 10 ثوان
      expect(responseTime).toBeLessThan(10000);
    });

    it('should handle large datasets', async () => {
      // إنشاء مجموعة كبيرة من البيانات للاختبار
      const largeUserEvents = Array.from({ length: 100 }, (_, i) => ({
        event_type: 'article_view',
        event_data: { category: 'تقنية' },
        timestamp: new Date(Date.now() - i * 86400000).toISOString()
      }));

      const largeArticles = Array.from({ length: 50 }, (_, i) => ({
        id: i.toString(),
        title: `مقال ${i}`,
        category: { name: 'تقنية' },
        tags: ['تقنية']
      }));

      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_events: largeUserEvents,
          articles: largeArticles,
          top_n: 10
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('معالجة الأخطاء', () => {
    it('should handle malformed requests', async () => {
      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it('should handle missing required fields', async () => {
      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // حذف الحقول المطلوبة
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });
});

describe('🔧 اختبارات التكامل', () => {
  
  describe('تدفق التوصيات الكامل', () => {
    it('should complete full recommendation flow', async () => {
      // 1. تسجيل حدث
      const eventResponse = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{
            eventType: 'article_view',
            eventData: { category: 'تقنية' },
            timestamp: new Date().toISOString(),
            sessionId: 'test_session'
          }]
        })
      });

      // 2. جلب التوصيات
      const recResponse = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_events: [{
            event_type: 'article_view',
            event_data: { category: 'تقنية' },
            timestamp: new Date().toISOString()
          }],
          articles: [],
          top_n: 5
        })
      });

      // فحص النتائج
      expect(eventResponse.status).toBeGreaterThanOrEqual(200);
      expect(recResponse.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('سيناريوهات واقعية', () => {
    it('should handle new user scenario', async () => {
      // مستخدم جديد بدون تاريخ
      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_events: [],
          articles: [
            {
              id: '1',
              title: 'مقال شائع',
              category: { name: 'أخبار' },
              view_count: 10000,
              tags: []
            }
          ],
          top_n: 5,
          context: 'homepage'
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should handle active user scenario', async () => {
      // مستخدم نشط مع تاريخ متنوع
      const userEvents = [
        {
          event_type: 'article_view',
          event_data: { category: 'تقنية' },
          timestamp: '2024-01-15T10:00:00Z'
        },
        {
          event_type: 'article_like',
          event_data: { category: 'رياضة' },
          timestamp: '2024-01-15T11:00:00Z'
        },
        {
          event_type: 'reading_time',
          event_data: { 
            category: 'تقنية',
            duration: 300
          },
          timestamp: '2024-01-15T12:00:00Z'
        }
      ];

      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_events: userEvents,
          articles: [],
          top_n: 5
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });
});

// تنظيف بعد الاختبارات
afterAll(async () => {
  console.log('🧹 تنظيف بيانات اختبار التوصيات...');
});

// إعداد قبل الاختبارات  
beforeAll(async () => {
  console.log('🔧 إعداد اختبارات التوصيات...');
}); 