import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getCurrentUser } from '@/app/lib/auth';

const prisma = new PrismaClient();

// دالة مساعدة للتحقق من صلاحيات الإدارة
async function checkAdminPermission(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isAdmin: true }
  });
  
  return !!(user && (user.isAdmin || ['admin', 'moderator'].includes(user.role)));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من المستخدم
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من الصلاحيات
    const isAdmin = await checkAdminPermission(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية الوصول' },
        { status: 403 }
      );
    }

    const { status } = await request.json();
    const { id: commentId } = await params;

    if (!['pending', 'approved', 'rejected', 'reported', 'archived'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'حالة غير صالحة' },
        { status: 400 }
      );
    }

    // جلب التعليق الحالي
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        status: true,
        articleId: true
      }
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    // تحديث حالة التعليق
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { status }
    });

    // تسجيل الإجراء
    await prisma.commentModerationLog.create({
      data: {
        commentId,
        moderatorId: user.id,
        action: status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'archive',
        reason: `تغيير الحالة من ${comment.status} إلى ${status}`
      }
    });

    // تحديث عدد التعليقات في المقال
    if (comment.status !== 'approved' && status === 'approved') {
      // التعليق تم اعتماده
      await prisma.$executeRaw`
        UPDATE articles 
        SET comments_count = comments_count + 1,
            last_comment_at = NOW()
        WHERE id = ${comment.articleId}
      `;
    } else if (comment.status === 'approved' && status !== 'approved') {
      // التعليق تم إلغاء اعتماده
      await prisma.$executeRaw`
        UPDATE articles 
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = ${comment.articleId}
      `;
    }

    return NextResponse.json({
      success: true,
      comment: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment status:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث حالة التعليق' },
      { status: 500 }
    );
  }
} 