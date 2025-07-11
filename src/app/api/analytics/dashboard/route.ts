import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/dashboard
 * Get dashboard metrics and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d, 90d
    const userId = searchParams.get('userId'); // Optional: get user-specific analytics

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build base where clause
    const baseWhere = {
      timestamp: { gte: startDate },
      ...(userId && { user_id: userId }),
    };

    // Get key metrics
    const [
      totalPageViews,
      uniqueUsers,
      totalSessions,
      avgSessionDuration,
      bounceRate,
      topContent,
      topCategories,
      eventsByType,
      userActivity,
      deviceStats,
    ] = await Promise.all([
      // Total page views
      prisma.analyticsEvent.count({
        where: {
          ...baseWhere,
          event_type: 'page_view',
        },
      }),

      // Unique users
      prisma.analyticsEvent.groupBy({
        by: ['user_id'],
        where: {
          ...baseWhere,
          user_id: { not: null },
        },
        _count: true,
      }),

      // Total sessions
      prisma.userSession.count({
        where: {
          start_time: { gte: startDate },
          ...(userId && { user_id: userId }),
        },
      }),

      // Average session duration
      prisma.userSession.aggregate({
        _avg: { duration: true },
        where: {
          start_time: { gte: startDate },
          duration: { not: null },
          ...(userId && { user_id: userId }),
        },
      }),

      // Bounce rate
      prisma.userSession.aggregate({
        _avg: { is_bounce: true },
        where: {
          start_time: { gte: startDate },
          ...(userId && { user_id: userId }),
        },
      }),

      // Top content
      prisma.analyticsEvent.groupBy({
        by: ['article_id'],
        where: {
          ...baseWhere,
          event_type: 'page_view',
          article_id: { not: null },
        },
        _count: true,
        orderBy: { _count: { article_id: 'desc' } },
        take: 10,
      }),

      // Top categories
      prisma.analyticsEvent.groupBy({
        by: ['article_id'],
        where: {
          ...baseWhere,
          event_type: 'page_view',
          article_id: { not: null },
        },
        _count: true,
        take: 50,
      }),

      // Events by type
      prisma.analyticsEvent.groupBy({
        by: ['event_type'],
        where: baseWhere,
        _count: true,
        orderBy: { _count: { event_type: 'desc' } },
      }),

      // User activity over time
      prisma.analyticsEvent.groupBy({
        by: ['timestamp'],
        where: baseWhere,
        _count: true,
        orderBy: { timestamp: 'asc' },
      }),

      // Device stats
      prisma.userSession.groupBy({
        by: ['device_type'],
        where: {
          start_time: { gte: startDate },
          device_type: { not: null },
          ...(userId && { user_id: userId }),
        },
        _count: true,
      }),
    ]);

    // Get article details for top content
    const topContentWithDetails = await Promise.all(
      topContent.map(async (item) => {
        const article = await prisma.article.findUnique({
          where: { id: item.article_id! },
          select: {
            id: true,
            title: true,
            slug: true,
            view_count: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        });
        return {
          ...item,
          article,
        };
      })
    );

    // Calculate category stats
    const categoryStats = await prisma.article.groupBy({
      by: ['category_id'],
      where: {
        id: { in: topContent.map(c => c.article_id!).filter(Boolean) },
      },
      _count: true,
    });

    const categoryStatsWithDetails = await Promise.all(
      categoryStats.map(async (stat) => {
        const category = await prisma.category.findUnique({
          where: { id: stat.category_id },
          select: { name: true, slug: true },
        });
        return {
          ...stat,
          category,
        };
      })
    );

    // Process user activity for time series
    const activityTimeSeries = userActivity.reduce((acc, item) => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + item._count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousPeriodWhere = {
      timestamp: { gte: previousPeriodStart, lt: startDate },
      ...(userId && { user_id: userId }),
    };

    const [previousPageViews, previousSessions] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          ...previousPeriodWhere,
          event_type: 'page_view',
        },
      }),
      prisma.userSession.count({
        where: {
          start_time: { gte: previousPeriodStart, lt: startDate },
          ...(userId && { user_id: userId }),
        },
      }),
    ]);

    // Calculate growth percentages
    const pageViewGrowth = previousPageViews > 0 
      ? ((totalPageViews - previousPageViews) / previousPageViews) * 100 
      : 0;
    const sessionGrowth = previousSessions > 0 
      ? ((totalSessions - previousSessions) / previousSessions) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      overview: {
        totalPageViews,
        uniqueUsers: uniqueUsers.length,
        totalSessions,
        avgSessionDuration: Math.round(avgSessionDuration._avg.duration || 0),
        bounceRate: Math.round((bounceRate._avg.is_bounce || 0) * 100),
        growth: {
          pageViews: Math.round(pageViewGrowth * 100) / 100,
          sessions: Math.round(sessionGrowth * 100) / 100,
        },
      },
      topContent: topContentWithDetails.map(item => ({
        articleId: item.article_id,
        title: item.article?.title,
        slug: item.article?.slug,
        category: item.article?.category?.name,
        views: item._count,
        totalViews: item.article?.view_count || 0,
      })),
      topCategories: categoryStatsWithDetails.map(stat => ({
        categoryId: stat.category_id,
        name: stat.category?.name,
        slug: stat.category?.slug,
        views: stat._count,
      })),
      eventTypes: eventsByType.map(event => ({
        type: event.event_type,
        count: event._count,
      })),
      deviceStats: deviceStats.map(device => ({
        type: device.device_type,
        count: device._count,
        percentage: Math.round((device._count / totalSessions) * 100),
      })),
      activityTimeSeries,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { 
        error: 'خطأ في جلب الإحصائيات',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/dashboard/realtime
 * Get real-time analytics data
 */
export async function POST(request: NextRequest) {
  try {
    const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);
    const last1Hour = new Date(Date.now() - 60 * 60 * 1000);

    const [
      activeUsers,
      recentPageViews,
      recentEvents,
      topPages,
      recentSessions,
    ] = await Promise.all([
      // Active users in last 15 minutes
      prisma.analyticsEvent.groupBy({
        by: ['user_id'],
        where: {
          timestamp: { gte: last15Minutes },
          user_id: { not: null },
        },
        _count: true,
      }),

      // Page views in last hour
      prisma.analyticsEvent.count({
        where: {
          event_type: 'page_view',
          timestamp: { gte: last1Hour },
        },
      }),

      // Recent events
      prisma.analyticsEvent.findMany({
        where: {
          timestamp: { gte: last15Minutes },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: {
          article: {
            select: {
              title: true,
              slug: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Top pages in last hour
      prisma.analyticsEvent.groupBy({
        by: ['page_url'],
        where: {
          event_type: 'page_view',
          timestamp: { gte: last1Hour },
          page_url: { not: null },
        },
        _count: true,
        orderBy: { _count: { page_url: 'desc' } },
        take: 10,
      }),

      // Recent sessions
      prisma.userSession.count({
        where: {
          start_time: { gte: last1Hour },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      realtime: {
        activeUsers: activeUsers.length,
        pageViewsLastHour: recentPageViews,
        sessionsLastHour: recentSessions,
        topPages: topPages.map(page => ({
          url: page.page_url,
          views: page._count,
        })),
        recentEvents: recentEvents.slice(0, 20).map(event => ({
          type: event.event_type,
          timestamp: event.timestamp,
          user: event.user?.name || 'زائر',
          article: event.article?.title,
          page: event.page_url,
        })),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Real-time analytics error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب البيانات المباشرة' },
      { status: 500 }
    );
  }
} 