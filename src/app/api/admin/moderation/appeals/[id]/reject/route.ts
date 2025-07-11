import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendNotificationToUser } from '@/lib/real-time-notifications';

const prisma = new PrismaClient();

/**
 * POST /api/admin/moderation/appeals/[id]/reject
 * رفض تظلم المستخدم
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { admin_id, admin_notes, reason } = body;

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
                title: true
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

    // رفض التظلم
    const updatedAppeal = await prisma.commentAppeal.update({
      where: { id: params.id },
      data: {
        status: 'rejected',
        reviewed_by: admin_id,
        reviewed_at: new Date(),
        admin_notes: admin_notes || null
      }
    });

    // إشعار المستخدم برفض التظلم
    await sendNotificationToUser(appeal.user_id, {
      type: 'appeal_rejected',
      title: 'تم رفض تظلمك',
      message: `تم رفض تظلمك على تعليقك في مقال "${appeal.comment.article.title}"${reason ? ` بسبب: ${reason}` : ''}`,
      link: `/articles/${appeal.comment.article.id}`,
      data: {
        appeal_id: params.id,
        comment_id: appeal.comment_id,
        article_id: appeal.comment.article_id,
        reason: reason || null,
        rejected_by: admin_id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        appeal: updatedAppeal,
        message: 'تم رفض التظلم'
      }
    });

  } catch (error) {
    console.error('Error rejecting appeal:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في رفض التظلم' },
      { status: 500 }
    );
  }
} 