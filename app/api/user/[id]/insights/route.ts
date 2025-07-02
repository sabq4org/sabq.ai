import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: Params
) {
  try {
    const { id: userId } = await context.params;

    // جلب جميع التفاعلات
    const interactions = await prisma.interaction.findMany({
      where: { userId: userId },
      include: {
        article: {
          include: {
            category: true,
            author: true,
            deepAnalysis: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // جلب المقالات المحفوظة  
    const savedArticles = await prisma.interaction.findMany({
      where: { 
        userId: userId,
        type: 'save'
      },
      include: {
        article: {
          include: {
            category: true,
            author: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // تحليل نمط القراءة
    const readingPattern = analyzeReadingPattern(interactions);
    
    // تحليل التصنيفات المفضلة
    const categoryAnalysis = analyzeCategoryPreferences(interactions);
    
    // تحليل الوقت
    const timeAnalysis = analyzeReadingTime(interactions);
    
    // حساب الإحصائيات
    const stats = {
      totalArticlesRead: interactions.filter(i => i.type === 'view').length,
      totalLikes: interactions.filter(i => i.type === 'like').length,
      totalShares: interactions.filter(i => i.type === 'share').length,
      totalSaves: savedArticles.length,
      totalComments: interactions.filter(i => i.type === 'comment').length,
      averageReadingTime: calculateAverageReadingTime(interactions),
      streakDays: calculateReadingStreak(interactions)
    };

    // جلب الشارات/الإنجازات
    const achievements = await calculateAchievements(userId, interactions, stats);

    // سجل الرحلة الزمني
    const timeline = createReadingTimeline(interactions);

    // المقالات غير المكتملة
    const unfinishedArticles = findUnfinishedArticles(interactions);

    return NextResponse.json({
      success: true,
      data: {
        readingProfile: {
          type: readingPattern.type,
          description: readingPattern.description,
          level: readingPattern.level
        },
        categoryDistribution: categoryAnalysis,
        timePatterns: timeAnalysis,
        stats,
        achievements,
        timeline,
        savedArticles: savedArticles.map((s: any) => ({
          id: s.article.id,
          title: s.article.title,
          category: s.article.category?.name,
          savedAt: s.createdAt
        })),
        unfinishedArticles,
        recommendations: {
          diversifyCategories: categoryAnalysis.recommendations,
          bestReadingTime: timeAnalysis.bestTime
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

// تحليل نمط القراءة
function analyzeReadingPattern(interactions: any[]) {
  const viewedArticles = interactions.filter(i => i.type === 'view');
  
  // تحليل عمق القراءة
  const deepReads = viewedArticles.filter(i => {
    return i.article?.deepAnalysis?.readability_score > 70;
  });
  
  const ratio = deepReads.length / (viewedArticles.length || 1);
  
  if (ratio > 0.7) {
    return {
      type: 'analytical',
      description: 'قارئ تحليلي - يفضل المحتوى العميق والمفصل',
      level: 'متقدم'
    };
  } else if (ratio > 0.4) {
    return {
      type: 'balanced',
      description: 'قارئ متوازن - يقرأ مزيج من المحتوى',
      level: 'متوسط'
    };
  } else {
    return {
      type: 'casual',
      description: 'قارئ عادي - يفضل المحتوى السريع',
      level: 'مبتدئ'
    };
  }
}

// تحليل التصنيفات المفضلة
function analyzeCategoryPreferences(interactions: any[]) {
  const categoryCount: Record<string, number> = {};
  const categoryDetails: Record<string, any> = {};
  
  interactions.forEach(interaction => {
    if (interaction.article?.category) {
      const catName = interaction.article.category.name;
      categoryCount[catName] = (categoryCount[catName] || 0) + 1;
      categoryDetails[catName] = interaction.article.category;
    }
  });
  
  const total = Object.values(categoryCount).reduce((a, b) => a + b, 0);
  const distribution = Object.entries(categoryCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      ...categoryDetails[name]
    }))
    .sort((a, b) => b.count - a.count);
  
  // توصيات للتنويع
  const recommendations = [];
  if (distribution.length > 0 && distribution[0].percentage > 60) {
    recommendations.push(`جرب قراءة محتوى من أقسام أخرى لتوسيع آفاقك`);
  }
  
  return {
    distribution,
    topCategory: distribution[0]?.name || 'غير محدد',
    diversity: distribution.length,
    recommendations
  };
}

// تحليل أوقات القراءة
function analyzeReadingTime(interactions: any[]) {
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<string, number> = {};
  
  interactions.forEach(interaction => {
    const date = new Date(interaction.createdAt);
    const hour = date.getHours();
    const day = date.toLocaleDateString('ar-SA', { weekday: 'long' });
    
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  
  // إيجاد أفضل وقت للقراءة
  const bestHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0];
  
  const bestDay = Object.entries(dayCounts)
    .sort(([, a], [, b]) => b - a)[0];
  
  let timeOfDay = 'المساء';
  if (bestHour && parseInt(bestHour[0]) < 12) {
    timeOfDay = 'الصباح';
  } else if (bestHour && parseInt(bestHour[0]) < 17) {
    timeOfDay = 'الظهيرة';
  }
  
  return {
    bestTime: timeOfDay,
    bestDay: bestDay?.[0] || 'غير محدد',
    hourlyDistribution: hourCounts,
    dailyDistribution: dayCounts
  };
}

// حساب متوسط وقت القراءة
function calculateAverageReadingTime(interactions: any[]): number {
  const readingTimes = interactions
    .filter(i => i.type === 'view' && i.article?.reading_time)
    .map(i => i.article.reading_time);
  
  if (readingTimes.length === 0) return 0;
  
  const sum = readingTimes.reduce((a, b) => a + b, 0);
  return Math.round(sum / readingTimes.length);
}

// حساب عدد أيام القراءة المتتالية
function calculateReadingStreak(interactions: any[]): number {
  const dates = interactions
    .filter(i => i.type === 'view')
    .map(i => new Date(i.createdAt).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  if (dates.length === 0) return 0;
  
  let streak = 1;
  const today = new Date().toDateString();
  
  if (dates[0] !== today && dates[0] !== new Date(Date.now() - 86400000).toDateString()) {
    return 0; // انقطع التسلسل
  }
  
  for (let i = 1; i < dates.length; i++) {
    const current = new Date(dates[i - 1]);
    const previous = new Date(dates[i]);
    const diffDays = Math.floor((current.getTime() - previous.getTime()) / 86400000);
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// حساب الإنجازات
async function calculateAchievements(userId: string, interactions: any[], stats: any) {
  const achievements = [];
  
  // قارئ صباحي
  const morningReads = interactions.filter(i => {
    const hour = new Date(i.createdAt).getHours();
    return i.type === 'view' && hour >= 5 && hour < 12;
  });
  
  if (morningReads.length > 10) {
    achievements.push({
      id: 'early_bird',
      name: 'قارئ صباحي',
      description: 'تقرأ بانتظام في الصباح',
      icon: '🌅',
      color: '#F59E0B'
    });
  }
  
  // قارئ نهم
  if (stats.totalArticlesRead > 50) {
    achievements.push({
      id: 'bookworm',
      name: 'قارئ نهم',
      description: 'قرأت أكثر من 50 مقال',
      icon: '📚',
      color: '#8B5CF6'
    });
  }
  
  // متفاعل
  if (stats.totalLikes > 20) {
    achievements.push({
      id: 'engaged',
      name: 'قارئ متفاعل',
      description: 'تتفاعل بكثرة مع المحتوى',
      icon: '💬',
      color: '#3B82F6'
    });
  }
  
  // مشارك
  if (stats.totalShares > 10) {
    achievements.push({
      id: 'sharer',
      name: 'ناشر المعرفة',
      description: 'تشارك المحتوى مع الآخرين',
      icon: '🔄',
      color: '#10B981'
    });
  }
  
  // قارئ منتظم
  if (stats.streakDays >= 7) {
    achievements.push({
      id: 'consistent',
      name: 'قارئ منتظم',
      description: `${stats.streakDays} أيام متتالية من القراءة`,
      icon: '🔥',
      color: '#EF4444'
    });
  }
  
  return achievements;
}

// إنشاء الجدول الزمني للقراءة
function createReadingTimeline(interactions: any[]) {
  const timeline: Record<string, any[]> = {};
  
  interactions
    .filter(i => i.type === 'view')
    .slice(0, 30) // آخر 30 تفاعل
    .forEach(interaction => {
      const date = new Date(interaction.createdAt).toLocaleDateString('ar-SA');
      
      if (!timeline[date]) {
        timeline[date] = [];
      }
      
      timeline[date].push({
        time: new Date(interaction.createdAt).toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        title: interaction.article?.title,
        category: interaction.article?.category?.name,
        readingTime: interaction.article?.reading_time
      });
    });
  
  return Object.entries(timeline).map(([date, articles]) => ({
    date,
    articlesCount: articles.length,
    totalReadingTime: articles.reduce((sum, a) => sum + (a.readingTime || 0), 0),
    articles
  }));
}

// إيجاد المقالات غير المكتملة
function findUnfinishedArticles(interactions: any[]) {
  // هذا مثال بسيط - يمكن تحسينه بتتبع وقت القراءة الفعلي
  const viewedArticles = interactions
    .filter(i => i.type === 'view')
    .map(i => i.article);
  
  // المقالات التي شوهدت ولكن لم يتم الإعجاب بها أو حفظها
  const potentiallyUnfinished = viewedArticles.filter(article => {
    if (!article) return false;
    const hasEngagement = interactions.some(i => 
      i.articleId === article.id && 
      (i.type === 'like' || i.type === 'save')
    );
    return !hasEngagement && article.reading_time > 5;
  });
  
  return potentiallyUnfinished.slice(0, 5).map(article => ({
    id: article.id,
    title: article.title,
    category: article.category?.name,
    readingTime: article.reading_time,
    excerpt: article.excerpt
  }));
} 