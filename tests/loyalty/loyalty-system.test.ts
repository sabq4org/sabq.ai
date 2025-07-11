import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { addLoyaltyPoints, checkAndAwardBadges, updateDailyStreak } from '../../lib/loyalty-engine';
import { LoyaltyIntegration } from '../../lib/loyalty-integration';
import { LoyaltySecurityManager } from '../../lib/loyalty-security';
import { LoyaltyAnalyticsManager } from '../../lib/loyalty-analytics';

// Mock Prisma Client
const prisma = new PrismaClient();

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date('2024-01-01'),
  is_active: true
};

const mockArticle = {
  id: 'article-123',
  title: 'Test Article',
  author_id: 'user-123',
  status: 'published',
  created_at: new Date()
};

const mockComment = {
  id: 'comment-123',
  content: 'Test comment',
  user_id: 'user-123',
  article_id: 'article-123',
  created_at: new Date()
};

describe('نظام النقاط والشارات', () => {
  
  beforeEach(async () => {
    // إعداد البيانات التجريبية
    await prisma.user.create({ data: mockUser });
    await prisma.article.create({ data: mockArticle });
    await prisma.articleComment.create({ data: mockComment });
  });

  afterEach(async () => {
    // تنظيف البيانات التجريبية
    await prisma.loyaltyPoint.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.userLoyaltyStats.deleteMany();
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.realTimeNotification.deleteMany();
    await prisma.articleComment.deleteMany();
    await prisma.article.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('محرك النقاط الأساسي', () => {
    
    it('يجب أن يضيف النقاط بنجاح', async () => {
      const result = await addLoyaltyPoints(
        mockUser.id,
        'comment',
        5,
        mockComment.id,
        'comment'
      );

      expect(result.success).toBe(true);
      expect(result.points).toBe(5);
      expect(result.newTotal).toBe(5);

      // التحقق من قاعدة البيانات
      const loyaltyPoint = await prisma.loyaltyPoint.findFirst({
        where: { user_id: mockUser.id }
      });
      expect(loyaltyPoint).not.toBeNull();
      expect(loyaltyPoint?.points).toBe(5);
      expect(loyaltyPoint?.action_type).toBe('comment');
    });

    it('يجب أن ينشئ إحصائيات المستخدم عند أول نقطة', async () => {
      await addLoyaltyPoints(mockUser.id, 'comment', 10);

      const stats = await prisma.userLoyaltyStats.findUnique({
        where: { user_id: mockUser.id }
      });

      expect(stats).not.toBeNull();
      expect(stats?.current_points).toBe(10);
      expect(stats?.total_points_earned).toBe(10);
      expect(stats?.lifetime_points).toBe(10);
    });

    it('يجب أن يسجل معاملة النقاط', async () => {
      await addLoyaltyPoints(mockUser.id, 'comment', 5);

      const transaction = await prisma.loyaltyTransaction.findFirst({
        where: { user_id: mockUser.id }
      });

      expect(transaction).not.toBeNull();
      expect(transaction?.transaction_type).toBe('earn');
      expect(transaction?.points_amount).toBe(5);
      expect(transaction?.balance_before).toBe(0);
      expect(transaction?.balance_after).toBe(5);
    });

    it('يجب أن يرفض النقاط السالبة بدون سبب', async () => {
      const result = await addLoyaltyPoints(
        mockUser.id,
        'invalid_action',
        0
      );

      expect(result.success).toBe(false);
      expect(result.points).toBe(0);
    });

    it('يجب أن يتعامل مع النقاط السالبة (العقوبات)', async () => {
      // إضافة نقاط أولاً
      await addLoyaltyPoints(mockUser.id, 'comment', 20);
      
      // تطبيق عقوبة
      const result = await addLoyaltyPoints(
        mockUser.id,
        'spam_penalty',
        -10
      );

      expect(result.success).toBe(true);
      expect(result.points).toBe(-10);
      expect(result.newTotal).toBe(10);
    });
  });

  describe('نظام الشارات', () => {
    
    beforeEach(async () => {
      // إنشاء شارات تجريبية
      await prisma.badge.createMany({
        data: [
          {
            id: 'badge-1',
            name: 'first_comment',
            name_ar: 'أول تعليق',
            description: 'First comment badge',
            description_ar: 'شارة أول تعليق',
            icon: '💬',
            category: 'engagement',
            tier: 'bronze',
            conditions: { action: 'first_comment' },
            is_active: true
          },
          {
            id: 'badge-2',
            name: 'active_commenter',
            name_ar: 'معلق نشط',
            description: 'Active commenter badge',
            description_ar: 'شارة المعلق النشط',
            icon: '🗣️',
            category: 'engagement',
            tier: 'silver',
            conditions: { action: 'comment', count: 10 },
            is_active: true
          }
        ]
      });
    });

    it('يجب أن يمنح شارة أول تعليق', async () => {
      // إضافة تعليق أول
      await addLoyaltyPoints(mockUser.id, 'comment', 5, mockComment.id, 'comment');
      await checkAndAwardBadges(mockUser.id);

      const userBadge = await prisma.userBadge.findFirst({
        where: { user_id: mockUser.id, badge_id: 'badge-1' }
      });

      expect(userBadge).not.toBeNull();
    });

    it('يجب أن يمنح شارة المعلق النشط بعد 10 تعليقات', async () => {
      // إضافة 10 تعليقات
      for (let i = 0; i < 10; i++) {
        await prisma.articleComment.create({
          data: {
            id: `comment-${i}`,
            content: `Comment ${i}`,
            user_id: mockUser.id,
            article_id: mockArticle.id
          }
        });
      }

      await checkAndAwardBadges(mockUser.id);

      const userBadge = await prisma.userBadge.findFirst({
        where: { user_id: mockUser.id, badge_id: 'badge-2' }
      });

      expect(userBadge).not.toBeNull();
    });

    it('يجب ألا يمنح نفس الشارة مرتين', async () => {
      // منح الشارة أول مرة
      await checkAndAwardBadges(mockUser.id);
      
      // محاولة منح الشارة مرة أخرى
      await checkAndAwardBadges(mockUser.id);

      const badgeCount = await prisma.userBadge.count({
        where: { user_id: mockUser.id, badge_id: 'badge-1' }
      });

      expect(badgeCount).toBe(1);
    });

    it('يجب أن يضيف نقاط إضافية عند منح الشارة', async () => {
      const initialPoints = await addLoyaltyPoints(mockUser.id, 'comment', 5);
      await checkAndAwardBadges(mockUser.id);

      const finalStats = await prisma.userLoyaltyStats.findUnique({
        where: { user_id: mockUser.id }
      });

      expect(finalStats?.current_points).toBeGreaterThan(initialPoints.newTotal);
    });
  });

  describe('السلسلة اليومية', () => {
    
    it('يجب أن تبدأ السلسلة من 1', async () => {
      await updateDailyStreak(mockUser.id);

      const stats = await prisma.userLoyaltyStats.findUnique({
        where: { user_id: mockUser.id }
      });

      expect(stats?.current_streak).toBe(1);
      expect(stats?.longest_streak).toBe(1);
    });

    it('يجب أن تزيد السلسلة يومياً', async () => {
      // اليوم الأول
      await updateDailyStreak(mockUser.id);
      
      // محاكاة اليوم التالي
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      jest.spyOn(Date, 'now').mockReturnValue(tomorrow.getTime());
      
      await updateDailyStreak(mockUser.id);

      const stats = await prisma.userLoyaltyStats.findUnique({
        where: { user_id: mockUser.id }
      });

      expect(stats?.current_streak).toBe(2);
      expect(stats?.longest_streak).toBe(2);
    });

    it('يجب أن تنقطع السلسلة بعد يومين', async () => {
      // اليوم الأول
      await updateDailyStreak(mockUser.id);
      
      // محاكاة بعد يومين
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      jest.spyOn(Date, 'now').mockReturnValue(dayAfterTomorrow.getTime());
      
      await updateDailyStreak(mockUser.id);

      const stats = await prisma.userLoyaltyStats.findUnique({
        where: { user_id: mockUser.id }
      });

      expect(stats?.current_streak).toBe(1);
      expect(stats?.longest_streak).toBe(1);
    });
  });

  describe('نظام التكامل', () => {
    
    it('يجب أن يسجل حدث التعليق', async () => {
      await LoyaltyIntegration.logInteractionEvent(
        mockUser.id,
        'comment_added',
        mockComment.id
      );

      const loyaltyPoint = await prisma.loyaltyPoint.findFirst({
        where: { user_id: mockUser.id, action_type: 'comment' }
      });

      expect(loyaltyPoint).not.toBeNull();
    });

    it('يجب أن يسجل حدث الإعجاب', async () => {
      await LoyaltyIntegration.logInteractionEvent(
        mockUser.id,
        'like_added',
        'like-123',
        'article',
        { targetId: mockArticle.id }
      );

      const loyaltyPoint = await prisma.loyaltyPoint.findFirst({
        where: { user_id: mockUser.id, action_type: 'like_article' }
      });

      expect(loyaltyPoint).not.toBeNull();
    });

    it('يجب أن يسجل حدث المشاركة', async () => {
      await LoyaltyIntegration.logInteractionEvent(
        mockUser.id,
        'article_shared',
        'share-123',
        undefined,
        { articleId: mockArticle.id, platform: 'twitter' }
      );

      const loyaltyPoint = await prisma.loyaltyPoint.findFirst({
        where: { user_id: mockUser.id, action_type: 'share_article' }
      });

      expect(loyaltyPoint).not.toBeNull();
    });

    it('يجب أن يحصل على ملخص النقاط', async () => {
      await addLoyaltyPoints(mockUser.id, 'comment', 10);
      
      const summary = await LoyaltyIntegration.getUserLoyaltySummary(mockUser.id);

      expect(summary).not.toBeNull();
      expect(summary?.stats?.current_points).toBe(10);
    });
  });

  describe('نظام الأمان', () => {
    
    it('يجب أن يمرر الفحص الأمني للنشاط العادي', async () => {
      const securityCheck = await LoyaltySecurityManager.performSecurityCheck(
        mockUser.id,
        'comment',
        {
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      );

      expect(securityCheck.allowed).toBe(true);
      expect(securityCheck.risk_score).toBeLessThan(50);
    });

    it('يجب أن يرفض النشاط المشبوه', async () => {
      // محاكاة نشاط مشبوه - تعليقات سريعة متتالية
      for (let i = 0; i < 10; i++) {
        await addLoyaltyPoints(mockUser.id, 'comment', 5);
      }

      const securityCheck = await LoyaltySecurityManager.performSecurityCheck(
        mockUser.id,
        'comment',
        {
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0'
        }
      );

      expect(securityCheck.allowed).toBe(false);
      expect(securityCheck.risk_score).toBeGreaterThan(50);
    });

    it('يجب أن يتحقق من حدود المعدل', async () => {
      // تجاوز الحد المسموح في الدقيقة
      for (let i = 0; i < 6; i++) {
        await addLoyaltyPoints(mockUser.id, 'comment', 5);
      }

      const rateLimitCheck = await LoyaltySecurityManager.checkRateLimit(mockUser.id, 'comment');

      expect(rateLimitCheck.allowed).toBe(false);
      expect(rateLimitCheck.reason).toContain('تجاوز الحد المسموح');
    });

    it('يجب أن يحظر المستخدم المشبوه', async () => {
      await LoyaltySecurityManager.blockUser(
        mockUser.id,
        'temporary',
        'نشاط مشبوه'
      );

      const blockStatus = await LoyaltySecurityManager.checkBlockStatus(mockUser.id);

      expect(blockStatus.blocked).toBe(true);
      expect(blockStatus.reason).toBe('نشاط مشبوه');
    });

    it('يجب أن يحدث نقاط الخطر', async () => {
      await LoyaltySecurityManager.updateRiskScore(mockUser.id, 25);

      const profile = await prisma.userSecurityProfile.findUnique({
        where: { user_id: mockUser.id }
      });

      expect(profile?.risk_score).toBe(25);
    });
  });

  describe('نظام التحليلات', () => {
    
    beforeEach(async () => {
      // إضافة بيانات تجريبية للتحليلات
      await addLoyaltyPoints(mockUser.id, 'comment', 10);
      await addLoyaltyPoints(mockUser.id, 'like_article', 5);
      await checkAndAwardBadges(mockUser.id);
    });

    it('يجب أن ينشئ تقرير تحليلي', async () => {
      const timeframe = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
        period: 'day' as const
      };

      const report = await LoyaltyAnalyticsManager.generateAnalyticsReport(timeframe);

      expect(report).toHaveProperty('overview');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('distribution');
      expect(report).toHaveProperty('leaderboards');
      expect(report).toHaveProperty('insights');
    });

    it('يجب أن يحسب الإحصائيات العامة', async () => {
      const timeframe = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
        period: 'day' as const
      };

      const overview = await LoyaltyAnalyticsManager.getOverviewAnalytics(timeframe);

      expect(overview.total_users).toBeGreaterThan(0);
      expect(overview.total_points_distributed).toBeGreaterThan(0);
      expect(overview.engagement_rate).toBeGreaterThanOrEqual(0);
    });

    it('يجب أن يحسب معدل الاحتفاظ', async () => {
      const timeframe = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
        period: 'day' as const
      };

      const retentionData = await LoyaltyAnalyticsManager.calculateRetentionRate(timeframe);

      expect(retentionData).toHaveProperty('retention_rate');
      expect(retentionData).toHaveProperty('churn_rate');
      expect(retentionData.retention_rate).toBeGreaterThanOrEqual(0);
      expect(retentionData.churn_rate).toBeGreaterThanOrEqual(0);
    });

    it('يجب أن يحسب معدل إكمال الشارات', async () => {
      const completionRates = await LoyaltyAnalyticsManager.calculateBadgeCompletionRate();

      expect(completionRates).toBeInstanceOf(Object);
      Object.values(completionRates).forEach(rate => {
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      });
    });

    it('يجب أن ينشئ تقرير مخصص', async () => {
      const timeframe = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
        period: 'day' as const
      };

      const customReport = await LoyaltyAnalyticsManager.generateCustomReport(
        ['user_growth', 'engagement_metrics'],
        {},
        timeframe
      );

      expect(customReport).toHaveProperty('user_growth');
      expect(customReport).toHaveProperty('engagement_metrics');
    });
  });

  describe('اختبارات الأداء', () => {
    
    it('يجب أن يتعامل مع إضافة نقاط متعددة بسرعة', async () => {
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(addLoyaltyPoints(mockUser.id, 'comment', 1));
      }
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // أقل من 5 ثوان
      
      const stats = await prisma.userLoyaltyStats.findUnique({
        where: { user_id: mockUser.id }
      });
      
      expect(stats?.current_points).toBe(100);
    });

    it('يجب أن يتعامل مع فحص أمني متعدد', async () => {
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          LoyaltySecurityManager.performSecurityCheck(
            mockUser.id,
            'comment',
            { ip_address: '192.168.1.1', user_agent: 'test' }
          )
        );
      }
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(3000); // أقل من 3 ثوان
    });
  });

  describe('اختبارات حالات الخطأ', () => {
    
    it('يجب أن يتعامل مع مستخدم غير موجود', async () => {
      const result = await addLoyaltyPoints(
        'nonexistent-user',
        'comment',
        5
      );

      expect(result.success).toBe(false);
    });

    it('يجب أن يتعامل مع نوع عمل غير صحيح', async () => {
      const result = await addLoyaltyPoints(
        mockUser.id,
        'invalid_action_type',
        5
      );

      expect(result.success).toBe(false);
    });

    it('يجب أن يتعامل مع خطأ في قاعدة البيانات', async () => {
      // محاكاة خطأ في قاعدة البيانات
      jest.spyOn(prisma.loyaltyPoint, 'create').mockRejectedValue(new Error('Database error'));

      const result = await addLoyaltyPoints(
        mockUser.id,
        'comment',
        5
      );

      expect(result.success).toBe(false);
    });

    it('يجب أن يتعامل مع بيانات تالفة', async () => {
      // إنشاء بيانات تالفة
      await prisma.userLoyaltyStats.create({
        data: {
          user_id: mockUser.id,
          current_points: -100, // قيمة سالبة غير صحيحة
          total_points_earned: 0,
          lifetime_points: 0
        }
      });

      const result = await addLoyaltyPoints(
        mockUser.id,
        'comment',
        5
      );

      expect(result.success).toBe(true);
      expect(result.newTotal).toBeGreaterThan(0);
    });
  });

  describe('اختبارات التوافق', () => {
    
    it('يجب أن يحافظ على سلامة البيانات', async () => {
      // إضافة نقاط متعددة
      await addLoyaltyPoints(mockUser.id, 'comment', 10);
      await addLoyaltyPoints(mockUser.id, 'like_article', 5);
      await addLoyaltyPoints(mockUser.id, 'share_article', 3);

      // التحقق من التوافق
      const stats = await prisma.userLoyaltyStats.findUnique({
        where: { user_id: mockUser.id }
      });

      const totalPoints = await prisma.loyaltyPoint.aggregate({
        _sum: { points: true },
        where: { user_id: mockUser.id }
      });

      expect(stats?.current_points).toBe(totalPoints._sum.points);
      expect(stats?.total_points_earned).toBe(totalPoints._sum.points);
      expect(stats?.lifetime_points).toBe(totalPoints._sum.points);
    });

    it('يجب أن يحافظ على عدد الشارات', async () => {
      await checkAndAwardBadges(mockUser.id);

      const stats = await prisma.userLoyaltyStats.findUnique({
        where: { user_id: mockUser.id }
      });

      const badgeCount = await prisma.userBadge.count({
        where: { user_id: mockUser.id }
      });

      expect(stats?.badges_count).toBe(badgeCount);
    });
  });
});

