import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// جلب تحليلات سلوك المستخدم
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, all
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // حساب تاريخ البداية بناءً على الفترة
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }
    
    // جلب البيانات بشكل متوازي
    const [
      impressions,
      interactions,
      readingHistory,
      sessions,
      userInterests,
      behaviorPatterns
    ] = await Promise.all([
      // الانطباعات
      prisma.impression.findMany({
        where: {
          userId,
          startedAt: { gte: startDate }
        },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              categoryId: true,
              readingTime: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        }
      }),
      
      // التفاعلات
      prisma.interaction.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      }),
      
      // سجل القراءة
      prisma.readingHistory.findMany({
        where: {
          userId,
          lastReadAt: { gte: startDate }
        },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              categoryId: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        }
      }),
      
      // الجلسات
      prisma.session.findMany({
        where: {
          userId,
          startedAt: { gte: startDate }
        }
      }),
      
      // الاهتمامات
      prisma.userInterest.findMany({
        where: { userId },
        orderBy: { score: 'desc' }
      }),
      
      // أنماط السلوك
      prisma.userBehaviorPattern.findMany({
        where: { userId }
      })
    ]);
    
    // تحليل البيانات
    const analytics = {
      overview: {
        totalImpressions: impressions.length,
        totalInteractions: interactions.length,
        uniqueArticlesRead: new Set(impressions.map(i => i.articleId)).size,
        totalReadingTime: impressions.reduce((sum, i) => sum + (i.durationSeconds || 0), 0),
        averageScrollDepth: impressions.reduce((sum, i) => sum + (i.scrollDepth || 0), 0) / impressions.length || 0,
        completionRate: impressions.filter(i => i.readingComplete).length / impressions.length || 0
      },
      
      readingPatterns: analyzeReadingPatterns(impressions),
      
      interactionBreakdown: analyzeInteractions(interactions),
      
      categoryInsights: analyzeCategoryPreferences(impressions, readingHistory),
      
      timeAnalysis: analyzeTimePatterns(impressions, sessions),
      
      interests: userInterests.map(i => ({
        category: i.interest,
        score: i.score,
        source: i.source
      })),
      
      behaviorPatterns: behaviorPatterns.reduce((acc, pattern) => {
        acc[pattern.patternType] = pattern.patternData;
        return acc;
      }, {} as any),
      
      recommendations: {
        optimalReadingTime: findOptimalReadingTime(impressions),
        suggestedCategories: suggestCategories(categoryInsights, userInterests),
        engagementTips: generateEngagementTips(analytics)
      }
    };
    
    // تحديث أنماط السلوك
    await updateBehaviorPatterns(userId, analytics);
    
    return NextResponse.json({
      success: true,
      analytics,
      period,
      startDate,
      endDate: new Date()
    });
    
  } catch (error) {
    console.error('Error fetching behavior analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// دوال التحليل

function analyzeReadingPatterns(impressions: any[]) {
  const patterns = {
    byDayOfWeek: {} as Record<string, number>,
    byHourOfDay: {} as Record<number, number>,
    averageDuration: 0,
    readingSpeed: {
      fast: 0,
      normal: 0,
      slow: 0
    }
  };
  
  let totalDuration = 0;
  
  impressions.forEach(impression => {
    const date = new Date(impression.startedAt);
    const dayOfWeek = date.toLocaleDateString('ar-SA', { weekday: 'long' });
    const hourOfDay = date.getHours();
    
    patterns.byDayOfWeek[dayOfWeek] = (patterns.byDayOfWeek[dayOfWeek] || 0) + 1;
    patterns.byHourOfDay[hourOfDay] = (patterns.byHourOfDay[hourOfDay] || 0) + 1;
    
    if (impression.durationSeconds) {
      totalDuration += impression.durationSeconds;
      
      // تصنيف سرعة القراءة
      const expectedDuration = (impression.article?.readingTime || 5) * 60; // بالثواني
      const ratio = impression.durationSeconds / expectedDuration;
      
      if (ratio < 0.7) patterns.readingSpeed.fast++;
      else if (ratio > 1.3) patterns.readingSpeed.slow++;
      else patterns.readingSpeed.normal++;
    }
  });
  
  patterns.averageDuration = impressions.length > 0 ? totalDuration / impressions.length : 0;
  
  return patterns;
}

function analyzeInteractions(interactions: any[]) {
  const breakdown = {
    like: 0,
    save: 0,
    share: 0,
    comment: 0,
    view: 0
  };
  
  interactions.forEach(interaction => {
    if (breakdown.hasOwnProperty(interaction.type)) {
      breakdown[interaction.type as keyof typeof breakdown]++;
    }
  });
  
  return breakdown;
}

function analyzeCategoryPreferences(impressions: any[], readingHistory: any[]) {
  const categoryStats: Record<string, {
    impressions: number;
    totalTime: number;
    completionRate: number;
    articles: Set<string>;
  }> = {};
  
  impressions.forEach(impression => {
    const category = impression.article?.category;
    if (!category) return;
    
    if (!categoryStats[category.slug]) {
      categoryStats[category.slug] = {
        impressions: 0,
        totalTime: 0,
        completionRate: 0,
        articles: new Set()
      };
    }
    
    const stats = categoryStats[category.slug];
    stats.impressions++;
    stats.totalTime += impression.durationSeconds || 0;
    stats.articles.add(impression.articleId);
    
    if (impression.readingComplete) {
      stats.completionRate++;
    }
  });
  
  // حساب معدل الإكمال
  Object.values(categoryStats).forEach(stats => {
    stats.completionRate = stats.impressions > 0 ? stats.completionRate / stats.impressions : 0;
  });
  
  // تحويل Set إلى عدد
  const result = Object.entries(categoryStats).map(([slug, stats]) => ({
    category: slug,
    impressions: stats.impressions,
    totalTime: stats.totalTime,
    averageTime: stats.impressions > 0 ? stats.totalTime / stats.impressions : 0,
    completionRate: stats.completionRate,
    uniqueArticles: stats.articles.size
  }));
  
  return result.sort((a, b) => b.impressions - a.impressions);
}

function analyzeTimePatterns(impressions: any[], sessions: any[]) {
  const patterns = {
    mostActiveHours: [] as number[],
    mostActiveDays: [] as string[],
    averageSessionDuration: 0,
    peakReadingTimes: [] as { hour: number; count: number }[]
  };
  
  // تحليل الساعات النشطة
  const hourCounts: Record<number, number> = {};
  impressions.forEach(impression => {
    const hour = new Date(impression.startedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  patterns.peakReadingTimes = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  patterns.mostActiveHours = patterns.peakReadingTimes.map(p => p.hour);
  
  // حساب متوسط مدة الجلسة
  const sessionDurations = sessions.filter(s => s.duration).map(s => s.duration);
  patterns.averageSessionDuration = sessionDurations.length > 0 
    ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length 
    : 0;
  
  return patterns;
}

function findOptimalReadingTime(impressions: any[]) {
  // إيجاد الأوقات التي يكمل فيها المستخدم القراءة أكثر
  const completionByHour: Record<number, { total: number; completed: number }> = {};
  
  impressions.forEach(impression => {
    const hour = new Date(impression.startedAt).getHours();
    if (!completionByHour[hour]) {
      completionByHour[hour] = { total: 0, completed: 0 };
    }
    
    completionByHour[hour].total++;
    if (impression.readingComplete) {
      completionByHour[hour].completed++;
    }
  });
  
  // حساب معدل الإكمال لكل ساعة
  const hourRates = Object.entries(completionByHour)
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      rate: stats.total > 0 ? stats.completed / stats.total : 0,
      total: stats.total
    }))
    .filter(h => h.total >= 2) // فقط الساعات مع قراءتين على الأقل
    .sort((a, b) => b.rate - a.rate);
  
  if (hourRates.length === 0) return null;
  
  const optimalHour = hourRates[0].hour;
  return {
    hour: optimalHour,
    timeRange: `${optimalHour}:00 - ${optimalHour + 1}:00`,
    completionRate: Math.round(hourRates[0].rate * 100)
  };
}

function suggestCategories(categoryInsights: any[], userInterests: any[]) {
  // اقتراح فئات جديدة بناءً على الأنماط
  const currentCategories = new Set(userInterests.map(i => i.interest));
  const suggestions = [];
  
  // إيجاد الفئات ذات معدل الإكمال العالي
  const highCompletionCategories = categoryInsights
    .filter(c => c.completionRate > 0.7 && !currentCategories.has(c.category))
    .slice(0, 3);
  
  suggestions.push(...highCompletionCategories.map(c => ({
    category: c.category,
    reason: 'معدل إكمال قراءة عالي',
    score: c.completionRate
  })));
  
  return suggestions;
}

function generateEngagementTips(analytics: any) {
  const tips = [];
  
  // نصائح بناءً على معدل الإكمال
  if (analytics.overview.completionRate < 0.5) {
    tips.push({
      type: 'completion',
      message: 'حاول قراءة مقالات أقصر أو في أوقات أكثر هدوءاً',
      priority: 'high'
    });
  }
  
  // نصائح بناءً على التفاعل
  if (analytics.interactionBreakdown.like < analytics.overview.totalImpressions * 0.1) {
    tips.push({
      type: 'interaction',
      message: 'لا تنسى الإعجاب بالمقالات التي تستمتع بقراءتها',
      priority: 'medium'
    });
  }
  
  return tips;
}

async function updateBehaviorPatterns(userId: string, analytics: any) {
  try {
    // تحديث نمط وقت القراءة
    await prisma.userBehaviorPattern.upsert({
      where: {
        userId_patternType: {
          userId,
          patternType: 'reading_time'
        }
      },
      update: {
        patternData: analytics.timeAnalysis,
        confidence: 0.8
      },
      create: {
        userId,
        patternType: 'reading_time',
        patternData: analytics.timeAnalysis,
        confidence: 0.8
      }
    });
    
    // تحديث تفضيلات الفئات
    const categoryPreferences = analytics.categoryInsights.reduce((acc: any, cat: any) => {
      acc[cat.category] = cat.completionRate;
      return acc;
    }, {});
    
    await prisma.userBehaviorPattern.upsert({
      where: {
        userId_patternType: {
          userId,
          patternType: 'category_preference'
        }
      },
      update: {
        patternData: categoryPreferences,
        confidence: 0.7
      },
      create: {
        userId,
        patternType: 'category_preference',
        patternData: categoryPreferences,
        confidence: 0.7
      }
    });
  } catch (error) {
    console.error('Error updating behavior patterns:', error);
  }
} 