import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/security';

const prisma = new PrismaClient();

const reportSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'offensive', 'harassment', 'misinformation', 'other']),
  description: z.string().max(500).optional()
});

/**
 * POST /api/comments/[id]/report
 * تبليغ عن تعليق مسيء
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { id: commentId } = params;

    // التحقق من Rate Limiting
    if (!checkRateLimit(`report_${user.id}`, 5, 60000)) { // 5 تبليغات في الدقيقة
      return NextResponse.json(
        { error: 'Too many reports. Please wait before reporting again.' },
        { status: 429 }
      );
    }

    // التحقق من وجود التعليق
    const comment = await prisma.articleComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        content: true,
        user_id: true,
        article_id: true,
        status: true,
        user: {
          select: { id: true, name: true }
        },
        article: {
          select: { id: true, title: true }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.status === 'deleted') {
      return NextResponse.json(
        { error: 'Cannot report deleted comment' },
        { status: 403 }
      );
    }

    // منع التبليغ عن التعليقات الخاصة بالمستخدم نفسه
    if (comment.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot report your own comment' },
        { status: 403 }
      );
    }

    // التحقق من عدم تكرار التبليغ
    const existingReport = await prisma.commentReport.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: commentId,
          user_id: user.id
        }
      }
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'Already reported this comment' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const validatedData = reportSchema.parse(body);

    // إنشاء التبليغ
    const result = await prisma.$transaction(async (tx) => {
      // إنشاء سجل التبليغ
      const report = await tx.commentReport.create({
        data: {
          comment_id: commentId,
          user_id: user.id,
          reason: validatedData.reason,
          description: validatedData.description
        }
      });

      // تحديث عداد التبليغات
      const updatedComment = await tx.articleComment.update({
        where: { id: commentId },
        data: {
          report_count: { increment: 1 }
        },
        select: {
          id: true,
          report_count: true,
          status: true
        }
      });

      // إخفاء التعليق تلقائياً إذا تجاوز عدد التبليغات الحد المسموح
      const reportThreshold = 3; // عدد التبليغات المطلوبة لإخفاء التعليق
      if (updatedComment.report_count >= reportThreshold && updatedComment.status === 'visible') {
        await tx.articleComment.update({
          where: { id: commentId },
          data: { status: 'reported' }
        });

        // إنشاء إشعار للإدارة
        const adminUsers = await tx.user.findMany({
          where: { role: 'admin' },
          select: { id: true }
        });

        for (const admin of adminUsers) {
          await tx.notification.create({
            data: {
              user_id: admin.id,
              sender_id: user.id,
              type: 'comment_auto_hidden',
              title: 'تعليق مخفي تلقائياً',
              message: `تم إخفاء تعليق تلقائياً بسبب كثرة التبليغات في مقال "${comment.article.title}"`,
              action_url: `/admin/comments/${commentId}`,
              data: {
                comment_id: commentId,
                article_id: comment.article_id,
                report_count: updatedComment.report_count
              }
            }
          });
        }
      }

      // إنشاء إشعار للإدارة عن التبليغ الجديد
      const adminUsers = await tx.user.findMany({
        where: { role: 'admin' },
        select: { id: true }
      });

      for (const admin of adminUsers) {
        await tx.notification.create({
          data: {
            user_id: admin.id,
            sender_id: user.id,
            type: 'comment_reported',
            title: 'تبليغ جديد عن تعليق',
            message: `تم تبليغ عن تعليق في مقال "${comment.article.title}" بسبب: ${getReasonInArabic(validatedData.reason)}`,
            action_url: `/admin/reports/comments/${report.id}`,
            data: {
              report_id: report.id,
              comment_id: commentId,
              article_id: comment.article_id,
              reason: validatedData.reason
            }
          }
        });
      }

      return { report, updatedComment };
    });

    return NextResponse.json({
      success: true,
      data: {
        report: result.report,
        message: 'تم تسجيل التبليغ بنجاح. سيتم مراجعته من قبل الإدارة.'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error reporting comment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments/[id]/report
 * جلب تفاصيل التبليغات للتعليق (للإدارة فقط)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    
    // التحقق من صلاحيات الإدارة
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: commentId } = params;

    // جلب التبليغات
    const reports = await prisma.commentReport.findMany({
      where: { comment_id: commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // جلب تفاصيل التعليق
    const comment = await prisma.articleComment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // تجميع التبليغات حسب السبب
    const reportsByReason = reports.reduce((acc, report) => {
      acc[report.reason] = (acc[report.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        comment,
        reports,
        total_reports: reports.length,
        reports_by_reason: reportsByReason
      }
    });

  } catch (error) {
    console.error('Error fetching comment reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * تحويل سبب التبليغ إلى العربية
 */
function getReasonInArabic(reason: string): string {
  const reasons: Record<string, string> = {
    spam: 'رسائل مزعجة',
    inappropriate: 'محتوى غير لائق',
    offensive: 'محتوى مسيء',
    harassment: 'تحرش أو تنمر',
    misinformation: 'معلومات خاطئة',
    other: 'أسباب أخرى'
  };

  return reasons[reason] || reason;
} 