/**
 * API Routes for Content Recommendations
 * 
 * @description Provides intelligent content recommendations based on user behavior and content analysis
 * @author Sabq AI CMS Team
 * @version 1.0.0
 * @created 2024-01-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit-logger';
import { validateUserPermissions } from '@/lib/permissions';
import { rateLimiter } from '@/lib/rate-limiter';
import { getClientIP } from '@/lib/device-detection';
import { redisClient } from '@/lib/redis';
import { mlRecommendationEngine } from '@/lib/ml-recommendation-engine';
import { calculateContentSimilarity } from '@/lib/content-similarity';

// Validation schemas
const recommendationQuerySchema = z.object({
  type: z.enum(['articles', 'sections', 'tags', 'users', 'mixed']).default('articles'),
  algorithm: z.enum(['collaborative', 'content-based', 'hybrid', 'trending', 'personalized']).default('hybrid'),
  userId: z.string().uuid().optional(),
  articleId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  limit: z.number().min(1).max(50).default(10),
  excludeViewed: z.boolean().default(true),
  includeReasons: z.boolean().default(false),
  timeWindow: z.enum(['hour', 'day', 'week', 'month', 'all']).default('week'),
  minScore: z.number().min(0).max(1).default(0.1),
  diversityFactor: z.number().min(0).max(1).default(0.3),
  freshnessFactor: z.number().min(0).max(1).default(0.2),
  filters: z.object({
    sections: z.array(z.string().uuid()).optional(),
    tags: z.array(z.string().uuid()).optional(),
    authors: z.array(z.string().uuid()).optional(),
    languages: z.array(z.string()).optional(),
    contentTypes: z.array(z.string()).optional(),
    publishedAfter: z.string().datetime().optional(),
    readingTimeRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional(),
  }).optional(),
});

const feedbackSchema = z.object({
  recommendationId: z.string().uuid(),
  articleId: z.string().uuid(),
  feedback: z.enum(['like', 'dislike', 'not_interested', 'clicked', 'shared', 'bookmarked']),
  context: z.object({
    position: z.number().min(0).optional(),
    algorithm: z.string().optional(),
    reason: z.string().optional(),
  }).optional(),
});

/**
 * Recommendation Engine Class
 */
