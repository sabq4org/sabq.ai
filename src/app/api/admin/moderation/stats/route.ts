import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/moderation/stats
 * جلب إحصائيات الإشراف الذكي
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'day'; // day, week, month
    const user_id = searchParams.get('user_id');

    // التحقق من صلاحيات المشرف
    const user = await prisma.user.findUnique({
      where: { id: user_id! },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مسموح لك بالوصول' },
        { status: 403 }
      );
    }

    // تحديد الفترة الزمنية
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // الإحصائيات الأساسية
    const [
      totalComments,
      pendingComments,
      approvedComments,
      rejectedComments,
      needsReviewComments,
      hiddenComments,
      totalAppeals,
      pendingAppeals,
      totalReports,
      pendingReports
    ] = await Promise.all([
      prisma.articleComment.count({
        where: { created_at: { gte: startDate } }
      }),
      prisma.articleComment.count({
        where: { 
          created_at: { gte: startDate },
          status: 'pending'
        }
      }),
      prisma.articleComment.count({
        where: { 
          created_at: { gte: startDate },
          status: 'approved'
        }
      }),
      prisma.articleComment.count({
        where: { 
          created_at: { gte: startDate },
          status: 'rejected'
        }
      }),
      prisma.articleComment.count({
        where: { 
          created_at: { gte: startDate },
          status: 'needs_review'
        }
      }),
      prisma.articleComment.count({
        where: { 
          created_at: { gte: startDate },
          status: 'hidden'
        }
      }),
      prisma.commentAppeal.count({
        where: { created_at: { gte: startDate } }
      }),
      prisma.commentAppeal.count({
        where: { 
          created_at: { gte: startDate },
          status: 'pending'
        }
      }),
      prisma.commentReport.count({
        where: { created_at: { gte: startDate } }
      }),
      prisma.commentReport.count({
        where: { 
          created_at: { gte: startDate },
          status: 'pending'
        }
      })
    ]);

    // إحصائيات AI
    const aiStats = await prisma.articleComment.groupBy({
      by: ['ai_category'],
      where: {
        created_at: { gte: startDate },
        ai_processed: true
      },
      _count: { id: true },
      _avg: { ai_risk_score: true }
    });

    const categoriesBreakdown = aiStats.reduce((acc, stat) => {
      acc[stat.ai_category || 'unknown'] = {
        count: stat._count.id,
        avg_risk_score: stat._avg.ai_risk_score || 0
      };
      return acc;
    }, {} as Record<string, { count: number; avg_risk_score: number }>);

    // إحصائيات الأداء
    const aiProcessedComments = await prisma.articleComment.count({
      where: {
        created_at: { gte: startDate },
        ai_processed: true
      }
    });

    const autoApprovedComments = await prisma.articleComment.count({
      where: {
        created_at: { gte: startDate },
        status: 'approved',
        reviewed_by: null // لم يتم مراجعته بشرياً
      }
    });

    const autoRejectedComments = await prisma.articleComment.count({
      where: {
        created_at: { gte: startDate },
        status: 'rejected',
        reviewed_by: null // لم يتم مراجعته بشرياً
      }
    });

    // حساب معدل الدقة
    const reviewedComments = await prisma.articleComment.count({
      where: {
        created_at: { gte: startDate },
        reviewed_by: { not: null }
      }
    });

    // إحصائيات المشرفين
    const adminActivity = await prisma.articleComment.groupBy({
      by: ['reviewed_by'],
      where: {
        reviewed_at: { gte: startDate },
        reviewed_by: { not: null }
      },
      _count: { id: true }
    });

    const adminStats = await Promise.all(
      adminActivity.map(async (activity) => {
        const admin = await prisma.user.findUnique({
          where: { id: activity.reviewed_by! },
          select: { name: true, email: true }
        });
        return {
          admin_id: activity.reviewed_by,
          admin_name: admin?.name || 'Unknown',
          reviews_count: activity._count.id
        };
      })
    );

    // إحصائيات زمنية (آخر 7 أيام)
    const dailyStats = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        const [total, approved, rejected, needsReview] = await Promise.all([
          prisma.articleComment.count({
            where: {
              created_at: { gte: startOfDay, lt: endOfDay }
            }
          }),
          prisma.articleComment.count({
            where: {
              created_at: { gte: startOfDay, lt: endOfDay },
              status: 'approved'
            }
          }),
          prisma.articleComment.count({
            where: {
              created_at: { gte: startOfDay, lt: endOfDay },
              status: 'rejected'
            }
          }),
          prisma.articleComment.count({
            where: {
              created_at: { gte: startOfDay, lt: endOfDay },
              status: 'needs_review'
            }
          })
        ]);

        return {
          date: startOfDay.toISOString().split('T')[0],
          total,
          approved,
          rejected,
          needs_review: needsReview
        };
      })
    );

    // معدلات الأداء
    const automationRate = aiProcessedComments > 0 ? 
      ((autoApprovedComments + autoRejectedComments) / aiProcessedComments) * 100 : 0;

    const humanReviewRate = totalComments > 0 ? 
      (needsReviewComments / totalComments) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_comments: totalComments,
          pending: pendingComments,
          approved: approvedComments,
          rejected: rejectedComments,
          needs_review: needsReviewComments,
          hidden: hiddenComments,
          automation_rate: Math.round(automationRate * 100) / 100,
          human_review_rate: Math.round(humanReviewRate * 100) / 100
        },
        ai_performance: {
          total_processed: aiProcessedComments,
          auto_approved: autoApprovedComments,
          auto_rejected: autoRejectedComments,
          categories_breakdown: categoriesBreakdown,
          avg_processing_time: '< 1s' // يمكن حسابه من البيانات الفعلية
        },
        appeals_reports: {
          total_appeals: totalAppeals,
          pending_appeals: pendingAppeals,
          total_reports: totalReports,
          pending_reports: pendingReports
        },
        admin_activity: {
          total_reviews: reviewedComments,
          admin_stats: adminStats
        },
        daily_trends: dailyStats.reverse(), // من الأقدم للأحدث
        timeframe
      }
    });

  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الإحصائيات' },
      { status: 500 }
    );
  }
} 