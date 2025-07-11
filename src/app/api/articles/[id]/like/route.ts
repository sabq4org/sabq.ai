import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/security';

const prisma = new PrismaClient();

/**
 * POST /api/articles/[id]/like
 * إضافة إعجاب للمقال
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
    const { id: articleId } = params;

    // التحقق من Rate Limiting
    if (!checkRateLimit(`article_like_${user.id}`, 10, 60000)) { // 10 إعجابات في الدقيقة
      return NextResponse.json(
        { error: 'Too many likes. Please wait before liking again.' },
        { status: 429 }
      );
    }

    // التحقق من وجود المقال
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        author_id: true,
        status: true,
        author: {
          select: { id: true, name: true }
        }
      }
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    if (article.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot like unpublished article' },
        { status: 403 }
      );
    }

    // التحقق من عدم تكرار الإعجاب
    const existingLike = await prisma.articleLike.findUnique({
      where: {
        user_id_article_id: {
          user_id: user.id,
          article_id: articleId
        }
      }
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this article' },
        { status: 409 }
      );
    }

    // إضافة الإعجاب
    const result = await prisma.$transaction(async (tx) => {
      // إنشاء الإعجاب
      const like = await tx.articleLike.create({
        data: {
          user_id: user.id,
          article_id: articleId
        }
      });

      // تحديث عداد الإعجابات
      const updatedArticle = await tx.article.update({
        where: { id: articleId },
        data: {
          like_count: { increment: 1 }
        },
        select: {
          id: true,
          like_count: true
        }
      });

      // إنشاء إشعار للكاتب
      if (article.author_id !== user.id) {
        await tx.notification.create({
          data: {
            user_id: article.author_id,
            sender_id: user.id,
            type: 'article_like',
            title: 'إعجاب جديد',
            message: `أعجب ${user.name} بمقالك "${article.title}"`,
            action_url: `/articles/${articleId}`,
            data: {
              article_id: articleId,
              article_title: article.title
            }
          }
        });
      }

      // تسجيل الحدث في التحليلات
      await tx.analyticsEvent.create({
        data: {
          event_type: 'article_like',
          article_id: articleId,
          user_id: user.id,
          event_data: {
            article_title: article.title,
            author_id: article.author_id
          }
        }
      });

      return { like, updatedArticle };
    });

    return NextResponse.json({
      success: true,
      data: {
        like: result.like,
        article: result.updatedArticle
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error liking article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[id]/like
 * إلغاء الإعجاب بالمقال
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
    const { id: articleId } = params;

    // التحقق من وجود الإعجاب
    const existingLike = await prisma.articleLike.findUnique({
      where: {
        user_id_article_id: {
          user_id: user.id,
          article_id: articleId
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
      await tx.articleLike.delete({
        where: {
          user_id_article_id: {
            user_id: user.id,
            article_id: articleId
          }
        }
      });

      // تحديث عداد الإعجابات
      const updatedArticle = await tx.article.update({
        where: { id: articleId },
        data: {
          like_count: { decrement: 1 }
        },
        select: {
          id: true,
          like_count: true
        }
      });

      // تسجيل الحدث في التحليلات
      await tx.analyticsEvent.create({
        data: {
          event_type: 'article_unlike',
          article_id: articleId,
          user_id: user.id,
          event_data: {}
        }
      });

      return { updatedArticle };
    });

    return NextResponse.json({
      success: true,
      data: {
        article: result.updatedArticle
      }
    });

  } catch (error) {
    console.error('Error unliking article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/articles/[id]/like
 * التحقق من حالة الإعجاب والحصول على إحصائيات
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: articleId } = params;

    // جلب إحصائيات الإعجابات
    const likesCount = await prisma.articleLike.count({
      where: { article_id: articleId }
    });

    // التحقق من حالة الإعجاب للمستخدم الحالي
    let userLiked = false;
    const authResult = await authMiddleware(request);
    
    if (authResult.success) {
      const existingLike = await prisma.articleLike.findUnique({
        where: {
          user_id_article_id: {
            user_id: authResult.user.id,
            article_id: articleId
          }
        }
      });
      userLiked = !!existingLike;
    }

    return NextResponse.json({
      success: true,
      data: {
        liked: userLiked,
        likes_count: likesCount
      }
    });

  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 