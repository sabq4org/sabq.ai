/**
 * خوارزمية Collaborative Filtering المتقدمة
 * Advanced Collaborative Filtering Algorithm
 */

import { PrismaClient } from '@prisma/client';
import { RecommendationItem, RecommendationRequest } from '../recommendation-engine';

const prisma = new PrismaClient();

export interface UserSimilarity {
  userId: string;
  similarity: number;
  commonInterests: number;
}

export interface ItemSimilarity {
  articleId: string;
  similarity: number;
  commonUsers: number;
}

/**
 * خوارزمية Collaborative Filtering
 */
export class CollaborativeFilteringEngine {
  private static instance: CollaborativeFilteringEngine;
  private userSimilarityCache: Map<string, UserSimilarity[]> = new Map();
  private itemSimilarityCache: Map<string, ItemSimilarity[]> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // ساعة واحدة

  public static getInstance(): CollaborativeFilteringEngine {
    if (!CollaborativeFilteringEngine.instance) {
      CollaborativeFilteringEngine.instance = new CollaborativeFilteringEngine();
    }
    return CollaborativeFilteringEngine.instance;
  }

  /**
   * توصيات مبنية على المستخدمين المشابهين (User-Based CF)
   */
  async getUserBasedRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { userId, limit = 10, excludeArticleIds = [] } = request;

    if (!userId) {
      return [];
    }

    // 1. جلب تفاعلات المستخدم
    const userInteractions = await this.getUserInteractions(userId);
    if (userInteractions.length === 0) {
      return [];
    }

    // 2. العثور على المستخدمين المشابهين
    const similarUsers = await this.findSimilarUsers(userId, userInteractions);
    if (similarUsers.length === 0) {
      return [];
    }

    // 3. جلب توصيات من المستخدمين المشابهين
    const recommendations = await this.getRecommendationsFromSimilarUsers(
      userId,
      similarUsers,
      excludeArticleIds,
      limit
    );

