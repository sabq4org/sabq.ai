import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للتحقق من صحة المعاملات
const exportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  format: z.enum(['csv', 'json', 'excel']).default('csv'),
  type: z.enum(['articles', 'users', 'events', 'summary']).default('summary'),
  category_id: z.string().optional()
});

// تحويل البيانات إلى CSV
function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [];
  
  // إضافة الرؤوس
  csvRows.push(headers.join(','));
  
  // إضافة البيانات
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // التعامل مع القيم التي تحتوي على فواصل أو علامات اقتباس
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// تسجيل عملية التصدير في audit log
async function logExport(userId: string | null, exportType: string, format: string) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'data_export',
        resource: 'analytics',
        resource_id: exportType,
        details: {
          format,
          exportType,
          timestamp: new Date().toISOString()
        },
        success: true
      }
    });
  } catch (error) {
    console.error('خطأ في تسجيل عملية التصدير:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = exportQuerySchema.parse({
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      format: (searchParams.get('format') as any) || 'csv',
      type: (searchParams.get('type') as any) || 'summary',
      category_id: searchParams.get('category_id') || undefined
    });

    // تحديد الفترة الزمنية (افتراضياً آخر 30 يوم)
    const toDate = query.to ? new Date(query.to) : new Date();
    const fromDate = query.from ? new Date(query.from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';

    // جلب البيانات حسب النوع المطلوب
    switch (query.type) {
      case 'articles':
        // تصدير إحصائيات المقالات
        const articlesWithStats = await prisma.article.findMany({
          where: {
            published_at: {
              gte: fromDate,
              lte: toDate
            },
            ...(query.category_id && { category_id: query.category_id })
          },
          include: {
            category: { select: { name: true } },
            author: { select: { name: true } }
          },
          orderBy: { view_count: 'desc' },
          take: 1000
        });

                 data = articlesWithStats.map(article => ({
           id: article.id,
           title: article.title,
           category: article.category?.name || '',
           author: article.author?.name || '',
           status: article.status,
           view_count: article.view_count,
           like_count: article.like_count,
           comment_count: article.comment_count,
           share_count: 0, // يمكن حسابه من الأحداث لاحقاً
           reading_time: article.reading_time || 0,
           published_at: article.published_at?.toISOString() || '',
           created_at: article.created_at.toISOString()
         }));

        headers = [
          'id', 'title', 'category', 'author', 'status',
          'view_count', 'like_count', 'comment_count', 'share_count',
          'reading_time', 'published_at', 'created_at'
        ];
        filename = `articles_${fromDate.toISOString().split('T')[0]}_${toDate.toISOString().split('T')[0]}`;
        break;

      case 'users':
        // تصدير إحصائيات المستخدمين (بيانات مجهولة الهوية)
        const usersWithBehavior = await prisma.userBehavior.findMany({
          where: {
            updated_at: {
              gte: fromDate,
              lte: toDate
            }
          },
          include: {
            user: {
              select: {
                id: true,
                role: true,
                created_at: true,
                is_active: true
              }
            }
          },
          take: 1000
        });

        data = usersWithBehavior.map((behavior, index) => ({
          user_index: index + 1, // فهرس مجهول بدلاً من ID
          role: behavior.user?.role || 'reader',
          total_sessions: behavior.total_sessions,
          total_page_views: behavior.total_page_views,
          total_time_spent_minutes: Math.round(behavior.total_time_spent / 60),
          avg_session_duration_minutes: Math.round(behavior.avg_session_duration / 60),
          bounce_rate: Math.round(behavior.bounce_rate * 100) / 100,
          pages_per_session: Math.round(behavior.pages_per_session * 100) / 100,
          interaction_score: Math.round(behavior.interaction_score * 100) / 100,
          reading_speed_wpm: Math.round(behavior.reading_speed),
          is_active: behavior.user?.is_active || false,
          member_since: behavior.user?.created_at?.toISOString().split('T')[0] || '',
          last_activity: behavior.last_activity_at?.toISOString().split('T')[0] || ''
        }));

        headers = [
          'user_index', 'role', 'total_sessions', 'total_page_views',
          'total_time_spent_minutes', 'avg_session_duration_minutes',
          'bounce_rate', 'pages_per_session', 'interaction_score',
          'reading_speed_wpm', 'is_active', 'member_since', 'last_activity'
        ];
        filename = `users_behavior_${fromDate.toISOString().split('T')[0]}_${toDate.toISOString().split('T')[0]}`;
        break;

      case 'events':
        // تصدير الأحداث (مجهولة الهوية)
        const events = await prisma.analyticsEvent.findMany({
          where: {
            timestamp: {
              gte: fromDate,
              lte: toDate
            },
            ...(query.category_id && {
              article: { category_id: query.category_id }
            })
          },
          include: {
            article: {
              select: { 
                title: true, 
                category: { select: { name: true } }
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 5000
        });

        data = events.map((event, index) => ({
          event_index: index + 1,
          event_type: event.event_type,
          article_title: event.article?.title || '',
          category: event.article?.category?.name || '',
          timestamp: event.timestamp.toISOString(),
          date: event.timestamp.toISOString().split('T')[0],
          hour: event.timestamp.getHours(),
          referrer: event.referrer || 'مباشر',
          user_agent_info: event.user_agent ? 'متوفر' : 'غير متوفر',
          has_user: event.user_id ? 'مسجل' : 'زائر'
        }));

        headers = [
          'event_index', 'event_type', 'article_title', 'category',
          'timestamp', 'date', 'hour', 'referrer', 'user_agent_info', 'has_user'
        ];
        filename = `events_${fromDate.toISOString().split('T')[0]}_${toDate.toISOString().split('T')[0]}`;
        break;

      case 'summary':
      default:
        // تصدير الملخص العام
        const contentAnalytics = await prisma.contentAnalytics.findMany({
          where: {
            content_type: 'article',
            updated_at: {
              gte: fromDate,
              lte: toDate
            }
          },
          take: 500
        });

        const categoryStats = await prisma.category.findMany({
          include: {
            articles: {
              select: {
                view_count: true,
                like_count: true,
                comment_count: true
              }
            }
          }
        });

        // إحصائيات حسب التصنيف
        const categorySummary = categoryStats.map(category => ({
          category_name: category.name,
          total_articles: category.articles.length,
          total_views: category.articles.reduce((sum, article) => sum + article.view_count, 0),
          total_likes: category.articles.reduce((sum, article) => sum + article.like_count, 0),
          total_comments: category.articles.reduce((sum, article) => sum + article.comment_count, 0),
          avg_views_per_article: category.articles.length > 0 
            ? Math.round(category.articles.reduce((sum, article) => sum + article.view_count, 0) / category.articles.length)
            : 0
        }));

        data = categorySummary;
        headers = [
          'category_name', 'total_articles', 'total_views', 
          'total_likes', 'total_comments', 'avg_views_per_article'
        ];
        filename = `summary_${fromDate.toISOString().split('T')[0]}_${toDate.toISOString().split('T')[0]}`;
        break;
    }

    // تسجيل عملية التصدير
    await logExport(null, query.type, query.format);

    // تحديد نوع المحتوى حسب الصيغة
    let contentType: string;
    let fileContent: string;
    let fileExtension: string;

    switch (query.format) {
      case 'json':
        contentType = 'application/json';
        fileContent = JSON.stringify({
          metadata: {
            exportType: query.type,
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            totalRecords: data.length,
            exportedAt: new Date().toISOString()
          },
          data
        }, null, 2);
        fileExtension = 'json';
        break;

      case 'csv':
      default:
        contentType = 'text/csv; charset=utf-8';
        fileContent = '\uFEFF' + convertToCSV(data, headers); // إضافة BOM للدعم العربي
        fileExtension = 'csv';
        break;
    }

    // إعداد headers للاستجابة
    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
        'Cache-Control': 'no-cache',
        'Access-Control-Expose-Headers': 'Content-Disposition'
      }
    });

    return response;

  } catch (error) {
    console.error('خطأ في تصدير البيانات:', error);
    
    // تسجيل الخطأ
    try {
      await prisma.auditLog.create({
        data: {
          action: 'data_export_failed',
          resource: 'analytics',
          details: {
            error: error instanceof Error ? error.message : 'خطأ غير معروف',
            timestamp: new Date().toISOString()
          },
          success: false,
          error_message: error instanceof Error ? error.message : 'خطأ غير معروف'
        }
      });
    } catch (logError) {
      console.error('خطأ في تسجيل الخطأ:', logError);
    }

    return NextResponse.json(
      { 
        error: 'حدث خطأ في تصدير البيانات', 
        details: error instanceof Error ? error.message : 'خطأ غير معروف' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 