import { ReaderProfile, ReaderPersonality, ReaderTrait } from '@/types/reader-profile';
import { prisma } from '@/lib/prisma';

// تحديد الشخصية المعرفية بناءً على السلوك
function determinePersonality(
  categoryDistribution: Record<string, number>,
  readingSpeed: number,
  engagementRate: number
): ReaderPersonality {
  const topCategories = Object.entries(categoryDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  // صياد الأخبار: يقرأ الأخبار العاجلة والسياسة بسرعة
  if (topCategories.includes('أخبار') || topCategories.includes('سياسة')) {
    if (readingSpeed > 10) return {
      type: 'news-hunter',
      title: 'صياد الأخبار',
      description: 'دائماً في قلب الحدث، تتابع آخر المستجدات بشغف',
      icon: '📰',
      color: 'red',
      gradient: 'from-red-500 to-orange-500'
    };
  }

  // المحلل العميق: يقرأ ببطء ويتفاعل كثيراً
  if (readingSpeed < 5 && engagementRate > 30) {
    return {
      type: 'deep-analyst',
      title: 'المحلل العميق',
      description: 'تقرأ بتمعن وتحلل كل التفاصيل',
      icon: '🔍',
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-500'
    };
  }

  // باحث عن الآراء: يفضل مقالات الرأي
  if (topCategories.includes('رأي') || topCategories.includes('مقالات')) {
    return {
      type: 'opinion-seeker',
      title: 'باحث عن الآراء',
      description: 'تستمتع بوجهات النظر المختلفة والنقاشات الفكرية',
      icon: '💭',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500'
    };
  }

  // مستكشف المعرفة: يقرأ في مجالات متنوعة
  if (Object.keys(categoryDistribution).length > 5) {
    return {
      type: 'knowledge-explorer',
      title: 'مستكشف المعرفة',
      description: 'فضولك لا حدود له، تقرأ في كل المجالات',
      icon: '🌍',
      color: 'green',
      gradient: 'from-green-500 to-teal-500'
    };
  }

  // متابع الترندات: يقرأ المواضيع الأكثر تفاعلاً
  if (engagementRate > 50) {
    return {
      type: 'trend-follower',
      title: 'متابع الترندات',
      description: 'دائماً على اطلاع بما يشغل الناس',
      icon: '🔥',
      color: 'orange',
      gradient: 'from-orange-500 to-yellow-500'
    };
  }

  return {
    type: 'balanced-reader',
    title: 'القارئ المتوازن',
    description: 'تقرأ باعتدال وتنوع في اختياراتك',
    icon: '⚖️',
    color: 'gray',
    gradient: 'from-gray-500 to-slate-500'
  };
}

// تحديد السمات بناءً على السلوك
function determineTraits(stats: any, engagementRate?: number, activeHours?: number[]): ReaderTrait[] {
  const traits: ReaderTrait[] = [];

  // قارئ نشط
  if (stats?.dailyReadingAverage && stats.dailyReadingAverage > 5) {
    traits.push({
      id: 'active-reader',
      name: 'قارئ نشط',
      icon: '🔥',
      color: 'orange'
    });
  }

  // محب للتفاصيل
  if (stats?.totalArticlesRead && stats.totalArticlesRead > 50) {
    traits.push({
      id: 'detail-lover',
      name: 'محب للتفاصيل',
      icon: '🔍',
      color: 'blue'
    });
  }

  // متفاعل
  if (engagementRate && engagementRate > 30) {
    traits.push({
      id: 'engaged',
      name: 'متفاعل',
      icon: '💬',
      color: 'purple'
    });
  }

  // قارئ الصباح
  const morningHours = activeHours?.filter((h: number) => h >= 6 && h <= 12) || [];
  if (morningHours.length > 3) {
    traits.push({
      id: 'morning-reader',
      name: 'قارئ الصباح',
      icon: '🌅',
      color: 'yellow'
    });
  }

  // مثابر
  if (stats?.streakDays && stats.streakDays > 7) {
    traits.push({
      id: 'persistent',
      name: 'مثابر',
      icon: '🎯',
      color: 'green'
    });
  }

  return traits;
}

export async function buildReaderProfile(userId: string): Promise<ReaderProfile> {
  try {
    // جلب تفاعلات المستخدم
    const interactions = await prisma.interaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // جلب نقاط الولاء
    const loyaltyPoints = await prisma.loyaltyPoint.aggregate({
      where: { userId },
      _sum: { points: true }
    });

    // جلب معلومات المقالات والتصنيفات بشكل منفصل
    const articleIds = [...new Set(interactions.map(i => i.articleId))];
    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: {
        id: true,
        categoryId: true
      }
    });

    // إنشاء خريطة للمقالات وتصنيفاتها
    const articleCategoryMap = new Map<string, string | null>();
    articles.forEach(article => {
      articleCategoryMap.set(article.id, article.categoryId);
    });

    // جلب التصنيفات
    const categoryIds = [...new Set(articles.map(a => a.categoryId).filter(id => id !== null))] as string[];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: {
        id: true,
        name: true
      }
    });

    // إنشاء خريطة للتصنيفات
    const categoryMap = new Map<string, string>();
    categories.forEach(category => {
      categoryMap.set(category.id, category.name);
    });

    // حساب الإحصائيات
    const totalInteractions = interactions.length;
    const uniqueArticles = new Set(interactions.map(i => i.articleId)).size;
    
    // حساب التفاعلات حسب النوع
    const interactionsByType = interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // حساب التفضيلات حسب التصنيف
    const categoryPreferences = interactions
      .filter(i => {
        const categoryId = articleCategoryMap.get(i.articleId);
        return categoryId && categoryMap.has(categoryId);
      })
      .reduce((acc, interaction) => {
        const categoryId = articleCategoryMap.get(interaction.articleId)!;
        const categoryName = categoryMap.get(categoryId)!;
        
        if (!acc[categoryName]) {
          acc[categoryName] = { count: 0, percentage: 0 };
        }
        acc[categoryName].count++;
        return acc;
      }, {} as Record<string, { count: number; percentage: number }>);

    // حساب النسب المئوية للتصنيفات
    const totalCategoryInteractions = Object.values(categoryPreferences).reduce((sum, cat) => sum + cat.count, 0);
    Object.keys(categoryPreferences).forEach(category => {
      categoryPreferences[category].percentage = totalCategoryInteractions > 0 
        ? Math.round((categoryPreferences[category].count / totalCategoryInteractions) * 100)
        : 0;
    });

    // حساب معدل القراءة اليومي
    const firstInteractionDate = interactions.length > 0 
      ? new Date(interactions[interactions.length - 1].createdAt)
      : new Date();
    const daysSinceFirstInteraction = Math.max(1, Math.ceil((Date.now() - firstInteractionDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyReadingAverage = Math.round(uniqueArticles / daysSinceFirstInteraction * 10) / 10;

    // حساب سلسلة الأيام المتتالية
    const streakDays = calculateStreakDays(interactions);

    // تحضير توزيع التصنيفات للشخصية
    const categoryDistribution = Object.entries(categoryPreferences).reduce((acc, [name, data]) => {
      acc[name] = data.count;
      return acc;
    }, {} as Record<string, number>);

    // تحديد الشخصية المعرفية
    const personality = determinePersonality(categoryDistribution, dailyReadingAverage, interactionsByType.share || 0);

    // تحديد السمات
    const traits = determineTraits(
      {
        dailyReadingAverage,
        totalArticlesRead: uniqueArticles,
        totalInteractions,
        streakDays,
        loyaltyPoints: loyaltyPoints._sum.points || 0
      },
      interactionsByType.share || 0,
      undefined // activeHours - يمكن إضافتها لاحقاً
    );

    return {
      userId,
      personality,
      traits,
      stats: {
        totalArticlesRead: uniqueArticles,
        totalInteractions,
        dailyReadingAverage,
        streakDays,
        loyaltyPoints: loyaltyPoints._sum.points || 0,
        favoriteCategories: Object.entries(categoryPreferences)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 3)
          .map(([name, data]) => ({
            name,
            percentage: data.percentage
          })),
        interactionBreakdown: {
          views: interactionsByType.view || 0,
          likes: interactionsByType.like || 0,
          saves: interactionsByType.save || 0,
          shares: interactionsByType.share || 0,
          comments: interactionsByType.comment || 0
        }
      },
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error building reader profile:', error);
    
    // إرجاع ملف شخصي افتراضي في حالة الخطأ
    return {
      userId,
      personality: {
        type: 'balanced-reader',
        title: 'القارئ المتوازن',
        description: 'تقرأ باعتدال وتنوع في اختياراتك',
        icon: '⚖️',
        color: 'gray',
        gradient: 'from-gray-500 to-slate-500'
      },
      traits: [],
      stats: {
        totalArticlesRead: 0,
        totalInteractions: 0,
        dailyReadingAverage: 0,
        streakDays: 0,
        loyaltyPoints: 0,
        favoriteCategories: [],
        interactionBreakdown: {
          views: 0,
          likes: 0,
          saves: 0,
          shares: 0,
          comments: 0
        }
      },
      lastUpdated: new Date()
    };
  }
}

function calculateStreakDays(interactions: any[]): number {
  if (interactions.length === 0) return 0;

  const dates = interactions.map(i => new Date(i.createdAt).toDateString());
  const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  let streak = 1;
  const today = new Date().toDateString();
  
  if (uniqueDates[0] !== today && uniqueDates[0] !== new Date(Date.now() - 86400000).toDateString()) {
    return 0; // الsترeak انقطع
  }

  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i - 1]);
    const previousDate = new Date(uniqueDates[i]);
    const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// حفظ أو تحديث ملف القارئ في قاعدة البيانات
export async function saveReaderProfile(profile: ReaderProfile) {
  // يمكن إضافة جدول خاص لحفظ الملفات الشخصية
  // أو استخدام Redis للتخزين المؤقت
  return profile;
} 