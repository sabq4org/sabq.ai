import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getCurrentUser } from '@/app/lib/auth';

const prisma = new PrismaClient();

// دالة مساعدة للتحقق من دور المستخدم
async function getUserRole(userId: string): Promise<string> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role || 'user';
}

// دالة مساعدة للتحقق من صلاحيات الإدارة
async function checkAdminPermission(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true, is_admin: true }
  });
  
  return !!(user && (user.is_admin || ['admin', 'moderator'].includes(user.role)));
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { status, reason } = body

    // التحقق من المستخدم
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // التحقق من الصلاحيات
    const userRole = await getUserRole(user.id);
    if (!['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية للوصول' },
        { status: 403 }
      );
    }

    if (!['pending', 'approved', 'rejected', 'reported', 'archived'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'حالة غير صالحة' },
        { status: 400 }
      );
    }

    // جلب التعليق الحالي
    const comment = await prisma.comments.findUnique({
      where: { id: id },
      select: {
        status: true,
        article_id: true
      }
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    // تحديث حالة التعليق
    const updatedComment = await prisma.comments.update({
      where: { id: id },
      data: { status }
    });

    // تسجيل الإجراء
    // DISABLED: Comment moderation log
      // await prisma.commentModerationLog.create({ ... });

    // تحديث عدد التعليقات في المقال
    if (comment.status !== 'approved' && status === 'approved') {
      // التعليق تم اعتماده
      await prisma.$executeRaw`
        UPDATE articles 
        SET comments_count = comments_count + 1,
            last_comment_at = NOW()
        WHERE id = ${comment.article_id}
      `;
    } else if (comment.status === 'approved' && status !== 'approved') {
      // التعليق تم إلغاء اعتماده
      await prisma.$executeRaw`
        UPDATE articles 
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = ${comment.article_id}
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