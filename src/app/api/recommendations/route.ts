/**
 * API Routes for Content Recommendations
 * 
 * @description Provides intelligent content recommendations based on user behavior and content analysis
 * @author Sabq AI CMS Team
 * @version 1.0.0
 * @created 2024-01-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { RecommendationsEngine } from '@/lib/recommendations-engine';
import { checkRateLimit } from '@/lib/rate-limiter';
import { RequestSecurity } from '@/lib/auth-security';

const prisma = new PrismaClient();
const recommendationsEngine = RecommendationsEngine.getInstance();

// Validation schemas
const getRecommendationsSchema = z.object({
  userId: z.string().uuid('معرف المستخدم غير صحيح'),
  type: z.enum(['content', 'category', 'mixed']).default('mixed'),
  limit: z.number().min(1).max(20).default(5),
  excludeViewed: z.boolean().default(true),
  timeWindow: z.number().min(1).max(365).default(30),
});

const feedbackSchema = z.object({
  userId: z.string().uuid('معرف المستخدم غير صحيح'),
  recommendationId: z.string().min(1, 'معرف التوصية مطلوب'),
  feedback: z.enum(['like', 'dislike', 'view', 'click', 'share']),
  metadata: z.any().optional(),
});

const analyzeInterestsSchema = z.object({
  userId: z.string().uuid('معرف المستخدم غير صحيح'),
  forceUpdate: z.boolean().default(false),
});

/**
 * GET /api/recommendations
 * Get personalized recommendations for a user
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد الأقصى للطلبات' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      userId: searchParams.get('userId') || '',
      type: searchParams.get('type') || 'mixed',
      limit: parseInt(searchParams.get('limit') || '5'),
      excludeViewed: searchParams.get('excludeViewed') !== 'false',
      timeWindow: parseInt(searchParams.get('timeWindow') || '30'),
    };

    // Validate input
    const validation = getRecommendationsSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }

    const { userId, type, limit, excludeViewed, timeWindow } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Generate recommendations
    const result = await recommendationsEngine.generateRecommendations(userId, {
      type: type as 'content' | 'category' | 'mixed',
      limit,
      excludeViewed,
      timeWindow,
    });

    // Save recommendations to database
    if (result.recommendations.length > 0) {
      await recommendationsEngine.saveRecommendations(result.recommendations);
    }

    // Log the request
    await prisma.analyticsEvent.create({
      data: {
        user_id: userId,
        event_type: 'recommendations_requested',
        metadata: {
          type,
          limit,
          excludeViewed,
          timeWindow,
          recommendationsCount: result.recommendations.length,
          confidence: result.confidence,
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations: result.recommendations.map(rec => ({
          id: rec.id,
          contentType: rec.content_type,
          contentId: rec.content_id,
          title: rec.title,
          description: rec.description,
          url: rec.url,
          score: Math.round(rec.score * 100) / 100, // تقريب إلى منزلتين عشريتين
          reasonType: rec.reason_type,
          reasonData: rec.reason_data,
          createdAt: rec.created_at,
        })),
        reasoning: result.reasoning,
        confidence: Math.round(result.confidence * 100) / 100,
        metadata: {
          userId,
          type,
          limit,
          excludeViewed,
          timeWindow,
          generatedAt: new Date(),
        },
      },
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب التوصيات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recommendations
 * Record user feedback on recommendations or trigger analysis
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد الأقصى للطلبات' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'feedback':
        return await handleFeedback(request, body);
      case 'analyze_interests':
        return await handleAnalyzeInterests(request, body);
      case 'refresh_recommendations':
        return await handleRefreshRecommendations(request, body);
      default:
        return NextResponse.json(
          { error: 'عملية غير مدعومة' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Post recommendations error:', error);
    return NextResponse.json(
      { error: 'خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
}

/**
 * Handle user feedback on recommendations
 */
async function handleFeedback(request: NextRequest, body: any) {
  try {
    const validation = feedbackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }

    const { userId, recommendationId, feedback, metadata } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Check if recommendation exists
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
      select: { id: true, user_id: true, content_id: true },
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: 'التوصية غير موجودة' },
        { status: 404 }
      );
    }

    if (recommendation.user_id !== userId) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول لهذه التوصية' },
        { status: 403 }
      );
    }

    // Record feedback
    await recommendationsEngine.recordRecommendationFeedback(
      userId,
      recommendationId,
      feedback,
      metadata
    );

    // Log the feedback
    await prisma.analyticsEvent.create({
      data: {
        user_id: userId,
        event_type: 'recommendation_feedback',
        metadata: {
          recommendationId,
          feedback,
          contentId: recommendation.content_id,
          ...metadata,
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل ردود الفعل بنجاح',
      data: {
        userId,
        recommendationId,
        feedback,
        recordedAt: new Date(),
      },
    });

  } catch (error) {
    console.error('Handle feedback error:', error);
    return NextResponse.json(
      { error: 'خطأ في تسجيل ردود الفعل' },
      { status: 500 }
    );
  }
}

