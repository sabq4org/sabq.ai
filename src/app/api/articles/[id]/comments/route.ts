import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { moderateCommentAI } from '@/lib/ai-moderation';
import { sendNotificationToAdmins, sendNotificationToUser } from '@/lib/real-time-notifications';
import { addLoyaltyPoints } from '@/lib/loyalty-integration';

const prisma = new PrismaClient();

/**
 * GET /api/articles/[id]/comments
 * جلب التعليقات المعتمدة للمقال
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest'; // newest, oldest, popular
    const parent_id = searchParams.get('parent_id') || undefined;

    const skip = (page - 1) * limit;

    // ترتيب التعليقات
    let orderBy: any = { created_at: 'desc' };
    if (sort === 'oldest') {
      orderBy = { created_at: 'asc' };
    } else if (sort === 'popular') {
      orderBy = { like_count: 'desc' };
    }

    // جلب التعليقات المعتمدة فقط
    const comments = await prisma.articleComment.findMany({
      where: {
        article_id: params.id,
        status: 'approved',
        parent_id: parent_id || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image: true
          }
        },
        likes: {
          select: {
            user_id: true
          }
        },
        replies: {
          where: { status: 'approved' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile_image: true
              }
            },
            likes: {
              select: {
                user_id: true
              }
            }
          },
          orderBy: { created_at: 'asc' },
          take: 3 // أول 3 ردود فقط
        },
        _count: {
          select: {
            replies: {
              where: { status: 'approved' }
            }
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    // إجمالي عدد التعليقات
    const total = await prisma.articleComment.count({
      where: {
        article_id: params.id,
        status: 'approved',
        parent_id: parent_id || null
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التعليقات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles/[id]/comments
 * إضافة تعليق جديد مع الإشراف الذكي
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { user_id, content, parent_id } = body;

    // التحقق من صحة البيانات
    if (!user_id || !content || content.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم والمقال
    const [user, article] = await Promise.all([
      prisma.user.findUnique({ where: { id: user_id } }),
      prisma.article.findUnique({ where: { id: params.id } })
    ]);

    if (!user || !article) {
      return NextResponse.json(
        { success: false, error: 'المستخدم أو المقال غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من التعليق الأصلي (إذا كان رد)
    if (parent_id) {
      const parentComment = await prisma.articleComment.findUnique({
        where: { id: parent_id }
      });
      
      if (!parentComment || parentComment.article_id !== params.id) {
        return NextResponse.json(
          { success: false, error: 'التعليق الأصلي غير موجود' },
          { status: 404 }
        );
      }
    }

    // 1. إنشاء التعليق في حالة الانتظار
    const comment = await prisma.articleComment.create({
      data: {
        article_id: params.id,
        user_id,
        content: content.trim(),
        parent_id: parent_id || null,
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image: true
          }
        }
      }
    });

    // 2. تطبيق الإشراف الذكي
    let moderationResult;
    try {
      moderationResult = await moderateCommentAI({
        comment: content.trim(),
        user_id,
        article_id: params.id,
        lang: 'ar'
      });
    } catch (error) {
      console.error('AI Moderation Error:', error);
      // في حالة فشل الذكاء الاصطناعي، ضع التعليق للمراجعة البشرية
      moderationResult = {
        status: 'needs_review' as const,
        ai_response: {
          accepted: false,
          category: 'ai_error',
          risk_score: 0.5,
          confidence: 0,
          reasons: ['AI service unavailable']
        },
        final_decision: 'AI service error - needs human review',
        reasons: ['AI service unavailable']
      };
    }

    // 3. تحديث التعليق بنتائج الإشراف
    const updatedComment = await prisma.articleComment.update({
      where: { id: comment.id },
      data: {
        status: moderationResult.status,
        ai_category: moderationResult.ai_response.category,
        ai_risk_score: moderationResult.ai_response.risk_score,
        ai_confidence: moderationResult.ai_response.confidence,
        ai_reasons: moderationResult.ai_response.reasons,
        ai_notes: moderationResult.ai_response.notes,
        ai_processed: true,
        ai_processed_at: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image: true
          }
        }
      }
    });

    // 4. إرسال الإشعارات والمكافآت بناءً على النتيجة
    if (moderationResult.status === 'approved') {
      // إضافة نقاط الولاء للمستخدم
      await addLoyaltyPoints(user_id, 'comment', {
        article_id: params.id,
        comment_id: comment.id
      });

      // إشعار كاتب المقال (إذا لم يكن هو المعلق)
      if (article.author_id !== user_id) {
        await sendNotificationToUser(article.author_id, {
          type: 'comment_added',
          title: 'تعليق جديد على مقالك',
          message: `علق ${user.name} على مقالك: ${article.title}`,
          link: `/articles/${params.id}#comment-${comment.id}`,
          data: {
            article_id: params.id,
            comment_id: comment.id,
            user_id
          }
        });
      }

      // تحديث عدد التعليقات في المقال
      await prisma.article.update({
        where: { id: params.id },
        data: {
          comment_count: { increment: 1 }
        }
      });

      // تحديث عدد الردود في التعليق الأصلي
      if (parent_id) {
        await prisma.articleComment.update({
          where: { id: parent_id },
          data: {
            reply_count: { increment: 1 }
          }
        });
      }
    } else if (moderationResult.status === 'needs_review') {
      // إشعار المشرفين
      await sendNotificationToAdmins({
        type: 'comment_needs_review',
        title: 'تعليق يحتاج مراجعة',
        message: `تعليق من ${user.name} يحتاج مراجعة بشرية`,
        link: `/admin/moderation/comments/${comment.id}`,
        data: {
          comment_id: comment.id,
          user_id,
          article_id: params.id,
          ai_category: moderationResult.ai_response.category,
          risk_score: moderationResult.ai_response.risk_score
        }
      });
    } else if (moderationResult.status === 'rejected') {
      // إشعار المستخدم برفض التعليق
      await sendNotificationToUser(user_id, {
        type: 'comment_rejected',
        title: 'تم رفض تعليقك',
        message: `تم رفض تعليقك بسبب: ${moderationResult.reasons.join(', ')}`,
        link: `/articles/${params.id}`,
        data: {
          comment_id: comment.id,
          reasons: moderationResult.reasons,
          can_appeal: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        comment: updatedComment,
        moderation: {
          status: moderationResult.status,
          reasons: moderationResult.reasons,
          can_appeal: moderationResult.status === 'rejected'
        }
      }
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة التعليق' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/articles/[id]/comments
 * تحديث تعليق موجود
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { comment_id, content, user_id } = body;

    if (!comment_id || !content || !user_id) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { status: 400 }
      );
    }

    // التحقق من وجود التعليق وصاحبه
    const comment = await prisma.articleComment.findUnique({
      where: { id: comment_id },
      include: { user: true }
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    if (comment.user_id !== user_id) {
      return NextResponse.json(
        { success: false, error: 'غير مسموح لك بتعديل هذا التعليق' },
        { status: 403 }
      );
    }

    // التحقق من إمكانية التعديل (خلال 30 دقيقة من النشر)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (comment.created_at < thirtyMinutesAgo) {
      return NextResponse.json(
        { success: false, error: 'انتهت مدة التعديل المسموحة' },
        { status: 400 }
      );
    }

    // إعادة الإشراف على التعليق المحدث
    const moderationResult = await moderateCommentAI({
      comment: content.trim(),
      user_id,
      article_id: params.id,
      lang: 'ar'
    });

    // تحديث التعليق
    const updatedComment = await prisma.articleComment.update({
      where: { id: comment_id },
      data: {
        content: content.trim(),
        status: moderationResult.status,
        ai_category: moderationResult.ai_response.category,
        ai_risk_score: moderationResult.ai_response.risk_score,
        ai_confidence: moderationResult.ai_response.confidence,
        ai_reasons: moderationResult.ai_response.reasons,
        ai_notes: moderationResult.ai_response.notes,
        ai_processed: true,
        ai_processed_at: new Date(),
        is_edited: true,
        edited_at: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image: true
          }
        }
      }
    });

    // إشعار المشرفين إذا احتاج التعليق المحدث لمراجعة
    if (moderationResult.status === 'needs_review') {
      await sendNotificationToAdmins({
        type: 'comment_edited_needs_review',
        title: 'تعليق محدث يحتاج مراجعة',
        message: `تعليق محدث من ${comment.user.name} يحتاج مراجعة`,
        link: `/admin/moderation/comments/${comment_id}`,
        data: {
          comment_id,
          user_id,
          article_id: params.id,
          is_edited: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        comment: updatedComment,
        moderation: {
          status: moderationResult.status,
          reasons: moderationResult.reasons
        }
      }
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التعليق' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[id]/comments
 * حذف تعليق
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const comment_id = searchParams.get('comment_id');
    const user_id = searchParams.get('user_id');

    if (!comment_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { status: 400 }
      );
    }

    // التحقق من وجود التعليق وصاحبه
    const comment = await prisma.articleComment.findUnique({
      where: { id: comment_id }
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    if (comment.user_id !== user_id) {
      return NextResponse.json(
        { success: false, error: 'غير مسموح لك بحذف هذا التعليق' },
        { status: 403 }
      );
    }

    // حذف التعليق (soft delete)
    await prisma.articleComment.update({
      where: { id: comment_id },
      data: {
        status: 'deleted',
        content: '[تم حذف التعليق]'
      }
    });

    // تحديث عدد التعليقات في المقال
    if (comment.status === 'approved') {
      await prisma.article.update({
        where: { id: params.id },
        data: {
          comment_count: { decrement: 1 }
        }
      });

      // تحديث عدد الردود في التعليق الأصلي
      if (comment.parent_id) {
        await prisma.articleComment.update({
          where: { id: comment.parent_id },
          data: {
            reply_count: { decrement: 1 }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف التعليق بنجاح'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التعليق' },
      { status: 500 }
    );
  }
} 