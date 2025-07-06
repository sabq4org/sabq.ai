import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { corsResponse } from '@/lib/cors';

const prisma = new PrismaClient();

// أنواع الأحداث في النظام
const EVENT_TYPES = {
  ARTICLE_PUBLISHED: 'article_published',
  ARTICLE_UPDATED: 'article_updated',
  ARTICLE_FEATURED: 'article_featured',
  ARTICLE_BREAKING: 'article_breaking',
  COMMENT_ADDED: 'comment_added',
  CATEGORY_CREATED: 'category_created',
  AUTHOR_JOINED: 'author_joined',
  ANALYSIS_COMPLETED: 'analysis_completed',
  USER_MILESTONE: 'user_milestone',
  SYSTEM_UPDATE: 'system_update'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20'); // تقليل الحد الافتراضي
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter') || 'all';
    const realtime = searchParams.get('realtime') === 'true';

    // جلب آخر الأحداث من جداول مختلفة
    const events = [];
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // تقليل من 7 أيام إلى 3
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // تشغيل جميع الاستعلامات بشكل متوازي
    const [
      recentArticles,
      recentAnalyses,
      recentComments,
      recentCategories,
      recentAuthors
    ] = await Promise.all([
      // 1. المقالات المنشورة حديثاً
      prisma.articles.findMany({
        where: {
          status: 'published',
          publishedAt: {
            gte: realtime ? last24Hours : last3Days
          }
        },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        take: realtime ? 10 : 20 // تقليل العدد
      }),

      // 2. التحليلات العميقة الجديدة
      realtime ? [] : prisma.deepAnalysis.findMany({
        where: {
          analyzedAt: {
            gte: last3Days
          }
        },
        include: {
          article: {
            include: {
              category: true
            }
          }
        },
        orderBy: {
          analyzedAt: 'desc'
        },
        take: 10 // تقليل العدد
      }),

      // 3. التعليقات الجديدة
      realtime ? [] : prisma.comment.findMany({
        where: {
          status: 'approved',
          createdAt: {
            gte: last24Hours
          }
        },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              category: true
            }
          },
          user: {
            select: {
              name: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20 // تقليل العدد
      }),

      // 4. التصنيفات الجديدة
      realtime ? [] : prisma.category.findMany({
        where: {
          createdAt: {
            gte: last3Days
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }),

      // 5. المؤلفون الجدد
      realtime ? [] : prisma.user.findMany({
        where: {
          role: 'AUTHOR',
          createdAt: {
            gte: last3Days
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ]);

    // تحويل المقالات لأحداث (بدون استعلامات إضافية)
    for (const article of recentArticles) {
      const publishedAt = article.publishedAt || article.createdAt;
      const isNew = publishedAt.getTime() > lastHour.getTime();
      
      events.push({
        id: `article-${article.id}`,
        type: article.breaking ? EVENT_TYPES.ARTICLE_BREAKING : 
              article.featured ? EVENT_TYPES.ARTICLE_FEATURED : 
              EVENT_TYPES.ARTICLE_PUBLISHED,
        timestamp: publishedAt.toISOString(),
        title: article.title,
        description: article.excerpt || '',
        category: article.category?.name || 'عام',
        categoryColor: '#6B7280',
        author: article.author?.name || 'الكاتب',
        authorAvatar: article.author?.avatar,
        url: `/article/${article.id}`,
        metadata: {
          views: article.views || 0,
          featured: article.featured,
          breaking: article.breaking,
          readingTime: article.readingTime,
          comments: 0, // تعيين قيمة افتراضية بدلاً من الاستعلام
          shares: 0
        },
        isNew,
        icon: article.breaking ? '🚨' : (article.featured ? '⭐' : '📰')
      });
    }

    // تحويل التحليلات لأحداث
    for (const analysis of recentAnalyses) {
      events.push({
        id: `analysis-${analysis.id}`,
        type: EVENT_TYPES.ANALYSIS_COMPLETED,
        timestamp: analysis.analyzedAt.toISOString(),
        title: `تحليل عميق: ${analysis.article.title}`,
        description: analysis.aiSummary || '',
        category: analysis.article.category?.name || 'تحليل',
        categoryColor: '#8B5CF6',
        url: `/insights/deep/${analysis.article.id}`,
        metadata: {
          sentiment: analysis.sentiment,
          readabilityScore: analysis.readabilityScore,
          engagementScore: analysis.engagementScore
        },
        isNew: analysis.analyzedAt.getTime() > lastHour.getTime(),
        icon: '📊'
      });
    }

    // تحويل التعليقات لأحداث
    for (const comment of recentComments) {
      const content = comment.content.length > 100 
        ? comment.content.substring(0, 97) + '...' 
        : comment.content;
        
      events.push({
        id: `comment-${comment.id}`,
        type: EVENT_TYPES.COMMENT_ADDED,
        timestamp: comment.createdAt.toISOString(),
        title: `تعليق جديد على: ${comment.article.title}`,
        description: content,
        category: comment.article.category?.name || 'تعليقات',
        categoryColor: '#10B981',
        author: comment.user?.name || 'مستخدم',
        authorAvatar: comment.user?.avatar,
        url: `/article/${comment.article.id}#comment-${comment.id}`,
        metadata: {
          likes: comment.likes || 0
        },
        isNew: comment.createdAt.getTime() > lastHour.getTime(),
        icon: '💬'
      });
    }

    // تحويل التصنيفات لأحداث (بدون عد المقالات)
    for (const category of recentCategories) {
      events.push({
        id: `category-${category.id}`,
        type: EVENT_TYPES.CATEGORY_CREATED,
        timestamp: category.createdAt.toISOString(),
        title: `تصنيف جديد: ${category.name}`,
        description: category.description || '',
        category: 'نظام',
        categoryColor: '#6B7280',
        url: `/categories/${category.slug}`,
        metadata: {},
        isNew: category.createdAt.getTime() > lastHour.getTime(),
        icon: '🗂️'
      });
    }

    // تحويل المؤلفين لأحداث (بدون عد المقالات)
    for (const author of recentAuthors) {
      events.push({
        id: `author-${author.id}`,
        type: EVENT_TYPES.AUTHOR_JOINED,
        timestamp: author.createdAt.toISOString(),
        title: `انضم كاتب جديد: ${author.name}`,
        description: 'كاتب في صحيفة سبق',
        category: 'فريق العمل',
        categoryColor: '#F59E0B',
        authorAvatar: author.avatar,
        url: `/author/${author.id}`,
        metadata: {
          role: author.role
        },
        isNew: author.createdAt.getTime() > lastHour.getTime(),
        icon: '✍️'
      });
    }

    // ترتيب الأحداث حسب الوقت
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // تطبيق الفلترة
    let filteredEvents = events;
    if (filter !== 'all') {
      filteredEvents = events.filter(event => {
        switch (filter) {
          case 'articles':
            return [EVENT_TYPES.ARTICLE_PUBLISHED, EVENT_TYPES.ARTICLE_UPDATED, EVENT_TYPES.ARTICLE_FEATURED, EVENT_TYPES.ARTICLE_BREAKING].includes(event.type);
          case 'analysis':
            return event.type === EVENT_TYPES.ANALYSIS_COMPLETED;
          case 'comments':
            return event.type === EVENT_TYPES.COMMENT_ADDED;
          case 'system':
            return [EVENT_TYPES.CATEGORY_CREATED, EVENT_TYPES.SYSTEM_UPDATE].includes(event.type);
          case 'community':
            return [EVENT_TYPES.USER_MILESTONE, EVENT_TYPES.AUTHOR_JOINED].includes(event.type);
          default:
            return true;
        }
      });
    }

    // تطبيق pagination
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    // إحصائيات مبسطة (بدون استعلامات إضافية إلا في أول مرة)
    let stats = {
      total: events.length,
      totalEvents: filteredEvents.length,
      todayEvents: events.filter(e => {
        const eventDate = new Date(e.timestamp);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
      }).length,
      activeUsers: 0,
      newEvents: events.filter(e => e.isNew).length,
      totalArticles: 0,
      todayArticles: 0,
      totalComments: 0,
      totalViews: 0,
      byType: {
        articles: events.filter(e => [EVENT_TYPES.ARTICLE_PUBLISHED, EVENT_TYPES.ARTICLE_FEATURED, EVENT_TYPES.ARTICLE_BREAKING].includes(e.type)).length,
        analyses: events.filter(e => e.type === EVENT_TYPES.ANALYSIS_COMPLETED).length,
        comments: events.filter(e => e.type === EVENT_TYPES.COMMENT_ADDED).length,
        system: events.filter(e => [EVENT_TYPES.CATEGORY_CREATED, EVENT_TYPES.SYSTEM_UPDATE].includes(e.type)).length,
        community: events.filter(e => [EVENT_TYPES.USER_MILESTONE, EVENT_TYPES.AUTHOR_JOINED].includes(e.type)).length
      }
    };

    // جلب الإحصائيات الكاملة فقط في الطلب الأول (offset = 0)
    if (offset === 0 && !realtime) {
      const [
        totalArticles,
        todayArticles,
        totalComments,
        activeUsers,
        totalViews
      ] = await Promise.all([
        prisma.articles.count({ where: { status: 'published' } }),
        prisma.articles.count({ 
          where: { 
            status: 'published',
            publishedAt: { gte: new Date(now.setHours(0, 0, 0, 0)) }
          } 
        }),
        prisma.comment.count({ where: { status: 'approved' } }),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.articles.aggregate({
          _sum: { views: true },
          where: { status: 'published' }
        })
      ]);

      stats = {
        ...stats,
        activeUsers,
        totalArticles,
        todayArticles,
        totalComments,
        totalViews: totalViews._sum.views || 0
      };
    }

    // تنسيق البيانات للعرض
    const formattedEvents = paginatedEvents.map(event => {
      const date = new Date(event.timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      let timeAgo;
      if (diffInMinutes < 1) {
        timeAgo = 'الآن';
      } else if (diffInMinutes < 60) {
        timeAgo = `منذ ${diffInMinutes} دقيقة`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        timeAgo = hours === 1 ? 'منذ ساعة' : hours === 2 ? 'منذ ساعتين' : `منذ ${hours} ساعات`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        timeAgo = days === 1 ? 'منذ يوم' : days === 2 ? 'منذ يومين' : `منذ ${days} أيام`;
      }

      return {
        ...event,
        timestamp: date.toLocaleTimeString('ar-SA', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        date: date.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        }),
        timeAgo,
        // تحديد نوع العرض للواجهة
        displayType: getDisplayType(event.type),
        // إضافة معلومات التفاعل
        engagement: {
          views: event.metadata?.views || 0,
          likes: event.metadata?.likes || 0,
          comments: event.metadata?.comments || 0,
          shares: event.metadata?.shares || 0
        }
      };
    });

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      stats,
      pagination: {
        total: filteredEvents.length,
        limit,
        offset,
        hasMore: offset + limit < filteredEvents.length
      }
    });

  } catch (error) {
    console.error('Error fetching timeline events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch timeline events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// دالة مساعدة لتحديد نوع العرض
function getDisplayType(eventType: string) {
  switch (eventType) {
    case EVENT_TYPES.ARTICLE_PUBLISHED:
    case EVENT_TYPES.ARTICLE_UPDATED:
    case EVENT_TYPES.ARTICLE_FEATURED:
    case EVENT_TYPES.ARTICLE_BREAKING:
      return 'article';
    case EVENT_TYPES.ANALYSIS_COMPLETED:
      return 'analysis';
    case EVENT_TYPES.COMMENT_ADDED:
      return 'comment';
    case EVENT_TYPES.CATEGORY_CREATED:
    case EVENT_TYPES.SYSTEM_UPDATE:
      return 'system';
    case EVENT_TYPES.USER_MILESTONE:
    case EVENT_TYPES.AUTHOR_JOINED:
      return 'community';
    default:
      return 'default';
  }
}

// API لإضافة أحداث مخصصة (للأحداث اليدوية أو أحداث النظام)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, description, metadata } = body;

    // هنا يمكن إضافة الحدث إلى جدول أحداث مخصص
    // أو إرساله عبر WebSocket للتحديث الفوري

    return NextResponse.json({
      success: true,
      message: 'Event added successfully'
    });

  } catch (error) {
    console.error('Error adding event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add event' },
      { status: 500 }
    );
  }
} 