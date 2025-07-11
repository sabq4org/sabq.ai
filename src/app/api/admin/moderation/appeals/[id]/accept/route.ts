import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendNotificationToUser } from '@/lib/real-time-notifications';
import { addLoyaltyPoints } from '@/lib/loyalty-integration';

const prisma = new PrismaClient();

/**
 * POST /api/admin/moderation/appeals/[id]/accept
 * قبول تظلم المستخدم
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { admin_id, admin_notes } = body;

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

    // جلب التظلم
    const appeal = await prisma.commentAppeal.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        comment: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                author_id: true
              }
            }
          }
        }
      }
    });

    if (!appeal) {
      return NextResponse.json(
        { success: false, error: 'التظلم غير موجود' },
        { status: 404 }
      );
    }

    if (appeal.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'التظلم تم البت فيه بالفعل' },
        { status: 400 }
      );
    }

    // قبول التظلم
    const updatedAppeal = await prisma.commentAppeal.update({
      where: { id: params.id },
      data: {
        status: 'accepted',
        reviewed_by: admin_id,
        reviewed_at: new Date(),
        admin_notes: admin_notes || null
      }
    });

    // اعتماد التعليق
    await prisma.articleComment.update({
      where: { id: appeal.comment_id },
      data: {
        status: 'approved',
        reviewed_by: admin_id,
        reviewed_at: new Date(),
        review_notes: `Appeal accepted: ${admin_notes || 'No notes'}`
      }
    });

    // إضافة نقاط الولاء للمستخدم
    await addLoyaltyPoints(appeal.user_id, 'comment', {
      article_id: appeal.comment.article_id,
      comment_id: appeal.comment_id
    });

    // تحديث عدد التعليقات في المقال
    await prisma.article.update({
      where: { id: appeal.comment.article_id },
      data: {
        comment_count: { increment: 1 }
      }
    });

    // تحديث عدد الردود في التعليق الأصلي (إذا كان رد)
    if (appeal.comment.parent_id) {
      await prisma.articleComment.update({
        where: { id: appeal.comment.parent_id },
        data: {
          reply_count: { increment: 1 }
        }
      });
    }

    // إشعار المستخدم بقبول التظلم
    await sendNotificationToUser(appeal.user_id, {
      type: 'appeal_accepted',
      title: 'تم قبول تظلمك',
      message: `تم قبول تظلمك وإعادة اعتماد تعليقك على مقال "${appeal.comment.article.title}"`,
      link: `/articles/${appeal.comment.article.id}#comment-${appeal.comment_id}`,
      data: {
        appeal_id: params.id,
        comment_id: appeal.comment_id,
        article_id: appeal.comment.article_id,
        accepted_by: admin_id
      }
    });

    // إشعار كاتب المقال (إذا لم يكن هو المعلق)
    if (appeal.comment.article.author_id !== appeal.user_id) {
      await sendNotificationToUser(appeal.comment.article.author_id, {
        type: 'comment_added',
        title: 'تعليق جديد على مقالك',
        message: `علق ${appeal.user.name} على مقالك: ${appeal.comment.article.title}`,
        link: `/articles/${appeal.comment.article.id}#comment-${appeal.comment_id}`,
        data: {
          comment_id: appeal.comment_id,
          article_id: appeal.comment.article_id,
          user_id: appeal.user_id
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        appeal: updatedAppeal,
        message: 'تم قبول التظلم واعتماد التعليق بنجاح'
      }
    });

  } catch (error) {
    console.error('Error accepting appeal:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في قبول التظلم' },
      { status: 500 }
    );
  }
} 