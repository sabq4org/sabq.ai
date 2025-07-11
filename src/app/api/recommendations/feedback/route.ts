import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '../../../../../lib/recommendation-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/recommendations/feedback
 * تسجيل تقييم المستخدم للتوصية
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      sessionId,
      articleId,
      feedback,
      recommendationId,
      context = {}
    } = body;

    // التحقق من صحة البيانات
    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'User ID or Session ID is required' },
        { status: 400 }
      );
    }

    const validFeedbacks = ['like', 'dislike', 'not_interested', 'already_read', 'clicked', 'shared'];
    if (!validFeedbacks.includes(feedback)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // التحقق من وجود المقال
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, category_id: true }
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // تسجيل التقييم في محرك التوصيات
    await recommendationEngine.recordRecommendationFeedback(
      userId || null,
      articleId,
      feedback as any
    );

    // تحديث سجل التوصية إذا كان معرف التوصية متوفراً
    if (recommendationId) {
      await prisma.recommendationLog.updateMany({
        where: {
          id: recommendationId,
          article_id: articleId
        },
        data: {
          feedback,
          clicked: feedback === 'clicked',
          updated_at: new Date()
        }
      });
    } else {
      // البحث عن سجل التوصية وتحديثه
      await prisma.recommendationLog.updateMany({
        where: {
          user_id: userId || null,
          session_id: sessionId || null,
          article_id: articleId,
          shown: true
        },
        data: {
          feedback,
          clicked: feedback === 'clicked',
          updated_at: new Date()
        }
      });
    }

    // تسجيل الحدث في التحليلات
    await prisma.analyticsEvent.create({
      data: {
        user_id: userId || null,
        session_id: sessionId || null,
        article_id: articleId,
        event_type: 'recommendation_feedback',
        event_data: {
          feedback,
          recommendationId: recommendationId || null,
          context,
          timestamp: new Date().toISOString()
        },
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date()
      }
    });

    // تحديث ملف اهتمامات المستخدم إذا كان مسجلاً
    if (userId) {
      await recommendationEngine.updateUserInterestProfile(
        userId,
        articleId,
        feedback
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل التقييم بنجاح',
      data: {
        userId: userId || null,
        sessionId: sessionId || null,
        articleId,
        feedback,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error recording recommendation feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recommendations/feedback
 * جلب إحصائيات التقييمات
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');
    const algorithmType = searchParams.get('algorithm');

    // بناء شروط الاستعلام
    const whereClause: any = {
      created_at: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    };

    if (userId) {
      whereClause.user_id = userId;
    }

    if (algorithmType) {
      whereClause.algorithm_type = algorithmType;
    }

    // جلب إحصائيات التقييمات
    const feedbackStats = await prisma.recommendationLog.groupBy({
      by: ['feedback'],
      where: {
        ...whereClause,
        feedback: { not: null }
      },
      _count: {
        feedback: true
      }
    });

    // جلب إحصائيات الخوارزميات
    const algorithmStats = await prisma.recommendationLog.groupBy({
      by: ['algorithm_type'],
      where: whereClause,
      _count: {
        algorithm_type: true
      },
      _sum: {
        score: true
      }
    });

    // جلب أكثر المقالات تقييماً
    const topRatedArticles = await prisma.recommendationLog.groupBy({
      by: ['article_id'],
      where: {
        ...whereClause,
        feedback: { in: ['like', 'clicked'] }
      },
      _count: {
        article_id: true
      },
      orderBy: {
        _count: {
          article_id: 'desc'
        }
      },
      take: 10
    });

    // جلب تفاصيل المقالات الأكثر تقييماً
    const articleIds = topRatedArticles.map(item => item.article_id);
    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        category_id: true,
        view_count: true,
        like_count: true
      }
    });

    const articlesWithStats = topRatedArticles.map(stat => {
      const article = articles.find(a => a.id === stat.article_id);
      return {
        article,
        recommendationCount: stat._count.article_id
      };
    });

    // حساب معدلات النقر والرضا
    const totalShown = await prisma.recommendationLog.count({
      where: { ...whereClause, shown: true }
    });

    const totalClicked = await prisma.recommendationLog.count({
      where: { ...whereClause, clicked: true }
    });

    const totalLiked = await prisma.recommendationLog.count({
      where: { ...whereClause, feedback: 'like' }
    });

    const totalDisliked = await prisma.recommendationLog.count({
      where: { ...whereClause, feedback: 'dislike' }
    });

    const clickThroughRate = totalShown > 0 ? (totalClicked / totalShown) * 100 : 0;
    const satisfactionRate = (totalLiked + totalDisliked) > 0 
      ? (totalLiked / (totalLiked + totalDisliked)) * 100 
      : 0;

    const response = {
      success: true,
      data: {
        summary: {
          totalShown,
          totalClicked,
          totalLiked,
          totalDisliked,
          clickThroughRate: Math.round(clickThroughRate * 100) / 100,
          satisfactionRate: Math.round(satisfactionRate * 100) / 100
        },
        feedbackBreakdown: feedbackStats.map(stat => ({
          feedback: stat.feedback,
          count: stat._count.feedback,
          percentage: totalShown > 0 
            ? Math.round((stat._count.feedback / totalShown) * 100 * 100) / 100 
            : 0
        })),
        algorithmPerformance: algorithmStats.map(stat => ({
          algorithm: stat.algorithm_type,
          count: stat._count.algorithm_type,
          averageScore: stat._sum.score 
            ? Math.round((stat._sum.score / stat._count.algorithm_type) * 100) / 100
            : 0
        })),
        topRatedArticles: articlesWithStats,
        period: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching feedback statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recommendations/feedback
 * حذف تقييمات المستخدم (امتثال GDPR)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'User ID or Session ID is required' },
        { status: 400 }
      );
    }

    // حذف سجلات التوصيات
    const deletedRecommendations = await prisma.recommendationLog.deleteMany({
      where: {
        user_id: userId || null,
        session_id: sessionId || null
      }
    });

    // حذف أحداث التحليلات المرتبطة
    const deletedEvents = await prisma.analyticsEvent.deleteMany({
      where: {
        user_id: userId || null,
        session_id: sessionId || null,
        event_type: 'recommendation_feedback'
      }
    });

    // حذف ملف الاهتمامات إذا كان المستخدم مسجلاً
    if (userId) {
      await prisma.userInterestProfile.deleteMany({
        where: { user_id: userId }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف جميع بيانات التوصيات بنجاح',
      data: {
        deletedRecommendations: deletedRecommendations.count,
        deletedEvents: deletedEvents.count,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error deleting recommendation data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 