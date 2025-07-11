import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { addLoyaltyPoints } from '@/lib/loyalty-integration';
import { sendNotificationToUser } from '@/lib/real-time-notifications';

const prisma = new PrismaClient();

/**
 * POST /api/comments/[id]/like
 * إضافة أو إزالة إعجاب على التعليق
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود التعليق
    const comment = await prisma.articleComment.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true
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

    if (comment.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'لا يمكن الإعجاب بهذا التعليق' },
        { status: 400 }
      );
    }

    // التحقق من الإعجاب الموجود
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: params.id,
          user_id
        }
      }
    });

    let isLiked = false;
    let likeCount = comment.like_count;

    if (existingLike) {
      // إزالة الإعجاب
      await prisma.commentLike.delete({
        where: { id: existingLike.id }
      });
      
      likeCount = Math.max(0, likeCount - 1);
      
      await prisma.articleComment.update({
        where: { id: params.id },
        data: { like_count: likeCount }
      });
      
      isLiked = false;
    } else {
      // إضافة الإعجاب
      await prisma.commentLike.create({
        data: {
          comment_id: params.id,
          user_id
        }
      });
      
      likeCount = likeCount + 1;
      
      await prisma.articleComment.update({
        where: { id: params.id },
        data: { like_count: likeCount }
      });
      
      isLiked = true;

      // إضافة نقاط ولاء للمستخدم الذي أعجب
      await addLoyaltyPoints(user_id, 'like_comment', {
        comment_id: params.id,
        article_id: comment.article_id
      });

      // إضافة نقاط ولاء لصاحب التعليق
      if (comment.user_id !== user_id) {
        await addLoyaltyPoints(comment.user_id, 'comment_liked', {
          comment_id: params.id,
          article_id: comment.article_id,
          liked_by: user_id
        });

        // إشعار صاحب التعليق
        await sendNotificationToUser(comment.user_id, {
          type: 'comment_liked',
          title: 'أعجب أحدهم بتعليقك',
          message: `أعجب أحد المستخدمين بتعليقك`,
          link: `/articles/${comment.article_id}#comment-${params.id}`,
          data: {
            comment_id: params.id,
            article_id: comment.article_id,
            liked_by: user_id
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isLiked,
        likeCount,
        message: isLiked ? 'تم الإعجاب بالتعليق' : 'تم إلغاء الإعجاب'
      }
    });

  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تسجيل الإعجاب' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments/[id]/like
 * جلب حالة الإعجاب للمستخدم
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود الإعجاب
    const like = await prisma.commentLike.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: params.id,
          user_id
        }
      }
    });

    // جلب عدد الإعجابات
    const comment = await prisma.articleComment.findUnique({
      where: { id: params.id },
      select: { like_count: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        isLiked: !!like,
        likeCount: comment?.like_count || 0
      }
    });

  } catch (error) {
    console.error('Error fetching comment like status:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب حالة الإعجاب' },
      { status: 500 }
    );
  }
} 