/**
 * Handle user interests analysis
 */
async function handleAnalyzeInterests(request: NextRequest, body: any) {
  try {
    const validation = analyzeInterestsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }

    const { userId, forceUpdate } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Check if recent analysis exists (unless forced)
    if (!forceUpdate) {
      const recentAnalysis = await prisma.userInterest.findFirst({
        where: { 
          user_id: userId,
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // آخر 24 ساعة
          },
        },
      });

      if (recentAnalysis) {
        return NextResponse.json(
          { error: 'تم تحليل اهتمامات المستخدم مؤخراً' },
          { status: 409 }
        );
      }
    }

    // Analyze user interests
    const analysis = await recommendationsEngine.analyzeUserInterests(userId);

    // Update user interests in database
    await recommendationsEngine.updateUserInterests(userId, analysis);

    // Log the analysis
    await prisma.analyticsEvent.create({
      data: {
        user_id: userId,
        event_type: 'interests_analyzed',
        metadata: {
          dataPoints: analysis.dataPoints,
          overallEngagement: analysis.overallEngagement,
          categoriesCount: Object.keys(analysis.categoryInterests).length,
          keywordsCount: Object.keys(analysis.keywordInterests).length,
          forceUpdate,
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحليل اهتمامات المستخدم بنجاح',
      data: {
        userId,
        analysis: {
          dataPoints: analysis.dataPoints,
          overallEngagement: Math.round(analysis.overallEngagement * 100) / 100,
          topCategories: Object.entries(analysis.categoryInterests)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([category, score]) => ({
              category,
              score: Math.round(score * 100) / 100,
            })),
          topKeywords: Object.entries(analysis.keywordInterests)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([keyword, score]) => ({
              keyword,
              score: Math.round(score * 100) / 100,
            })),
          lastUpdated: analysis.lastUpdated,
        },
      },
    });

  } catch (error) {
    console.error('Handle analyze interests error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحليل اهتمامات المستخدم' },
      { status: 500 }
    );
  }
}

/**
 * Handle refresh recommendations
 */
async function handleRefreshRecommendations(request: NextRequest, body: any) {
  try {
    const { userId, clearOld = false } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Clear old recommendations if requested
    if (clearOld) {
      await prisma.recommendation.deleteMany({
        where: { 
          user_id: userId,
          created_at: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // أقدم من 7 أيام
          },
        },
      });
    }

    // Generate fresh recommendations
    const result = await recommendationsEngine.generateRecommendations(userId, {
      type: 'mixed',
      limit: 10,
      excludeViewed: true,
      timeWindow: 30,
    });

    // Save new recommendations
    if (result.recommendations.length > 0) {
      await recommendationsEngine.saveRecommendations(result.recommendations);
    }

    // Log the refresh
    await prisma.analyticsEvent.create({
      data: {
        user_id: userId,
        event_type: 'recommendations_refreshed',
        metadata: {
          recommendationsCount: result.recommendations.length,
          confidence: result.confidence,
          clearOld,
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث التوصيات بنجاح',
      data: {
        userId,
        recommendationsCount: result.recommendations.length,
        confidence: Math.round(result.confidence * 100) / 100,
        refreshedAt: new Date(),
      },
    });

  } catch (error) {
    console.error('Handle refresh recommendations error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث التوصيات' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recommendations
 * Clear user recommendations
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Delete user recommendations
    const deletedCount = await prisma.recommendation.deleteMany({
      where: { user_id: userId },
    });

    // Log the deletion
    await prisma.analyticsEvent.create({
      data: {
        user_id: userId,
        event_type: 'recommendations_cleared',
        metadata: {
          deletedCount: deletedCount.count,
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف التوصيات بنجاح',
      data: {
        userId,
        deletedCount: deletedCount.count,
        clearedAt: new Date(),
      },
    });

  } catch (error) {
    console.error('Delete recommendations error:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف التوصيات' },
      { status: 500 }
    );
  }
} 