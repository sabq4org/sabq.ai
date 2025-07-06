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
    
    // جلب اهتمامات المستخدم من UserPreference
    const userPreference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key: 'interests'
        }
      }
    });
    
    const userInterests = userPreference ? (userPreference.value as any[]) || [] : [];
    
    // جلب سجل التفاعلات
    const userInteractions = await prisma.interaction.findMany({
      where: { userId },
      select: { articleId: true, type: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    const readArticleIds = userInteractions
      .filter((i: any) => i.type === 'view')
      .map((i: any) => i.articleId);
    
    // تحليل الأنماط من التفاعلات
    const patterns = analyzeBehaviorPatterns(userInteractions);
    
    // بناء استعلام التوصيات
    let recommendedArticles = [];
    
    // 1. مقالات من الفئات المفضلة
    if (userInterests.length > 0) {
      const interestNames = userInterests.map(i => i.name || i);
      const categoryArticles = await prisma.articles.findMany({
        where: {
          status: 'published',
          id: { notIn: readArticleIds },
          category: {
            slug: { in: interestNames }
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
              }
          }
        }
      });
      
      recommendedArticles.push(
        ...categoryArticles.map((article: any) => ({
          article,
          reason: `بناءً على اهتمامك بـ ${article.category?.name || 'هذه الفئة'}`,
          score: calculateRecommendationScore(article, userInterests, patterns)
        }))
      );
    }
    
    // 2. مقالات مشابهة لما تفاعل معه المستخدم مؤخراً
    if (readArticleIds.length > 0) {
      const recentArticle = await prisma.articles.findFirst({
        where: { id: readArticleIds[0] },
        select: { categoryId: true, seoKeywords: true }
      });
      
      if (recentArticle?.categoryId) {
        const similarArticles = await prisma.articles.findMany({
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
                }
            }
          }
        });
        
        recommendedArticles.push(
          ...similarArticles.map((article: any) => ({
            article,
            reason: 'مشابه لما قرأته مؤخراً',
            score: calculateRecommendationScore(article, userInterests, patterns) * 0.8
          }))
        );
      }
    }
    
    // 3. مقالات رائجة
    const trendingArticles = await prisma.articles.findMany({
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
            }
        }
      }
    });
    
    recommendedArticles.push(
      ...trendingArticles.map((article: any) => ({
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
    const { userId, articleId } = body;
    
    if (!userId || !articleId) {
      return NextResponse.json(
        { error: 'User ID and Article ID are required' },
        { status: 400 }
      );
    }
    
    // تسجيل التفاعل
    await prisma.interaction.create({
      data: {
        userId,
        articleId,
        type: 'view'
      }
    }).catch(() => {
      // تجاهل إذا كان التفاعل موجود
    });
    
    return NextResponse.json({
      success: true,
      message: 'Interaction recorded successfully'
    });
    
  } catch (error) {
    console.error('Error recording interaction:', error);
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    );
  }
}

// تحليل أنماط السلوك من التفاعلات
function analyzeBehaviorPatterns(interactions: any[]) {
  const patterns = {
    preferredCategories: {} as Record<string, number>,
    interactionTypes: {} as Record<string, number>,
    readingTime: 'evening', // افتراضي
    engagementLevel: 'medium' // افتراضي
  };
  
  // تحليل الفئات المفضلة
  interactions.forEach(interaction => {
    if (interaction.article?.category?.slug) {
      const category = interaction.null.slug;
      patterns.preferredCategories[category] = (patterns.preferredCategories[category] || 0) + 1;
    }
    
    if (interaction.type) {
      patterns.interactionTypes[interaction.type] = (patterns.interactionTypes[interaction.type] || 0) + 1;
    }
  });
  
  // تحديد مستوى المشاركة
  const totalInteractions = interactions.length;
  if (totalInteractions > 50) {
    patterns.engagementLevel = 'high';
  } else if (totalInteractions > 10) {
    patterns.engagementLevel = 'medium';
  } else {
    patterns.engagementLevel = 'low';
  }
  
  return patterns;
}

// حساب درجة التوصية
function calculateRecommendationScore(
  article: any,
  userInterests: any[],
  patterns: any
) {
  let score = 1.0;
  
  // تطابق مع الاهتمامات
  const articleCategory = article.category?.slug;
  if (articleCategory && userInterests.length > 0) {
    const interestMatch = userInterests.find(i => i.name === articleCategory || i === articleCategory);
    if (interestMatch) {
      score += (interestMatch.score || 1.0) * 2;
    }
  }
  
  // تطابق مع الفئات المفضلة
  if (articleCategory && patterns.preferredCategories[articleCategory]) {
    score += patterns.preferredCategories[articleCategory] * 0.5;
  }
  
  // شعبية المقال
  if (article.views) {
    score += Math.min(article.views / 1000, 2); // حد أقصى 2 نقطة للشعبية
  }
  
  // حداثة المقال
  const daysSincePublished = (Date.now() - new Date(article.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublished < 7) {
    score += 1; // مقالات حديثة
  } else if (daysSincePublished < 30) {
    score += 0.5; // مقالات حديثة نسبياً
  }
  
  return score;
}

// إزالة التوصيات المكررة
function removeDuplicates(recommendations: any[]) {
  const seen = new Set();
  return recommendations.filter(rec => {
    const key = rec.article.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
} 