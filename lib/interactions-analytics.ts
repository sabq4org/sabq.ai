import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * تحليل أنماط التفاعل للمستخدمين
 */
export async function analyzeUserInteractionPatterns(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [comments, likes, shares] = await Promise.all([
    // تحليل التعليقات
    prisma.articleComment.findMany({
      where: {
        user_id: userId,
        created_at: { gte: startDate }
      },
      include: {
        article: {
          select: { category_id: true }
        }
      }
    }),
    // تحليل الإعجابات
    prisma.articleLike.findMany({
      where: {
        user_id: userId,
        created_at: { gte: startDate }
      },
      include: {
        article: {
          select: { category_id: true }
        }
      }
    }),
    // تحليل المشاركات
    prisma.articleShare.findMany({
      where: {
        user_id: userId,
        created_at: { gte: startDate }
      },
      include: {
        article: {
          select: { category_id: true }
        }
      }
    })
  ]);

  // تحليل الأنماط الزمنية
  const timePatterns = analyzeTimePatterns([...comments, ...likes, ...shares]);
  
  // تحليل الاهتمامات حسب الفئات
  const categoryInterests = analyzeCategoryInterests(comments, likes, shares);
  
  // تحليل مستوى التفاعل
  const engagementLevel = calculateEngagementLevel(comments, likes, shares);
  
  // تحليل جودة التفاعل
  const interactionQuality = await analyzeInteractionQuality(userId, comments);

  return {
    timePatterns,
    categoryInterests,
    engagementLevel,
    interactionQuality,
    summary: {
      total_comments: comments.length,
      total_likes: likes.length,
      total_shares: shares.length,
      most_active_hour: timePatterns.mostActiveHour,
      preferred_categories: categoryInterests.slice(0, 3),
      engagement_score: engagementLevel.score
    }
  };
}

/**
 * تحليل الأنماط الزمنية للتفاعل
 */
function analyzeTimePatterns(interactions: any[]) {
  const hourlyActivity = new Array(24).fill(0);
  const dailyActivity = new Array(7).fill(0);
  
  interactions.forEach(interaction => {
    const date = new Date(interaction.created_at);
    const hour = date.getHours();
    const day = date.getDay();
    
    hourlyActivity[hour]++;
    dailyActivity[day]++;
  });

  const mostActiveHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
  const mostActiveDay = dailyActivity.indexOf(Math.max(...dailyActivity));

  return {
    hourlyActivity,
    dailyActivity,
    mostActiveHour,
    mostActiveDay,
    peakHours: hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  };
}

/**
 * تحليل الاهتمامات حسب الفئات
 */
function analyzeCategoryInterests(comments: any[], likes: any[], shares: any[]) {
  const categoryScores: Record<string, number> = {};

  // وزن التعليقات أعلى من الإعجابات والمشاركات
  comments.forEach(comment => {
    const categoryId = comment.article.category_id;
    categoryScores[categoryId] = (categoryScores[categoryId] || 0) + 3;
  });

  likes.forEach(like => {
    const categoryId = like.article.category_id;
    categoryScores[categoryId] = (categoryScores[categoryId] || 0) + 1;
  });

  shares.forEach(share => {
    const categoryId = share.article.category_id;
    categoryScores[categoryId] = (categoryScores[categoryId] || 0) + 2;
  });

  return Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
    .map(([categoryId, score]) => ({ categoryId, score }));
}

/**
 * حساب مستوى التفاعل
 */
function calculateEngagementLevel(comments: any[], likes: any[], shares: any[]) {
  const totalInteractions = comments.length + likes.length + shares.length;
  
  // حساب النشاط اليومي المتوسط
  const days = 30;
  const avgDailyActivity = totalInteractions / days;
  
  // حساب تنوع التفاعل
  const interactionTypes = [
    comments.length > 0 ? 1 : 0,
    likes.length > 0 ? 1 : 0,
    shares.length > 0 ? 1 : 0
  ].reduce((sum, val) => sum + val, 0);
  
  const diversityScore = interactionTypes / 3;
  
  // حساب النقاط الإجمالية
  let score = 0;
  score += Math.min(avgDailyActivity * 10, 50); // نشاط يومي (حد أقصى 50)
  score += diversityScore * 30; // تنوع التفاعل (حد أقصى 30)
  score += Math.min(comments.length * 2, 20); // جودة التفاعل (حد أقصى 20)
  
  return {
    score: Math.round(score),
    level: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
    avgDailyActivity,
    diversityScore,
    breakdown: {
      comments: comments.length,
      likes: likes.length,
      shares: shares.length
    }
  };
}

/**
 * تحليل جودة التفاعل
 */
