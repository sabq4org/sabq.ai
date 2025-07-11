import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/security';

const prisma = new PrismaClient();

/**
 * POST /api/comments/[id]/like
 * إضافة إعجاب للتعليق
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
    if (!checkRateLimit(`like_${user.id}`, 20, 60000)) { // 20 إعجاب في الدقيقة
      return NextResponse.json(
        { error: 'Too many likes. Please wait before liking again.' },
        { status: 429 }
      );
    }

    // التحقق من وجود التعليق
    const comment = await prisma.articleComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        user_id: true,
        status: true,
        article_id: true,
        user: {
          select: { id: true, name: true }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.status !== 'visible') {
      return NextResponse.json(
        { error: 'Cannot like this comment' },
        { status: 403 }
      );
    }

    // التحقق من عدم تكرار الإعجاب
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: commentId,
          user_id: user.id
        }
      }
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this comment' },
        { status: 409 }
      );
    }

    // إضافة الإعجاب
    const result = await prisma.$transaction(async (tx) => {
      // إنشاء الإعجاب
      const like = await tx.commentLike.create({
        data: {
          comment_id: commentId,
          user_id: user.id
        }
      });

      // تحديث عداد الإعجابات
      const updatedComment = await tx.articleComment.update({
        where: { id: commentId },
        data: {
          like_count: { increment: 1 }
        },
        select: {
          id: true,
          like_count: true
        }
      });

      // إنشاء إشعار لصاحب التعليق
      if (comment.user_id !== user.id) {
        await tx.notification.create({
          data: {
            user_id: comment.user_id,
            sender_id: user.id,
            type: 'comment_like',
            title: 'إعجاب جديد',
            message: `أعجب ${user.name} بتعليقك`,
            action_url: `/articles/${comment.article_id}#comment-${commentId}`,
            data: {
              comment_id: commentId,
              article_id: comment.article_id
            }
          }
        });
      }

      return { like, updatedComment };
    });

    return NextResponse.json({
      success: true,
      data: {
        like: result.like,
        comment: result.updatedComment
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]/like
 * إلغاء الإعجاب بالتعليق
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
    const { id: commentId } = params;

    // التحقق من وجود الإعجاب
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: commentId,
          user_id: user.id
        }
      }
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      );
    }

    // إلغاء الإعجاب
    const result = await prisma.$transaction(async (tx) => {
      // حذف الإعجاب
      await tx.commentLike.delete({
        where: {
          comment_id_user_id: {
            comment_id: commentId,
            user_id: user.id
          }
        }
      });

      // تحديث عداد الإعجابات
      const updatedComment = await tx.articleComment.update({
        where: { id: commentId },
        data: {
          like_count: { decrement: 1 }
        },
        select: {
          id: true,
          like_count: true
        }
      });

      return { updatedComment };
    });

    return NextResponse.json({
      success: true,
      data: {
        comment: result.updatedComment
      }
    });

  } catch (error) {
    console.error('Error unliking comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments/[id]/like
 * التحقق من حالة الإعجاب
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json({
        success: true,
        data: { liked: false }
      });
    }

    const user = authResult.user;
    const { id: commentId } = params;

    // التحقق من وجود الإعجاب
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: commentId,
          user_id: user.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { liked: !!existingLike }
    });

  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 