import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleOptions, corsResponse } from '@/lib/cors';

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return handleOptions();
}

export const runtime = 'nodejs';

type TimeIntent = 'morning' | 'afternoon' | 'evening';

// دالة لتحديد ما إذا كان المقال في آخر 48 ساعة
function isWithinLast48Hours(date: Date): boolean {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  return hours <= 48;
}

// دالة لحساب النقاط حسب النية
function calculateScore(article: any, intent: TimeIntent): number {
  let score = 0;
  
  // النقاط الأساسية حسب الحداثة
  const hoursAgo = (new Date().getTime() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 48 - hoursAgo); // كلما كان أحدث، كلما زادت النقاط
  
  // النقاط حسب النية
  switch (intent) {
    case 'morning':
      // في الصباح نفضل المقالات المهمة والتحليلية
      if (article.category?.slug === 'politics' || article.category?.slug === 'economy') {
        score += 20;
      }
      if (article.readTime && article.readTime > 5) {
        score += 10; // مقالات أطول للقراءة الصباحية
      }
      break;
      
    case 'afternoon':
      // في الظهيرة نفضل المقالات السريعة والمتنوعة
      if (article.category?.slug === 'technology' || article.category?.slug === 'sports') {
        score += 20;
      }
      if (article.readTime && article.readTime <= 5) {
        score += 10; // مقالات قصيرة للاستراحة
      }
      break;
      
    case 'evening':
      // في المساء نفضل المقالات الخفيفة والترفيهية
      if (article.category?.slug === 'culture' || article.category?.slug === 'lifestyle') {
        score += 20;
      }
      if (article.views && article.views > 1000) {
        score += 15; // المقالات الأكثر شعبية
      }
      break;
  }
  
  // نقاط إضافية للتفاعل
  if (article.views) {
    score += Math.min(article.views / 100, 20); // حد أقصى 20 نقطة
  }
  
  return score;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const intent = (searchParams.get('intent') || 'morning') as TimeIntent;
  
  try {
    
    // جلب المقالات المنشورة في آخر 48 ساعة
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 48);
    
    const articles = await prisma.article.findMany({
      where: {
        status: 'published',
        publishedAt: {
          gte: twoHoursAgo
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 20 // جلب أكثر من المطلوب للتصفية
    });
    
    // حساب النقاط وترتيب المقالات
    const scoredArticles = articles.map(article => ({
      ...article,
      score: calculateScore(article, intent)
    }));
    
    // ترتيب حسب النقاط وأخذ أفضل 3
    const topArticles = scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score, ...article }) => article); // إزالة النقاط من النتيجة النهائية
    
    // إذا لم نجد مقالات كافية، جلب مقالات إضافية
    if (topArticles.length < 3) {
      const additionalArticles = await prisma.article.findMany({
        where: {
          status: 'published',
          id: {
            notIn: topArticles.map(a => a.id)
          }
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        take: 3 - topArticles.length
      });
      
      topArticles.push(...additionalArticles);
    }
    
    return corsResponse({
      articles: topArticles,
      intent,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching smart digest:', error);
    
    // إرجاع بيانات وهمية في حالة الخطأ
    const mockArticles = [
      {
        id: '1',
        title: 'مقال تجريبي للصباح',
        excerpt: 'هذا مقال تجريبي يظهر في فترة الصباح مع محتوى مفيد وهادئ',
        slug: 'morning-article',
        publishedAt: new Date().toISOString(),
        readTime: 5,
        views: 1250,
        category: { id: '1', name: 'أخبار', slug: 'news' },
        author: { id: '1', name: 'محرر سبق' },
        image: '/images/placeholder.jpg'
      },
      {
        id: '2',
        title: 'تحليل عميق لأحداث اليوم',
        excerpt: 'تحليل شامل للأحداث المهمة التي جرت اليوم مع رؤى الخبراء',
        slug: 'deep-analysis',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        readTime: 8,
        views: 890,
        category: { id: '2', name: 'تحليلات', slug: 'analysis' },
        author: { id: '2', name: 'محلل سبق' },
        image: '/images/placeholder.jpg'
      },
      {
        id: '3',
        title: 'آخر التطورات التقنية',
        excerpt: 'نظرة على أحدث التطورات في عالم التقنية والابتكار',
        slug: 'tech-updates',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        readTime: 4,
        views: 2100,
        category: { id: '3', name: 'تقنية', slug: 'technology' },
        author: { id: '3', name: 'خبير التقنية' },
        image: '/images/placeholder.jpg'
      }
    ];
    
    return corsResponse({
      articles: mockArticles,
      intent: intent,
      timestamp: new Date().toISOString(),
      mock: true
    });
  }
} 