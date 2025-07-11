import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { aiModerationService } from '@/lib/ai-moderation';
import { sendNotificationToUser } from '@/lib/real-time-notifications';
import { addLoyaltyPoints } from '@/lib/loyalty-integration';

const prisma = new PrismaClient();

/**
 * POST /api/admin/moderation/comments/[id]/approve
 * اعتماد تعليق من قبل المشرف
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { admin_id, notes } = body;

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
            title: true,
            author_id: true
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

    // التحقق من إمكانية الاعتماد
    if (comment.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'التعليق معتمد بالفعل' },
        { status: 400 }
      );
    }

    // تحديث التعليق
    const updatedComment = await prisma.articleComment.update({
      where: { id: params.id },
      data: {
        status: 'approved',
        reviewed_by: admin_id,
        reviewed_at: new Date(),
        review_notes: notes || null
      }
    });

    // إضافة نقاط الولاء للمستخدم
    await addLoyaltyPoints(comment.user_id, 'comment', {
      article_id: comment.article_id,
      comment_id: params.id
    });

    // تحديث عدد التعليقات في المقال
    await prisma.article.update({
      where: { id: comment.article_id },
      data: {
        comment_count: { increment: 1 }
      }
    });

    // تحديث عدد الردود في التعليق الأصلي (إذا كان رد)
    if (comment.parent_id) {
      await prisma.articleComment.update({
        where: { id: comment.parent_id },
        data: {
          reply_count: { increment: 1 }
        }
      });
    }

    // إشعار المستخدم بالاعتماد
    await sendNotificationToUser(comment.user_id, {
      type: 'comment_approved',
      title: 'تم اعتماد تعليقك',
      message: `تم اعتماد تعليقك على مقال "${comment.article.title}"`,
      link: `/articles/${comment.article.id}#comment-${params.id}`,
      data: {
        comment_id: params.id,
        article_id: comment.article_id,
        approved_by: admin_id
      }
    });

    // إشعار كاتب المقال (إذا لم يكن هو المعلق)
    if (comment.article.author_id !== comment.user_id) {
      await sendNotificationToUser(comment.article.author_id, {
        type: 'comment_added',
        title: 'تعليق جديد على مقالك',
        message: `علق ${comment.user.name} على مقالك: ${comment.article.title}`,
        link: `/articles/${comment.article.id}#comment-${params.id}`,
        data: {
          comment_id: params.id,
          article_id: comment.article_id,
          user_id: comment.user_id
        }
      });
    }

    // تسجيل القرار للتدريب
    await aiModerationService.trainFromHumanFeedback(
      params.id,
      'approved',
      admin_id
    );

    return NextResponse.json({
      success: true,
      data: {
        comment: updatedComment,
        message: 'تم اعتماد التعليق بنجاح'
      }
    });

  } catch (error) {
    console.error('Error approving comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في اعتماد التعليق' },
      { status: 500 }
    );
  }
} 