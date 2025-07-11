import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/dashboard
 * الحصول على إحصائيات لوحة التحكم الشاملة
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d, 90d
    const userId = searchParams.get('userId'); // إحصائيات مستخدم محدد

    // حساب التواريخ
    const now = new Date();
    const periodDays = getPeriodDays(period);
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // إعداد فلاتر الاستعلام
    const baseFilter: any = {
      timestamp: { gte: startDate }
    };
    const prevFilter: any = {
      timestamp: { gte: prevStartDate, lt: startDate }
    };

    if (userId) {
      baseFilter.user_id = userId;
      prevFilter.user_id = userId;
    }

    // استعلامات متوازية للحصول على الإحصائيات
    const [
      // الإحصائيات الأساسية
      totalEvents,
      prevTotalEvents,
      uniqueUsers,
      prevUniqueUsers,
      totalSessions,
      prevTotalSessions,
      
      // إحصائيات التفاعل
      pageViews,
      prevPageViews,
      totalReadingTime,
      prevTotalReadingTime,
      
      // أهم المقالات
      topArticles,
      
      // إحصائيات الأحداث
      eventsByType,
      prevEventsByType,
      
      // إحصائيات الجلسات
      sessionStats,
      
      // إحصائيات المحتوى
      contentStats,
      
      // المقاييس المباشرة
      realtimeStats
    ] = await Promise.all([
      // الإحصائيات الأساسية
      prisma.analyticsEvent.count({ where: baseFilter }),
      prisma.analyticsEvent.count({ where: prevFilter }),
      
      prisma.analyticsEvent.groupBy({
        by: ['user_id'],
        where: { ...baseFilter, user_id: { not: null } },
        _count: { user_id: true }
      }),
      
      prisma.analyticsEvent.groupBy({
        by: ['user_id'],
        where: { ...prevFilter, user_id: { not: null } },
        _count: { user_id: true }
      }),
      
      prisma.userSession.count({
        where: { start_time: { gte: startDate } }
      }),
      
      prisma.userSession.count({
        where: { start_time: { gte: prevStartDate, lt: startDate } }
      }),
      
      // إحصائيات التفاعل
      prisma.analyticsEvent.count({
        where: { ...baseFilter, event_type: 'page_view' }
      }),
      
      prisma.analyticsEvent.count({
        where: { ...prevFilter, event_type: 'page_view' }
      }),
      
      prisma.analyticsEvent.aggregate({
        where: { ...baseFilter, event_type: 'reading_time' },
        _sum: { event_data: true }
      }),
      
      prisma.analyticsEvent.aggregate({
        where: { ...prevFilter, event_type: 'reading_time' },
        _sum: { event_data: true }
      }),
      
      // أهم المقالات
      getTopArticles(startDate, userId),
      
      // إحصائيات الأحداث
      prisma.analyticsEvent.groupBy({
        by: ['event_type'],
        where: baseFilter,
        _count: { event_type: true }
      }),
      
      prisma.analyticsEvent.groupBy({
        by: ['event_type'],
        where: prevFilter,
        _count: { event_type: true }
      }),
      
      // إحصائيات الجلسات
      getSessionStats(startDate, userId),
      
      // إحصائيات المحتوى
      getContentStats(startDate, userId),
      
      // المقاييس المباشرة (آخر 15 دقيقة)
      getRealtimeStats()
    ]);

    // حساب معدلات النمو
    const growthRates = {
      events: calculateGrowthRate(totalEvents, prevTotalEvents),
      users: calculateGrowthRate(uniqueUsers.length, prevUniqueUsers.length),
      sessions: calculateGrowthRate(totalSessions, prevTotalSessions),
      pageViews: calculateGrowthRate(pageViews, prevPageViews),
      readingTime: calculateGrowthRate(
        getTotalSeconds(totalReadingTime),
        getTotalSeconds(prevTotalReadingTime)
      )
    };

    // تنسيق البيانات
    const dashboard = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      
      // الإحصائيات الأساسية
      overview: {
        totalEvents: {
          current: totalEvents,
          previous: prevTotalEvents,
          growth: growthRates.events
        },
        uniqueUsers: {
          current: uniqueUsers.length,
          previous: prevUniqueUsers.length,
          growth: growthRates.users
        },
        totalSessions: {
          current: totalSessions,
          previous: prevTotalSessions,
          growth: growthRates.sessions
        },
        pageViews: {
          current: pageViews,
          previous: prevPageViews,
          growth: growthRates.pageViews
        },
        avgReadingTime: {
          current: Math.round(getTotalSeconds(totalReadingTime) / Math.max(pageViews, 1)),
          previous: Math.round(getTotalSeconds(prevTotalReadingTime) / Math.max(prevPageViews, 1)),
          growth: growthRates.readingTime
        }
      },
      
      // أهم المقالات
      topArticles: topArticles.slice(0, 10),
      
      // إحصائيات الأحداث
      eventsByType: formatEventsByType(eventsByType, prevEventsByType),
      
      // إحصائيات الجلسات
      sessions: sessionStats,
      
      // إحصائيات المحتوى
      content: contentStats,
      
      // المقاييس المباشرة
      realtime: realtimeStats,
      
      // تحليلات إضافية
      analytics: {
        bounceRate: sessionStats.bounceRate,
        avgSessionDuration: sessionStats.avgDuration,
        pagesPerSession: sessionStats.avgPagesPerSession,
        topDevices: sessionStats.topDevices,
        topBrowsers: sessionStats.topBrowsers,
        topCountries: sessionStats.topCountries
      }
    };

    return NextResponse.json(dashboard);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/dashboard
 * الحصول على بيانات مباشرة للوحة التحكم
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics, timeRange } = body;

    const now = new Date();
    const startTime = timeRange === 'hour' 
      ? new Date(now.getTime() - 60 * 60 * 1000)
      : new Date(now.getTime() - 15 * 60 * 1000);

    const realtimeData: any = {};

    // جلب المقاييس المطلوبة
    if (metrics.includes('activeUsers')) {
      realtimeData.activeUsers = await getActiveUsers(startTime);
    }

    if (metrics.includes('pageViews')) {
      realtimeData.pageViews = await getRealtimePageViews(startTime);
    }

    if (metrics.includes('events')) {
      realtimeData.events = await getRealtimeEvents(startTime);
    }

    if (metrics.includes('topPages')) {
      realtimeData.topPages = await getTopPages(startTime);
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      timeRange,
      data: realtimeData
    });

  } catch (error) {
    console.error('Error fetching realtime data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// دوال مساعدة

/**
 * تحويل فترة إلى أيام
 */
function getPeriodDays(period: string): number {
  switch (period) {
    case '1d': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 7;
  }
}

/**
 * حساب معدل النمو
 */
function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * استخراج إجمالي الثواني من نتيجة aggregate
 */
function getTotalSeconds(result: any): number {
  if (!result._sum.event_data) return 0;
  
  // إذا كانت البيانات في شكل { seconds: number }
  if (typeof result._sum.event_data === 'object' && result._sum.event_data.seconds) {
    return result._sum.event_data.seconds;
  }
  
  // إذا كانت البيانات رقم مباشر
  if (typeof result._sum.event_data === 'number') {
    return result._sum.event_data;
  }
  
  return 0;
}

/**
 * الحصول على أهم المقالات
 */
async function getTopArticles(startDate: Date, userId?: string) {
  const filter: any = {
    timestamp: { gte: startDate },
    article_id: { not: null }
  };
  
  if (userId) filter.user_id = userId;

  const articleEvents = await prisma.analyticsEvent.groupBy({
    by: ['article_id'],
    where: filter,
    _count: { article_id: true },
    orderBy: { _count: { article_id: 'desc' } },
    take: 15
  });

  // جلب تفاصيل المقالات
  const articleIds = articleEvents.map(e => e.article_id).filter(Boolean);
  const articles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    select: { id: true, title: true, slug: true, view_count: true }
  });

  return articleEvents.map(event => {
    const article = articles.find(a => a.id === event.article_id);
    return {
      id: event.article_id,
      title: article?.title || 'مقال غير معروف',
      slug: article?.slug || '',
      events: event._count.article_id,
      totalViews: article?.view_count || 0
    };
  });
}

