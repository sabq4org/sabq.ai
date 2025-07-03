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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter') || 'all';
    const realtime = searchParams.get('realtime') === 'true';

    // جلب آخر الأحداث من جداول مختلفة
    const events = [];
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // 1. المقالات المنشورة حديثاً
    const recentArticles = await prisma.article.findMany({
      where: {
        status: 'published',
        publishedAt: {
          gte: realtime ? lastHour : last24Hours
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
      take: realtime ? 10 : limit
    });

    // تحويل المقالات لأحداث
    for (const article of recentArticles) {
      const publishedAt = article.publishedAt || article.createdAt;
      const isNew = publishedAt.getTime() > lastHour.getTime();
      
      events.push({
        id: `article-${article.id}`,
        type: EVENT_TYPES.ARTICLE_PUBLISHED,
        timestamp: publishedAt.toISOString(),
        title: article.title,
        description: article.excerpt || '',
        category: article.category?.name || 'عام',
        categoryColor: article.category?.color || '#6B7280',
        author: article.author?.name || 'الكاتب',
        authorAvatar: article.author?.avatar,
        url: `/article/${article.id}`,
        metadata: {
          views: article.views || 0,
          featured: article.featured,
          breaking: article.breaking,
          readingTime: article.readingTime,
          comments: 0,
          shares: 0
        },
        isNew,
        icon: article.breaking ? '🚨' : (article.featured ? '⭐' : '📰')
      });
    }

    // 2. التحليلات العميقة الجديدة
    const recentAnalyses = await prisma.deepAnalysis.findMany({
      where: {
        analyzedAt: {
          gte: realtime ? lastHour : last24Hours
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
      take: realtime ? 5 : 20
    });

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

    // 3. التعليقات الجديدة
    const recentComments = await prisma.comment.findMany({
      where: {
        status: 'approved',
        createdAt: {
          gte: realtime ? lastHour : last24Hours
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
      take: realtime ? 10 : 30
    });

    for (const comment of recentComments) {
      events.push({
        id: `comment-${comment.id}`,
        type: EVENT_TYPES.COMMENT_ADDED,
        timestamp: comment.createdAt.toISOString(),
        title: `تعليق جديد على: ${comment.article.title}`,
        description: comment.content.substring(0, 100) + '...',
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

    // 4. التصنيفات الجديدة
    const recentCategories = await prisma.category.findMany({
      where: {
        createdAt: {
          gte: last24Hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

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
        metadata: {
          icon: category.icon,
          color: category.color
        },
        isNew: category.createdAt.getTime() > lastHour.getTime(),
        icon: '🗂️'
      });
    }

    // 5. المؤلفون الجدد
    const recentAuthors = await prisma.user.findMany({
      where: {
        role: 'AUTHOR',
        createdAt: {
          gte: last24Hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

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
        metadata: {},
        isNew: author.createdAt.getTime() > lastHour.getTime(),
        icon: '✍️'
      });
    }

    // إضافة بعض الأحداث التجريبية إذا لم توجد بيانات كافية
    if (events.length < 10) {
      const now = new Date();
      const demoEvents = [
        {
          id: 'demo-1',
          type: EVENT_TYPES.ARTICLE_PUBLISHED,
          timestamp: new Date().toISOString(),
          title: 'عاجل: تطورات جديدة في مجال الذكاء الاصطناعي',
          description: 'شركات التقنية الكبرى تتنافس على تطوير نماذج ذكاء اصطناعي أكثر تقدماً',
          category: 'تقنية',
          categoryColor: '#3B82F6',
          author: 'محمد الأحمد',
          url: '/article/demo-1',
          metadata: {
            views: 1250,
            featured: false,
            breaking: true,
            readingTime: 5,
            comments: 0,
            shares: 0
          },
          isNew: true,
          icon: '🚨',
          displayType: 'article',
          engagement: {
            views: 1250,
            likes: 45,
            comments: 12,
            shares: 8
          },
          timeAgo: 'الآن',
          date: now.toLocaleDateString('ar-SA')
        },
        {
          id: 'demo-2',
          type: EVENT_TYPES.ANALYSIS_COMPLETED,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          title: 'تحليل عميق: تأثير التحول الرقمي على الاقتصاد السعودي',
          description: 'دراسة شاملة حول التحولات الاقتصادية في ظل رؤية 2030',
          category: 'تحليل',
          categoryColor: '#8B5CF6',
          author: 'د. سارة العتيبي',
          url: '/insights/deep/demo-2',
          metadata: {
            sentiment: 'إيجابي',
            readabilityScore: 85,
            engagementScore: 92
          },
          isNew: false,
          icon: '📊',
          displayType: 'analysis',
          engagement: {
            views: 850,
            likes: 67,
            comments: 23,
            shares: 15
          },
          timeAgo: 'منذ 30 دقيقة',
          date: now.toLocaleDateString('ar-SA')
        },
        {
          id: 'demo-3',
          type: EVENT_TYPES.COMMENT_ADDED,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          title: 'تعليق جديد على: الذكاء الاصطناعي يغير مستقبل التعليم',
          description: 'تحليل رائع ومفيد، أتمنى المزيد من هذه المقالات المتعمقة...',
          category: 'تعليقات',
          categoryColor: '#10B981',
          author: 'أحمد الشمري',
          url: '/article/ai-education#comment-123',
          metadata: {
            likes: 5
          },
          isNew: false,
          icon: '💬',
          displayType: 'comment',
          engagement: {
            views: 0,
            likes: 5,
            comments: 0,
            shares: 0
          },
          timeAgo: 'منذ 45 دقيقة',
          date: now.toLocaleDateString('ar-SA')
        },
        {
          id: 'demo-4',
          type: EVENT_TYPES.ARTICLE_FEATURED,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          title: 'مقال مميز: كيف تستثمر في العملات الرقمية بأمان',
          description: 'دليل شامل للمبتدئين في عالم الاستثمار بالعملات الرقمية مع نصائح الخبراء',
          category: 'اقتصاد',
          categoryColor: '#F59E0B',
          author: 'خالد السالم',
          url: '/article/demo-4',
          metadata: {
            views: 3450,
            featured: true,
            breaking: false,
            readingTime: 8,
            comments: 0,
            shares: 0
          },
          isNew: false,
          icon: '⭐',
          displayType: 'article',
          engagement: {
            views: 3450,
            likes: 234,
            comments: 56,
            shares: 89
          },
          timeAgo: 'منذ ساعتين',
          date: now.toLocaleDateString('ar-SA')
        },
        {
          id: 'demo-5',
          type: EVENT_TYPES.SYSTEM_UPDATE,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          title: 'تحديث النظام: تحسينات في سرعة التحميل',
          description: 'تم تحسين أداء الموقع بنسبة 40% وتقليل وقت التحميل',
          category: 'نظام',
          categoryColor: '#6B7280',
          url: '',
          metadata: {},
          isNew: false,
          icon: '🛠️',
          displayType: 'system',
          engagement: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          },
          timeAgo: 'منذ 3 ساعات',
          date: now.toLocaleDateString('ar-SA')
        },
        {
          id: 'demo-6',
          type: EVENT_TYPES.USER_MILESTONE,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          title: 'إنجاز جديد: علي الحازمي حصل على وسام القارئ النشط',
          description: 'لقراءة أكثر من 100 مقال في شهر واحد',
          category: 'مجتمع',
          categoryColor: '#EC4899',
          author: 'علي الحازمي',
          authorAvatar: '/default-avatar.png',
          url: '/profile/ali-alhazmi',
          metadata: {
            badge: '🏅',
            points: 500
          },
          isNew: false,
          icon: '🏆',
          displayType: 'community',
          engagement: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          },
          timeAgo: 'منذ 4 ساعات',
          date: now.toLocaleDateString('ar-SA')
        },
        {
          id: 'demo-7',
          type: EVENT_TYPES.ARTICLE_PUBLISHED,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          title: 'الرياضة السعودية تحقق إنجازات غير مسبوقة في 2025',
          description: 'تقرير شامل عن الإنجازات الرياضية للمملكة في مختلف الألعاب',
          category: 'رياضة',
          categoryColor: '#10B981',
          author: 'عبدالله الرياضي',
          url: '/article/demo-7',
          metadata: {
            views: 2100,
            featured: false,
            breaking: false,
            readingTime: 6,
            comments: 0,
            shares: 0
          },
          isNew: false,
          icon: '📰',
          displayType: 'article',
          engagement: {
            views: 2100,
            likes: 89,
            comments: 34,
            shares: 45
          },
          timeAgo: 'منذ 5 ساعات',
          date: now.toLocaleDateString('ar-SA')
        },
        {
          id: 'demo-8',
          type: EVENT_TYPES.COMMENT_ADDED,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          title: 'تعليق جديد على: مستقبل السيارات الكهربائية في السعودية',
          description: 'أتطلع لرؤية المزيد من محطات الشحن في جميع أنحاء المملكة...',
          category: 'تعليقات',
          categoryColor: '#10B981',
          author: 'فاطمة العلي',
          url: '/article/electric-cars#comment-456',
          metadata: {
            likes: 12
          },
          isNew: false,
          icon: '💬',
          displayType: 'comment',
          engagement: {
            views: 0,
            likes: 12,
            comments: 0,
            shares: 0
          },
          timeAgo: 'منذ 6 ساعات',
          date: now.toLocaleDateString('ar-SA')
        },
        {
          id: 'demo-9',
          type: EVENT_TYPES.CATEGORY_CREATED,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          title: 'تصنيف جديد: الذكاء الاصطناعي',
          description: 'قسم متخصص في أخبار وتطورات الذكاء الاصطناعي',
          category: 'نظام',
          categoryColor: '#6B7280',
          url: '/categories/ai',
          metadata: {
            icon: '🤖',
            color: '#8B5CF6'
          },
          isNew: false,
          icon: '🗂️',
          displayType: 'system',
          engagement: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          },
          timeAgo: 'منذ يوم',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')
        },
        {
          id: 'demo-10',
          type: EVENT_TYPES.AUTHOR_JOINED,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          title: 'انضم كاتب جديد: د. نورا الفهد',
          description: 'متخصصة في الصحة والطب الوقائي',
          category: 'فريق العمل',
          categoryColor: '#F59E0B',
          authorAvatar: '/default-avatar.png',
          url: '/author/nora-alfahad',
          metadata: {},
          isNew: false,
          icon: '✍️',
          displayType: 'community',
          engagement: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          },
          timeAgo: 'منذ يومين',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')
        }
      ];
      
      events.push(...demoEvents);
    }

    // ترتيب الأحداث حسب الوقت
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // تطبيق الفلترة
    let filteredEvents = events;
    if (filter !== 'all') {
      filteredEvents = events.filter(event => {
        switch (filter) {
          case 'articles':
            return [EVENT_TYPES.ARTICLE_PUBLISHED, EVENT_TYPES.ARTICLE_UPDATED].includes(event.type);
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

    // إحصائيات
    const stats = {
      total: events.length,
      newEvents: events.filter(e => e.isNew).length,
      byType: {
        articles: events.filter(e => e.type === EVENT_TYPES.ARTICLE_PUBLISHED).length,
        analyses: events.filter(e => e.type === EVENT_TYPES.ANALYSIS_COMPLETED).length,
        comments: events.filter(e => e.type === EVENT_TYPES.COMMENT_ADDED).length,
        system: events.filter(e => [EVENT_TYPES.CATEGORY_CREATED, EVENT_TYPES.SYSTEM_UPDATE].includes(e.type)).length,
        community: events.filter(e => [EVENT_TYPES.USER_MILESTONE, EVENT_TYPES.AUTHOR_JOINED].includes(e.type)).length
      }
    };

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
        timeAgo = `منذ ${hours} ساعة`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        timeAgo = `منذ ${days} يوم`;
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