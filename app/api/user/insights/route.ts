import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // جلب تفاعلات المستخدم
    const userInteractions = await prisma.interaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        article: {
          include: {
            category: true
          }
        }
      }
    });

    if (!userInteractions || userInteractions.length === 0) {
      // إرجاع بيانات افتراضية للمستخدمين الجدد
      return NextResponse.json({
        todayRecommendation: null,
        knowledgeDiversity: {
          readCategories: 0,
          totalCategories: 8,
          topCategory: 'ابدأ رحلتك',
          topCategoryPercentage: 0,
          suggestedCategories: ['التقنية', 'الاقتصاد', 'الرياضة']
        },
        behaviorAnalysis: {
          preferredReadingTime: 'لم تحدد بعد',
          contentPreference: 'استكشف المحتوى لتحديد تفضيلاتك',
          readingPattern: 'مستخدم جديد'
        },
        weeklyActivity: {
          articlesRead: 0,
          articlesSaved: 0,
          interactions: 0,
          streak: 0
        },
        similarReaders: {
          recommendations: []
        }
      });
    }

    // حساب التنوع المعرفي
    const allCategories = await prisma.category.count();
    const readCategories = new Set(
      userInteractions
        .filter(i => i.article?.category)
        .map(i => i.article!.category!.id)
    );

    // حساب النسب لكل تصنيف
    const categoryStats = userInteractions
      .filter(i => i.article?.category)
      .reduce((acc: Record<string, number>, interaction) => {
        const categoryId = interaction.article!.category!.id;
        acc[categoryId] = (acc[categoryId] || 0) + 1;
        return acc;
      }, {});

    const topCategory = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b - a)[0];

    const topCategoryData = topCategory ? await prisma.category.findUnique({
      where: { id: topCategory[0] }
    }) : null;

    // اقتراح تصنيفات جديدة
    const suggestedCategories = await prisma.category.findMany({
      where: {
        id: { notIn: Array.from(readCategories) as string[] }
      },
      take: 3,
      orderBy: { displayOrder: 'asc' }
    });

    // تحليل السلوك القرائي
    const readingHours = userInteractions.map(i => 
      new Date(i.createdAt).getHours()
    );
    const mostFrequentHour = mode(readingHours);
    const preferredReadingTime = getReadingTimeDescription(mostFrequentHour);

    // حساب النشاط الأسبوعي
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyInteractions = userInteractions.filter(i => 
      new Date(i.createdAt) >= oneWeekAgo
    );

    const weeklyStats = {
      articlesRead: new Set(weeklyInteractions.map(i => i.articleId)).size,
      articlesSaved: weeklyInteractions.filter(i => i.type === 'save').length,
      interactions: weeklyInteractions.length,
      streak: calculateStreak(userInteractions)
    };

    // توصية اليوم
    const todayRecommendation = await getTodayRecommendation(userId, readCategories);

    // توصيات قراء مشابهين
    const similarReadersRecommendations = await getSimilarReadersRecommendations(
      userId, 
      Array.from(readCategories) as string[]
    );

    const insights = {
      todayRecommendation,
      knowledgeDiversity: {
        readCategories: readCategories.size,
        totalCategories: allCategories,
        topCategory: topCategoryData?.name || 'غير محدد',
        topCategoryPercentage: topCategory 
          ? Math.round((topCategory[1] / userInteractions.length) * 100)
          : 0,
        suggestedCategories: suggestedCategories.map(c => c.name)
      },
      behaviorAnalysis: {
        preferredReadingTime,
        contentPreference: getContentPreference(userInteractions),
        readingPattern: getReadingPattern(userInteractions)
      },
      weeklyActivity: weeklyStats,
      similarReaders: {
        recommendations: similarReadersRecommendations
      }
    };

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error fetching user insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user insights' },
      { status: 500 }
    );
  }
}

// دالة لحساب القيمة الأكثر تكراراً
function mode(arr: number[]): number {
  const frequency: { [key: number]: number } = {};
  let maxFreq = 0;
  let mode = 0;

  arr.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num];
      mode = num;
    }
  });

  return mode;
}