/**
 * تنسيق إحصائيات الأحداث
 */
function formatEventsByType(current: any[], previous: any[]) {
  const currentMap = new Map(current.map(e => [e.event_type, e._count.event_type]));
  const previousMap = new Map(previous.map(e => [e.event_type, e._count.event_type]));

  const eventTypes = [...new Set([...currentMap.keys(), ...previousMap.keys()])];

  return eventTypes.map(type => ({
    type,
    current: currentMap.get(type) || 0,
    previous: previousMap.get(type) || 0,
    growth: calculateGrowthRate(
      currentMap.get(type) || 0,
      previousMap.get(type) || 0
    )
  }));
}

/**
 * إحصائيات الجلسات
 */
async function getSessionStats(startDate: Date, userId?: string) {
  const filter: any = { start_time: { gte: startDate } };
  if (userId) filter.user_id = userId;

  const sessions = await prisma.userSession.findMany({
    where: filter,
    select: {
      duration: true,
      page_views: true,
      is_bounce: true,
      device_type: true,
      browser: true,
      country: true
    }
  });

  const totalSessions = sessions.length;
  const bounceSessions = sessions.filter(s => s.is_bounce).length;
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalPageViews = sessions.reduce((sum, s) => sum + (s.page_views || 0), 0);

  // تجميع الأجهزة والمتصفحات
  const deviceCounts = new Map<string, number>();
  const browserCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();

  sessions.forEach(session => {
    if (session.device_type) {
      deviceCounts.set(session.device_type, (deviceCounts.get(session.device_type) || 0) + 1);
    }
    if (session.browser) {
      browserCounts.set(session.browser, (browserCounts.get(session.browser) || 0) + 1);
    }
    if (session.country) {
      countryCounts.set(session.country, (countryCounts.get(session.country) || 0) + 1);
    }
  });

  return {
    total: totalSessions,
    bounceRate: totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0,
    avgDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
    avgPagesPerSession: totalSessions > 0 ? Math.round(totalPageViews / totalSessions) : 0,
    topDevices: Array.from(deviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([device, count]) => ({ device, count })),
    topBrowsers: Array.from(browserCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([browser, count]) => ({ browser, count })),
    topCountries: Array.from(countryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }))
  };
}

