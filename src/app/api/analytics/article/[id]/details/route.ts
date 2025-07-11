import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للتحقق من صحة المعاملات
const detailsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  period: z.enum(['24h', '7d', '30d', '90d', 'all']).optional().default('30d')
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = detailsQuerySchema.parse({
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      period: (searchParams.get('period') as any) || '30d'
    });

    const article_id = params.id;

    // تحديد الفترة الزمنية
    const now = new Date();
    let fromDate: Date;
    
    if (query.from) {
      fromDate = new Date(query.from);
    } else {
      switch (query.period) {
        case '24h':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date('2020-01-01');
      }
    }

    const toDate = query.to ? new Date(query.to) : now;

    // 1. جلب معلومات المقال الأساسية
    const article = await prisma.article.findUnique({
      where: { id: article_id },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!article) {
      return NextResponse.json(
        { error: 'المقال غير موجود' },
        { status: 404 }
      );
    }

    // 2. جلب البيانات من ContentAnalytics
    const contentAnalytics = await prisma.contentAnalytics.findFirst({
      where: {
        content_id: article_id,
        content_type: 'article'
      }
    });

    // 3. جلب الأحداث الحديثة من AnalyticsEvent
    const events = await prisma.analyticsEvent.findMany({
      where: {
        article_id,
        timestamp: {
          gte: fromDate,
          lte: toDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // 4. تحليل الأحداث
    const viewEvents = events.filter(e => e.event_type === 'page_view');
    const likeEvents = events.filter(e => e.event_type === 'like');
    const shareEvents = events.filter(e => e.event_type === 'share');
    const commentEvents = events.filter(e => e.event_type === 'comment');

    // 5. المشاهدات الفريدة
    const uniqueViewers = new Set(
      viewEvents
        .filter(e => e.user_id)
        .map(e => e.user_id)
    ).size;

    // 6. إحصائيات الجلسات
    const sessions = new Set(
      events
        .filter(e => e.event_data && (e.event_data as any).session_id)
        .map(e => (e.event_data as any).session_id)
    );

    // 7. متوسط وقت القراءة من البيانات الحالية
    const readingTimeEvents = events.filter(e => 
      e.event_type === 'page_view' && 
      e.event_data && 
      (e.event_data as any).reading_time
    );

    const avgReadingTime = readingTimeEvents.length > 0
      ? readingTimeEvents.reduce((sum, e) => sum + ((e.event_data as any).reading_time || 0), 0) / readingTimeEvents.length
      : contentAnalytics?.avg_time_on_page || 0;

    // 8. توزيع الزيارات حسب الساعة (آخر 24 ساعة)
    const hourlyViews = Array.from({ length: 24 }, (_, hour) => {
      const startHour = new Date();
      startHour.setHours(hour, 0, 0, 0);
      const endHour = new Date();
      endHour.setHours(hour, 59, 59, 999);

      const hourViews = viewEvents.filter(e => {
        const eventHour = e.timestamp.getHours();
        return eventHour === hour;
      }).length;

      return {
        hour,
        views: hourViews
      };
    });

    // 9. توزيع حسب نوع الجهاز
    const deviceStats = events.reduce((acc: Record<string, number>, event) => {
      const deviceInfo = event.event_data as any;
      const device = deviceInfo?.device || deviceInfo?.deviceType || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    // 10. مصادر الزيارات
    const referrerStats = events.reduce((acc: Record<string, number>, event) => {
      const referrer = event.referrer || 'مباشر';
      const domain = referrer.includes('://') 
        ? new URL(referrer).hostname 
        : referrer;
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {});

    // 11. تطور المشاهدات (آخر 7 أيام)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const viewTrend = last7Days.map(date => {
      const dayStr = date.toISOString().split('T')[0];
      const dayViews = viewEvents.filter(e => 
        e.timestamp.toISOString().split('T')[0] === dayStr
      ).length;
      
      return {
        date: dayStr,
        views: dayViews
      };
    });

    // 12. معدل التفاعل
    const totalViews = viewEvents.length || contentAnalytics?.views || 0;
    const engagementRate = totalViews > 0 
      ? ((likeEvents.length + shareEvents.length + commentEvents.length) / totalViews) * 100
      : 0;

    // 13. معدل الارتداد (تقديري)
    const singleEventSessions = Array.from(sessions).filter(sessionId => {
      const sessionEvents = events.filter(e => 
        e.event_data && (e.event_data as any).session_id === sessionId
      );
      return sessionEvents.length === 1;
    });

    const bounceRate = sessions.size > 0 
      ? (singleEventSessions.length / sessions.size) * 100 
      : contentAnalytics?.bounce_rate || 0;

    // 14. Top المدن/البلدان (إذا كانت متوفرة)
    const locationStats = events.reduce((acc: Record<string, number>, event) => {
      const locationInfo = event.event_data as any;
      const location = locationInfo?.country || locationInfo?.city || 'غير محدد';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    const response = {
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category?.name,
        author: article.author?.name,
        published_at: article.published_at,
        total_view_count: article.view_count
      },
      analytics: {
        summary: {
          views: totalViews,
          uniqueViews: uniqueViewers,
          sessions: sessions.size,
          avgReadingTime: Math.round(avgReadingTime),
          likes: likeEvents.length,
          shares: shareEvents.length,
          comments: commentEvents.length,
          engagementRate: Math.round(engagementRate * 100) / 100,
          bounceRate: Math.round(bounceRate * 100) / 100
        },
        trends: {
          hourlyViews,
          dailyTrend: viewTrend
        },
        demographics: {
          devices: Object.entries(deviceStats)
            .map(([device, count]) => ({ device, count }))
            .sort((a, b) => b.count - a.count),
          referrers: Object.entries(referrerStats)
            .map(([referrer, count]) => ({ referrer, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          locations: Object.entries(locationStats)
            .map(([location, count]) => ({ location, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        },
        contentAnalytics: contentAnalytics ? {
          performanceScore: contentAnalytics.performance_score,
          avgTimeOnPage: contentAnalytics.avg_time_on_page,
          scrollDepth: contentAnalytics.scroll_depth,
          conversionRate: contentAnalytics.conversion_rate
        } : null
      },
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        period: query.period
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('خطأ في جلب تحليلات المقال:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب البيانات', details: error instanceof Error ? error.message : 'خطأ غير معروف' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 