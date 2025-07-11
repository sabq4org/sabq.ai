import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للتحقق من صحة المعاملات
const summaryQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  category_id: z.string().optional(),
  period: z.enum(['24h', '7d', '30d', '90d', 'all']).optional().default('30d')
});

interface CategoryViewResult {
  name: string;
  id: string;
  view_count: bigint;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = summaryQuerySchema.parse({
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      period: (searchParams.get('period') as any) || '30d'
    });

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
          fromDate = new Date('2020-01-01'); // كل البيانات
      }
    }

    const toDate = query.to ? new Date(query.to) : now;

    // استخدام جدول AnalyticsEvent الموجود بدلاً من ArticleAnalyticsEvent
    // أو استخدام جدول ContentAnalytics للإحصائيات المجمعة

    // جلب الإحصائيات من جدول ContentAnalytics (أسرع)
    const contentAnalytics = await prisma.contentAnalytics.findMany({
      where: {
        content_type: 'article',
        updated_at: {
          gte: fromDate,
          lte: toDate
        }
      },
      take: 100
    });

    // حساب الإحصائيات المجمعة
    const totalViews = contentAnalytics.reduce((sum, item) => sum + item.views, 0);
    const totalUniqueViews = contentAnalytics.reduce((sum, item) => sum + item.unique_views, 0);
    const avgTimeOnPage = contentAnalytics.length > 0 
      ? contentAnalytics.reduce((sum, item) => sum + item.avg_time_on_page, 0) / contentAnalytics.length 
      : 0;
    const totalShares = contentAnalytics.reduce((sum, item) => sum + item.shares, 0);
    const totalLikes = contentAnalytics.reduce((sum, item) => sum + item.likes, 0);
    const totalComments = contentAnalytics.reduce((sum, item) => sum + item.comments, 0);
    const avgBounceRate = contentAnalytics.length > 0 
      ? contentAnalytics.reduce((sum, item) => sum + item.bounce_rate, 0) / contentAnalytics.length 
      : 0;

    // أكثر المقالات مشاهدة
    const topArticles = contentAnalytics
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map((item) => ({
        content_id: item.content_id,
        title: item.title || 'مقال',
        views: item.views,
        unique_views: item.unique_views,
        avg_time: item.avg_time_on_page,
        bounce_rate: item.bounce_rate
      }));

    // إحصائيات من AnalyticsEvent للبيانات الحية
    const recentEvents = await prisma.analyticsEvent.findMany({
      where: {
        timestamp: {
          gte: fromDate,
          lte: toDate
        },
        article_id: { not: null }
      },
      orderBy: { timestamp: 'desc' },
      take: 1000
    });

    // تجميع الأحداث حسب النوع
    const eventTypeStats = recentEvents.reduce((acc: Record<string, number>, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    // تجميع حسب نوع الجهاز
    const deviceStats = recentEvents.reduce((acc: Record<string, number>, event) => {
      const deviceInfo = event.event_data as any;
      const device = deviceInfo?.device || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    // اتجاه الزيارات (آخر 7 أيام)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const viewTrend = last7Days.map(date => {
      const dayStr = date.toISOString().split('T')[0];
      const dayEvents = recentEvents.filter(event => 
        event.timestamp.toISOString().split('T')[0] === dayStr &&
        event.event_type === 'page_view'
      );
      return {
        date: dayStr,
        views: dayEvents.length
      };
    });

    // جلب إحصائيات التصنيفات
    const categories = await prisma.category.findMany({
      include: {
        articles: {
          select: {
            id: true,
            view_count: true
          }
        }
      }
    });

    const categoryStats = categories.map(category => ({
      name: category.name,
      id: category.id,
      views: category.articles.reduce((sum, article) => sum + article.view_count, 0)
    })).sort((a, b) => b.views - a.views).slice(0, 10);

    const response = {
      summary: {
        totalViews,
        uniqueViews: totalUniqueViews,
        avgReadingTime: Math.round(avgTimeOnPage),
        totalLikes,
        totalShares,
        totalComments,
        bounceRate: Math.round(avgBounceRate * 100) / 100
      },
      topArticles,
      deviceStats: Object.entries(deviceStats).map(([device, count]) => ({
        device_type: device,
        _count: { _all: count }
      })),
      eventTypeStats: Object.entries(eventTypeStats).map(([event_type, count]) => ({
        event_type,
        _count: { _all: count }
      })),
      categoryStats,
      viewTrend,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        period: query.period
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('خطأ في جلب إحصائيات التحليلات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب البيانات', details: error instanceof Error ? error.message : 'خطأ غير معروف' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 