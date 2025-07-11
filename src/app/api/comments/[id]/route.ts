import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { sanitizeHtml } from '@/lib/security';

const prisma = new PrismaClient();

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000)
});

/**
 * GET /api/comments/[id]
 * جلب تفاصيل تعليق محدد
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const comment = await prisma.articleComment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        parent: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        replies: {
          where: { status: 'visible' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar_url: true
              }
            },
            _count: {
              select: { likes: true }
            }
          },
          orderBy: { created_at: 'asc' }
        },
        _count: {
          select: {
            likes: true,
            replies: true,
            reports: true
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

    // تحقق من الصلاحية لرؤية التعليق
    if (comment.status !== 'visible') {
      // يمكن للمؤلف والإدارة رؤية التعليقات المخفية
      const authResult = await authMiddleware(request);
      if (!authResult.success) {
        return NextResponse.json(
          { error: 'Comment not available' },
          { status: 404 }
        );
      }

      const user = authResult.user;
      if (user.id !== comment.user_id && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Comment not available' },
          { status: 404 }
        );
      }
    }

    const formattedComment = {
      ...comment,
      likes_count: comment._count.likes,
      replies_count: comment._count.replies,
      reports_count: comment._count.reports,
      _count: undefined
    };

    return NextResponse.json({
      success: true,
      data: { comment: formattedComment }
    });

  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/comments/[id]
 * تحديث تعليق
 */
export async function PUT(
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
    const { id } = params;

    // التحقق من وجود التعليق
    const existingComment = await prisma.articleComment.findUnique({
      where: { id },
      include: {
        article: true
      }
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحية للتحديث
    const canEdit = 
      user.id === existingComment.user_id || 
      user.role === 'admin';

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // التحقق من إمكانية التحديث (خلال 15 دقيقة من النشر)
    const timeSinceCreation = Date.now() - existingComment.created_at.getTime();
    const canEditTime = timeSinceCreation <= 15 * 60 * 1000; // 15 دقيقة

    if (!canEditTime && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Comment can only be edited within 15 minutes of posting' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // تنظيف المحتوى
    const sanitizedContent = sanitizeHtml(validatedData.content);

    // تحديث التعليق
    const updatedComment = await prisma.articleComment.update({
      where: { id },
      data: {
        content: sanitizedContent,
        is_edited: true,
        edited_at: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        },
        _count: {
          select: { likes: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { comment: updatedComment }
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    
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
 * DELETE /api/comments/[id]
 * حذف تعليق
 */
export async function DELETE(
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
    const { id } = params;

    // التحقق من وجود التعليق
    const existingComment = await prisma.articleComment.findUnique({
      where: { id },
      include: {
        article: true,
        _count: {
          select: { replies: true }
        }
      }
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحية للحذف
    const canDelete = 
      user.id === existingComment.user_id || 
      user.role === 'admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // إذا كان التعليق له ردود، نغير المحتوى بدلاً من الحذف
      if (existingComment._count.replies > 0) {
        await tx.articleComment.update({
          where: { id },
          data: {
            content: '[تم حذف هذا التعليق]',
            status: 'deleted'
          }
        });
      } else {
        // حذف فعلي إذا لم يكن له ردود
        await tx.articleComment.delete({
          where: { id }
        });
      }

      // تحديث عداد التعليقات في المقال
      await tx.article.update({
        where: { id: existingComment.article_id },
        data: {
          comment_count: { decrement: 1 }
        }
      });

      // تحديث عداد الردود في التعليق الأب
      if (existingComment.parent_id) {
        await tx.articleComment.update({
          where: { id: existingComment.parent_id },
          data: {
            reply_count: { decrement: 1 }
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 