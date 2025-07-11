import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * محرك التوصيات الذكية
 * يحلل سلوك المستخدمين ويقدم توصيات مخصصة للمحتوى
 */
export class RecommendationsEngine {
  private static instance: RecommendationsEngine;
  private readonly MIN_INTERACTIONS = 3; // الحد الأدنى من التفاعلات لبناء التوصيات
  private readonly MAX_RECOMMENDATIONS = 10; // الحد الأقصى للتوصيات
  private readonly SIMILARITY_THRESHOLD = 0.3; // عتبة التشابه

  private constructor() {}

  public static getInstance(): RecommendationsEngine {
    if (!RecommendationsEngine.instance) {
      RecommendationsEngine.instance = new RecommendationsEngine();
    }
    return RecommendationsEngine.instance;
  }

  /**
   * إنشاء توصيات للمستخدم بناءً على سلوكه واهتماماته
   */
  async generateRecommendations(
    userId: string,
    options: {
      type?: 'content' | 'category' | 'mixed';
      limit?: number;
      excludeViewed?: boolean;
      timeWindow?: number; // بالأيام
    } = {}
  ): Promise<{
    recommendations: Recommendation[];
    reasoning: RecommendationReasoning[];
    confidence: number;
  }> {
    const {
      type = 'mixed',
      limit = 5,
      excludeViewed = true,
      timeWindow = 30,
    } = options;

    try {
      // جلب بيانات المستخدم والسلوك
      const userProfile = await this.getUserProfile(userId);
      const userBehavior = await this.getUserBehavior(userId, timeWindow);
      const userInterests = await this.getUserInterests(userId);

      // التحقق من توفر بيانات كافية
      if (!userProfile || userBehavior.totalInteractions < this.MIN_INTERACTIONS) {
        return await this.generateDefaultRecommendations(userId, limit);
      }

      // إنشاء توصيات مختلطة
      const recommendations: Recommendation[] = [];
      const reasoning: RecommendationReasoning[] = [];

      // 1. التوصيات القائمة على المحتوى (Content-Based)
      if (type === 'content' || type === 'mixed') {
        const contentBasedRecs = await this.generateContentBasedRecommendations(
          userId,
          userInterests,
          userBehavior,
          Math.ceil(limit * 0.4)
        );
        recommendations.push(...contentBasedRecs.recommendations);
        reasoning.push(...contentBasedRecs.reasoning);
      }

      // 2. التوصيات التعاونية (Collaborative Filtering)
      if (type === 'mixed') {
        const collaborativeRecs = await this.generateCollaborativeRecommendations(
          userId,
          userBehavior,
          Math.ceil(limit * 0.3)
        );
        recommendations.push(...collaborativeRecs.recommendations);
        reasoning.push(...collaborativeRecs.reasoning);
      }

      // 3. التوصيات الشائعة والمتداولة
      if (type === 'category' || type === 'mixed') {
        const trendingRecs = await this.generateTrendingRecommendations(
          userId,
          userInterests,
          Math.ceil(limit * 0.3)
        );
        recommendations.push(...trendingRecs.recommendations);
        reasoning.push(...trendingRecs.reasoning);
      }

      // تنظيف التوصيات المكررة
      const uniqueRecommendations = this.removeDuplicateRecommendations(recommendations);

      // ترتيب التوصيات حسب الأهمية
      const sortedRecommendations = this.sortRecommendationsByScore(uniqueRecommendations);

      // تطبيق الفلاتر
      let filteredRecommendations = sortedRecommendations;
      
      if (excludeViewed) {
        filteredRecommendations = await this.filterViewedContent(userId, filteredRecommendations);
      }

      // تحديد الثقة في التوصيات
      const confidence = this.calculateConfidence(userBehavior, filteredRecommendations);

      return {
        recommendations: filteredRecommendations.slice(0, limit),
        reasoning,
        confidence,
      };

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return await this.generateDefaultRecommendations(userId, limit);
    }
  }

