/**
 * API التغذية الراجعة لأسباب التوصية
 * Recommendation Reason Feedback API
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// نموذج التحقق من البيانات
const feedbackSchema = z.object({
  recommendationId: z.string(),
  reasonText: z.string(),
  feedback: z.enum(['clear', 'unclear', 'helpful', 'not_helpful']),
  note: z.string().optional(),
  improvement_suggestion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = feedbackSchema.parse(body);

    // الحصول على معلومات المستخدم من الجلسة
    const userId = request.headers.get('user-id') || null;
    const sessionId = request.headers.get('session-id') || null;
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = getClientIP(request);

    // حفظ التغذية الراجعة
    const feedback = await prisma.recommendationReasonFeedback.create({
      data: {
        recommendation_id: validatedData.recommendationId,
        reason_text: validatedData.reasonText,
        feedback: validatedData.feedback,
        note: validatedData.note,
        improvement_suggestion: validatedData.improvement_suggestion,
        user_id: userId,
        session_id: sessionId,
        user_agent: userAgent,
        ip_address: ipAddress,
      },
    });

    // تحديث إحصائيات التوصية
    await updateRecommendationStats(validatedData.recommendationId, validatedData.feedback);

    // تتبع الحدث في التحليلات
    await prisma.analyticsEvent.create({
      data: {
        event_type: 'recommendation_feedback',
        event_data: {
          recommendationId: validatedData.recommendationId,
          feedback: validatedData.feedback,
          hasNote: !!validatedData.note,
          hasImprovement: !!validatedData.improvement_suggestion,
          reasonLength: validatedData.reasonText.length,
        },
        user_id: userId,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إرسال التغذية الراجعة بنجاح',
      feedbackId: feedback.id,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('خطأ في API التغذية الراجعة:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'بيانات غير صحيحة',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'فشل في إرسال التغذية الراجعة',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

// الحصول على إحصائيات التغذية الراجعة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recommendationId = searchParams.get('recommendationId');
    const timeframe = searchParams.get('timeframe') || '7d';

    // حساب تاريخ البداية
    const startDate = new Date();
    const days = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : 30;
    startDate.setDate(startDate.getDate() - days);

    let whereClause: any = {
      created_at: {
        gte: startDate,
      },
    };

    if (recommendationId) {
      whereClause.recommendation_id = recommendationId;
    }

    // جمع الإحصائيات
    const stats = await prisma.recommendationReasonFeedback.groupBy({
      by: ['feedback'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // إحصائيات تفصيلية
    const totalFeedback = await prisma.recommendationReasonFeedback.count({
      where: whereClause,
    });

    const feedbackWithNotes = await prisma.recommendationReasonFeedback.count({
      where: {
        ...whereClause,
        note: {
          not: null,
        },
      },
    });

    const feedbackWithImprovements = await prisma.recommendationReasonFeedback.count({
      where: {
        ...whereClause,
        improvement_suggestion: {
          not: null,
        },
      },
    });

    // أحدث التعليقات
    const recentFeedback = await prisma.recommendationReasonFeedback.findMany({
      where: {
        ...whereClause,
        OR: [
          { note: { not: null } },
          { improvement_suggestion: { not: null } },
        ],
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
      select: {
        id: true,
        feedback: true,
        note: true,
        improvement_suggestion: true,
        created_at: true,
        reason_text: true,
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: totalFeedback,
        by_type: stats.reduce((acc, item) => {
          acc[item.feedback] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        with_notes: feedbackWithNotes,
        with_improvements: feedbackWithImprovements,
        satisfaction_rate: totalFeedback > 0 
          ? ((stats.find(s => s.feedback === 'clear')?._count.id || 0) + 
             (stats.find(s => s.feedback === 'helpful')?._count.id || 0)) / totalFeedback * 100
          : 0,
      },
      recent_feedback: recentFeedback,
      timeframe,
      date_range: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('خطأ في جلب إحصائيات التغذية الراجعة:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في جلب الإحصائيات',
    }, { status: 500 });
  }
}

// دالة تحديث إحصائيات التوصية
async function updateRecommendationStats(recommendationId: string, feedback: string) {
  try {
    // البحث عن التوصية وتحديث الإحصائيات
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (recommendation) {
      // تحديث نقاط الجودة
      let qualityScoreChange = 0;
      
      switch (feedback) {
        case 'clear':
        case 'helpful':
          qualityScoreChange = 1;
          break;
        case 'unclear':
        case 'not_helpful':
          qualityScoreChange = -1;
          break;
      }

      // تحديث النقاط (مثال بسيط)
      await prisma.recommendation.update({
        where: { id: recommendationId },
        data: {
          score: {
            increment: qualityScoreChange * 0.1, // تأثير بسيط على النقاط
          },
        },
      });
    }
  } catch (error) {
    console.error('خطأ في تحديث إحصائيات التوصية:', error);
  }
}

// دالة للحصول على IP العميل
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// دعم طرق HTTP أخرى
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 