async function analyzeInteractionQuality(userId: string, comments: any[]) {
  if (comments.length === 0) {
    return { score: 0, factors: [] };
  }

  const factors = [];
  let score = 50; // نقطة البداية

  // تحليل طول التعليقات
  const avgCommentLength = comments.reduce((sum, c) => sum + c.content.length, 0) / comments.length;
  if (avgCommentLength > 50) {
    score += 10;
    factors.push('تعليقات مفصلة');
  }

  // تحليل الإعجابات المستلمة
  const totalLikesReceived = comments.reduce((sum, c) => sum + c.like_count, 0);
  const avgLikesPerComment = totalLikesReceived / comments.length;
  if (avgLikesPerComment > 2) {
    score += 15;
    factors.push('تعليقات محبوبة');
  }

  // تحليل الردود المستلمة
  const totalRepliesReceived = comments.reduce((sum, c) => sum + c.reply_count, 0);
  if (totalRepliesReceived > 0) {
    score += 10;
    factors.push('تعليقات تحفز النقاش');
  }

  // فحص التبليغات
  const reportedComments = await prisma.commentReport.count({
    where: {
      comment: {
        user_id: userId
      }
    }
  });

  if (reportedComments > 0) {
    score -= reportedComments * 5;
    factors.push('تعليقات مبلغ عنها');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    factors,
    metrics: {
      avgCommentLength,
      avgLikesPerComment,
      totalRepliesReceived,
      reportedComments
    }
  };
}

/**
 * تحليل تفاعل المحتوى
 */
export async function analyzeContentInteraction(articleId: string) {
  const [article, comments, likes, shares] = await Promise.all([
    prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: {
          select: { id: true, name: true }
        },
        category: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.articleComment.findMany({
      where: { article_id: articleId },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.articleLike.findMany({
      where: { article_id: articleId }
    }),
    prisma.articleShare.findMany({
      where: { article_id: articleId }
    })
  ]);

  if (!article) {
    throw new Error('Article not found');
  }

  // تحليل الأنماط الزمنية
  const timeAnalysis = analyzeInteractionTimeline([...comments, ...likes, ...shares]);
  
  // تحليل جودة التعليقات
  const commentQuality = analyzeCommentQuality(comments);
  
  // تحليل انتشار المحتوى
  const viralityScore = calculateViralityScore(article, comments, likes, shares);
  
  // تحليل التفاعل حسب المنصة
  const platformAnalysis = analyzePlatformSharing(shares);

  return {
    article: {
      id: article.id,
      title: article.title,
      author: article.author.name,
      category: article.category.name,
      published_at: article.published_at
    },
    metrics: {
      total_comments: comments.length,
      total_likes: likes.length,
      total_shares: shares.length,
      engagement_rate: calculateEngagementRate(article, comments, likes, shares)
    },
    timeAnalysis,
    commentQuality,
    viralityScore,
    platformAnalysis,
    insights: generateContentInsights(article, comments, likes, shares)
  };
}

/**
 * تحليل الخط الزمني للتفاعل
 */
function analyzeInteractionTimeline(interactions: any[]) {
  const timeline: Record<string, { comments: number; likes: number; shares: number }> = {};
  
  interactions.forEach(interaction => {
    const date = new Date(interaction.created_at).toISOString().split('T')[0];
    if (!timeline[date]) {
      timeline[date] = { comments: 0, likes: 0, shares: 0 };
    }
    
    if (interaction.content !== undefined) {
      timeline[date].comments++;
    } else if (interaction.platform !== undefined) {
      timeline[date].shares++;
    } else {
      timeline[date].likes++;
    }
  });

  const sortedDates = Object.keys(timeline).sort();
  const peakDay = sortedDates.reduce((peak, date) => {
    const total = timeline[date].comments + timeline[date].likes + timeline[date].shares;
    const peakTotal = timeline[peak].comments + timeline[peak].likes + timeline[peak].shares;
    return total > peakTotal ? date : peak;
  }, sortedDates[0]);

  return {
    timeline,
    peakDay,
    totalDays: sortedDates.length,
    avgDailyInteractions: interactions.length / sortedDates.length
  };
}

/**
 * تحليل جودة التعليقات
 */
function analyzeCommentQuality(comments: any[]) {
  if (comments.length === 0) {
    return { score: 0, insights: [] };
  }

  const insights = [];
  let score = 0;

  // تحليل طول التعليقات
  const lengths = comments.map(c => c.content.length);
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  
  if (avgLength > 100) {
    score += 20;
    insights.push('تعليقات مفصلة ومفيدة');
  }

  // تحليل التفاعل مع التعليقات
  const totalLikes = comments.reduce((sum, c) => sum + c.like_count, 0);
  const avgLikesPerComment = totalLikes / comments.length;
  
  if (avgLikesPerComment > 1) {
    score += 15;
    insights.push('تعليقات تحصل على إعجابات');
  }

  // تحليل النقاشات
  const repliesCount = comments.reduce((sum, c) => sum + c.reply_count, 0);
  if (repliesCount > 0) {
    score += 10;
    insights.push('تعليقات تحفز النقاش');
  }

  return {
    score: Math.min(100, score),
    insights,
    metrics: {
      avgLength,
      avgLikesPerComment,
      repliesCount,
      totalComments: comments.length
    }
  };
}

/**
 * حساب نقاط الانتشار
 */
function calculateViralityScore(article: any, comments: any[], likes: any[], shares: any[]) {
  const ageInHours = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60);
  const totalInteractions = comments.length + likes.length + shares.length;
  
  // معدل التفاعل بالساعة
  const interactionRate = totalInteractions / Math.max(ageInHours, 1);
  
  // وزن المشاركات أعلى
  const weightedScore = (comments.length * 1) + (likes.length * 0.5) + (shares.length * 2);
  
  // نقاط الانتشار
  let viralityScore = 0;
  
  if (interactionRate > 10) viralityScore += 30;
  else if (interactionRate > 5) viralityScore += 20;
  else if (interactionRate > 1) viralityScore += 10;
  
  if (shares.length > 50) viralityScore += 40;
  else if (shares.length > 20) viralityScore += 25;
  else if (shares.length > 5) viralityScore += 10;
  
  return {
    score: Math.min(100, viralityScore),
    level: viralityScore >= 60 ? 'viral' : viralityScore >= 30 ? 'trending' : 'normal',
    metrics: {
      interactionRate,
      weightedScore,
      ageInHours: Math.round(ageInHours)
    }
  };
}

/**
 * تحليل المشاركة حسب المنصة
 */
function analyzePlatformSharing(shares: any[]) {
  const platformCounts: Record<string, number> = {};
  
  shares.forEach(share => {
    platformCounts[share.platform] = (platformCounts[share.platform] || 0) + 1;
  });

  const sortedPlatforms = Object.entries(platformCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([platform, count]) => ({ platform, count, percentage: (count / shares.length) * 100 }));

  return {
    platforms: sortedPlatforms,
    topPlatform: sortedPlatforms[0]?.platform || null,
    totalShares: shares.length
  };
}

/**
 * حساب معدل التفاعل
 */
function calculateEngagementRate(article: any, comments: any[], likes: any[], shares: any[]) {
  const totalInteractions = comments.length + likes.length + shares.length;
  const views = article.view_count || 1;
  
  return (totalInteractions / views) * 100;
}

/**
 * توليد رؤى المحتوى
 */
function generateContentInsights(article: any, comments: any[], likes: any[], shares: any[]) {
  const insights = [];
  
  // تحليل نسبة التفاعل
  const engagementRate = calculateEngagementRate(article, comments, likes, shares);
  if (engagementRate > 10) {
    insights.push('معدل تفاعل عالي جداً');
  } else if (engagementRate > 5) {
    insights.push('معدل تفاعل جيد');
  } else if (engagementRate < 1) {
    insights.push('معدل تفاعل منخفض');
  }

  // تحليل نوع التفاعل
  const totalInteractions = comments.length + likes.length + shares.length;
  if (totalInteractions > 0) {
    const commentRatio = (comments.length / totalInteractions) * 100;
    const shareRatio = (shares.length / totalInteractions) * 100;
    
    if (commentRatio > 40) {
      insights.push('محتوى يحفز النقاش');
    }
    if (shareRatio > 20) {
      insights.push('محتوى قابل للمشاركة');
    }
  }

  // تحليل الوقت
  const ageInDays = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays < 1 && totalInteractions > 20) {
    insights.push('تفاعل سريع');
  }

  return insights;
}

