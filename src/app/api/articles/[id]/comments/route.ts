import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { sanitizeHtml, checkRateLimit, validateInput } from '@/lib/security';

const prisma = new PrismaClient();

// Validation schemas
const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parent_id: z.string().uuid().optional()
});

const getCommentsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort: z.enum(['newest', 'oldest', 'popular']).default('newest'),
  status: z.enum(['visible', 'all']).default('visible')
});

/**
 * GET /api/articles/[id]/comments
 * جلب تعليقات المقال مع الردود
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: articleId } = params;
    const { searchParams } = new URL(request.url);

    // التحقق من صحة المعاملات
    const queryParams = getCommentsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      status: searchParams.get('status')
    });

    // التحقق من وجود المقال
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, status: true }
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // بناء شروط البحث
    const whereClause: any = {
      article_id: articleId,
      parent_id: null // جلب التعليقات الرئيسية فقط
    };

    if (queryParams.status === 'visible') {
      whereClause.status = 'visible';
    }

    // ترتيب التعليقات
    const orderBy: any = {};
    switch (queryParams.sort) {
      case 'newest':
        orderBy.created_at = 'desc';
        break;
      case 'oldest':
        orderBy.created_at = 'asc';
        break;
      case 'popular':
        orderBy.like_count = 'desc';
        break;
    }

    // حساب الإزاحة
    const skip = (queryParams.page - 1) * queryParams.limit;

    // جلب التعليقات الرئيسية
    const [comments, totalCount] = await Promise.all([
      prisma.articleComment.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar_url: true
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
            orderBy: { created_at: 'asc' },
            take: 5 // أول 5 ردود لكل تعليق
          },
          _count: {
            select: {
              likes: true,
              replies: {
                where: { status: 'visible' }
              }
            }
          }
        },
        orderBy,
        skip,
        take: queryParams.limit
      }),
      prisma.articleComment.count({ where: whereClause })
    ]);

    // تنسيق النتائج
    const formattedComments = comments.map(comment => ({
      ...comment,
      likes_count: comment._count.likes,
      replies_count: comment._count.replies,
      has_more_replies: comment._count.replies > 5,
      _count: undefined
    }));

    return NextResponse.json({
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / queryParams.limit)
        },
        article: {
          id: article.id,
          title: article.title
        }
      }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
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
 * POST /api/articles/[id]/comments
 * إضافة تعليق جديد أو رد
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
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`comment_${user.id}`, 10, 60000)) { // 10 تعليقات في الدقيقة
      return NextResponse.json(
        { error: 'Too many comments. Please wait before posting again.' },
        { status: 429 }
      );
    }

    // التحقق من وجود المقال
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, status: true, author_id: true }
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    if (article.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot comment on unpublished article' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // تنظيف المحتوى
    const sanitizedContent = sanitizeHtml(validatedData.content);

    // فحص السبام والمحتوى المسيء
    const isSpam = await checkForSpam(sanitizedContent, user.id);
    if (isSpam) {
      return NextResponse.json(
        { error: 'Comment flagged as spam' },
        { status: 403 }
      );
    }

    // التحقق من التعليق الأب إذا كان رد
    let parentComment = null;
    if (validatedData.parent_id) {
      parentComment = await prisma.articleComment.findFirst({
        where: {
          id: validatedData.parent_id,
          article_id: articleId,
          status: 'visible'
        }
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    // إنشاء التعليق
    const comment = await prisma.$transaction(async (tx) => {
      // إنشاء التعليق
      const newComment = await tx.articleComment.create({
        data: {
          article_id: articleId,
          user_id: user.id,
          content: sanitizedContent,
          parent_id: validatedData.parent_id || null,
          status: 'visible' // يمكن تغييرها إلى 'pending' للمراجعة
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar_url: true
            }
          }
        }
      });

      // تحديث عداد التعليقات في المقال
      await tx.article.update({
        where: { id: articleId },
        data: {
          comment_count: { increment: 1 }
        }
      });

      // تحديث عداد الردود في التعليق الأب
      if (parentComment) {
        await tx.articleComment.update({
          where: { id: parentComment.id },
          data: {
            reply_count: { increment: 1 }
          }
        });
      }

      // إنشاء إشعار للكاتب أو صاحب التعليق الأب
      const notificationUserId = parentComment ? parentComment.user_id : article.author_id;
      if (notificationUserId !== user.id) {
        await tx.notification.create({
          data: {
            user_id: notificationUserId,
            sender_id: user.id,
            type: parentComment ? 'comment_reply' : 'comment_new',
            title: parentComment ? 'رد جديد على تعليقك' : 'تعليق جديد على مقالك',
            message: `${user.name} ${parentComment ? 'رد على تعليقك' : 'علق على مقالك'}`,
            action_url: `/articles/${articleId}#comment-${newComment.id}`,
            data: {
              article_id: articleId,
              comment_id: newComment.id,
              parent_id: validatedData.parent_id
            }
          }
        });
      }

      return newComment;
    });

    return NextResponse.json({
      success: true,
      data: { comment }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    
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
 * فحص السبام والمحتوى المسيء
 */
async function checkForSpam(content: string, userId: string): Promise<boolean> {
  try {
    // فحص الفلاتر المحفوظة
    const spamFilters = await prisma.spamFilter.findMany({
      where: { is_active: true }
    });

    for (const filter of spamFilters) {
      if (filter.type === 'keyword') {
        if (content.toLowerCase().includes(filter.pattern.toLowerCase())) {
          return true;
        }
      } else if (filter.type === 'regex') {
        const regex = new RegExp(filter.pattern, 'i');
        if (regex.test(content)) {
          return true;
        }
      }
    }

    // فحص التكرار المفرط
    const recentComments = await prisma.articleComment.count({
      where: {
        user_id: userId,
        created_at: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // آخر 5 دقائق
        }
      }
    });

    if (recentComments >= 5) {
      return true;
    }

    // فحص المحتوى المكرر
    const duplicateComment = await prisma.articleComment.findFirst({
      where: {
        user_id: userId,
        content: content,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // آخر 24 ساعة
        }
      }
    });

    if (duplicateComment) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking spam:', error);
    return false;
  }
} 