  /**
   * تحليل اهتمامات المستخدم بناءً على سلوكه
   */
  async analyzeUserInterests(userId: string): Promise<UserInterestAnalysis> {
    try {
      const timeWindow = 90; // آخر 90 يوم
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeWindow);

      // جلب تفاعلات المستخدم
      const interactions = await prisma.analyticsEvent.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: cutoffDate,
          },
          event_type: {
            in: ['page_view', 'article_read', 'article_like', 'article_share', 'search'],
          },
        },
        include: {
          metadata: true,
        },
      });

      // تحليل الفئات
      const categoryInterests = this.analyzeCategoryInterests(interactions);
      
      // تحليل الكلمات المفتاحية
      const keywordInterests = this.analyzeKeywordInterests(interactions);
      
      // تحليل أنماط القراءة
      const readingPatterns = this.analyzeReadingPatterns(interactions);
      
      // تحليل التفاعل الاجتماعي
      const socialInteractions = this.analyzeSocialInteractions(interactions);

      // حساب درجة الاهتمام الإجمالية
      const overallEngagement = this.calculateOverallEngagement(interactions);

      return {
        userId,
        categoryInterests,
        keywordInterests,
        readingPatterns,
        socialInteractions,
        overallEngagement,
        lastUpdated: new Date(),
        dataPoints: interactions.length,
      };

    } catch (error) {
      console.error('Error analyzing user interests:', error);
      throw error;
    }
  }

  /**
   * تحديث اهتمامات المستخدم في قاعدة البيانات
   */
  async updateUserInterests(userId: string, analysis: UserInterestAnalysis): Promise<void> {
    try {
      // حذف الاهتمامات القديمة
      await prisma.userInterest.deleteMany({
        where: { user_id: userId },
      });

      // إضافة الاهتمامات الجديدة
      const interests = [];

      // إضافة اهتمامات الفئات
      for (const [category, score] of Object.entries(analysis.categoryInterests)) {
        if (score > 0.1) { // فقط الاهتمامات المهمة
          interests.push({
            user_id: userId,
            interest_type: 'category',
            interest_value: category,
            weight: score,
            created_at: new Date(),
          });
        }
      }

      // إضافة اهتمامات الكلمات المفتاحية
      for (const [keyword, score] of Object.entries(analysis.keywordInterests)) {
        if (score > 0.1) {
          interests.push({
            user_id: userId,
            interest_type: 'keyword',
            interest_value: keyword,
            weight: score,
            created_at: new Date(),
          });
        }
      }

      // إضافة الاهتمامات إلى قاعدة البيانات
      if (interests.length > 0) {
        await prisma.userInterest.createMany({
          data: interests,
        });
      }

      // تحديث سلوك المستخدم
      await this.updateUserBehaviorProfile(userId, analysis);

    } catch (error) {
      console.error('Error updating user interests:', error);
      throw error;
    }
  }

  /**
   * إنشاء توصيات قائمة على المحتوى
   */
  private async generateContentBasedRecommendations(
    userId: string,
    userInterests: UserInterest[],
    userBehavior: UserBehaviorData,
    limit: number
  ): Promise<{
    recommendations: Recommendation[];
    reasoning: RecommendationReasoning[];
  }> {
    const recommendations: Recommendation[] = [];
    const reasoning: RecommendationReasoning[] = [];

    try {
      // جلب المحتوى المشابه بناءً على الاهتمامات
      const categoryInterests = userInterests.filter(i => i.interest_type === 'category');
      const keywordInterests = userInterests.filter(i => i.interest_type === 'keyword');

      if (categoryInterests.length === 0 && keywordInterests.length === 0) {
        return { recommendations, reasoning };
      }

      // البحث عن محتوى مشابه
      const similarContent = await this.findSimilarContent(
        categoryInterests,
        keywordInterests,
        limit * 2 // جلب أكثر للتصفية
      );

      // تسجيل التوصيات
      for (const content of similarContent.slice(0, limit)) {
        const recommendation: Recommendation = {
          id: `content_${content.id}`,
          user_id: userId,
          content_type: 'article',
          content_id: content.id,
          title: content.title,
          description: content.description,
          url: content.url,
          score: content.similarityScore,
          reason_type: 'content_similarity',
          reason_data: {
            matchedCategories: content.matchedCategories,
            matchedKeywords: content.matchedKeywords,
          },
          created_at: new Date(),
        };

        recommendations.push(recommendation);

        // إضافة التفسير
        reasoning.push({
          recommendationId: recommendation.id,
          type: 'content_similarity',
          explanation: `محتوى مشابه لاهتماماتك في ${content.matchedCategories.join(', ')}`,
          confidence: content.similarityScore,
          factors: [
            ...content.matchedCategories.map(cat => `الفئة: ${cat}`),
            ...content.matchedKeywords.map(kw => `الكلمة المفتاحية: ${kw}`),
          ],
        });
      }

    } catch (error) {
      console.error('Error generating content-based recommendations:', error);
    }

    return { recommendations, reasoning };
  }

  /**
   * إنشاء توصيات تعاونية
   */
  private async generateCollaborativeRecommendations(
    userId: string,
    userBehavior: UserBehaviorData,
    limit: number
  ): Promise<{
    recommendations: Recommendation[];
    reasoning: RecommendationReasoning[];
  }> {
    const recommendations: Recommendation[] = [];
    const reasoning: RecommendationReasoning[] = [];

    try {
      // العثور على مستخدمين مشابهين
      const similarUsers = await this.findSimilarUsers(userId, userBehavior);

      if (similarUsers.length === 0) {
        return { recommendations, reasoning };
      }

      // جلب المحتوى الذي أعجب المستخدمين المشابهين
      const collaborativeContent = await this.getContentFromSimilarUsers(
        userId,
        similarUsers,
        limit * 2
      );

      // تسجيل التوصيات
      for (const content of collaborativeContent.slice(0, limit)) {
        const recommendation: Recommendation = {
          id: `collab_${content.id}`,
          user_id: userId,
          content_type: 'article',
          content_id: content.id,
          title: content.title,
          description: content.description,
          url: content.url,
          score: content.collaborativeScore,
          reason_type: 'collaborative_filtering',
          reason_data: {
            similarUsers: content.similarUsers,
            commonInteractions: content.commonInteractions,
          },
          created_at: new Date(),
        };

        recommendations.push(recommendation);

        // إضافة التفسير
        reasoning.push({
          recommendationId: recommendation.id,
          type: 'collaborative_filtering',
          explanation: `أعجب مستخدمين مشابهين لك بهذا المحتوى`,
          confidence: content.collaborativeScore,
          factors: [
            `${content.similarUsers.length} مستخدمين مشابهين`,
            `${content.commonInteractions} تفاعل مشترك`,
          ],
        });
      }

    } catch (error) {
      console.error('Error generating collaborative recommendations:', error);
    }

    return { recommendations, reasoning };
  }

  /**
   * إنشاء توصيات المحتوى الشائع والمتداول
   */
  private async generateTrendingRecommendations(
    userId: string,
    userInterests: UserInterest[],
    limit: number
  ): Promise<{
    recommendations: Recommendation[];
    reasoning: RecommendationReasoning[];
  }> {
    const recommendations: Recommendation[] = [];
    const reasoning: RecommendationReasoning[] = [];

    try {
      // جلب المحتوى الشائع في الفئات المهتم بها المستخدم
      const trendingContent = await this.getTrendingContent(userInterests, limit * 2);

      // تسجيل التوصيات
      for (const content of trendingContent.slice(0, limit)) {
        const recommendation: Recommendation = {
          id: `trend_${content.id}`,
          user_id: userId,
          content_type: 'article',
          content_id: content.id,
          title: content.title,
          description: content.description,
          url: content.url,
          score: content.trendingScore,
          reason_type: 'trending',
          reason_data: {
            views: content.views,
            interactions: content.interactions,
            category: content.category,
          },
          created_at: new Date(),
        };

        recommendations.push(recommendation);

        // إضافة التفسير
        reasoning.push({
          recommendationId: recommendation.id,
          type: 'trending',
          explanation: `محتوى شائع في فئة ${content.category}`,
          confidence: content.trendingScore,
          factors: [
            `${content.views} مشاهدة`,
            `${content.interactions} تفاعل`,
            `شائع في ${content.category}`,
          ],
        });
      }

    } catch (error) {
      console.error('Error generating trending recommendations:', error);
    }

    return { recommendations, reasoning };
  }

  /**
   * حفظ التوصيات في قاعدة البيانات
   */
  async saveRecommendations(recommendations: Recommendation[]): Promise<void> {
    try {
      if (recommendations.length === 0) return;

      // حفظ التوصيات
      await prisma.recommendation.createMany({
        data: recommendations.map(rec => ({
          id: rec.id,
          user_id: rec.user_id,
          content_type: rec.content_type,
          content_id: rec.content_id,
          title: rec.title,
          description: rec.description,
          url: rec.url,
          score: rec.score,
          reason_type: rec.reason_type,
          reason_data: rec.reason_data,
          created_at: rec.created_at,
        })),
      });

    } catch (error) {
      console.error('Error saving recommendations:', error);
      throw error;
    }
  }

  /**
   * تسجيل ردود فعل المستخدم على التوصيات
   */
  async recordRecommendationFeedback(
    userId: string,
    recommendationId: string,
    feedback: 'like' | 'dislike' | 'view' | 'click' | 'share',
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.recommendationReasonFeedback.create({
        data: {
          user_id: userId,
          recommendation_id: recommendationId,
          feedback_type: feedback,
          feedback_data: metadata || {},
          created_at: new Date(),
        },
      });

      // تحديث درجة التوصية بناءً على الردود
      await this.updateRecommendationScore(recommendationId, feedback);

    } catch (error) {
      console.error('Error recording recommendation feedback:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات التوصيات
   */
  async getRecommendationStats(userId?: string): Promise<RecommendationStats> {
    try {
      const whereClause = userId ? { user_id: userId } : {};

      const [
        totalRecommendations,
        totalFeedback,
        avgScore,
        topReasonTypes,
        recentPerformance,
      ] = await Promise.all([
        prisma.recommendation.count({ where: whereClause }),
        prisma.recommendationReasonFeedback.count({ where: whereClause }),
        prisma.recommendation.aggregate({
          where: whereClause,
          _avg: { score: true },
        }),
        prisma.recommendation.groupBy({
          by: ['reason_type'],
          where: whereClause,
          _count: true,
          orderBy: { _count: { reason_type: 'desc' } },
          take: 5,
        }),
        this.getRecentRecommendationPerformance(userId),
      ]);

      return {
        totalRecommendations,
        totalFeedback,
        averageScore: avgScore._avg.score || 0,
        topReasonTypes: topReasonTypes.map(item => ({
          type: item.reason_type,
          count: item._count,
        })),
        recentPerformance,
        lastUpdated: new Date(),
      };

    } catch (error) {
      console.error('Error getting recommendation stats:', error);
      throw error;
    }
  }

  // Helper methods (private)

  private async getUserProfile(userId: string): Promise<any> {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
  }

  private async getUserBehavior(userId: string, timeWindow: number): Promise<UserBehaviorData> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        user_id: userId,
        created_at: { gte: cutoffDate },
      },
    });

    return {
      totalInteractions: events.length,
      viewEvents: events.filter(e => e.event_type === 'page_view').length,
      readEvents: events.filter(e => e.event_type === 'article_read').length,
      likeEvents: events.filter(e => e.event_type === 'article_like').length,
      shareEvents: events.filter(e => e.event_type === 'article_share').length,
      searchEvents: events.filter(e => e.event_type === 'search').length,
      avgSessionDuration: this.calculateAvgSessionDuration(events),
      preferredCategories: this.extractPreferredCategories(events),
      activityPattern: this.analyzeActivityPattern(events),
    };
  }

  private async getUserInterests(userId: string): Promise<UserInterest[]> {
    return await prisma.userInterest.findMany({
      where: { user_id: userId },
      orderBy: { weight: 'desc' },
    });
  }

  private async generateDefaultRecommendations(userId: string, limit: number): Promise<{
    recommendations: Recommendation[];
    reasoning: RecommendationReasoning[];
    confidence: number;
  }> {
    // إنشاء توصيات افتراضية للمستخدمين الجدد
    const defaultContent = await this.getPopularContent(limit);
    
    const recommendations: Recommendation[] = defaultContent.map((content, index) => ({
      id: `default_${content.id}`,
      user_id: userId,
      content_type: 'article',
      content_id: content.id,
      title: content.title,
      description: content.description,
      url: content.url,
      score: 0.5 - (index * 0.05), // درجة تنازلية
      reason_type: 'popular',
      reason_data: { views: content.views },
      created_at: new Date(),
    }));

    const reasoning: RecommendationReasoning[] = recommendations.map(rec => ({
      recommendationId: rec.id,
      type: 'popular',
      explanation: 'محتوى شائع ومقترح للمستخدمين الجدد',
      confidence: 0.3,
      factors: ['محتوى شائع', 'مقترح للمستخدمين الجدد'],
    }));

    return {
      recommendations,
      reasoning,
      confidence: 0.3,
    };
  }

  // Additional helper methods would be implemented here...
  // (Due to length constraints, I'm showing the main structure)

  private removeDuplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = `${rec.content_type}_${rec.content_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sortRecommendationsByScore(recommendations: Recommendation[]): Recommendation[] {
    return recommendations.sort((a, b) => b.score - a.score);
  }

  private async filterViewedContent(userId: string, recommendations: Recommendation[]): Promise<Recommendation[]> {
    // تصفية المحتوى الذي شاهده المستخدم بالفعل
    const viewedContent = await prisma.analyticsEvent.findMany({
      where: {
        user_id: userId,
        event_type: 'page_view',
      },
      select: { metadata: true },
    });

    const viewedIds = new Set(
      viewedContent
        .map(event => event.metadata?.content_id)
        .filter(Boolean)
    );

    return recommendations.filter(rec => !viewedIds.has(rec.content_id));
  }

  private calculateConfidence(userBehavior: UserBehaviorData, recommendations: Recommendation[]): number {
    // حساب الثقة بناءً على كمية البيانات المتاحة وجودة التوصيات
    const dataScore = Math.min(userBehavior.totalInteractions / 50, 1); // تطبيع إلى 0-1
    const recommendationScore = recommendations.length > 0 
      ? recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length 
      : 0;

    return (dataScore * 0.6) + (recommendationScore * 0.4);
  }

  // More helper methods would be implemented here...
}

// Types and interfaces

export interface Recommendation {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  title: string;
  description?: string;
  url: string;
  score: number;
  reason_type: string;
  reason_data: any;
  created_at: Date;
}

export interface RecommendationReasoning {
  recommendationId: string;
  type: string;
  explanation: string;
  confidence: number;
  factors: string[];
}

export interface UserInterest {
  id: string;
  user_id: string;
  interest_type: string;
  interest_value: string;
  weight: number;
  created_at: Date;
}

export interface UserBehaviorData {
  totalInteractions: number;
  viewEvents: number;
  readEvents: number;
  likeEvents: number;
  shareEvents: number;
  searchEvents: number;
  avgSessionDuration: number;
  preferredCategories: string[];
  activityPattern: any;
}

export interface UserInterestAnalysis {
  userId: string;
  categoryInterests: Record<string, number>;
  keywordInterests: Record<string, number>;
  readingPatterns: any;
  socialInteractions: any;
  overallEngagement: number;
  lastUpdated: Date;
  dataPoints: number;
}

export interface RecommendationStats {
  totalRecommendations: number;
  totalFeedback: number;
  averageScore: number;
  topReasonTypes: Array<{ type: string; count: number }>;
  recentPerformance: any;
  lastUpdated: Date;
}

export default RecommendationsEngine; 