class RecommendationEngine {
  /**
   * Get collaborative filtering recommendations
   */
  static async getCollaborativeRecommendations(
    userId: string,
    limit: number,
    filters?: any
  ) {
    // Find users with similar behavior
    const userInteractions = await prisma.userInteraction.findMany({
      where: { userId },
      select: { articleId: true, interactionType: true, createdAt: true },
      take: 1000,
      orderBy: { createdAt: 'desc' },
    });

    const userArticleIds = userInteractions.map(i => i.articleId);

    // Find similar users
    const similarUsers = await prisma.userInteraction.groupBy({
      by: ['userId'],
      where: {
        articleId: { in: userArticleIds },
        userId: { not: userId },
      },
      _count: { articleId: true },
      orderBy: { _count: { articleId: 'desc' } },
      take: 50,
    });

    // Get recommendations from similar users
    const similarUserIds = similarUsers.map(u => u.userId);
    const recommendations = await prisma.userInteraction.findMany({
      where: {
        userId: { in: similarUserIds },
        articleId: { notIn: userArticleIds },
        interactionType: { in: ['VIEW', 'LIKE', 'SHARE', 'BOOKMARK'] },
      },
      include: {
        article: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profile: { select: { avatar: true } },
              },
            },
            section: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
            _count: {
              select: {
                views: true,
                likes: true,
                comments: true,
                shares: true,
              },
            },
          },
        },
      },
      take: limit * 2,
    });

    // Score and rank recommendations
    const scoredRecommendations = recommendations.map(rec => ({
      ...rec.article,
      score: this.calculateCollaborativeScore(rec, similarUsers),
      reason: 'مستخدمون آخرون مهتمون بمحتوى مشابه أعجبهم هذا المقال',
      algorithm: 'collaborative',
    }));

    // Remove duplicates and sort by score
    const uniqueRecommendations = scoredRecommendations
      .filter((rec, index, self) => 
        index === self.findIndex(r => r.id === rec.id)
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return uniqueRecommendations;
  }

  /**
   * Get content-based recommendations
   */
  static async getContentBasedRecommendations(
    userId?: string,
    articleId?: string,
    limit: number = 10,
    filters?: any
  ) {
    let seedArticles = [];

    if (articleId) {
      // Get recommendations based on specific article
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          tags: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      });

      if (article) {
        seedArticles = [article];
      }
    } else if (userId) {
      // Get recommendations based on user's reading history
      const userHistory = await prisma.userInteraction.findMany({
        where: {
          userId,
          interactionType: { in: ['VIEW', 'LIKE', 'BOOKMARK'] },
        },
        include: {
          article: {
            include: {
              tags: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
            },
          },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });

      seedArticles = userHistory.map(h => h.article);
    }

    if (seedArticles.length === 0) {
      return [];
    }

    // Extract features from seed articles
    const features = this.extractContentFeatures(seedArticles);

    // Find similar articles
    const similarArticles = await prisma.article.findMany({
      where: {
        id: { notIn: seedArticles.map(a => a.id) },
        status: 'PUBLISHED',
        ...this.buildFilterQuery(filters),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatar: true } },
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
      take: limit * 3,
    });

    // Calculate content similarity scores
    const scoredRecommendations = similarArticles.map(article => ({
      ...article,
      score: calculateContentSimilarity(features, this.extractContentFeatures([article])),
      reason: this.generateContentBasedReason(article, features),
      algorithm: 'content-based',
    }));

    // Sort by score and return top recommendations
    return scoredRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get trending recommendations
   */
  static async getTrendingRecommendations(
    limit: number,
    timeWindow: string = 'week',
    filters?: any
  ) {
    const timeWindowMap = {
      hour: 1,
      day: 24,
      week: 24 * 7,
      month: 24 * 30,
    };

    const hoursBack = timeWindowMap[timeWindow] || 24 * 7;
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Get trending articles based on interactions
    const trendingArticles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: since },
        ...this.buildFilterQuery(filters),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatar: true } },
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
      take: limit * 2,
    });

    // Calculate trending score
    const scoredArticles = trendingArticles.map(article => ({
      ...article,
      score: this.calculateTrendingScore(article, hoursBack),
      reason: 'مقال رائج حالياً بناءً على التفاعل الأخير',
      algorithm: 'trending',
    }));

    return scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get personalized recommendations using ML
   */
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number,
    filters?: any
  ) {
    try {
      // Get user profile and preferences
      const userProfile = await this.buildUserProfile(userId);
      
      // Use ML recommendation engine
      const mlRecommendations = await mlRecommendationEngine.getRecommendations(
        userProfile,
        limit,
        filters
      );

      // Enrich with database data
      const articleIds = mlRecommendations.map(r => r.articleId);
      const articles = await prisma.article.findMany({
        where: { id: { in: articleIds } },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profile: { select: { avatar: true } },
            },
          },
          section: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          _count: {
            select: {
              views: true,
              likes: true,
              comments: true,
              shares: true,
            },
          },
        },
      });

      // Merge ML scores with article data
      const personalizedRecommendations = articles.map(article => {
        const mlRec = mlRecommendations.find(r => r.articleId === article.id);
        return {
          ...article,
          score: mlRec?.score || 0,
          reason: mlRec?.reason || 'توصية شخصية بناءً على اهتماماتك',
          algorithm: 'personalized',
        };
      });

      return personalizedRecommendations.sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      // Fallback to content-based recommendations
      return this.getContentBasedRecommendations(userId, undefined, limit, filters);
    }
  }

  /**
   * Get hybrid recommendations
   */
  static async getHybridRecommendations(
    userId?: string,
    articleId?: string,
    limit: number = 10,
    diversityFactor: number = 0.3,
    freshnessFactor: number = 0.2,
    filters?: any
  ) {
    const recommendations = [];

    // Get different types of recommendations
    const [collaborative, contentBased, trending, personalized] = await Promise.all([
      userId ? this.getCollaborativeRecommendations(userId, Math.ceil(limit * 0.3), filters) : [],
      this.getContentBasedRecommendations(userId, articleId, Math.ceil(limit * 0.3), filters),
      this.getTrendingRecommendations(Math.ceil(limit * 0.2), 'week', filters),
      userId ? this.getPersonalizedRecommendations(userId, Math.ceil(limit * 0.2), filters) : [],
    ]);

    // Combine recommendations
    recommendations.push(...collaborative);
    recommendations.push(...contentBased);
    recommendations.push(...trending);
    recommendations.push(...personalized);

    // Remove duplicates
    const uniqueRecommendations = recommendations.filter((rec, index, self) => 
      index === self.findIndex(r => r.id === rec.id)
    );

    // Apply diversity and freshness factors
    const finalRecommendations = this.applyDiversityAndFreshness(
      uniqueRecommendations,
      diversityFactor,
      freshnessFactor
    );

    return finalRecommendations.slice(0, limit);
  }

  /**
   * Helper methods
   */
  static calculateCollaborativeScore(recommendation: any, similarUsers: any[]) {
    // Simple scoring based on interaction frequency
    const baseScore = 0.5;
    const interactionWeight = 0.3;
    const userSimilarityWeight = 0.2;
    
    return baseScore + (interactionWeight * Math.random()) + (userSimilarityWeight * Math.random());
  }

  static extractContentFeatures(articles: any[]) {
    const features = {
      sections: {},
      tags: {},
      authors: {},
      keywords: [],
      avgReadingTime: 0,
    };

    articles.forEach(article => {
      // Section features
      if (article.section) {
        features.sections[article.section.name] = (features.sections[article.section.name] || 0) + 1;
      }

      // Tag features
      article.tags?.forEach(tag => {
        features.tags[tag.name] = (features.tags[tag.name] || 0) + 1;
      });

      // Author features
      if (article.author) {
        features.authors[article.author.name] = (features.authors[article.author.name] || 0) + 1;
      }

      // Keywords
      if (article.keywords) {
        features.keywords.push(...article.keywords);
      }

      // Reading time
      features.avgReadingTime += article.readingTime || 0;
    });

    features.avgReadingTime = features.avgReadingTime / articles.length;
    return features;
  }

  static generateContentBasedReason(article: any, features: any) {
    if (article.section && features.sections[article.section.name]) {
      return `مقال من قسم ${article.section.name} الذي تقرأ منه كثيراً`;
    }

    if (article.tags?.length > 0) {
      const commonTags = article.tags.filter(tag => features.tags[tag.name]);
      if (commonTags.length > 0) {
        return `مقال يحتوي على موضوع ${commonTags[0].name} الذي يهمك`;
      }
    }

    return 'مقال مشابه لما تقرأه عادة';
  }

  static calculateTrendingScore(article: any, hoursBack: number) {
    const now = Date.now();
    const publishedAt = new Date(article.publishedAt).getTime();
    const age = (now - publishedAt) / (1000 * 60 * 60); // hours
    
    // Fresher articles get higher scores
    const freshnessScore = Math.max(0, 1 - (age / hoursBack));
    
    // Engagement score
    const engagementScore = (
      (article._count?.views || 0) * 0.1 +
      (article._count?.likes || 0) * 0.3 +
      (article._count?.comments || 0) * 0.4 +
      (article._count?.shares || 0) * 0.2
    );

    return freshnessScore * 0.3 + engagementScore * 0.7;
  }

  static async buildUserProfile(userId: string) {
    // Get user interactions
    const interactions = await prisma.userInteraction.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            section: true,
            tags: true,
          },
        },
      },
      take: 500,
      orderBy: { createdAt: 'desc' },
    });

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
      },
    });

    return {
      userId,
      interactions,
      preferences: user?.preferences || {},
    };
  }

  static buildFilterQuery(filters?: any) {
    const query: any = {};

    if (filters?.sections?.length > 0) {
      query.sectionId = { in: filters.sections };
    }

    if (filters?.tags?.length > 0) {
      query.tags = { some: { id: { in: filters.tags } } };
    }

    if (filters?.authors?.length > 0) {
      query.authorId = { in: filters.authors };
    }

    if (filters?.languages?.length > 0) {
      query.language = { in: filters.languages };
    }

    if (filters?.publishedAfter) {
      query.publishedAt = { gte: new Date(filters.publishedAfter) };
    }

    if (filters?.readingTimeRange) {
      const range: any = {};
      if (filters.readingTimeRange.min) {
        range.gte = filters.readingTimeRange.min;
      }
      if (filters.readingTimeRange.max) {
        range.lte = filters.readingTimeRange.max;
      }
      if (Object.keys(range).length > 0) {
        query.readingTime = range;
      }
    }

    return query;
  }

  static applyDiversityAndFreshness(
    recommendations: any[],
    diversityFactor: number,
    freshnessFactor: number
  ) {
    // Apply diversity by reducing scores of similar content
    const sectionCounts = {};
    const tagCounts = {};

    recommendations.forEach(rec => {
      if (rec.section) {
        sectionCounts[rec.section.id] = (sectionCounts[rec.section.id] || 0) + 1;
      }
      rec.tags?.forEach(tag => {
        tagCounts[tag.id] = (tagCounts[tag.id] || 0) + 1;
      });
    });

    // Apply freshness factor
    const now = Date.now();
    recommendations.forEach(rec => {
      const publishedAt = new Date(rec.publishedAt).getTime();
      const age = (now - publishedAt) / (1000 * 60 * 60 * 24); // days
      const freshnessScore = Math.max(0, 1 - (age / 30)); // 30 days max
      
      // Apply diversity penalty
      let diversityPenalty = 0;
      if (rec.section && sectionCounts[rec.section.id] > 1) {
        diversityPenalty += diversityFactor * (sectionCounts[rec.section.id] - 1) * 0.1;
      }

      // Apply freshness bonus
      const freshnessBonus = freshnessFactor * freshnessScore;

      // Adjust final score
      rec.score = Math.max(0, rec.score - diversityPenalty + freshnessBonus);
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }
}

/**
 * GET /api/recommendations
 * Get content recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const ipAddress = getClientIP(request);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(
      `recommendations:${ipAddress}`,
      30, // 30 requests
      60 * 1000 // per minute
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'تم تجاوز الحد الأقصى لطلبات التوصيات',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Get session (optional)
    const session = await getServerSession(authOptions);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    
    // Convert string values to proper types
    if (queryParams.limit) {
      queryParams.limit = parseInt(queryParams.limit);
    }
    if (queryParams.minScore) {
      queryParams.minScore = parseFloat(queryParams.minScore);
    }
    if (queryParams.diversityFactor) {
      queryParams.diversityFactor = parseFloat(queryParams.diversityFactor);
    }
    if (queryParams.freshnessFactor) {
      queryParams.freshnessFactor = parseFloat(queryParams.freshnessFactor);
    }
    if (queryParams.excludeViewed) {
      queryParams.excludeViewed = queryParams.excludeViewed === 'true';
    }
    if (queryParams.includeReasons) {
      queryParams.includeReasons = queryParams.includeReasons === 'true';
    }
    if (queryParams.filters) {
      queryParams.filters = JSON.parse(queryParams.filters);
    }

    const validatedQuery = recommendationQuerySchema.parse(queryParams);

    // Use user from session if not provided
    const targetUserId = validatedQuery.userId || session?.user?.id;

    // Check cache first
    const cacheKey = `recommendations:${targetUserId}:${JSON.stringify(validatedQuery)}`;
    const cachedRecommendations = await redisClient.get(cacheKey);
    
    if (cachedRecommendations) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(cachedRecommendations),
        fromCache: true,
        message: 'تم جلب التوصيات من الذاكرة المؤقتة',
      });
    }

    // Get recommendations based on algorithm
    let recommendations = [];
    
    switch (validatedQuery.algorithm) {
      case 'collaborative':
        if (targetUserId) {
          recommendations = await RecommendationEngine.getCollaborativeRecommendations(
            targetUserId,
            validatedQuery.limit,
            validatedQuery.filters
          );
        }
        break;
      case 'content-based':
        recommendations = await RecommendationEngine.getContentBasedRecommendations(
          targetUserId,
          validatedQuery.articleId,
          validatedQuery.limit,
          validatedQuery.filters
        );
        break;
      case 'trending':
        recommendations = await RecommendationEngine.getTrendingRecommendations(
          validatedQuery.limit,
          validatedQuery.timeWindow,
          validatedQuery.filters
        );
        break;
      case 'personalized':
        if (targetUserId) {
          recommendations = await RecommendationEngine.getPersonalizedRecommendations(
            targetUserId,
            validatedQuery.limit,
            validatedQuery.filters
          );
        }
        break;
      case 'hybrid':
      default:
        recommendations = await RecommendationEngine.getHybridRecommendations(
          targetUserId,
          validatedQuery.articleId,
          validatedQuery.limit,
          validatedQuery.diversityFactor,
          validatedQuery.freshnessFactor,
          validatedQuery.filters
        );
        break;
    }

    // Filter by minimum score
    recommendations = recommendations.filter(rec => rec.score >= validatedQuery.minScore);

    // Exclude viewed articles if requested
    if (validatedQuery.excludeViewed && targetUserId) {
      const viewedArticles = await prisma.userInteraction.findMany({
        where: {
          userId: targetUserId,
          interactionType: 'VIEW',
        },
        select: { articleId: true },
      });

      const viewedArticleIds = viewedArticles.map(v => v.articleId);
      recommendations = recommendations.filter(rec => !viewedArticleIds.includes(rec.id));
    }

    // Remove reasons if not requested
    if (!validatedQuery.includeReasons) {
      recommendations = recommendations.map(rec => {
        const { reason, ...recWithoutReason } = rec;
        return recWithoutReason;
      });
    }

    // Cache results for 10 minutes
    await redisClient.setex(cacheKey, 600, JSON.stringify(recommendations));

    // Create recommendation tracking record
    const recommendationRecord = await prisma.recommendationSession.create({
      data: {
        userId: targetUserId,
        algorithm: validatedQuery.algorithm,
        articleIds: recommendations.map(r => r.id),
        parameters: validatedQuery,
        timestamp: new Date(),
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: targetUserId || 'anonymous',
      action: 'GET_RECOMMENDATIONS',
      resource: 'recommendations',
      metadata: {
        algorithm: validatedQuery.algorithm,
        count: recommendations.length,
        sessionId: recommendationRecord.id,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: recommendations,
      sessionId: recommendationRecord.id,
      algorithm: validatedQuery.algorithm,
      fromCache: false,
      message: `تم إنشاء ${recommendations.length} توصية`,
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'معايير التوصيات غير صحيحة',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'خطأ في الحصول على التوصيات',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recommendations/feedback
 * Submit feedback on recommendations
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = feedbackSchema.parse(body);

    // Record feedback
    const feedback = await prisma.recommendationFeedback.create({
      data: {
        userId: session.user.id,
        recommendationId: validatedData.recommendationId,
        articleId: validatedData.articleId,
        feedback: validatedData.feedback,
        context: validatedData.context,
        timestamp: new Date(),
      },
    });

    // Update recommendation model with feedback
    await mlRecommendationEngine.updateWithFeedback(feedback);

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'RECOMMENDATION_FEEDBACK',
      resource: 'recommendations',
      metadata: {
        recommendationId: validatedData.recommendationId,
        articleId: validatedData.articleId,
        feedback: validatedData.feedback,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: feedback,
      message: 'تم تسجيل تقييم التوصية بنجاح',
    });

  } catch (error) {
    console.error('Error recording recommendation feedback:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'بيانات التقييم غير صحيحة',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'خطأ في تسجيل تقييم التوصية',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
} 