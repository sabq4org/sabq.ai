import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { aiModerationService } from '@/lib/ai-moderation';
import { sendNotificationToUser } from '@/lib/real-time-notifications';

const prisma = new PrismaClient();

/**
 * POST /api/admin/moderation/comments/[id]/reject
 * رفض تعليق من قبل المشرف
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { admin_id, notes, reason } = body;

    // التحقق من صلاحيات المشرف
    const admin = await prisma.user.findUnique({
      where: { id: admin_id },
      select: { role: true, name: true }
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مسموح لك بالوصول' },
        { status: 403 }
      );
    }

    // جلب التعليق
    const comment = await prisma.articleComment.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        article: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من إمكانية الرفض
    if (comment.status === 'rejected') {
      return NextResponse.json(
        { success: false, error: 'التعليق مرفوض بالفعل' },
        { status: 400 }
      );
    }

    // تحديث التعليق
    const updatedComment = await prisma.articleComment.update({
      where: { id: params.id },
      data: {
        status: 'rejected',
        reviewed_by: admin_id,
        reviewed_at: new Date(),
        review_notes: notes || null
      }
    });

    // إشعار المستخدم بالرفض
    await sendNotificationToUser(comment.user_id, {
      type: 'comment_rejected',
      title: 'تم رفض تعليقك',
      message: `تم رفض تعليقك على مقال "${comment.article.title}"${reason ? ` بسبب: ${reason}` : ''}`,
      link: `/articles/${comment.article.id}`,
      data: {
        comment_id: params.id,
        article_id: comment.article_id,
        reason: reason || null,
        can_appeal: true,
        rejected_by: admin_id
      }
    });

    // تسجيل القرار للتدريب
    await aiModerationService.trainFromHumanFeedback(
      params.id,
      'rejected',
      admin_id
    );

    return NextResponse.json({
      success: true,
      data: {
        comment: updatedComment,
        message: 'تم رفض التعليق بنجاح'
      }
    });

  } catch (error) {
    console.error('Error rejecting comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في رفض التعليق' },
      { status: 500 }
    );
  }
} 