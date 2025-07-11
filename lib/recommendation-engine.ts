/**
 * محرك التوصيات الذكية - Sabq AI CMS
 * Smart Recommendation Engine
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RecommendationItem {
  article: {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    featured_image?: string;
    category_id: string;
    published_at?: Date;
    view_count: number;
    like_count: number;
    reading_time?: number;
    tags: string[];
  };
  score: number;
  reason_type: string;
  reason_explanation: string;
  algorithm_type: string;
  context_data?: any;
}

export interface RecommendationRequest {
  userId?: string;
  sessionId?: string;
  algorithmType?: 'personal' | 'collaborative' | 'graph' | 'ai' | 'trending' | 'mixed';
  limit?: number;
  excludeArticleIds?: string[];
  categoryFilter?: string;
  contextData?: any;
}

export interface UserProfile {
  interests: Record<string, number>;
  categories: Record<string, number>;
  reading_patterns: {
    preferred_times?: string[];
    preferred_devices?: string[];
    avg_reading_time?: number;
    engagement_score?: number;
  };
  behavioral_signals: {
    scroll_depth?: number;
    interaction_rate?: number;
    return_rate?: number;
  };
}

/**
 * محرك التوصيات الرئيسي
 */
export class RecommendationEngine {
  private static instance: RecommendationEngine;
  private cache: Map<string, { data: RecommendationItem[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 دقيقة

  public static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine();
    }
    return RecommendationEngine.instance;
  }

  /**
   * الحصول على التوصيات الرئيسية
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { userId, sessionId, algorithmType = 'mixed', limit = 10 } = request;
    
    // التحقق من الذاكرة المؤقتة
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data.slice(0, limit);
    }

    let recommendations: RecommendationItem[] = [];

    try {
      switch (algorithmType) {
        case 'personal':
          recommendations = await this.getPersonalizedRecommendations(request);
          break;
        case 'collaborative':
          recommendations = await this.getCollaborativeRecommendations(request);
          break;
        case 'graph':
          recommendations = await this.getGraphBasedRecommendations(request);
          break;
        case 'ai':
          recommendations = await this.getAIRecommendations(request);
          break;
        case 'trending':
          recommendations = await this.getTrendingRecommendations(request);
          break;
        case 'mixed':
        default:
          recommendations = await this.getMixedRecommendations(request);
          break;
      }

      // حفظ في الذاكرة المؤقتة
      this.cache.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now()
      });

      // تسجيل التوصيات
      await this.logRecommendations(recommendations, request);

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // إرجاع توصيات افتراضية في حالة الخطأ
      return await this.getFallbackRecommendations(request);
    }
  }

  /**
   * توصيات شخصية بناءً على الاهتمامات والسلوك
   */
  private async getPersonalizedRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { userId, limit = 10, excludeArticleIds = [], categoryFilter } = request;

    if (!userId) {
      return await this.getTrendingRecommendations(request);
    }

    // 1. جلب ملف الاهتمامات
    const userProfile = await this.getUserProfile(userId);
    
    // 2. جلب المقالات المرشحة
    const whereClause: any = {
      status: 'published',
      published_at: { lte: new Date() },
      id: { notIn: excludeArticleIds }
    };

    if (categoryFilter) {
      whereClause.category_id = categoryFilter;
    }

    const candidateArticles = await prisma.article.findMany({
      where: whereClause,
      include: {
        category: true,
        author: { select: { id: true, name: true } }
      },
      orderBy: { published_at: 'desc' },
      take: limit * 3 // جلب أكثر للفرز
    });

    // 3. حساب النقاط
    const scoredArticles = candidateArticles.map(article => {
      let score = 0;
      
      // نقاط الاهتمام بالفئة
      const categoryInterest = userProfile.categories[article.category_id] || 0;
      score += categoryInterest * 0.4;
      
      // نقاط الكلمات المفتاحية
      const keywordScore = this.calculateKeywordScore(article.tags, userProfile.interests);
      score += keywordScore * 0.3;
      
      // نقاط الحداثة
      const recencyScore = this.calculateRecencyScore(article.published_at);
      score += recencyScore * 0.2;
      
      // نقاط الشعبية
      const popularityScore = this.calculatePopularityScore(article.view_count, article.like_count);
      score += popularityScore * 0.1;

      return {
        article,
        score,
        reason_type: 'interest',
        reason_explanation: categoryInterest > 0.5 
          ? `بناءً على اهتمامك بـ ${article.category.name}`
          : 'مقال مقترح حسب تفضيلاتك',
        algorithm_type: 'personal',
        context_data: {
          categoryInterest,
          keywordScore,
          recencyScore,
          popularityScore
        }
      };
    });

