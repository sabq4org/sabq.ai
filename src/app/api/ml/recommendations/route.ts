/**
 * API التوصيات الذكية - Sabq AI CMS
 * يوفر توصيات مخصصة للمستخدمين باستخدام الذكاء الاصطناعي
 * 
 * @author Sabq AI Team
 * @date 2024-01-20
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit-log';
import { mlRecommendationService } from '@/lib/ml-recommendation-service';
import { contentSimilarityAnalyzer } from '@/lib/content-similarity-analyzer';
import { userBehaviorAnalyzer } from '@/lib/user-behavior-analyzer';
import { arabicTextProcessor } from '@/lib/arabic-text-processor';
import { recommendationCache } from '@/lib/recommendation-cache';
import { personalizedRecommendations } from '@/lib/personalized-recommendations';

// Schema للتحقق من صحة البيانات
const recommendationQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.enum([
    'articles',
    'sections',
    'tags',
    'authors',
    'related_content',
    'trending',
    'personalized',
    'similar_users',
    'content_based',
    'collaborative',
    'hybrid',
  ]).optional().default('articles'),
  context: z.object({
    currentArticleId: z.string().uuid().optional(),
    currentSectionId: z.string().uuid().optional(),
    userInterests: z.array(z.string()).optional(),
    readingHistory: z.array(z.string()).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
    device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    location: z.string().optional(),
  }).optional(),
  filters: z.object({
    sections: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    authors: z.array(z.string()).optional(),
    publishedAfter: z.string().datetime().optional(),
    publishedBefore: z.string().datetime().optional(),
    minReadingTime: z.number().optional(),
    maxReadingTime: z.number().optional(),
    language: z.enum(['ar', 'en', 'both']).optional().default('both'),
    excludeRead: z.boolean().optional().default(false),
    onlyFeatured: z.boolean().optional().default(false),
  }).optional(),
  algorithm: z.enum([
    'content_similarity',
    'collaborative_filtering',
    'matrix_factorization',
    'deep_learning',
    'hybrid_ensemble',
    'trending_analysis',
    'semantic_search',
    'user_clustering',
  ]).optional().default('hybrid_ensemble'),
  diversityFactor: z.number().min(0).max(1).optional().default(0.3),
  freshnessFactor: z.number().min(0).max(1).optional().default(0.2),
  personalityFactor: z.number().min(0).max(1).optional().default(0.5),
  explainability: z.boolean().optional().default(false),
  limit: z.number().min(1).max(100).optional().default(10),
  offset: z.number().min(0).optional().default(0),
});

const feedbackSchema = z.object({
  recommendationId: z.string().uuid(),
  userId: z.string().uuid(),
  itemId: z.string().uuid(),
  action: z.enum(['click', 'like', 'share', 'save', 'ignore', 'dislike', 'report']),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().max(500).optional(),
  context: z.record(z.any()).optional(),
});

// Types للاستجابة
interface RecommendationResponse {
  success: boolean;
  message: string;
  data?: {
    recommendations: Array<{
      id: string;
      type: string;
      item: {
        id: string;
        title: string;
        slug: string;
        excerpt: string;
        featuredImage: string | null;
        publishedAt: string;
        readingTime: number;
        viewCount: number;
        likeCount: number;
        author: {
          id: string;
          fullName: string;
          username: string;
          avatar: string | null;
        };
        section: {
          id: string;
          name: string;
          slug: string;
        };
        tags: Array<{
          id: string;
          name: string;
          slug: string;
        }>;
      };
      score: number;
      confidence: number;
      reasoning: string[];
      algorithm: string;
      freshness: number;
      diversity: number;
      personalization: number;
      metadata: Record<string, any>;
    }>;
    pagination: {
      offset: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    metadata: {
      userId?: string;
      type: string;
      algorithm: string;
      context: Record<string, any>;
      filters: Record<string, any>;
      generatedAt: string;
      processingTime: number;
      cacheHit: boolean;
    };
    userProfile?: {
      interests: string[];
      readingPatterns: Record<string, any>;
      preferences: Record<string, any>;
      behavior: Record<string, any>;
    };
    explanations?: {
      why: string[];
      how: string[];
      alternatives: string[];
    };
    analytics: {
      totalRecommendations: number;
      averageScore: number;
      averageConfidence: number;
      algorithmBreakdown: Record<string, number>;
      diversityScore: number;
      freshnessScore: number;
    };
  };
  errors?: Record<string, string>;
}

/**
 * GET /api/ml/recommendations
 * جلب التوصيات الذكية
 */
