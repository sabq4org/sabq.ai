import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JourneyStep {
  eventType: string;
  articleId?: string;
  articleTitle?: string;
  timestamp: Date;
  order: number;
}

interface UserJourney {
  sessionId: string;
  userId?: string;
  steps: JourneyStep[];
  duration: number;
  deviceType?: string;
  startTime: Date;
  endTime?: Date;
}

/**
 * GET /api/analytics/user-journeys
 * تحليل مسارات المستخدم الأكثر شيوعاً
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5000');
    const days = parseInt(searchParams.get('days') || '30');
    const minSteps = parseInt(searchParams.get('minSteps') || '2');
    const maxSteps = parseInt(searchParams.get('maxSteps') || '10');

    // تحديد نطاق التاريخ
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // جلب الجلسات مع الأحداث المرتبطة
    const sessions = await prisma.userSession.findMany({
      where: {
        start_time: { gte: startDate },
        events_count: { gte: minSteps }
      },
      select: {
        session_id: true,
        user_id: true,
        start_time: true,
        end_time: true,
        duration: true,
        device_type: true,
        page_views: true,
        is_bounce: true
      },
      take: limit,
      orderBy: { start_time: 'desc' }
    });

    // جلب الأحداث لكل جلسة
    const sessionIds = sessions.map(s => s.session_id);
    const events = await prisma.analyticsEvent.findMany({
      where: {
        session_id: { in: sessionIds }
      },
      select: {
        session_id: true,
        event_type: true,
        article_id: true,
        timestamp: true,
        page_url: true,
        event_data: true
      },
      orderBy: { timestamp: 'asc' }
    });

    // جلب تفاصيل المقالات
    const articleIds = events
      .filter(e => e.article_id)
      .map(e => e.article_id!)
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, title: true, slug: true, category_id: true }
    });

    // بناء المسارات
    const journeys: UserJourney[] = sessions.map(session => {
      const sessionEvents = events
        .filter(e => e.session_id === session.session_id)
        .slice(0, maxSteps);

      const steps: JourneyStep[] = sessionEvents.map((event, index) => {
        const article = articles.find(a => a.id === event.article_id);
        return {
          eventType: event.event_type,
          articleId: event.article_id || undefined,
          articleTitle: article?.title,
          timestamp: event.timestamp,
          order: index + 1
        };
      });

      return {
        sessionId: session.session_id,
        userId: session.user_id || undefined,
        steps,
        duration: session.duration || 0,
        deviceType: session.device_type || undefined,
        startTime: session.start_time,
        endTime: session.end_time || undefined
      };
    }).filter(journey => journey.steps.length >= minSteps);

    // تحليل أكثر المسارات شيوعاً
    const pathCounts = new Map<string, {
      count: number;
      avgDuration: number;
      avgSteps: number;
      deviceTypes: Record<string, number>;
      conversionRate: number;
      bounceRate: number;
    }>();

    journeys.forEach(journey => {
      // إنشاء مسار من أول 3-5 خطوات
      const pathSteps = journey.steps.slice(0, 5);
      const pathKey = pathSteps.map(step => {
        if (step.eventType === 'page_view' && step.articleTitle) {
          return `📄 ${step.articleTitle.substring(0, 30)}...`;
        }
        return getEventDisplayName(step.eventType);
      }).join(' → ');

      if (!pathCounts.has(pathKey)) {
        pathCounts.set(pathKey, {
          count: 0,
          avgDuration: 0,
          avgSteps: 0,
          deviceTypes: {},
          conversionRate: 0,
          bounceRate: 0
        });
      }

      const pathData = pathCounts.get(pathKey)!;
      pathData.count++;
      pathData.avgDuration += journey.duration;
      pathData.avgSteps += journey.steps.length;
      
      if (journey.deviceType) {
        pathData.deviceTypes[journey.deviceType] = (pathData.deviceTypes[journey.deviceType] || 0) + 1;
      }
    });

    // تحويل النتائج وترتيبها
    const topJourneys = Array.from(pathCounts.entries())
      .map(([path, data]) => ({
        path,
        count: data.count,
        percentage: Math.round((data.count / journeys.length) * 100),
        avgDuration: Math.round(data.avgDuration / data.count),
        avgSteps: Math.round(data.avgSteps / data.count),
        topDevice: Object.entries(data.deviceTypes)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'غير محدد'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // تحليل نقاط الدخول الأكثر شيوعاً
    const entryPoints = new Map<string, number>();
    journeys.forEach(journey => {
      if (journey.steps.length > 0) {
        const firstStep = journey.steps[0];
        const entryKey = firstStep.articleTitle || getEventDisplayName(firstStep.eventType);
        entryPoints.set(entryKey, (entryPoints.get(entryKey) || 0) + 1);
      }
    });

    const topEntryPoints = Array.from(entryPoints.entries())
      .map(([entry, count]) => ({
        entry,
        count,
        percentage: Math.round((count / journeys.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // تحليل نقاط الخروج
    const exitPoints = new Map<string, number>();
    journeys.forEach(journey => {
      if (journey.steps.length > 0) {
        const lastStep = journey.steps[journey.steps.length - 1];
        const exitKey = lastStep.articleTitle || getEventDisplayName(lastStep.eventType);
        exitPoints.set(exitKey, (exitPoints.get(exitKey) || 0) + 1);
      }
    });

    const topExitPoints = Array.from(exitPoints.entries())
      .map(([exit, count]) => ({
        exit,
        count,
        percentage: Math.round((count / journeys.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // تحليل أطوال المسارات
    const pathLengths = journeys.map(j => j.steps.length);
    const lengthDistribution = [2, 3, 4, 5, 6, 7, 8, 9, 10].map(length => ({
      length,
      count: pathLengths.filter(l => l === length).length,
      percentage: Math.round((pathLengths.filter(l => l === length).length / pathLengths.length) * 100)
    }));

    // إحصائيات عامة
    const stats = {
      totalJourneys: journeys.length,
      totalSessions: sessions.length,
      avgJourneyLength: Math.round(pathLengths.reduce((sum, len) => sum + len, 0) / pathLengths.length),
      avgJourneyDuration: Math.round(journeys.reduce((sum, j) => sum + j.duration, 0) / journeys.length),
      uniquePaths: pathCounts.size,
      mostCommonDevice: getMostCommonValue(journeys.map(j => j.deviceType).filter(Boolean)),
      conversionEvents: journeys.filter(j => j.steps.some(s => 
        ['like', 'share', 'comment', 'bookmark'].includes(s.eventType)
      )).length
    };

    return NextResponse.json({
      success: true,
      data: {
        topJourneys,
        topEntryPoints,
        topExitPoints,
        lengthDistribution,
        stats,
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error analyzing user journeys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/user-journeys
 * تحليل مسارات مخصص
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      filters = {}, 
      pathLength = { min: 2, max: 10 },
      groupBy = null,
      includeArticleDetails = false 
    } = body;

    // بناء شروط الاستعلام
    const whereClause: any = {};
    if (filters.startDate) whereClause.start_time = { gte: new Date(filters.startDate) };
    if (filters.endDate) whereClause.end_time = { lte: new Date(filters.endDate) };
    if (filters.deviceType) whereClause.device_type = filters.deviceType;
    if (filters.userId) whereClause.user_id = filters.userId;
    if (filters.minDuration) whereClause.duration = { gte: filters.minDuration };

    // جلب الجلسات المفلترة
    const sessions = await prisma.userSession.findMany({
      where: whereClause,
      select: {
        session_id: true,
        user_id: true,
        start_time: true,
        end_time: true,
        duration: true,
        device_type: true,
        browser: true,
        country: true
      },
      take: 10000
    });

    // جلب الأحداث
    const events = await prisma.analyticsEvent.findMany({
      where: {
        session_id: { in: sessions.map(s => s.session_id) },
        ...(filters.eventTypes && { event_type: { in: filters.eventTypes } })
      },
      select: {
        session_id: true,
        event_type: true,
        article_id: true,
        timestamp: true,
        page_url: true
      },
      orderBy: { timestamp: 'asc' }
    });

    // تحليل مخصص حسب التجميع
    let result: any = {
      totalSessions: sessions.length,
      totalEvents: events.length,
      filters
    };

    if (groupBy) {
      const grouped = sessions.reduce((acc, session) => {
        let key = 'غير محدد';
        
        switch (groupBy) {
          case 'device':
            key = session.device_type || 'غير محدد';
            break;
          case 'browser':
            key = session.browser || 'غير محدد';
            break;
          case 'country':
            key = session.country || 'غير محدد';
            break;
          case 'hour':
            key = new Date(session.start_time).getHours().toString();
            break;
        }

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(session);
        return acc;
      }, {} as Record<string, any[]>);

      result.groupedAnalysis = Object.entries(grouped).map(([key, sessions]) => ({
        group: key,
        sessionCount: sessions.length,
        avgDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
      }));
    }

    // تحليل الأحداث الأكثر شيوعاً
    const eventCounts = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    result.topEvents = Object.entries(eventCounts)
      .map(([event, count]) => ({
        event: getEventDisplayName(event),
        count,
        percentage: Math.round((count / events.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in custom journey analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * دوال مساعدة
 */
function getEventDisplayName(eventType: string): string {
  const eventNames: Record<string, string> = {
    'page_view': '👁️ مشاهدة',
    'scroll': '📜 تمرير',
    'click': '👆 نقرة',
    'like': '❤️ إعجاب',
    'share': '📤 مشاركة',
    'comment': '💬 تعليق',
    'bookmark': '🔖 حفظ',
    'search': '🔍 بحث',
    'reading_time': '📖 قراءة',
    'reading_progress': '📊 تقدم',
    'article_interaction': '🔗 تفاعل',
    'page_exit': '🚪 خروج'
  };
  
  return eventNames[eventType] || eventType;
}

function getMostCommonValue(values: string[]): string {
  if (values.length === 0) return 'غير محدد';
  
  const counts = values.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'غير محدد';
} 