/**
 * تحليل اتجاهات التفاعل
 */
export async function analyzeInteractionTrends(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [dailyComments, dailyLikes, dailyShares] = await Promise.all([
    prisma.articleComment.groupBy({
      by: ['created_at'],
      where: { created_at: { gte: startDate } },
      _count: { id: true }
    }),
    prisma.articleLike.groupBy({
      by: ['created_at'],
      where: { created_at: { gte: startDate } },
      _count: { id: true }
    }),
    prisma.articleShare.groupBy({
      by: ['created_at'],
      where: { created_at: { gte: startDate } },
      _count: { id: true }
    })
  ]);

  // تجميع البيانات اليومية
  const dailyData: Record<string, { comments: number; likes: number; shares: number }> = {};
  
  // معالجة البيانات وتجميعها
  [dailyComments, dailyLikes, dailyShares].forEach((data, index) => {
    const type = ['comments', 'likes', 'shares'][index];
    data.forEach((item: any) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { comments: 0, likes: 0, shares: 0 };
      }
      dailyData[date][type as keyof typeof dailyData[string]] += item._count.id;
    });
  });

  // تحليل الاتجاهات
  const dates = Object.keys(dailyData).sort();
  const trends = {
    comments: calculateTrend(dates.map(date => dailyData[date].comments)),
    likes: calculateTrend(dates.map(date => dailyData[date].likes)),
    shares: calculateTrend(dates.map(date => dailyData[date].shares))
  };

  return {
    dailyData,
    trends,
    summary: {
      totalDays: dates.length,
      avgDailyComments: dates.reduce((sum, date) => sum + dailyData[date].comments, 0) / dates.length,
      avgDailyLikes: dates.reduce((sum, date) => sum + dailyData[date].likes, 0) / dates.length,
      avgDailyShares: dates.reduce((sum, date) => sum + dailyData[date].shares, 0) / dates.length
    }
  };
}

/**
 * حساب الاتجاه (صاعد/هابط/مستقر)
 */
function calculateTrend(values: number[]) {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
} 