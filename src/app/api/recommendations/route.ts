/**
 * API Routes for Content Recommendations
 * 
 * @description Provides intelligent content recommendations based on user behavior and content analysis
 * @author Sabq AI CMS Team
 * @version 1.0.0
 * @created 2024-01-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '../../../../lib/recommendation-engine';
import { collaborativeFilteringEngine } from '../../../../lib/recommendation/collaborative-filtering';
import { graphBasedRecommendationEngine } from '../../../../lib/recommendation/graph-based';

/**
 * GET /api/recommendations
 * جلب التوصيات للمستخدم
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // استخراج المعاملات
    const userId = searchParams.get('userId') || undefined;
    const sessionId = searchParams.get('sessionId') || undefined;
    const algorithmType = searchParams.get('type') as any || 'mixed';
    const limit = parseInt(searchParams.get('limit') || '10');
    const categoryFilter = searchParams.get('category') || undefined;
    const excludeIds = searchParams.get('exclude')?.split(',') || [];
    
    // التحقق من صحة المعاملات
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    const validAlgorithms = ['personal', 'collaborative', 'graph', 'ai', 'trending', 'mixed'];
    if (!validAlgorithms.includes(algorithmType)) {
      return NextResponse.json(
        { error: 'Invalid algorithm type' },
        { status: 400 }
      );
    }

    // إنشاء طلب التوصية
    const recommendationRequest = {
      userId,
      sessionId,
      algorithmType,
      limit,
      excludeArticleIds: excludeIds,
      categoryFilter,
      contextData: {
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer')
      }
    };

    // جلب التوصيات
    let recommendations;
    
    switch (algorithmType) {
      case 'collaborative':
        recommendations = await collaborativeFilteringEngine.getHybridRecommendations(recommendationRequest);
        break;
      case 'graph':
        recommendations = await graphBasedRecommendationEngine.getGraphBasedRecommendations(recommendationRequest);
        break;
      default:
        recommendations = await recommendationEngine.getRecommendations(recommendationRequest);
        break;
    }

    // إضافة معلومات إضافية
    const response = {
      success: true,
      data: {
        recommendations,
        metadata: {
          algorithm: algorithmType,
          count: recommendations.length,
          userId: userId || null,
          sessionId: sessionId || null,
          timestamp: new Date().toISOString(),
          filters: {
            category: categoryFilter || null,
            excluded: excludeIds.length
          }
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recommendations
 * إنشاء توصيات مخصصة مع معايير متقدمة
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      sessionId,
      algorithms = ['mixed'],
      limit = 10,
      filters = {},
      contextData = {},
      diversityFactor = 0.3,
      freshnessFactor = 0.2
    } = body;

    // التحقق من صحة البيانات
    if (!Array.isArray(algorithms) || algorithms.length === 0) {
      return NextResponse.json(
        { error: 'Algorithms must be a non-empty array' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // تنفيذ التوصيات المتعددة
    const allRecommendations = [];
    const resultsPerAlgorithm = Math.ceil(limit / algorithms.length);

    for (const algorithm of algorithms) {
      try {
        const recommendationRequest = {
          userId,
          sessionId,
          algorithmType: algorithm,
          limit: resultsPerAlgorithm,
          excludeArticleIds: filters.excludeIds || [],
          categoryFilter: filters.category,
          contextData: {
            ...contextData,
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent')
          }
        };

        let recommendations;
        
        switch (algorithm) {
          case 'collaborative':
            recommendations = await collaborativeFilteringEngine.getHybridRecommendations(recommendationRequest);
            break;
          case 'graph':
            recommendations = await graphBasedRecommendationEngine.getGraphBasedRecommendations(recommendationRequest);
            break;
          default:
            recommendations = await recommendationEngine.getRecommendations(recommendationRequest);
            break;
        }

        allRecommendations.push(...recommendations);
      } catch (algorithmError) {
        console.error(`Error with algorithm ${algorithm}:`, algorithmError);
        // استمرار مع الخوارزميات الأخرى
      }
    }

    // تطبيق التنويع والحداثة
    const diversifiedRecommendations = applyDiversityAndFreshness(
      allRecommendations,
      diversityFactor,
      freshnessFactor
    );

    // إزالة المكررات وترتيب النتائج
    const uniqueRecommendations = removeDuplicates(diversifiedRecommendations);
    const finalRecommendations = uniqueRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const response = {
      success: true,
      data: {
        recommendations: finalRecommendations,
        metadata: {
          algorithmsUsed: algorithms,
          totalCandidates: allRecommendations.length,
          finalCount: finalRecommendations.length,
          diversityFactor,
          freshnessFactor,
          userId: userId || null,
          sessionId: sessionId || null,
          timestamp: new Date().toISOString(),
          filters
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating custom recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * تطبيق التنويع والحداثة
 */
function applyDiversityAndFreshness(
  recommendations: any[],
  diversityFactor: number,
  freshnessFactor: number
): any[] {
  return recommendations.map(rec => {
    let adjustedScore = rec.score;

    // تطبيق عامل التنويع
    if (diversityFactor > 0) {
      const categoryDiversity = calculateCategoryDiversity(rec, recommendations);
      adjustedScore += categoryDiversity * diversityFactor;
    }

    // تطبيق عامل الحداثة
    if (freshnessFactor > 0 && rec.article.published_at) {
      const freshnessScore = calculateFreshnessScore(rec.article.published_at);
      adjustedScore += freshnessScore * freshnessFactor;
    }

    return {
      ...rec,
      score: adjustedScore,
      originalScore: rec.score
    };
  });
}

/**
 * حساب تنوع الفئات
 */
function calculateCategoryDiversity(recommendation: any, allRecommendations: any[]): number {
  const categoryCount = allRecommendations.filter(
    rec => rec.article.category_id === recommendation.article.category_id
  ).length;
  
  const totalCount = allRecommendations.length;
  const categoryRatio = categoryCount / totalCount;
  
  // كلما قل التكرار، زاد التنوع
  return 1 - categoryRatio;
}

/**
 * حساب نقاط الحداثة
 */
function calculateFreshnessScore(publishedAt: string): number {
  const publishedDate = new Date(publishedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // النقاط تقل مع الوقت
  return Math.max(0, 1 - daysDiff / 30);
}

/**
 * إزالة المكررات
 */
function removeDuplicates(recommendations: any[]): any[] {
  const seen = new Set<string>();
  return recommendations.filter(rec => {
    if (seen.has(rec.article.id)) {
      return false;
    }
    seen.add(rec.article.id);
    return true;
  });
} 