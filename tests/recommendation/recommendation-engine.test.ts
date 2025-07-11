/**
 * اختبارات نظام التوصيات الذكية
 * Smart Recommendation System Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { recommendationEngine } from '../../lib/recommendation-engine';
import { collaborativeFilteringEngine } from '../../lib/recommendation/collaborative-filtering';
import { graphBasedRecommendationEngine } from '../../lib/recommendation/graph-based';
import { aiRecommendationEngine } from '../../lib/recommendation/ai-integration';

const prisma = new PrismaClient();

// بيانات اختبار
const testUsers = [
  { id: 'user1', email: 'test1@example.com', name: 'Test User 1', password_hash: 'hash1' },
  { id: 'user2', email: 'test2@example.com', name: 'Test User 2', password_hash: 'hash2' },
  { id: 'user3', email: 'test3@example.com', name: 'Test User 3', password_hash: 'hash3' }
];

const testCategories = [
  { id: 'cat1', name: 'Technology', slug: 'technology' },
  { id: 'cat2', name: 'Sports', slug: 'sports' },
  { id: 'cat3', name: 'News', slug: 'news' }
];

const testArticles = [
  {
    id: 'article1',
    title: 'Test Article 1',
    slug: 'test-article-1',
    content: 'Content 1',
    category_id: 'cat1',
    author_id: 'user1',
    status: 'published',
    tags: ['tech', 'ai', 'programming'],
    published_at: new Date()
  },
  {
    id: 'article2',
    title: 'Test Article 2',
    slug: 'test-article-2',
    content: 'Content 2',
    category_id: 'cat2',
    author_id: 'user2',
    status: 'published',
    tags: ['sports', 'football', 'news'],
    published_at: new Date()
  },
  {
    id: 'article3',
    title: 'Test Article 3',
    slug: 'test-article-3',
    content: 'Content 3',
    category_id: 'cat3',
    author_id: 'user3',
    status: 'published',
    tags: ['news', 'politics', 'world'],
    published_at: new Date()
  }
];

describe('نظام التوصيات الذكية', () => {
  beforeAll(async () => {
    // إعداد بيانات الاختبار
    await setupTestData();
  });

  afterAll(async () => {
    // تنظيف بيانات الاختبار
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // مسح الذاكرة المؤقتة قبل كل اختبار
    recommendationEngine.clearCache();
    collaborativeFilteringEngine.clearCache();
    graphBasedRecommendationEngine.clearGraph();
  });

  describe('محرك التوصيات الأساسي', () => {
    it('يجب أن يُرجع توصيات شخصية للمستخدم المسجل', async () => {
      const recommendations = await recommendationEngine.getRecommendations({
        userId: 'user1',
        algorithmType: 'personal',
        limit: 5
      });

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('article');
      expect(recommendations[0]).toHaveProperty('score');
      expect(recommendations[0]).toHaveProperty('reason_explanation');
      expect(recommendations[0].algorithm_type).toBe('personal');
    });

    it('يجب أن يُرجع توصيات للزائر غير المسجل', async () => {
      const recommendations = await recommendationEngine.getRecommendations({
        sessionId: 'session123',
        algorithmType: 'trending',
        limit: 3
      });

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].algorithm_type).toBe('trending');
    });

    it('يجب أن يحترم حد عدد النتائج', async () => {
      const limit = 2;
      const recommendations = await recommendationEngine.getRecommendations({
        userId: 'user1',
        algorithmType: 'personal',
        limit
      });

      expect(recommendations.length).toBeLessThanOrEqual(limit);
    });

    it('يجب أن يستبعد المقالات المحددة', async () => {
      const excludeIds = ['article1'];
      const recommendations = await recommendationEngine.getRecommendations({
        userId: 'user1',
        algorithmType: 'personal',
        excludeArticleIds: excludeIds,
        limit: 10
      });

      const recommendedIds = recommendations.map(r => r.article.id);
      expect(recommendedIds).not.toContain('article1');
    });

    it('يجب أن يطبق فلتر الفئة', async () => {
      const recommendations = await recommendationEngine.getRecommendations({
        userId: 'user1',
        algorithmType: 'personal',
        categoryFilter: 'cat1',
        limit: 10
      });

      recommendations.forEach(rec => {
        expect(rec.article.category_id).toBe('cat1');
      });
    });
  });

  describe('التوصيات التعاونية (Collaborative Filtering)', () => {
    it('يجب أن يُرجع توصيات مبنية على المستخدمين المشابهين', async () => {
      // إنشاء تفاعلات مشتركة
      await createSharedInteractions();

      const recommendations = await collaborativeFilteringEngine.getUserBasedRecommendations({
        userId: 'user1',
        limit: 5
      });

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].algorithm_type).toBe('collaborative_user');
    });

    it('يجب أن يُرجع توصيات مبنية على المقالات المشابهة', async () => {
      await createSharedInteractions();

      const recommendations = await collaborativeFilteringEngine.getItemBasedRecommendations({
        userId: 'user1',
        limit: 5
      });

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations[0].algorithm_type).toBe('collaborative_item');
    });

    it('يجب أن يُرجع توصيات مختلطة', async () => {
      await createSharedInteractions();

      const recommendations = await collaborativeFilteringEngine.getHybridRecommendations({
        userId: 'user1',
        limit: 10
      });

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('التوصيات المبنية على الرسم البياني', () => {
    it('يجب أن يبني الرسم البياني بنجاح', async () => {
      await createGraphInteractions();
      
      const stats = await graphBasedRecommendationEngine.analyzeGraph();
      
      expect(stats.totalNodes).toBeGreaterThan(0);
      expect(stats.userNodes).toBeGreaterThan(0);
      expect(stats.articleNodes).toBeGreaterThan(0);
      expect(stats.totalEdges).toBeGreaterThan(0);
    });

    it('يجب أن يُرجع توصيات مبنية على الرسم البياني', async () => {
      await createGraphInteractions();

      const recommendations = await graphBasedRecommendationEngine.getGraphBasedRecommendations({
        userId: 'user1',
        limit: 5
      });

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations[0].algorithm_type).toBe('graph');
    });
  });

  describe('تكامل الذكاء الاصطناعي', () => {
    it('يجب أن يختبر الاتصال بخدمة الذكاء الاصطناعي', async () => {
      const isConnected = await aiRecommendationEngine.testConnection();
      // قد يكون false إذا لم تكن الخدمة متاحة في البيئة الاختبارية
      expect(typeof isConnected).toBe('boolean');
    });

    it('يجب أن يحلل المحتوى بالذكاء الاصطناعي', async () => {
      const analysis = await aiRecommendationEngine.analyzeContent(
        'هذا نص تجريبي للتحليل بالذكاء الاصطناعي'
      );

      expect(analysis).toHaveProperty('topics');
      expect(analysis).toHaveProperty('sentiment');
      expect(analysis).toHaveProperty('complexity');
      expect(analysis).toHaveProperty('readability');
      expect(analysis).toHaveProperty('keywords');
    });
  });

  describe('تسجيل التقييمات', () => {
    it('يجب أن يسجل تقييم المستخدم بنجاح', async () => {
      await recommendationEngine.recordRecommendationFeedback(
        'user1',
        'article1',
        'like'
      );

      const feedback = await prisma.recommendationLog.findFirst({
        where: {
          user_id: 'user1',
          article_id: 'article1',
          feedback: 'like'
        }
      });

      expect(feedback).toBeDefined();
      expect(feedback?.feedback).toBe('like');
    });

    it('يجب أن يحدث ملف اهتمامات المستخدم', async () => {
      await recommendationEngine.updateUserInterestProfile(
        'user1',
        'article1',
        'like'
      );

      const profile = await prisma.userInterestProfile.findUnique({
        where: { user_id: 'user1' }
      });

      expect(profile).toBeDefined();
      expect(profile?.interests).toBeDefined();
    });
  });

  describe('إحصائيات الأداء', () => {
    it('يجب أن يُرجع إحصائيات الأداء', async () => {
      // إنشاء بيانات تجريبية
      await createPerformanceData();

      const metrics = await recommendationEngine.getPerformanceMetrics();

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toHaveProperty('algorithm');
      expect(metrics[0]).toHaveProperty('ctr');
      expect(metrics[0]).toHaveProperty('satisfaction');
    });
  });

  describe('اختبارات الأداء', () => {
    it('يجب أن ينجز التوصيات في وقت معقول', async () => {
      const startTime = Date.now();
      
      await recommendationEngine.getRecommendations({
        userId: 'user1',
        algorithmType: 'mixed',
        limit: 10
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // يجب أن تكتمل في أقل من 5 ثوان
      expect(duration).toBeLessThan(5000);
    });

    it('يجب أن يتعامل مع حمولة كبيرة من الطلبات', async () => {
      const promises = [];
      const numberOfRequests = 10;

      for (let i = 0; i < numberOfRequests; i++) {
        promises.push(
          recommendationEngine.getRecommendations({
            userId: `user${(i % 3) + 1}`,
            algorithmType: 'personal',
            limit: 5
          })
        );
      }

      const results = await Promise.all(promises);
      
      expect(results.length).toBe(numberOfRequests);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('اختبارات الأمان', () => {
    it('يجب أن يتعامل مع معرف مستخدم غير صحيح', async () => {
      const recommendations = await recommendationEngine.getRecommendations({
        userId: 'invalid-user-id',
        algorithmType: 'personal',
        limit: 5
      });

      // يجب أن يُرجع توصيات افتراضية
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('يجب أن يتعامل مع معاملات غير صحيحة', async () => {
      const recommendations = await recommendationEngine.getRecommendations({
        userId: 'user1',
        algorithmType: 'invalid' as any,
        limit: -1
      });

      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('يجب أن يحمي من حقن SQL', async () => {
      const maliciousUserId = "'; DROP TABLE users; --";
      
      const recommendations = await recommendationEngine.getRecommendations({
        userId: maliciousUserId,
        algorithmType: 'personal',
        limit: 5
      });

      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('اختبارات التكامل', () => {
    it('يجب أن يتكامل مع جميع الخوارزميات', async () => {
      const algorithms = ['personal', 'collaborative', 'graph', 'trending', 'mixed'];
      
      for (const algorithm of algorithms) {
        const recommendations = await recommendationEngine.getRecommendations({
          userId: 'user1',
          algorithmType: algorithm as any,
          limit: 3
        });

        expect(Array.isArray(recommendations)).toBe(true);
        expect(recommendations.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

// دوال مساعدة للاختبار

async function setupTestData() {
  // إنشاء المستخدمين
  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user
    });
  }

  // إنشاء الفئات
  for (const category of testCategories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category
    });
  }

  // إنشاء المقالات
  for (const article of testArticles) {
    await prisma.article.upsert({
      where: { id: article.id },
      update: {},
      create: article
    });
  }
}

async function cleanupTestData() {
  // حذف البيانات بالترتيب الصحيح لتجنب مشاكل المفاتيح الخارجية
  await prisma.recommendationLog.deleteMany({
    where: { user_id: { in: testUsers.map(u => u.id) } }
  });
  
  await prisma.userInterestProfile.deleteMany({
    where: { user_id: { in: testUsers.map(u => u.id) } }
  });
  
  await prisma.analyticsEvent.deleteMany({
    where: { user_id: { in: testUsers.map(u => u.id) } }
  });
  
  await prisma.articleLike.deleteMany({
    where: { user_id: { in: testUsers.map(u => u.id) } }
  });
  
  await prisma.article.deleteMany({
    where: { id: { in: testArticles.map(a => a.id) } }
  });
  
  await prisma.category.deleteMany({
    where: { id: { in: testCategories.map(c => c.id) } }
  });
  
  await prisma.user.deleteMany({
    where: { id: { in: testUsers.map(u => u.id) } }
  });
}

async function createSharedInteractions() {
  // إنشاء إعجابات مشتركة
  await prisma.articleLike.createMany({
    data: [
      { user_id: 'user1', article_id: 'article1' },
      { user_id: 'user2', article_id: 'article1' },
      { user_id: 'user2', article_id: 'article2' },
      { user_id: 'user3', article_id: 'article2' }
    ],
    skipDuplicates: true
  });

  // إنشاء أحداث تحليلية
  await prisma.analyticsEvent.createMany({
    data: [
      {
        user_id: 'user1',
        article_id: 'article1',
        event_type: 'like',
        event_data: {},
        timestamp: new Date()
      },
      {
        user_id: 'user2',
        article_id: 'article1',
        event_type: 'like',
        event_data: {},
        timestamp: new Date()
      },
      {
        user_id: 'user2',
        article_id: 'article2',
        event_type: 'share',
        event_data: {},
        timestamp: new Date()
      }
    ],
    skipDuplicates: true
  });
}

async function createGraphInteractions() {
  await prisma.analyticsEvent.createMany({
    data: [
      {
        user_id: 'user1',
        article_id: 'article1',
        event_type: 'like',
        event_data: {},
        timestamp: new Date()
      },
      {
        user_id: 'user1',
        article_id: 'article2',
        event_type: 'reading_time',
        event_data: { duration: 300 },
        timestamp: new Date()
      },
      {
        user_id: 'user2',
        article_id: 'article1',
        event_type: 'share',
        event_data: {},
        timestamp: new Date()
      },
      {
        user_id: 'user2',
        article_id: 'article3',
        event_type: 'comment',
        event_data: {},
        timestamp: new Date()
      },
      {
        user_id: 'user3',
        article_id: 'article2',
        event_type: 'like',
        event_data: {},
        timestamp: new Date()
      }
    ],
    skipDuplicates: true
  });
}

async function createPerformanceData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.recommendationMetrics.createMany({
    data: [
      {
        algorithm_type: 'personal',
        total_shown: 100,
        total_clicked: 25,
        total_liked: 15,
        total_disliked: 5,
        date: today
      },
      {
        algorithm_type: 'collaborative',
        total_shown: 80,
        total_clicked: 20,
        total_liked: 12,
        total_disliked: 3,
        date: today
      }
    ],
    skipDuplicates: true
  });
} 