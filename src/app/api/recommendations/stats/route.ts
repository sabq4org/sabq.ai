import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { RecommendationsEngine } from '@/lib/recommendations-engine';
import { checkRateLimit } from '@/lib/rate-limiter';
import { RequestSecurity } from '@/lib/auth-security';

const prisma = new PrismaClient();
const recommendationsEngine = RecommendationsEngine.getInstance();

// Validation schemas
const getStatsSchema = z.object({
  userId: z.string().uuid('معرف المستخدم غير صحيح').optional(),
  timeRange: z.enum(['hour', 'day', 'week', 'month', 'year', 'all']).default('week'),
  includeDetails: z.boolean().default(false),
});

/**
 * GET /api/recommendations/stats
 * Get recommendation statistics and analytics
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
      userId: searchParams.get('userId') || undefined,
      timeRange: searchParams.get('timeRange') || 'week',
      includeDetails: searchParams.get('includeDetails') === 'true',
    };

    // Validate input
    const validation = getStatsSchema.safeParse(queryParams);
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

    const { userId, timeRange, includeDetails } = validation.data;

    // Check if user exists (if specified)
    if (userId) {
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
    }

    // Calculate time range
    const timeRangeMap = {
      hour: 1,
      day: 24,
      week: 24 * 7,
      month: 24 * 30,
      year: 24 * 365,
      all: null,
    };

    const hoursBack = timeRangeMap[timeRange];
    const since = hoursBack ? new Date(Date.now() - hoursBack * 60 * 60 * 1000) : null;

    // Get basic statistics
    const stats = await getBasicStats(userId, since);

    // Get detailed analytics if requested
    let detailedAnalytics = null;
    if (includeDetails) {
      detailedAnalytics = await getDetailedAnalytics(userId, since);
    }

    // Get performance metrics
    const performanceMetrics = await getPerformanceMetrics(userId, since);

    // Get recommendation engine stats
    const engineStats = await recommendationsEngine.getRecommendationStats(userId);

    // Log the request
    await prisma.analyticsEvent.create({
      data: {
        user_id: userId || 'system',
        event_type: 'stats_requested',
        details: {
          type: 'recommendations',
          timeRange,
          includeDetails,
          requestedBy: userId || 'anonymous',
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: stats,
        performance: performanceMetrics,
        engine: engineStats,
        ...(detailedAnalytics && { detailed: detailedAnalytics }),
        metadata: {
          userId,
          timeRange,
          includeDetails,
          generatedAt: new Date(),
          dataSource: 'recommendations_engine',
        },
      },
    });

  } catch (error) {
    console.error('Get recommendation stats error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الإحصائيات' },
      { status: 500 }
    );
  }
}

/**
 * Get basic recommendation statistics
 */
async function getBasicStats(userId?: string, since?: Date | null) {
  const whereClause: any = {};
  if (userId) whereClause.user_id = userId;
  if (since) whereClause.created_at = { gte: since };

  const [
    totalRecommendations,
    totalFeedback,
    uniqueUsers,
    avgScore,
    topReasonTypes,
  ] = await Promise.all([
    prisma.recommendation.count({ where: whereClause }),
    prisma.recommendationReasonFeedback.count({ where: whereClause }),
    userId ? 1 : prisma.recommendation.groupBy({
      by: ['user_id'],
      where: whereClause,
      _count: true,
    }).then(result => result.length),
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
  ]);

  return {
    totalRecommendations,
    totalFeedback,
    uniqueUsers,
    averageScore: Math.round((avgScore._avg.score || 0) * 100) / 100,
    topReasonTypes: topReasonTypes.map(item => ({
      type: item.reason_type,
      count: item._count,
      percentage: Math.round((item._count / totalRecommendations) * 100),
    })),
  };
}

/**
 * Get detailed analytics
 */