describe('اختبارات API', () => {
  
  describe('API النقاط والشارات', () => {
    
    it('يجب أن يجلب نقاط المستخدم', async () => {
      // محاكاة طلب HTTP
      const mockRequest = {
        method: 'GET',
        url: `/api/users/${mockUser.id}/loyalty`,
        headers: { authorization: 'Bearer valid-token' }
      };

      // هذا يتطلب إعداد محاكاة للـ API
      // يمكن استخدام supertest أو مكتبة مشابهة
    });

    it('يجب أن يضيف نقاط يدوياً (إدارة)', async () => {
      // محاكاة طلب إضافة نقاط من الإدارة
      const mockRequest = {
        method: 'POST',
        url: `/api/users/${mockUser.id}/loyalty`,
        body: { points: 50, reason: 'مكافأة إدارية' },
        headers: { authorization: 'Bearer admin-token' }
      };

      // اختبار الصلاحيات والوظائف
    });
  });

  describe('API الإشعارات', () => {
    
    it('يجب أن يجلب إشعارات المستخدم', async () => {
      // إنشاء إشعار تجريبي
      await prisma.realTimeNotification.create({
        data: {
          user_id: mockUser.id,
          type: 'badge_earned',
          category: 'loyalty',
          title: 'شارة جديدة',
          message: 'حصلت على شارة جديدة',
          read: false
        }
      });

      // محاكاة طلب جلب الإشعارات
      const mockRequest = {
        method: 'GET',
        url: `/api/users/${mockUser.id}/notifications`,
        headers: { authorization: 'Bearer valid-token' }
      };

      // اختبار الاستجابة
    });
  });
});

// تنظيف بعد جميع الاختبارات
afterAll(async () => {
  await prisma.$disconnect();
}); 