    return recommendations;
  }

  /**
   * توصيات مبنية على المقالات المشابهة (Item-Based CF)
   */
  async getItemBasedRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { userId, limit = 10, excludeArticleIds = [] } = request;

    if (!userId) {
      return [];
    }

    // 1. جلب المقالات التي تفاعل معها المستخدم
    const userInteractions = await this.getUserInteractions(userId);
    if (userInteractions.length === 0) {
      return [];
    }

    const likedArticles = userInteractions
      .filter(interaction => ['like', 'share', 'comment'].includes(interaction.event_type))
      .map(interaction => interaction.article_id);

    // 2. العثور على المقالات المشابهة
    const recommendations: RecommendationItem[] = [];
    
    for (const articleId of likedArticles) {
      const similarArticles = await this.findSimilarArticles(articleId);
      
      for (const similar of similarArticles) {
        if (!excludeArticleIds.includes(similar.articleId) && 
            !likedArticles.includes(similar.articleId)) {
          
          const article = await prisma.article.findUnique({
            where: { id: similar.articleId, status: 'published' },
            include: { category: true }
          });

          if (article) {
            recommendations.push({
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
              score: similar.similarity,
              reason_type: 'item_similarity',
              reason_explanation: `مشابه للمقال الذي أعجبك`,
              algorithm_type: 'collaborative_item',
              context_data: {
                basedOnArticle: articleId,
                similarity: similar.similarity,
                commonUsers: similar.commonUsers
              }
            });
          }
        }
      }
    }

    // ترتيب وإزالة المكررات
    const uniqueRecommendations = this.removeDuplicates(recommendations);
    return uniqueRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * توصيات مختلطة (Hybrid CF)
   */
  async getHybridRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { limit = 10 } = request;
    
    const userBasedLimit = Math.ceil(limit * 0.6); // 60% من المستخدمين
    const itemBasedLimit = limit - userBasedLimit; // 40% من المقالات

    const [userBased, itemBased] = await Promise.all([
      this.getUserBasedRecommendations({ ...request, limit: userBasedLimit }),
      this.getItemBasedRecommendations({ ...request, limit: itemBasedLimit })
    ]);

    // دمج النتائج
    const combined = [...userBased, ...itemBased];
    const unique = this.removeDuplicates(combined);

    return unique
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * جلب تفاعلات المستخدم
   */
  private async getUserInteractions(userId: string): Promise<any[]> {
    return await prisma.analyticsEvent.findMany({
      where: {
        user_id: userId,
        event_type: { in: ['like', 'share', 'comment', 'reading_time', 'page_view'] },
        article_id: { not: null }
      },
      select: {
        article_id: true,
        event_type: true,
        timestamp: true
      },
      orderBy: { timestamp: 'desc' }
    });
  }

  /**
   * العثور على المستخدمين المشابهين
   */
  private async findSimilarUsers(userId: string, userInteractions: any[]): Promise<UserSimilarity[]> {
    const cacheKey = `user_sim_${userId}`;
    const cached = this.userSimilarityCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const userArticles = userInteractions.map(i => i.article_id);
    
    // جلب المستخدمين الذين تفاعلوا مع نفس المقالات
    const otherUsersInteractions = await prisma.analyticsEvent.findMany({
      where: {
        article_id: { in: userArticles },
        user_id: { not: userId },
        event_type: { in: ['like', 'share', 'comment', 'reading_time'] }
      },
      select: {
        user_id: true,
        article_id: true,
        event_type: true
      }
    });

    // حساب التشابه
    const userSimilarities = this.calculateUserSimilarities(
      userArticles,
      otherUsersInteractions
    );

    // ترتيب وحفظ في الذاكرة المؤقتة
    const sortedSimilarities = Object.entries(userSimilarities)
      .map(([userId, data]) => ({
        userId,
        similarity: data.similarity,
        commonInterests: data.commonInterests
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 50); // أفضل 50 مستخدم مشابه

    this.userSimilarityCache.set(cacheKey, sortedSimilarities);
    
    // حذف من الذاكرة المؤقتة بعد انتهاء الصلاحية
    setTimeout(() => {
      this.userSimilarityCache.delete(cacheKey);
    }, this.CACHE_TTL);

    return sortedSimilarities;
  }

  /**
   * العثور على المقالات المشابهة
   */
  private async findSimilarArticles(articleId: string): Promise<ItemSimilarity[]> {
    const cacheKey = `item_sim_${articleId}`;
    const cached = this.itemSimilarityCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // جلب المستخدمين الذين تفاعلوا مع هذا المقال
    const articleUsers = await prisma.analyticsEvent.findMany({
      where: {
        article_id: articleId,
        event_type: { in: ['like', 'share', 'comment', 'reading_time'] }
      },
      select: { user_id: true }
    });

    const userIds = [...new Set(articleUsers.map(u => u.user_id))];

    if (userIds.length === 0) {
      return [];
    }

    // جلب المقالات الأخرى التي تفاعل معها هؤلاء المستخدمين
    const otherArticlesInteractions = await prisma.analyticsEvent.findMany({
      where: {
        user_id: { in: userIds },
        article_id: { not: articleId },
        event_type: { in: ['like', 'share', 'comment', 'reading_time'] }
      },
      select: {
        article_id: true,
        user_id: true,
        event_type: true
      }
    });

    // حساب التشابه بين المقالات
    const itemSimilarities = this.calculateItemSimilarities(
      userIds,
      otherArticlesInteractions
    );

    const sortedSimilarities = Object.entries(itemSimilarities)
      .map(([articleId, data]) => ({
        articleId,
        similarity: data.similarity,
        commonUsers: data.commonUsers
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20); // أفضل 20 مقال مشابه

    this.itemSimilarityCache.set(cacheKey, sortedSimilarities);
    
    setTimeout(() => {
      this.itemSimilarityCache.delete(cacheKey);
    }, this.CACHE_TTL);

    return sortedSimilarities;
  }

  /**
   * حساب التشابه بين المستخدمين
   */
  private calculateUserSimilarities(
    userArticles: string[],
    otherUsersInteractions: any[]
  ): Record<string, { similarity: number; commonInterests: number }> {
    const userSimilarities: Record<string, { similarity: number; commonInterests: number }> = {};

    // تجميع تفاعلات كل مستخدم
    const userInteractionMap = new Map<string, Set<string>>();
    
    otherUsersInteractions.forEach(interaction => {
      if (!userInteractionMap.has(interaction.user_id)) {
        userInteractionMap.set(interaction.user_id, new Set());
      }
      userInteractionMap.get(interaction.user_id)!.add(interaction.article_id);
    });

    // حساب التشابه لكل مستخدم
    userInteractionMap.forEach((otherUserArticles, otherUserId) => {
      const commonArticles = userArticles.filter(articleId => 
        otherUserArticles.has(articleId)
      );

      if (commonArticles.length > 0) {
        // حساب Jaccard Similarity
        const union = new Set([...userArticles, ...Array.from(otherUserArticles)]);
        const jaccardSimilarity = commonArticles.length / union.size;

        // حساب Cosine Similarity
        const cosineSimilarity = commonArticles.length / 
          Math.sqrt(userArticles.length * otherUserArticles.size);

        // متوسط التشابه
        const similarity = (jaccardSimilarity + cosineSimilarity) / 2;

        userSimilarities[otherUserId] = {
          similarity,
          commonInterests: commonArticles.length
        };
      }
    });

    return userSimilarities;
  }

  /**
   * حساب التشابه بين المقالات
   */
  private calculateItemSimilarities(
    baseArticleUsers: string[],
    otherArticlesInteractions: any[]
  ): Record<string, { similarity: number; commonUsers: number }> {
    const itemSimilarities: Record<string, { similarity: number; commonUsers: number }> = {};

    // تجميع المستخدمين لكل مقال
    const articleUserMap = new Map<string, Set<string>>();
    
    otherArticlesInteractions.forEach(interaction => {
      if (!articleUserMap.has(interaction.article_id)) {
        articleUserMap.set(interaction.article_id, new Set());
      }
      articleUserMap.get(interaction.article_id)!.add(interaction.user_id);
    });

    // حساب التشابه لكل مقال
    articleUserMap.forEach((otherArticleUsers, articleId) => {
      const commonUsers = baseArticleUsers.filter(userId => 
        otherArticleUsers.has(userId)
      );

      if (commonUsers.length > 0) {
        // حساب Jaccard Similarity
        const union = new Set([...baseArticleUsers, ...Array.from(otherArticleUsers)]);
        const jaccardSimilarity = commonUsers.length / union.size;

        // حساب Cosine Similarity
        const cosineSimilarity = commonUsers.length / 
          Math.sqrt(baseArticleUsers.length * otherArticleUsers.size);

        // متوسط التشابه
        const similarity = (jaccardSimilarity + cosineSimilarity) / 2;

        itemSimilarities[articleId] = {
          similarity,
          commonUsers: commonUsers.length
        };
      }
    });

    return itemSimilarities;
  }

  /**
   * جلب التوصيات من المستخدمين المشابهين
   */
  private async getRecommendationsFromSimilarUsers(
    userId: string,
    similarUsers: UserSimilarity[],
    excludeArticleIds: string[],
    limit: number
  ): Promise<RecommendationItem[]> {
    const topSimilarUsers = similarUsers.slice(0, 20); // أفضل 20 مستخدم
    const similarUserIds = topSimilarUsers.map(u => u.userId);

    // جلب المقالات التي أعجبت المستخدمين المشابهين
    const recommendedInteractions = await prisma.analyticsEvent.findMany({
      where: {
        user_id: { in: similarUserIds },
        event_type: { in: ['like', 'share', 'comment'] },
        article_id: { 
          notIn: [...excludeArticleIds, ...await this.getUserLikedArticles(userId)] 
        }
      },
      include: {
        article: {
          where: { status: 'published' },
          include: { category: true }
        }
      }
    });

    // حساب نقاط التوصية
    const articleScores = new Map<string, number>();
    const articleReasons = new Map<string, string>();

    recommendedInteractions.forEach(interaction => {
      if (interaction.article) {
        const userSimilarity = topSimilarUsers.find(u => u.userId === interaction.user_id);
        if (userSimilarity) {
          const currentScore = articleScores.get(interaction.article.id) || 0;
          const eventWeight = this.getEventWeight(interaction.event_type);
          const weightedScore = userSimilarity.similarity * eventWeight;
          
          articleScores.set(interaction.article.id, currentScore + weightedScore);
          articleReasons.set(interaction.article.id, 
            `مستخدمون مشابهون لك (${Math.round(userSimilarity.similarity * 100)}% تشابه) أعجبهم هذا المحتوى`
          );
        }
      }
    });

    // تحويل إلى توصيات
    const recommendations: RecommendationItem[] = [];
    const uniqueArticles = new Set<string>();

    for (const interaction of recommendedInteractions) {
      if (interaction.article && !uniqueArticles.has(interaction.article.id)) {
        uniqueArticles.add(interaction.article.id);
        
        const score = articleScores.get(interaction.article.id) || 0;
        const reason = articleReasons.get(interaction.article.id) || 'مقترح من مستخدمين مشابهين';

        recommendations.push({
          article: {
            id: interaction.article.id,
            title: interaction.article.title,
            slug: interaction.article.slug,
            summary: interaction.article.summary,
            featured_image: interaction.article.featured_image,
            category_id: interaction.article.category_id,
            published_at: interaction.article.published_at,
            view_count: interaction.article.view_count,
            like_count: interaction.article.like_count,
            reading_time: interaction.article.reading_time,
            tags: interaction.article.tags
          },
          score,
          reason_type: 'collaborative_user',
          reason_explanation: reason,
          algorithm_type: 'collaborative_user',
          context_data: {
            similarUsersCount: topSimilarUsers.length,
            recommendationStrength: score
          }
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * جلب المقالات التي أعجب بها المستخدم
   */
  private async getUserLikedArticles(userId: string): Promise<string[]> {
    const likes = await prisma.articleLike.findMany({
      where: { user_id: userId },
      select: { article_id: true }
    });
    return likes.map(like => like.article_id);
  }

  /**
   * وزن الأحداث
   */
  private getEventWeight(eventType: string): number {
    const weights: Record<string, number> = {
      'like': 1.0,
      'share': 0.9,
      'comment': 0.8,
      'reading_time': 0.6,
      'page_view': 0.2
    };
    return weights[eventType] || 0.1;
  }

  /**
   * إزالة المكررات
   */
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

  /**
   * حساب مصفوفة التشابه وحفظها
   */
  async calculateAndStoreSimilarityMatrix(): Promise<void> {
    console.log('بدء حساب مصفوفة التشابه...');

    // جلب جميع المقالات المنشورة
    const articles = await prisma.article.findMany({
      where: { status: 'published' },
      select: { id: true }
    });

    const articleIds = articles.map(a => a.id);
    const similarities: any[] = [];

    // حساب التشابه لكل زوج من المقالات
    for (let i = 0; i < articleIds.length; i++) {
      for (let j = i + 1; j < articleIds.length; j++) {
        const similarity = await this.calculateArticlePairSimilarity(
          articleIds[i],
          articleIds[j]
        );

        if (similarity > 0.1) { // حفظ التشابه المعنوي فقط
          similarities.push({
            item_a_id: articleIds[i],
            item_b_id: articleIds[j],
            similarity_score: similarity,
            algorithm_type: 'collaborative',
            last_calculated: new Date()
          });
        }
      }
    }

    // حفظ المصفوفة في قاعدة البيانات
    await prisma.similarityMatrix.createMany({
      data: similarities,
      skipDuplicates: true
    });

    console.log(`تم حساب ${similarities.length} علاقة تشابه`);
  }

  /**
   * حساب التشابه بين مقالين
   */
  private async calculateArticlePairSimilarity(articleId1: string, articleId2: string): Promise<number> {
    // جلب المستخدمين الذين تفاعلوا مع كل مقال
    const [users1, users2] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: {
          article_id: articleId1,
          event_type: { in: ['like', 'share', 'comment'] }
        },
        select: { user_id: true }
      }),
      prisma.analyticsEvent.findMany({
        where: {
          article_id: articleId2,
          event_type: { in: ['like', 'share', 'comment'] }
        },
        select: { user_id: true }
      })
    ]);

    const userIds1 = new Set(users1.map(u => u.user_id));
    const userIds2 = new Set(users2.map(u => u.user_id));

    // حساب التشابه
    const intersection = new Set([...userIds1].filter(id => userIds2.has(id)));
    const union = new Set([...userIds1, ...userIds2]);

    if (union.size === 0) return 0;

    return intersection.size / union.size; // Jaccard Similarity
  }

  /**
   * مسح الذاكرة المؤقتة
   */
  clearCache(): void {
    this.userSimilarityCache.clear();
    this.itemSimilarityCache.clear();
  }
}

export const collaborativeFilteringEngine = CollaborativeFilteringEngine.getInstance(); 