// وصف وقت القراءة المفضل
function getReadingTimeDescription(hour: number): string {
  if (hour >= 5 && hour < 9) return 'تفضل القراءة في الصباح الباكر';
  if (hour >= 9 && hour < 12) return 'تفضل القراءة في فترة الضحى';
  if (hour >= 12 && hour < 15) return 'تفضل القراءة وقت الظهيرة';
  if (hour >= 15 && hour < 18) return 'تفضل القراءة في فترة العصر';
  if (hour >= 18 && hour < 21) return 'تفضل القراءة في المساء';
  return 'تفضل القراءة في وقت متأخر من الليل';
}

// تحليل تفضيل المحتوى
function getContentPreference(interactions: any[]): string {
  const hasReadLongArticles = interactions.some(i => 
    i.article?.readingTime && i.article.readingTime > 10
  );
  
  if (hasReadLongArticles) {
    return 'تميل إلى المقالات التحليلية المعمقة';
  }
  return 'تفضل المقالات السريعة والموجزة';
}

// تحليل نمط القراءة
function getReadingPattern(interactions: any[]): string {
  const dates = interactions.map(i => new Date(i.createdAt).toDateString());
  const uniqueDates = new Set(dates);
  
  if (uniqueDates.size >= interactions.length * 0.8) {
    return 'قارئ منتظم - تقرأ بشكل يومي تقريباً';
  } else if (uniqueDates.size >= interactions.length * 0.5) {
    return 'قارئ متوسط - تقرأ عدة مرات في الأسبوع';
  }
  return 'قارئ متقطع - تقرأ بين الحين والآخر';
}

// حساب السلسلة المتتالية
function calculateStreak(interactions: any[]): number {
  if (interactions.length === 0) return 0;

  const dates = interactions
    .map(i => new Date(i.createdAt).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 1;
  const today = new Date().toDateString();
  
  if (dates[0] !== today && dates[0] !== new Date(Date.now() - 86400000).toDateString()) {
    return 0; // السلسلة انقطعت
  }

  for (let i = 1; i < dates.length; i++) {
    const currentDate = new Date(dates[i - 1]);
    const prevDate = new Date(dates[i]);
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// الحصول على توصية اليوم
async function getTodayRecommendation(userId: string, readCategories: Set<string>) {
  if (readCategories.size === 0) return null;
  
  // البحث عن مقال من التصنيفات المفضلة لم يقرأه المستخدم
  const recommendedArticle = await prisma.article.findFirst({
    where: {
      status: 'published',
      categoryId: { in: Array.from(readCategories) },
      NOT: {
        interactions: {
          some: {
            userId: userId,
            type: 'view'
          }
        }
      }
    },
    include: {
      category: true
    },
    orderBy: [
      { views: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  if (!recommendedArticle) return null;

  return {
    id: recommendedArticle.id,
    title: recommendedArticle.title,
    category: recommendedArticle.category?.name || 'غير مصنف',
    readingTime: recommendedArticle.readingTime || 5,
    reason: `مقال جديد في ${recommendedArticle.category?.name || 'التصنيف'} بناءً على اهتماماتك`
  };
}

// الحصول على توصيات من قراء مشابهين
async function getSimilarReadersRecommendations(userId: string, userCategories: string[]) {
  if (userCategories.length === 0) return [];
  
  // البحث عن مستخدمين لديهم اهتمامات مشابهة
  const similarUsers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      interactions: {
        some: {
          article: {
            categoryId: { in: userCategories }
          }
        }
      }
    },
    include: {
      interactions: {
        include: {
          article: {
            include: {
              category: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }
    },
    take: 10
  });

  // جمع المقالات التي قرأها المستخدمون المشابهون
  const articleCounts = new Map<string, { article: any, count: number }>();

  similarUsers.forEach(user => {
    user.interactions.forEach(interaction => {
      if (interaction.type === 'view' && interaction.article) {
        const articleId = interaction.article.id;
        if (articleCounts.has(articleId)) {
          articleCounts.get(articleId)!.count++;
        } else {
          articleCounts.set(articleId, {
            article: interaction.article,
            count: 1
          });
        }
      }
    });
  });

  // ترتيب المقالات حسب الشعبية
  const recommendations = Array.from(articleCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ article, count }) => ({
      id: article.id,
      title: article.title,
      reason: `${count} قراء مهتمين بنفس المواضيع قرأوا هذا`
    }));

  return recommendations;
} 