async function getDetailedAnalytics(userId?: string, since?: Date | null) {
  const whereClause: any = {};
  if (userId) whereClause.user_id = userId;
  if (since) whereClause.created_at = { gte: since };

  // Get feedback distribution
  const feedbackDistribution = await prisma.recommendationReasonFeedback.groupBy({
    by: ['feedback_type'],
    where: whereClause,
    _count: true,
  });

  // Get content type distribution
  const contentTypeDistribution = await prisma.recommendation.groupBy({
    by: ['content_type'],
    where: whereClause,
    _count: true,
  });

  // Get score distribution
  const scoreDistribution = await prisma.recommendation.findMany({
    where: whereClause,
    select: { score: true },
  });

  // Calculate score buckets
  const scoreBuckets = {
    '0.0-0.2': 0,
    '0.2-0.4': 0,
    '0.4-0.6': 0,
    '0.6-0.8': 0,
    '0.8-1.0': 0,
  };

  scoreDistribution.forEach(rec => {
    const score = rec.score;
    if (score < 0.2) scoreBuckets['0.0-0.2']++;
    else if (score < 0.4) scoreBuckets['0.2-0.4']++;
    else if (score < 0.6) scoreBuckets['0.4-0.6']++;
    else if (score < 0.8) scoreBuckets['0.6-0.8']++;
    else scoreBuckets['0.8-1.0']++;
  });

  // Get time-based trends
  const timeTrends = await getTimeTrends(whereClause);

  return {
    feedbackDistribution: feedbackDistribution.map(item => ({
      type: item.feedback_type,
      count: item._count,
    })),
    contentTypeDistribution: contentTypeDistribution.map(item => ({
      type: item.content_type,
      count: item._count,
    })),
    scoreDistribution: scoreBuckets,
    timeTrends,
  };
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(userId?: string, since?: Date | null) {
  const whereClause: any = {};
  if (userId) whereClause.user_id = userId;
  if (since) whereClause.created_at = { gte: since };

  // Get click-through rate
  const [totalRecommendations, clickedRecommendations] = await Promise.all([
    prisma.recommendation.count({ where: whereClause }),
    prisma.recommendationReasonFeedback.count({
      where: {
        ...whereClause,
        feedback_type: 'click',
      },
    }),
  ]);

  const clickThroughRate = totalRecommendations > 0 
    ? Math.round((clickedRecommendations / totalRecommendations) * 100) / 100
    : 0;

  // Get engagement metrics
  const engagementMetrics = await prisma.recommendationReasonFeedback.groupBy({
    by: ['feedback_type'],
    where: whereClause,
    _count: true,
  });

  const engagementRate = totalRecommendations > 0
    ? Math.round((engagementMetrics.reduce((sum, item) => sum + item._count, 0) / totalRecommendations) * 100) / 100
    : 0;

  // Get satisfaction metrics (likes vs dislikes)
  const likes = engagementMetrics.find(item => item.feedback_type === 'like')?._count || 0;
  const dislikes = engagementMetrics.find(item => item.feedback_type === 'dislike')?._count || 0;
  const satisfactionRate = (likes + dislikes) > 0
    ? Math.round((likes / (likes + dislikes)) * 100) / 100
    : 0;

  return {
    clickThroughRate,
    engagementRate,
    satisfactionRate,
    totalInteractions: engagementMetrics.reduce((sum, item) => sum + item._count, 0),
    interactionBreakdown: engagementMetrics.map(item => ({
      type: item.feedback_type,
      count: item._count,
    })),
  };
}

/**
 * Get time-based trends
 */
async function getTimeTrends(whereClause: any) {
  // Get daily trends for the last 7 days
  const trends = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayWhereClause = {
      ...whereClause,
      created_at: {
        gte: date,
        lt: nextDate,
      },
    };
    
    const [recommendations, feedback] = await Promise.all([
      prisma.recommendation.count({ where: dayWhereClause }),
      prisma.recommendationReasonFeedback.count({ where: dayWhereClause }),
    ]);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      recommendations,
      feedback,
    });
  }
  
  return trends;
}

/**
 * POST /api/recommendations/stats
 * Generate or refresh recommendation statistics
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
    const { action, userId } = body;

    switch (action) {
      case 'refresh_stats':
        return await handleRefreshStats(request, userId);
      case 'generate_report':
        return await handleGenerateReport(request, body);
      default:
        return NextResponse.json(
          { error: 'عملية غير مدعومة' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Post recommendation stats error:', error);
    return NextResponse.json(
      { error: 'خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
}

/**
 * Handle refresh statistics
 */
async function handleRefreshStats(request: NextRequest, userId?: string) {
  try {
    // Check if user exists (if specified)
    if (userId) {
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
    }

    // Refresh recommendation engine stats
    const engineStats = await recommendationsEngine.getRecommendationStats(userId);

    // Log the refresh
    await prisma.analyticsEvent.create({
      data: {
        user_id: userId || 'system',
        event_type: 'stats_refreshed',
        details: {
          type: 'recommendations',
          userId: userId || 'all',
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الإحصائيات بنجاح',
      data: {
        engineStats,
        refreshedAt: new Date(),
      },
    });

  } catch (error) {
    console.error('Handle refresh stats error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الإحصائيات' },
      { status: 500 }
    );
  }
}

/**
 * Handle generate report
 */
async function handleGenerateReport(request: NextRequest, body: any) {
  try {
    const { userId, format = 'json', timeRange = 'week' } = body;

    // Check if user exists (if specified)
    if (userId) {
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
    }

    // Calculate time range
    const timeRangeMap = {
      hour: 1,
      day: 24,
      week: 24 * 7,
      month: 24 * 30,
      year: 24 * 365,
    };

    const hoursBack = timeRangeMap[timeRange] || 24 * 7;
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Generate comprehensive report
    const [basicStats, detailedAnalytics, performanceMetrics, engineStats] = await Promise.all([
      getBasicStats(userId, since),
      getDetailedAnalytics(userId, since),
      getPerformanceMetrics(userId, since),
      recommendationsEngine.getRecommendationStats(userId),
    ]);

    const report = {
      metadata: {
        userId: userId || 'all_users',
        timeRange,
        generatedAt: new Date(),
        format,
      },
      summary: {
        totalRecommendations: basicStats.totalRecommendations,
        totalFeedback: basicStats.totalFeedback,
        averageScore: basicStats.averageScore,
        clickThroughRate: performanceMetrics.clickThroughRate,
        engagementRate: performanceMetrics.engagementRate,
        satisfactionRate: performanceMetrics.satisfactionRate,
      },
      detailed: {
        basic: basicStats,
        analytics: detailedAnalytics,
        performance: performanceMetrics,
        engine: engineStats,
      },
    };

    // Log the report generation
    await prisma.analyticsEvent.create({
      data: {
        user_id: userId || 'system',
        event_type: 'report_generated',
        details: {
          type: 'recommendations',
          format,
          timeRange,
          userId: userId || 'all',
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء التقرير بنجاح',
      data: report,
    });

  } catch (error) {
    console.error('Handle generate report error:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء التقرير' },
      { status: 500 }
    );
  }
} 