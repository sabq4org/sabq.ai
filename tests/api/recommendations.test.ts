/**
 * اختبارات API التوصيات - Sabq AI CMS
 * 
 * تاريخ الإنشاء: ${new Date().toISOString().split('T')[0]}
 * المطور: Ali Alhazmi
 * الغرض: اختبار جميع وظائف API التوصيات الذكية
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/ml/recommendations/route';
import { prismaMock } from '@/lib/prisma-mock';

// موك البيانات الثابتة
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  preferences: {
    sections: ['tech', 'sports'],
    reading_time: 'medium',
    notification_frequency: 'daily'
  }
};

const mockArticles = [
  {
    id: 'article-1',
    title: 'مقال عن الذكاء الاصطناعي',
    content: 'محتوى مفصل عن الذكاء الاصطناعي',
    section: { name: 'تقنية', slug: 'tech' },
    tags: [{ name: 'AI' }, { name: 'تقنية' }],
    views_count: 1500,
    published_at: new Date('2024-01-15'),
    author: { name: 'محمد أحمد' }
  },
  {
    id: 'article-2',
    title: 'مقال عن كرة القدم',
    content: 'أحدث أخبار كرة القدم',
    section: { name: 'رياضة', slug: 'sports' },
    tags: [{ name: 'كرة قدم' }, { name: 'رياضة' }],
    views_count: 800,
    published_at: new Date('2024-01-14'),
    author: { name: 'سارة خالد' }
  }
];

const mockRecommendations = [
  {
    article_id: 'article-1',
    title: 'مقال عن الذكاء الاصطناعي',
    score: 0.95,
    reason: 'content_similarity',
    confidence: 0.89,
    factors: {
      content_match: 0.92,
      user_interest: 0.88,
      trending_factor: 0.75
    }
  },
  {
    article_id: 'article-2',
    title: 'مقال عن كرة القدم',
    score: 0.78,
    reason: 'collaborative_filtering',
    confidence: 0.72,
    factors: {
      similar_users: 0.85,
      user_history: 0.70,
      popularity: 0.65
    }
  }
];

describe('API اختبارات التوصيات', () => {
  
  beforeAll(async () => {
    console.log('🔧 إعداد اختبارات API التوصيات...');
  });

  afterAll(async () => {
    console.log('🧹 تنظيف اختبارات API التوصيات...');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ml/recommendations - الحصول على التوصيات', () => {
    
    it('✅ يجب أن يرجع توصيات مخصصة للمستخدم', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&limit=10',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recommendations).toBeDefined();
      expect(data.recommendations).toHaveLength(2);
      expect(data.recommendations[0]).toHaveProperty('score');
      expect(data.recommendations[0]).toHaveProperty('reason');
    });

    it('✅ يجب أن يرجع توصيات عامة للمستخدم غير المسجل', async () => {
      // إعداد الموك
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?type=trending&limit=5',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recommendations).toBeDefined();
      expect(data.recommendations.length).toBeLessThanOrEqual(5);
    });

    it('🎯 يجب أن يطبق التوصيات حسب المحتوى المشابه', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&algorithm=content_based&reference_article=article-1',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من نوع التوصية
      expect(response.status).toBe(200);
      expect(data.recommendations[0].reason).toBe('content_similarity');
      expect(data.recommendations[0].factors.content_match).toBeGreaterThan(0.5);
    });

    it('👥 يجب أن يطبق التصفية التعاونية', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.analytics_event.findMany.mockResolvedValue([
        { user_id: 'user-456', event_data: { article_id: 'article-1' } },
        { user_id: 'user-789', event_data: { article_id: 'article-2' } }
      ]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&algorithm=collaborative',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من التصفية التعاونية
      expect(response.status).toBe(200);
      expect(data.recommendations.some(r => r.reason === 'collaborative_filtering')).toBe(true);
    });

    it('🔀 يجب أن يطبق التوصيات الهجينة', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&algorithm=hybrid',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من التوصيات الهجينة
      expect(response.status).toBe(200);
      expect(data.recommendations[0]).toHaveProperty('hybrid_score');
      expect(data.recommendations[0].factors).toHaveProperty('content_weight');
      expect(data.recommendations[0].factors).toHaveProperty('collaborative_weight');
    });

  });

  describe('POST /api/ml/recommendations - تدريب وتحسين التوصيات', () => {
    
    it('✅ يجب أن يسجل تفاعل المستخدم مع التوصية', async () => {
      const feedback = {
        user_id: 'user-123',
        article_id: 'article-1',
        action: 'clicked',
        recommendation_id: 'rec-456',
        rating: 5
      };

      // إعداد الموك
      prismaMock.recommendation_feedback.create.mockResolvedValue({
        id: 'feedback-123',
        ...feedback,
        created_at: new Date()
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations',
        {
          method: 'POST',
          body: JSON.stringify(feedback),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من تسجيل التفاعل
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.feedback_id).toBeDefined();
      
      // التحقق من حفظ البيانات
      expect(prismaMock.recommendation_feedback.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-123',
          article_id: 'article-1',
          action: 'clicked'
        })
      });
    });

    it('🎯 يجب أن يحسن التوصيات بناءً على التفاعل', async () => {
      const trainingData = {
        user_id: 'user-123',
        interactions: [
          { article_id: 'article-1', action: 'read', duration: 300 },
          { article_id: 'article-2', action: 'skip', duration: 5 }
        ]
      };

      // إعداد الموك
      prismaMock.user_preference.upsert.mockResolvedValue({
        user_id: 'user-123',
        preferences: {
          liked_topics: ['AI', 'tech'],
          disliked_topics: ['sports']
        }
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations',
        {
          method: 'POST',
          body: JSON.stringify(trainingData),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من تحسين التوصيات
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updated_preferences).toBeDefined();
    });

  });

  describe('🔍 اختبارات خوارزميات التوصية', () => {
    
    it('📊 يجب أن يحسب التشابه بين المقالات', async () => {
      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue(mockArticles[0]);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?type=similar&article_id=article-1',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من حساب التشابه
      expect(response.status).toBe(200);
      expect(data.similar_articles).toBeDefined();
      expect(data.similar_articles[0]).toHaveProperty('similarity_score');
    });

    it('📈 يجب أن يحسب شعبية المقالات', async () => {
      // إعداد الموك
      prismaMock.analytics_event.groupBy.mockResolvedValue([
        { event_data: { article_id: 'article-1' }, _count: { id: 100 } },
        { event_data: { article_id: 'article-2' }, _count: { id: 50 } }
      ]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?type=trending&timeframe=7days',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من حساب الشعبية
      expect(response.status).toBe(200);
      expect(data.trending_articles).toBeDefined();
      expect(data.trending_articles[0].popularity_score).toBeGreaterThan(0);
    });

    it('🕐 يجب أن يعتبر التوقيت في التوصيات', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&time_sensitive=true',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من اعتبار التوقيت
      expect(response.status).toBe(200);
      expect(data.recommendations[0].factors).toHaveProperty('time_relevance');
    });

  });

  describe('🎮 اختبارات التخصيص المتقدم', () => {
    
    it('🎨 يجب أن يخصص التوصيات حسب تفضيلات المستخدم', async () => {
      const userWithPreferences = {
        ...mockUser,
        preferences: {
          sections: ['tech'],
          reading_time: 'long',
          topics: ['AI', 'programming']
        }
      };

      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(userWithPreferences);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&personalized=true',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من التخصيص
      expect(response.status).toBe(200);
      expect(data.recommendations[0].factors).toHaveProperty('personalization_score');
    });

    it('🔄 يجب أن يتجنب التوصيات المتكررة', async () => {
      // إعداد موك المقالات المقروءة
      prismaMock.analytics_event.findMany.mockResolvedValue([
        { event_data: { article_id: 'article-1' }, event_type: 'article_read' }
      ]);

      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&exclude_read=true',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من تجنب التكرار
      expect(response.status).toBe(200);
      expect(data.recommendations.every(r => r.article_id !== 'article-1')).toBe(true);
    });

  });

  describe('📊 اختبارات الأداء والتحسين', () => {
    
    it('⚡ يجب أن يستخدم التخزين المؤقت للتوصيات', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&cache=true',
        { method: 'GET' }
      );

      // تنفيذ الطلب مرتين
      await GET(request);
      await GET(request);

      // التحقق من استخدام التخزين المؤقت
      expect(prismaMock.article.findMany).toHaveBeenCalledTimes(1);
    });

    it('🎯 يجب أن يحسب دقة التوصيات', async () => {
      // إعداد الموك
      prismaMock.recommendation_feedback.findMany.mockResolvedValue([
        { rating: 5, action: 'clicked' },
        { rating: 4, action: 'clicked' },
        { rating: 2, action: 'skipped' }
      ]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?type=accuracy&user_id=user-123',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من حساب الدقة
      expect(response.status).toBe(200);
      expect(data.accuracy_metrics).toBeDefined();
      expect(data.accuracy_metrics.click_through_rate).toBeDefined();
      expect(data.accuracy_metrics.average_rating).toBeDefined();
    });

  });

  describe('🔒 اختبارات الأمان والخصوصية', () => {
    
    it('🎭 يجب أن يحمي خصوصية المستخدم', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&privacy_mode=true',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من حماية الخصوصية
      expect(response.status).toBe(200);
      expect(data.recommendations[0]).not.toHaveProperty('user_profile');
      expect(data.recommendations[0]).not.toHaveProperty('reading_history');
    });

    it('🔐 يجب أن يتحقق من صلاحيات الوصول', async () => {
      // إنشاء طلب بدون تسجيل دخول
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=other-user&admin_insights=true',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من رفض الوصول
      expect(response.status).toBe(403);
      expect(data.error).toBe('غير مصرح بالوصول');
    });

  });

  describe('🌐 اختبارات التوصيات متعددة اللغات', () => {
    
    it('🔤 يجب أن يدعم التوصيات باللغة العربية', async () => {
      const arabicArticles = [
        {
          ...mockArticles[0],
          title: 'مقال عن الذكاء الاصطناعي',
          content: 'محتوى باللغة العربية عن الذكاء الاصطناعي',
          language: 'ar'
        }
      ];

      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.article.findMany.mockResolvedValue(arabicArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&language=ar',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من دعم اللغة العربية
      expect(response.status).toBe(200);
      expect(data.recommendations[0].factors).toHaveProperty('language_match');
    });

  });

  describe('📱 اختبارات التوصيات المتكيفة', () => {
    
    it('📱 يجب أن يتكيف مع نوع الجهاز', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&device=mobile',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من التكيف مع الجهاز
      expect(response.status).toBe(200);
      expect(data.recommendations[0].factors).toHaveProperty('device_optimization');
    });

    it('🕐 يجب أن يتكيف مع وقت اليوم', async () => {
      // إعداد الموك
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.article.findMany.mockResolvedValue(mockArticles);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/ml/recommendations?user_id=user-123&time_aware=true',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من التكيف مع الوقت
      expect(response.status).toBe(200);
      expect(data.recommendations[0].factors).toHaveProperty('time_of_day_factor');
    });

  });

});

/**
 * مساعدات الاختبار
 */
export const createMockRecommendation = (overrides = {}) => {
  return {
    ...mockRecommendations[0],
    ...overrides
  };
};

export const createRecommendationRequest = (params: string, method: string = 'GET') => {
  return new NextRequest(
    `http://localhost:3000/api/ml/recommendations?${params}`,
    { method }
  );
}; 