export async function GET(request: NextRequest): Promise<NextResponse<RecommendationResponse>> {
  const startTime = Date.now();
  
  try {
    const clientIp = request.ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // التحقق من حد الطلبات
    const rateLimitResult = await rateLimit({
      key: `ml_recommendations:${clientIp}`,
      limit: 50,
      window: 60 * 1000, // دقيقة واحدة
    });

    if (!rateLimitResult.success) {
      return NextResponse.json<RecommendationResponse>({
        success: false,
        message: 'تم تجاوز حد طلبات التوصيات المسموح',
        errors: { rate_limit: 'too_many_requests' },
      }, { status: 429 });
    }

    // قراءة معاملات الاستعلام
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    // تحويل المعاملات المركبة
    if (queryParams.context) {
      queryParams.context = JSON.parse(queryParams.context);
    }
    if (queryParams.filters) {
      queryParams.filters = JSON.parse(queryParams.filters);
    }
    if (queryParams.diversityFactor) {
      queryParams.diversityFactor = parseFloat(queryParams.diversityFactor);
    }
    if (queryParams.freshnessFactor) {
      queryParams.freshnessFactor = parseFloat(queryParams.freshnessFactor);
    }
    if (queryParams.personalityFactor) {
      queryParams.personalityFactor = parseFloat(queryParams.personalityFactor);
    }
    if (queryParams.explainability) {
      queryParams.explainability = queryParams.explainability === 'true';
    }
    if (queryParams.limit) {
      queryParams.limit = parseInt(queryParams.limit);
    }
    if (queryParams.offset) {
      queryParams.offset = parseInt(queryParams.offset);
    }

    const validationResult = recommendationQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json<RecommendationResponse>({
        success: false,
        message: 'معاملات طلب التوصيات غير صحيحة',
        errors: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const query = validationResult.data;

    // التحقق من المصادقة (اختياري)
    const user = await getAuthenticatedUser(request);
    const effectiveUserId = user?.id || query.userId;

    // إنشاء مفتاح الكاش
    const cacheKey = `recommendations:${effectiveUserId || 'anonymous'}:${JSON.stringify(query)}`;
    
    // التحقق من الكاش
    const cachedRecommendations = await recommendationCache.get(cacheKey);
    if (cachedRecommendations) {
      return NextResponse.json<RecommendationResponse>({
        success: true,
        message: 'تم جلب التوصيات بنجاح',
        data: {
          ...cachedRecommendations,
          metadata: {
            ...cachedRecommendations.metadata,
            cacheHit: true,
            processingTime: Date.now() - startTime,
          },
        },
      });
    }

    // تحليل سلوك المستخدم
    let userProfile = null;
    if (effectiveUserId) {
      userProfile = await userBehaviorAnalyzer.analyzeUser(effectiveUserId);
    }

    // إنشاء السياق المحسن
    const enhancedContext = {
      ...query.context,
      userProfile,
      clientIp,
      userAgent,
      timestamp: new Date().toISOString(),
      timeOfDay: getCurrentTimeOfDay(),
      device: detectDevice(userAgent),
    };

    // تنفيذ خوارزمية التوصيات
    const recommendations = await generateRecommendations(
      query,
      enhancedContext,
      effectiveUserId
    );

    // تطبيق الفلاتر
    const filteredRecommendations = await applyFilters(
      recommendations,
      query.filters || {}
    );

    // تطبيق التنويع والحداثة
    const diversifiedRecommendations = await applyDiversityAndFreshness(
      filteredRecommendations,
      query.diversityFactor,
      query.freshnessFactor
    );

    // تطبيق التخصيص
    const personalizedRecommendations = await applyPersonalization(
      diversifiedRecommendations,
      userProfile,
      query.personalityFactor
    );

    // ترتيب وتحديد النتائج
    const finalRecommendations = personalizedRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(query.offset, query.offset + query.limit);

    // إنشاء التفسيرات
    const explanations = query.explainability
      ? await generateExplanations(finalRecommendations, query, userProfile)
      : undefined;

    // حساب الإحصائيات
    const analytics = calculateAnalytics(personalizedRecommendations);

    // تحضير البيانات للاستجابة
    const responseData = {
      recommendations: finalRecommendations,
      pagination: {
        offset: query.offset,
        limit: query.limit,
        total: personalizedRecommendations.length,
        hasNext: query.offset + query.limit < personalizedRecommendations.length,
        hasPrevious: query.offset > 0,
      },
      metadata: {
        userId: effectiveUserId,
        type: query.type,
        algorithm: query.algorithm,
        context: enhancedContext,
        filters: query.filters || {},
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        cacheHit: false,
      },
      userProfile,
      explanations,
      analytics,
    };

    // حفظ في الكاش
    await recommendationCache.set(cacheKey, responseData, 10 * 60); // 10 دقائق

    // إنشاء سجل تدقيق
    await createAuditLog({
      action: 'ML_RECOMMENDATIONS_GENERATED',
      userId: effectiveUserId,
      ipAddress: clientIp,
      userAgent,
      details: {
        type: query.type,
        algorithm: query.algorithm,
        resultsCount: finalRecommendations.length,
        processingTime: Date.now() - startTime,
        cacheHit: false,
      },
    });

    return NextResponse.json<RecommendationResponse>({
      success: true,
      message: 'تم إنشاء التوصيات بنجاح',
      data: responseData,
    });

  } catch (error) {
    console.error('خطأ في إنشاء التوصيات:', error);

    return NextResponse.json<RecommendationResponse>({
      success: false,
      message: 'حدث خطأ أثناء إنشاء التوصيات',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

/**
 * POST /api/ml/recommendations
 * إرسال ملاحظات على التوصيات
 */
export async function POST(request: NextRequest): Promise<NextResponse<RecommendationResponse>> {
  try {
    const clientIp = request.ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // التحقق من حد الطلبات
    const rateLimitResult = await rateLimit({
      key: `ml_feedback:${clientIp}`,
      limit: 100,
      window: 60 * 1000, // دقيقة واحدة
    });

    if (!rateLimitResult.success) {
      return NextResponse.json<RecommendationResponse>({
        success: false,
        message: 'تم تجاوز حد إرسال الملاحظات المسموح',
        errors: { rate_limit: 'too_many_requests' },
      }, { status: 429 });
    }

    // قراءة وتحليل البيانات
    const body = await request.json();
    const validationResult = feedbackSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<RecommendationResponse>({
        success: false,
        message: 'بيانات الملاحظات غير صحيحة',
        errors: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const feedback = validationResult.data;

    // حفظ الملاحظات
    await prisma.recommendationFeedback.create({
      data: {
        recommendationId: feedback.recommendationId,
        userId: feedback.userId,
        itemId: feedback.itemId,
        action: feedback.action,
        rating: feedback.rating,
        feedback: feedback.feedback,
        context: feedback.context || {},
        ipAddress: clientIp,
        userAgent,
        timestamp: new Date(),
      },
    });

    // تحديث نموذج التوصيات
    await mlRecommendationService.updateModel(feedback);

    // إنشاء سجل تدقيق
    await createAuditLog({
      action: 'ML_RECOMMENDATION_FEEDBACK',
      userId: feedback.userId,
      ipAddress: clientIp,
      userAgent,
      details: {
        recommendationId: feedback.recommendationId,
        itemId: feedback.itemId,
        action: feedback.action,
        rating: feedback.rating,
      },
    });

    return NextResponse.json<RecommendationResponse>({
      success: true,
      message: 'تم إرسال الملاحظات بنجاح',
    });

  } catch (error) {
    console.error('خطأ في إرسال الملاحظات:', error);

    return NextResponse.json<RecommendationResponse>({
      success: false,
      message: 'حدث خطأ أثناء إرسال الملاحظات',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

// Helper Functions

/**
 * إنشاء التوصيات باستخدام خوارزميات مختلفة
 */
async function generateRecommendations(
  query: any,
  context: any,
  userId?: string
): Promise<any[]> {
  switch (query.algorithm) {
    case 'content_similarity':
      return await contentSimilarityAnalyzer.generateRecommendations(query, context);
    
    case 'collaborative_filtering':
      return await mlRecommendationService.collaborativeFiltering(query, context);
    
    case 'matrix_factorization':
      return await mlRecommendationService.matrixFactorization(query, context);
    
    case 'deep_learning':
      return await mlRecommendationService.deepLearning(query, context);
    
    case 'hybrid_ensemble':
      return await mlRecommendationService.hybridEnsemble(query, context);
    
    case 'trending_analysis':
      return await mlRecommendationService.trendingAnalysis(query, context);
    
    case 'semantic_search':
      return await mlRecommendationService.semanticSearch(query, context);
    
    case 'user_clustering':
      return await mlRecommendationService.userClustering(query, context);
    
    default:
      return await mlRecommendationService.hybridEnsemble(query, context);
  }
}

/**
 * تطبيق الفلاتر
 */
async function applyFilters(
  recommendations: any[],
  filters: any
): Promise<any[]> {
  let filtered = recommendations;

  // فلتر الأقسام
  if (filters.sections && filters.sections.length > 0) {
    filtered = filtered.filter(rec => 
      filters.sections.includes(rec.item.section.id)
    );
  }

  // فلتر الكلمات المفتاحية
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(rec => 
      rec.item.tags.some(tag => filters.tags.includes(tag.id))
    );
  }

  // فلتر المؤلفين
  if (filters.authors && filters.authors.length > 0) {
    filtered = filtered.filter(rec => 
      filters.authors.includes(rec.item.author.id)
    );
  }

  // فلتر التاريخ
  if (filters.publishedAfter) {
    const afterDate = new Date(filters.publishedAfter);
    filtered = filtered.filter(rec => 
      new Date(rec.item.publishedAt) > afterDate
    );
  }

  if (filters.publishedBefore) {
    const beforeDate = new Date(filters.publishedBefore);
    filtered = filtered.filter(rec => 
      new Date(rec.item.publishedAt) < beforeDate
    );
  }

  // فلتر وقت القراءة
  if (filters.minReadingTime) {
    filtered = filtered.filter(rec => 
      rec.item.readingTime >= filters.minReadingTime
    );
  }

  if (filters.maxReadingTime) {
    filtered = filtered.filter(rec => 
      rec.item.readingTime <= filters.maxReadingTime
    );
  }

  // فلتر المقالات المميزة
  if (filters.onlyFeatured) {
    filtered = filtered.filter(rec => rec.item.isFeatured === true);
  }

  return filtered;
}

/**
 * تطبيق التنويع والحداثة
 */
async function applyDiversityAndFreshness(
  recommendations: any[],
  diversityFactor: number,
  freshnessFactor: number
): Promise<any[]> {
  return recommendations.map(rec => {
    // حساب درجة التنويع
    const diversityScore = calculateDiversityScore(rec, recommendations);
    
    // حساب درجة الحداثة
    const freshnessScore = calculateFreshnessScore(rec.item.publishedAt);
    
    // تعديل النتيجة الإجمالية
    const adjustedScore = (rec.score * (1 - diversityFactor - freshnessFactor)) + 
                         (diversityScore * diversityFactor) + 
                         (freshnessScore * freshnessFactor);
    
    return {
      ...rec,
      score: adjustedScore,
      diversity: diversityScore,
      freshness: freshnessScore,
    };
  });
}

/**
 * تطبيق التخصيص
 */
async function applyPersonalization(
  recommendations: any[],
  userProfile: any,
  personalityFactor: number
): Promise<any[]> {
  if (!userProfile) return recommendations;

  return recommendations.map(rec => {
    const personalizationScore = calculatePersonalizationScore(rec, userProfile);
    
    const adjustedScore = (rec.score * (1 - personalityFactor)) + 
                         (personalizationScore * personalityFactor);
    
    return {
      ...rec,
      score: adjustedScore,
      personalization: personalizationScore,
    };
  });
}

/**
 * إنشاء التفسيرات
 */
async function generateExplanations(
  recommendations: any[],
  query: any,
  userProfile: any
): Promise<any> {
  const explanations = {
    why: [],
    how: [],
    alternatives: [],
  };

  // إنشاء تفسيرات "لماذا"
  if (userProfile?.interests?.length > 0) {
    explanations.why.push(`بناءً على اهتماماتك في: ${userProfile.interests.join('، ')}`);
  }

  if (query.context?.currentArticleId) {
    explanations.why.push('لأنك قرأت مقالاً مشابهاً');
  }

  // إنشاء تفسيرات "كيف"
  explanations.how.push(`تم استخدام خوارزمية ${query.algorithm} لإنشاء التوصيات`);
  explanations.how.push('تم تحليل سلوكك السابق وتفضيلاتك');

  // إنشاء بدائل
  explanations.alternatives.push('يمكنك تجربة أقسام مختلفة لتوصيات متنوعة');
  explanations.alternatives.push('استخدم البحث للعثور على محتوى محدد');

  return explanations;
}

/**
 * حساب الإحصائيات
 */
function calculateAnalytics(recommendations: any[]): any {
  const total = recommendations.length;
  const averageScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / total || 0;
  const averageConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / total || 0;

  const algorithmBreakdown = recommendations.reduce((acc, rec) => {
    acc[rec.algorithm] = (acc[rec.algorithm] || 0) + 1;
    return acc;
  }, {});

  const diversityScore = recommendations.reduce((sum, rec) => sum + (rec.diversity || 0), 0) / total || 0;
  const freshnessScore = recommendations.reduce((sum, rec) => sum + (rec.freshness || 0), 0) / total || 0;

  return {
    totalRecommendations: total,
    averageScore,
    averageConfidence,
    algorithmBreakdown,
    diversityScore,
    freshnessScore,
  };
}

/**
 * حساب درجة التنويع
 */
function calculateDiversityScore(recommendation: any, allRecommendations: any[]): number {
  // حساب التنويع بناءً على الأقسام والكلمات المفتاحية
  const sectionDiversity = calculateSectionDiversity(recommendation, allRecommendations);
  const tagDiversity = calculateTagDiversity(recommendation, allRecommendations);
  
  return (sectionDiversity + tagDiversity) / 2;
}

/**
 * حساب درجة الحداثة
 */
function calculateFreshnessScore(publishedAt: string): number {
  const now = new Date();
  const published = new Date(publishedAt);
  const daysDiff = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);
  
  // كلما كان المقال أحدث، كلما كانت النتيجة أعلى
  return Math.max(0, 1 - (daysDiff / 30)); // تقل النتيجة خلال 30 يوم
}

/**
 * حساب درجة التخصيص
 */
function calculatePersonalizationScore(recommendation: any, userProfile: any): number {
  let score = 0;
  
  // تطابق الاهتمامات
  if (userProfile.interests) {
    const interestMatch = recommendation.item.tags.some(tag => 
      userProfile.interests.includes(tag.name)
    );
    if (interestMatch) score += 0.5;
  }

  // تطابق أنماط القراءة
  if (userProfile.readingPatterns) {
    const timeMatch = matchesReadingTime(recommendation.item.readingTime, userProfile.readingPatterns);
    if (timeMatch) score += 0.3;
  }

  // تطابق التفضيلات
  if (userProfile.preferences) {
    const sectionMatch = userProfile.preferences.favoriteSections?.includes(recommendation.item.section.id);
    if (sectionMatch) score += 0.2;
  }

  return Math.min(1, score);
}

/**
 * حساب تنوع الأقسام
 */
function calculateSectionDiversity(recommendation: any, allRecommendations: any[]): number {
  const sectionCounts = allRecommendations.reduce((acc, rec) => {
    const sectionId = rec.item.section.id;
    acc[sectionId] = (acc[sectionId] || 0) + 1;
    return acc;
  }, {});

  const currentSectionCount = sectionCounts[recommendation.item.section.id] || 0;
  const totalRecommendations = allRecommendations.length;

  return 1 - (currentSectionCount / totalRecommendations);
}

/**
 * حساب تنوع الكلمات المفتاحية
 */
function calculateTagDiversity(recommendation: any, allRecommendations: any[]): number {
  const allTags = new Set(allRecommendations.flatMap(rec => rec.item.tags.map(tag => tag.id)));
  const currentTags = new Set(recommendation.item.tags.map(tag => tag.id));
  
  const uniqueTags = [...currentTags].filter(tagId => ![...allTags].includes(tagId));
  
  return uniqueTags.length / currentTags.size || 0;
}

/**
 * تحديد وقت اليوم الحالي
 */
function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * اكتشاف نوع الجهاز
 */
function detectDevice(userAgent: string): string {
  const mobile = /Mobile|Android|iPhone|iPad|BlackBerry|Windows Phone/i.test(userAgent);
  const tablet = /iPad|Android.*Tablet/i.test(userAgent);
  
  if (tablet) return 'tablet';
  if (mobile) return 'mobile';
  return 'desktop';
}

/**
 * فحص تطابق وقت القراءة
 */
function matchesReadingTime(readingTime: number, readingPatterns: any): boolean {
  const preferredRange = readingPatterns.preferredReadingTime;
  if (!preferredRange) return false;
  
  return readingTime >= preferredRange.min && readingTime <= preferredRange.max;
} 