/**
 * إحصائيات المحتوى
 */
async function getContentStats(startDate: Date, userId?: string) {
  const contentAnalytics = await prisma.contentAnalytics.findMany({
    where: {
      updated_at: { gte: startDate }
    },
    orderBy: { performance_score: 'desc' },
    take: 10
  });

  const totalViews = contentAnalytics.reduce((sum, c) => sum + c.views, 0);
  const totalLikes = contentAnalytics.reduce((sum, c) => sum + c.likes, 0);
  const totalShares = contentAnalytics.reduce((sum, c) => sum + c.shares, 0);
  const avgTimeOnPage = contentAnalytics.reduce((sum, c) => sum + c.avg_time_on_page, 0) / Math.max(contentAnalytics.length, 1);

  return {
    totalContent: contentAnalytics.length,
    totalViews,
    totalLikes,
    totalShares,
    avgTimeOnPage: Math.round(avgTimeOnPage),
    topPerforming: contentAnalytics.map(c => ({
      contentId: c.content_id,
      contentType: c.content_type,
      title: c.title,
      views: c.views,
      likes: c.likes,
      shares: c.shares,
      performanceScore: c.performance_score
    }))
  };
}

/**
 * المقاييس المباشرة
 */
async function getRealtimeStats() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  const realtimeMetrics = await prisma.realtimeMetrics.findMany({
    where: {
      timestamp: { gte: fifteenMinutesAgo }
    },
    orderBy: { timestamp: 'desc' }
  });

  const metricsByType = new Map<string, number>();
  realtimeMetrics.forEach(metric => {
    metricsByType.set(metric.metric_name, (metricsByType.get(metric.metric_name) || 0) + metric.value);
  });

  return {
    activeUsers: await getActiveUsers(fifteenMinutesAgo),
    recentEvents: Array.from(metricsByType.entries()).map(([name, value]) => ({
      name,
      value
    })),
    timestamp: new Date().toISOString()
  };
}

/**
 * المستخدمون النشطون
 */
async function getActiveUsers(startTime: Date) {
  const activeUsers = await prisma.analyticsEvent.groupBy({
    by: ['user_id'],
    where: {
      timestamp: { gte: startTime },
      user_id: { not: null }
    },
    _count: { user_id: true }
  });

  return activeUsers.length;
}

/**
 * مشاهدات الصفحات المباشرة
 */
async function getRealtimePageViews(startTime: Date) {
  return await prisma.analyticsEvent.count({
    where: {
      timestamp: { gte: startTime },
      event_type: 'page_view'
    }
  });
}

/**
 * الأحداث المباشرة
 */
async function getRealtimeEvents(startTime: Date) {
  return await prisma.analyticsEvent.groupBy({
    by: ['event_type'],
    where: {
      timestamp: { gte: startTime }
    },
    _count: { event_type: true }
  });
}

/**
 * أهم الصفحات المباشرة
 */
async function getTopPages(startTime: Date) {
  const pageViews = await prisma.analyticsEvent.groupBy({
    by: ['page_url'],
    where: {
      timestamp: { gte: startTime },
      event_type: 'page_view',
      page_url: { not: null }
    },
    _count: { page_url: true },
    orderBy: { _count: { page_url: 'desc' } },
    take: 10
  });

  return pageViews.map(pv => ({
    url: pv.page_url,
    views: pv._count.page_url
  }));
} 