import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// جلب التوصيات للمستخدم
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeReasons = searchParams.get('includeReasons') === 'true';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // جلب اهتمامات المستخدم
    const userInterests = await prisma.userInterest.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
      take: 5
    });
    
    // جلب سجل القراءة
    const readingHistory = await prisma.readingHistory.findMany({
      where: { userId },
      select: { articleId: true },
      orderBy: { lastReadAt: 'desc' },
      take: 100
    });
    
    const readArticleIds = readingHistory.map(h => h.articleId);
    
    // جلب أنماط السلوك
    const behaviorPatterns = await prisma.userBehaviorPattern.findMany({
      where: { userId }
    });
    
    // تحليل الأنماط
    const patterns = analyzeBehaviorPatterns(behaviorPatterns);
    
    // بناء استعلام التوصيات
    let recommendedArticles = [];
    
    // 1. مقالات من الفئات المفضلة
    if (userInterests.length > 0) {
      const categoryArticles = await prisma.article.findMany({
        where: {
          status: 'published',
          id: { notIn: readArticleIds },
          categoryId: {
            in: await getCategoryIdsFromInterests(userInterests.map(i => i.interest))
          }
        },
        orderBy: [
          { views: 'desc' },
          { createdAt: 'desc' }
        ],
        take: Math.ceil(limit * 0.6),
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        }
      });
      
      recommendedArticles.push(
        ...categoryArticles.map(article => ({
          article,
          reason: `بناءً على اهتمامك بـ ${article.category?.name}`,
          score: calculateRecommendationScore(article, userInterests, patterns)
        }))
      );
    }
    
    // 2. مقالات مشابهة لما قرأه المستخدم مؤخراً
    if (readArticleIds.length > 0) {
      const recentArticle = await prisma.article.findFirst({
        where: { id: readArticleIds[0] },
        select: { categoryId: true, seoKeywords: true }
      });
      
      if (recentArticle?.categoryId) {
        const similarArticles = await prisma.article.findMany({
          where: {
            status: 'published',
            id: { notIn: readArticleIds },
            categoryId: recentArticle.categoryId
          },
          orderBy: { createdAt: 'desc' },
          take: Math.ceil(limit * 0.3),
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        });
        
        recommendedArticles.push(
          ...similarArticles.map(article => ({
            article,
            reason: 'مشابه لما قرأته مؤخراً',
            score: calculateRecommendationScore(article, userInterests, patterns) * 0.8
          }))
        );
      }
    }
    
    // 3. مقالات رائجة
    const trendingArticles = await prisma.article.findMany({
      where: {
        status: 'published',
        id: { notIn: readArticleIds },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // آخر 7 أيام
        }
      },
      orderBy: { views: 'desc' },
      take: Math.ceil(limit * 0.1),
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true
          }
        }
      }
    });
    
    recommendedArticles.push(
      ...trendingArticles.map(article => ({
        article,
        reason: 'محتوى رائج',
        score: calculateRecommendationScore(article, userInterests, patterns) * 0.6
      }))
    );
    
    // ترتيب وإزالة المكرر
    const uniqueArticles = removeDuplicates(recommendedArticles);
    const sortedRecommendations = uniqueArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    // حفظ التوصيات في قاعدة البيانات
    for (const rec of sortedRecommendations) {
      await prisma.recommendation.create({
        data: {
          userId,
          articleId: rec.article.id,
          reason: rec.reason,
          score: rec.score,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // تنتهي بعد 24 ساعة
        }
      }).catch(() => {
        // تجاهل إذا كانت التوصية موجودة
      });
    }
    
    return NextResponse.json({
      success: true,
      recommendations: includeReasons 
        ? sortedRecommendations
        : sortedRecommendations.map(r => r.article),
      patterns: includeReasons ? patterns : undefined
    });
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

// تسجيل نقرة على توصية
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendationId, userId, articleId } = body;
    
    if (recommendationId) {
      // تحديث توصية موجودة
      await prisma.recommendation.update({
        where: { id: recommendationId },
        data: {
          isClicked: true,
          clickedAt: new Date()
        }
      });
    } else if (userId && articleId) {
      // البحث عن توصية حديثة وتحديثها
      const recentRecommendation = await prisma.recommendation.findFirst({
        where: {
          userId,
          articleId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (recentRecommendation) {
        await prisma.recommendation.update({
          where: { id: recentRecommendation.id },
          data: {
            isClicked: true,
            clickedAt: new Date()
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Recommendation click recorded'
    });
    
  } catch (error) {
    console.error('Error recording recommendation click:', error);
    return NextResponse.json(
      { error: 'Failed to record click' },
      { status: 500 }
    );
  }
}

// دوال مساعدة

function analyzeBehaviorPatterns(patterns: any[]) {
  const analysis: any = {
    preferredReadingTime: null,
    averageReadingDuration: null,
    categoryPreferences: {},
    interactionStyle: null
  };
  
  patterns.forEach(pattern => {
    if (pattern.patternType === 'reading_time') {
      analysis.preferredReadingTime = pattern.patternData;
    } else if (pattern.patternType === 'category_preference') {
      analysis.categoryPreferences = pattern.patternData;
    } else if (pattern.patternType === 'interaction_style') {
      analysis.interactionStyle = pattern.patternData;
    }
  });
  
  return analysis;
}

function calculateRecommendationScore(
  article: any,
  userInterests: any[],
  patterns: any
) {
  let score = 50; // نقطة البداية
  
  // زيادة النقاط بناءً على الاهتمامات
  const articleCategory = article.category?.slug;
  const interestMatch = userInterests.find(i => i.interest === articleCategory);
  if (interestMatch) {
    score += interestMatch.score * 20;
  }
  
  // زيادة النقاط بناءً على شعبية المقال
  if (article.views > 1000) score += 10;
  if (article.views > 5000) score += 10;
  
  // زيادة النقاط للمقالات الحديثة
  const ageInDays = (Date.now() - new Date(article.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays < 1) score += 20;
  else if (ageInDays < 7) score += 10;
  
  // تطبيق تفضيلات الفئة من الأنماط
  if (patterns.categoryPreferences && patterns.categoryPreferences[articleCategory]) {
    score *= patterns.categoryPreferences[articleCategory];
  }
  
  return Math.min(100, Math.max(0, score));
}

async function getCategoryIdsFromInterests(interests: string[]) {
  const categories = await prisma.category.findMany({
    where: {
      slug: { in: interests }
    },
    select: { id: true }
  });
  
  return categories.map(c => c.id);
}

function removeDuplicates(recommendations: any[]) {
  const seen = new Set();
  return recommendations.filter(rec => {
    if (seen.has(rec.article.id)) {
      return false;
    }
    seen.add(rec.article.id);
    return true;
  });
} 