    // 4. ترتيب وإرجاع النتائج
    return scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        ...item,
        article: {
          id: item.article.id,
          title: item.article.title,
          slug: item.article.slug,
          summary: item.article.summary,
          featured_image: item.article.featured_image,
          category_id: item.article.category_id,
          published_at: item.article.published_at,
          view_count: item.article.view_count,
          like_count: item.article.like_count,
          reading_time: item.article.reading_time,
          tags: item.article.tags
        }
      }));
  }

  /**
   * توصيات تعاونية (Collaborative Filtering)
   */
  private async getCollaborativeRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { userId, limit = 10, excludeArticleIds = [] } = request;

    if (!userId) {
      return await this.getTrendingRecommendations(request);
    }

    // 1. جلب المقالات التي أعجب بها المستخدم
    const userLikes = await prisma.articleLike.findMany({
      where: { user_id: userId },
      select: { article_id: true }
    });
    const likedArticleIds = userLikes.map(like => like.article_id);

    if (likedArticleIds.length === 0) {
      return await this.getPersonalizedRecommendations(request);
    }

    // 2. جلب المستخدمين المشابهين
    const similarUsers = await prisma.articleLike.findMany({
      where: {
        article_id: { in: likedArticleIds },
        user_id: { not: userId }
      },
      select: { user_id: true, article_id: true }
    });

    // حساب التشابه بين المستخدمين
    const userSimilarity = this.calculateUserSimilarity(likedArticleIds, similarUsers);
    const topSimilarUsers = Object.entries(userSimilarity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([userId]) => userId);

    // 3. جلب المقالات المقترحة من المستخدمين المشابهين
    const candidateLikes = await prisma.articleLike.findMany({
      where: {
        user_id: { in: topSimilarUsers },
        article_id: { 
          notIn: [...likedArticleIds, ...excludeArticleIds] 
        }
      },
      include: {
        article: {
          where: { status: 'published' },
          include: {
            category: true
          }
        }
      }
    });

    // 4. حساب النقاط وترتيب النتائج
    const articleScores = new Map<string, number>();
    candidateLikes.forEach(like => {
      if (like.article) {
        const currentScore = articleScores.get(like.article.id) || 0;
        const userWeight = userSimilarity[like.user_id] || 0;
        articleScores.set(like.article.id, currentScore + userWeight);
      }
    });

    const uniqueArticles = Array.from(new Set(candidateLikes.map(like => like.article)))
      .filter(article => article !== null)
      .map(article => ({
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          featured_image: article.featured_image,
          category_id: article.category_id,
          published_at: article.published_at,
          view_count: article.view_count,
          like_count: article.like_count,
          reading_time: article.reading_time,
          tags: article.tags
        },
        score: articleScores.get(article.id) || 0,
        reason_type: 'collaborative',
        reason_explanation: 'مستخدمون مشابهون أعجبهم هذا المحتوى',
        algorithm_type: 'collaborative',
        context_data: {
          similarUsersCount: topSimilarUsers.length,
          recommendationStrength: articleScores.get(article.id) || 0
        }
      }));

    return uniqueArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * توصيات مبنية على الرسم البياني (Graph-based)
   */
  private async getGraphBasedRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { userId, limit = 10, excludeArticleIds = [] } = request;

    if (!userId) {
      return await this.getTrendingRecommendations(request);
    }

    // 1. جلب المقالات التي تفاعل معها المستخدم
    const userInteractions = await prisma.analyticsEvent.findMany({
      where: {
        user_id: userId,
        event_type: { in: ['like', 'share', 'comment', 'reading_time'] },
        article_id: { not: null }
      },
      select: { article_id: true, event_type: true }
    });

    const interactedArticleIds = [...new Set(userInteractions.map(e => e.article_id))];

    if (interactedArticleIds.length === 0) {
      return await this.getPersonalizedRecommendations(request);
    }

    // 2. جلب المستخدمين الذين تفاعلوا مع نفس المقالات
    const coInteractions = await prisma.analyticsEvent.findMany({
      where: {
        article_id: { in: interactedArticleIds },
        user_id: { not: userId },
        event_type: { in: ['like', 'share', 'comment', 'reading_time'] }
      },
      select: { user_id: true, article_id: true, event_type: true }
    });

    const coUserIds = [...new Set(coInteractions.map(e => e.user_id))];

    // 3. جلب المقالات المقترحة من المستخدمين المترابطين
    const candidateInteractions = await prisma.analyticsEvent.findMany({
      where: {
        user_id: { in: coUserIds },
        article_id: { 
          notIn: [...interactedArticleIds, ...excludeArticleIds] 
        },
        event_type: { in: ['like', 'share', 'comment'] }
      },
      include: {
        article: {
          where: { status: 'published' },
          include: { category: true }
        }
      }
    });

    // 4. حساب قوة الارتباط
    const articleConnections = new Map<string, number>();
    candidateInteractions.forEach(interaction => {
      if (interaction.article) {
        const currentScore = articleConnections.get(interaction.article.id) || 0;
        const eventWeight = this.getEventWeight(interaction.event_type);
        articleConnections.set(interaction.article.id, currentScore + eventWeight);
      }
    });

    const uniqueArticles = Array.from(new Set(candidateInteractions.map(i => i.article)))
      .filter(article => article !== null)
      .map(article => ({
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          featured_image: article.featured_image,
          category_id: article.category_id,
          published_at: article.published_at,
          view_count: article.view_count,
          like_count: article.like_count,
          reading_time: article.reading_time,
          tags: article.tags
        },
        score: articleConnections.get(article.id) || 0,
        reason_type: 'graph',
        reason_explanation: 'مقترح عبر شبكة تفاعلات المستخدمين',
        algorithm_type: 'graph',
        context_data: {
          connectionStrength: articleConnections.get(article.id) || 0,
          coUsersCount: coUserIds.length
        }
      }));

    return uniqueArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * توصيات الذكاء الاصطناعي
   */
  private async getAIRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { userId, limit = 10 } = request;

    try {
      // استدعاء خدمة الذكاء الاصطناعي الخارجية
      const response = await fetch(process.env.AI_SERVICE_URL + '/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, limit }),
        timeout: 10000 // 10 ثوان
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const aiRecommendations = await response.json();
      
      // تحويل النتائج إلى التنسيق المطلوب
      return aiRecommendations.recommendations.map((rec: any) => ({
        article: rec.article,
        score: rec.score,
        reason_type: 'ai',
        reason_explanation: rec.explanation || 'توصية ذكية بناءً على الذكاء الاصطناعي',
        algorithm_type: 'ai',
        context_data: rec.context
      }));
    } catch (error) {
      console.error('AI recommendation service error:', error);
      // العودة للتوصيات الشخصية في حالة فشل الذكاء الاصطناعي
      return await this.getPersonalizedRecommendations(request);
    }
  }

  /**
   * توصيات المحتوى الشائع
   */
  private async getTrendingRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { limit = 10, excludeArticleIds = [], categoryFilter } = request;

    const whereClause: any = {
      status: 'published',
      published_at: { 
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // آخر 7 أيام
      },
      id: { notIn: excludeArticleIds }
    };

    if (categoryFilter) {
      whereClause.category_id = categoryFilter;
    }

    const trendingArticles = await prisma.article.findMany({
      where: whereClause,
      include: {
        category: true
      },
      orderBy: [
        { view_count: 'desc' },
        { like_count: 'desc' },
        { published_at: 'desc' }
      ],
      take: limit
    });

    return trendingArticles.map(article => ({
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        featured_image: article.featured_image,
        category_id: article.category_id,
        published_at: article.published_at,
        view_count: article.view_count,
        like_count: article.like_count,
        reading_time: article.reading_time,
        tags: article.tags
      },
      score: this.calculateTrendingScore(article.view_count, article.like_count, article.published_at),
      reason_type: 'trending',
      reason_explanation: 'مقال شائع ومتداول حالياً',
      algorithm_type: 'trending',
      context_data: {
        views: article.view_count,
        likes: article.like_count,
        recency: article.published_at
      }
    }));
  }

  /**
   * توصيات مختلطة (Mixed Algorithm)
   */
  private async getMixedRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { limit = 10 } = request;
    const recommendations: RecommendationItem[] = [];

    // تقسيم التوصيات
    const personalLimit = Math.ceil(limit * 0.4); // 40% شخصية
    const collaborativeLimit = Math.ceil(limit * 0.3); // 30% تعاونية
    const trendingLimit = Math.ceil(limit * 0.2); // 20% شائعة
    const graphLimit = limit - personalLimit - collaborativeLimit - trendingLimit; // الباقي

    try {
      // جلب التوصيات من كل خوارزمية
      const [personal, collaborative, trending, graph] = await Promise.all([
        this.getPersonalizedRecommendations({ ...request, limit: personalLimit }),
        this.getCollaborativeRecommendations({ ...request, limit: collaborativeLimit }),
        this.getTrendingRecommendations({ ...request, limit: trendingLimit }),
        this.getGraphBasedRecommendations({ ...request, limit: graphLimit })
      ]);

      // دمج النتائج وإزالة المكررات
      const allRecommendations = [...personal, ...collaborative, ...trending, ...graph];
      const uniqueRecommendations = this.removeDuplicates(allRecommendations);

      // ترتيب النتائج النهائية
      return uniqueRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in mixed recommendations:', error);
      return await this.getTrendingRecommendations(request);
    }
  }

  /**
   * توصيات احتياطية في حالة الأخطاء
   */
  private async getFallbackRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { limit = 10, excludeArticleIds = [] } = request;

    const fallbackArticles = await prisma.article.findMany({
      where: {
        status: 'published',
        featured: true,
        id: { notIn: excludeArticleIds }
      },
      orderBy: { published_at: 'desc' },
      take: limit
    });

    return fallbackArticles.map(article => ({
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        featured_image: article.featured_image,
        category_id: article.category_id,
        published_at: article.published_at,
        view_count: article.view_count,
        like_count: article.like_count,
        reading_time: article.reading_time,
        tags: article.tags
      },
      score: 0.5,
      reason_type: 'fallback',
      reason_explanation: 'مقال مميز من المحررين',
      algorithm_type: 'fallback',
      context_data: {}
    }));
  }

  /**
   * دوال مساعدة
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    const profile = await prisma.userInterestProfile.findUnique({
      where: { user_id: userId }
    });

    if (profile) {
      return {
        interests: profile.interests as Record<string, number>,
        categories: profile.categories as Record<string, number>,
        reading_patterns: profile.reading_patterns as any,
        behavioral_signals: profile.behavioral_signals as any
      };
    }

    // إنشاء ملف جديد إذا لم يكن موجوداً
    return await this.buildUserProfile(userId);
  }

  private async buildUserProfile(userId: string): Promise<UserProfile> {
    // تحليل السلوك من الأحداث
    const events = await prisma.analyticsEvent.findMany({
      where: { user_id: userId },
      include: { article: { include: { category: true } } }
    });

    const interests: Record<string, number> = {};
    const categories: Record<string, number> = {};

    events.forEach(event => {
      if (event.article) {
        // حساب الاهتمام بالفئة
        const categoryName = event.article.category.name;
        categories[categoryName] = (categories[categoryName] || 0) + this.getEventWeight(event.event_type);

        // حساب الاهتمام بالكلمات المفتاحية
        event.article.tags.forEach(tag => {
          interests[tag] = (interests[tag] || 0) + this.getEventWeight(event.event_type);
        });
      }
    });

    const profile: UserProfile = {
      interests,
      categories,
      reading_patterns: {},
      behavioral_signals: {}
    };

    // حفظ الملف الجديد
    await prisma.userInterestProfile.upsert({
      where: { user_id: userId },
      update: {
        interests,
        categories,
        last_updated: new Date()
      },
      create: {
        user_id: userId,
        interests,
        categories,
        reading_patterns: {},
        behavioral_signals: {}
      }
    });

    return profile;
  }

  private calculateKeywordScore(tags: string[], interests: Record<string, number>): number {
    return tags.reduce((score, tag) => score + (interests[tag] || 0), 0) / Math.max(tags.length, 1);
  }

  private calculateRecencyScore(publishedAt?: Date): number {
    if (!publishedAt) return 0;
    const daysSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - daysSincePublished / 30); // تقل النقاط مع الوقت
  }

  private calculatePopularityScore(viewCount: number, likeCount: number): number {
    return Math.log(viewCount + 1) * 0.1 + Math.log(likeCount + 1) * 0.2;
  }

  private calculateTrendingScore(viewCount: number, likeCount: number, publishedAt?: Date): number {
    const popularityScore = this.calculatePopularityScore(viewCount, likeCount);
    const recencyScore = this.calculateRecencyScore(publishedAt);
    return popularityScore + recencyScore;
  }

  private calculateUserSimilarity(userLikes: string[], similarUsers: any[]): Record<string, number> {
    const similarity: Record<string, number> = {};
    
    similarUsers.forEach(user => {
      if (!similarity[user.user_id]) {
        similarity[user.user_id] = 0;
      }
      if (userLikes.includes(user.article_id)) {
        similarity[user.user_id] += 1;
      }
    });

    // تطبيع النتائج
    Object.keys(similarity).forEach(userId => {
      similarity[userId] = similarity[userId] / userLikes.length;
    });

    return similarity;
  }

  private getEventWeight(eventType: string): number {
    const weights: Record<string, number> = {
      'like': 1.0,
      'share': 0.8,
      'comment': 0.9,
      'reading_time': 0.6,
      'page_view': 0.2,
      'scroll': 0.1
    };
    return weights[eventType] || 0.1;
  }

  private removeDuplicates(recommendations: RecommendationItem[]): RecommendationItem[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.article.id)) {
        return false;
      }
      seen.add(rec.article.id);
      return true;
    });
  }

  private generateCacheKey(request: RecommendationRequest): string {
    return `rec_${request.userId || 'anon'}_${request.algorithmType}_${request.limit}_${request.categoryFilter || 'all'}`;
  }

  private async logRecommendations(recommendations: RecommendationItem[], request: RecommendationRequest): Promise<void> {
    const logs = recommendations.map(rec => ({
      user_id: request.userId || null,
      session_id: request.sessionId || null,
      article_id: rec.article.id,
      algorithm_type: rec.algorithm_type,
      reason_type: rec.reason_type,
      reason_explanation: rec.reason_explanation,
      score: rec.score,
      context_data: rec.context_data,
      shown: true
    }));

    await prisma.recommendationLog.createMany({
      data: logs,
      skipDuplicates: true
    });
  }

  /**
   * تحديث ملف اهتمامات المستخدم
   */
  async updateUserInterestProfile(userId: string, articleId: string, eventType: string): Promise<void> {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { category: true }
      });

      if (!article) return;

      const profile = await this.getUserProfile(userId);
      const eventWeight = this.getEventWeight(eventType);

      // تحديث الاهتمام بالفئة
      profile.categories[article.category.name] = 
        (profile.categories[article.category.name] || 0) + eventWeight;

      // تحديث الاهتمام بالكلمات المفتاحية
      article.tags.forEach(tag => {
        profile.interests[tag] = (profile.interests[tag] || 0) + eventWeight;
      });

      // حفظ التحديثات
      await prisma.userInterestProfile.upsert({
        where: { user_id: userId },
        update: {
          interests: profile.interests,
          categories: profile.categories,
          last_updated: new Date()
        },
        create: {
          user_id: userId,
          interests: profile.interests,
          categories: profile.categories,
          reading_patterns: {},
          behavioral_signals: {}
        }
      });
    } catch (error) {
      console.error('Error updating user interest profile:', error);
    }
  }

  /**
   * تسجيل تفاعل المستخدم مع التوصية
   */
  async recordRecommendationFeedback(
    userId: string | null,
    articleId: string,
    feedback: 'like' | 'dislike' | 'not_interested' | 'already_read' | 'clicked'
  ): Promise<void> {
    try {
      await prisma.recommendationLog.updateMany({
        where: {
          user_id: userId,
          article_id: articleId,
          shown: true
        },
        data: {
          feedback,
          clicked: feedback === 'clicked',
          updated_at: new Date()
        }
      });

      // تحديث الإحصائيات
      await this.updateRecommendationMetrics(feedback);
    } catch (error) {
      console.error('Error recording recommendation feedback:', error);
    }
  }

  private async updateRecommendationMetrics(feedback: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // تحديث إحصائيات كل خوارزمية
    const algorithms = ['personal', 'collaborative', 'graph', 'trending', 'mixed'];
    
    for (const algorithm of algorithms) {
      await prisma.recommendationMetrics.upsert({
        where: {
          algorithm_type_date: {
            algorithm_type: algorithm,
            date: today
          }
        },
        update: {
          [`total_${feedback}`]: { increment: 1 },
          updated_at: new Date()
        },
        create: {
          algorithm_type: algorithm,
          date: today,
          [`total_${feedback}`]: 1
        }
      });
    }
  }

  /**
   * مسح الذاكرة المؤقتة
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * إحصائيات الأداء
   */
  async getPerformanceMetrics(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics = await prisma.recommendationMetrics.findMany({
      where: { date: today }
    });

    return metrics.map(metric => ({
      algorithm: metric.algorithm_type,
      shown: metric.total_shown,
      clicked: metric.total_clicked,
      liked: metric.total_liked,
      disliked: metric.total_disliked,
      ctr: metric.total_shown > 0 ? metric.total_clicked / metric.total_shown : 0,
      satisfaction: metric.total_liked + metric.total_disliked > 0 
        ? metric.total_liked / (metric.total_liked + metric.total_disliked) 
        : 0
    }));
  }
}

// إنشاء مثيل عام
export const recommendationEngine = RecommendationEngine.getInstance(); 