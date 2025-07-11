/**
 * API Routes for Individual Article Management
 * 
 * @description Handles CRUD operations for specific article by ID
 * @author Sabq AI CMS Team
 * @version 1.0.0
 * @created 2024-01-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { sanitizeHtml } from '@/lib/security';

const prisma = new PrismaClient();

const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().optional(),
  featured_image: z.string().url().optional().nullable(),
  category_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived', 'in_review']).optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  scheduled_at: z.string().datetime().optional().nullable(),
  seo_data: z.object({
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional(),
  change_summary: z.string().optional()
});

/**
 * GET /api/articles/[id]
 * جلب تفاصيل مقال محدد
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // التحقق من صحة معرف المقال
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    // جلب المقال مع جميع العلاقات
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true, color: true }
        },
        author: {
          select: { id: true, name: true, email: true, avatar_url: true }
        },
        article_tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true, color: true }
            }
          }
        },
        revisions: {
          include: {
            author: {
              select: { id: true, name: true }
            }
          },
          orderBy: { revision_number: 'desc' },
          take: 10 // آخر 10 مراجعات
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar_url: true }
            },
            added_by_user: {
              select: { id: true, name: true }
            }
          }
        },
        workflow_status: {
          include: {
            assignee: {
              select: { id: true, name: true }
            },
            changer: {
              select: { id: true, name: true }
            }
          },
          orderBy: { changed_at: 'desc' },
          take: 5 // آخر 5 تغييرات في حالة سير العمل
        },
        _count: {
          select: {
            comments: true,
            article_likes: true,
            analytics_events: {
              where: { event_type: 'page_view' }
            }
          }
        }
      }
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // تنسيق النتائج
    const formattedArticle = {
      ...article,
      tags: article.article_tags.map(at => at.tag),
      article_tags: undefined,
      stats: {
        comments: article._count.comments,
        likes: article._count.article_likes,
        views: article._count.analytics_events
      },
      _count: undefined
    };

    return NextResponse.json({
      success: true,
      data: { article: formattedArticle }
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/articles/[id]
 * تحديث مقال موجود
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

    // التحقق من صحة معرف المقال
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    // التحقق من وجود المقال
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        collaborators: true
      }
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحيات
    const canEdit = 
      user.role === 'admin' ||
      existingArticle.author_id === user.id ||
      existingArticle.collaborators.some(c => 
        c.user_id === user.id && ['editor', 'reviewer'].includes(c.role)
      );

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this article' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateArticleSchema.parse(body);

    // التحقق من عدم تكرار الـ slug (إذا تم تغييره)
    if (validatedData.slug && validatedData.slug !== existingArticle.slug) {
      const slugExists = await prisma.article.findUnique({
        where: { slug: validatedData.slug }
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 409 }
        );
      }
    }

    // تنظيف المحتوى إذا تم تحديثه
    let sanitizedContent = existingArticle.content;
    if (validatedData.content) {
      sanitizedContent = sanitizeHtml(validatedData.content);
    }

    // حساب وقت القراءة التقديري
    let readingTime = existingArticle.reading_time;
    if (validatedData.content) {
      const wordCount = sanitizedContent.split(/\s+/).length;
      readingTime = Math.ceil(wordCount / 200);
    }

    // تحديث المقال
    const updatedArticle = await prisma.$transaction(async (tx) => {
      // الحصول على رقم المراجعة التالي
      const lastRevision = await tx.articleRevision.findFirst({
        where: { article_id: id },
        orderBy: { revision_number: 'desc' }
      });

      const nextRevisionNumber = (lastRevision?.revision_number || 0) + 1;

      // تحديث المقال
      const article = await tx.article.update({
        where: { id },
        data: {
          ...(validatedData.title && { title: validatedData.title }),
          ...(validatedData.slug && { slug: validatedData.slug }),
          ...(validatedData.content && { content: sanitizedContent }),
          ...(validatedData.summary !== undefined && { summary: validatedData.summary }),
          ...(validatedData.featured_image !== undefined && { featured_image: validatedData.featured_image }),
          ...(validatedData.category_id && { category_id: validatedData.category_id }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.featured !== undefined && { featured: validatedData.featured }),
          ...(validatedData.scheduled_at !== undefined && { 
            scheduled_at: validatedData.scheduled_at ? new Date(validatedData.scheduled_at) : null 
          }),
          ...(validatedData.seo_data && { seo_data: validatedData.seo_data }),
          ...(validatedData.content && { reading_time: readingTime }),
          ...(validatedData.status === 'published' && !existingArticle.published_at && { 
            published_at: new Date() 
          }),
          updated_at: new Date()
        }
      });

      // إنشاء مراجعة جديدة إذا تم تغيير المحتوى الأساسي
      if (validatedData.title || validatedData.content || validatedData.summary) {
        await tx.articleRevision.create({
          data: {
            article_id: id,
            title: validatedData.title || existingArticle.title,
            content: sanitizedContent,
            summary: validatedData.summary !== undefined ? validatedData.summary : existingArticle.summary,
            author_id: user.id,
            revision_number: nextRevisionNumber,
            change_summary: validatedData.change_summary || 'Content updated'
          }
        });
      }

      // تحديث الوسوم إذا تم تمريرها
      if (validatedData.tags) {
        // حذف الوسوم الحالية
        await tx.articleTag.deleteMany({
          where: { article_id: id }
        });

        // إضافة الوسوم الجديدة
        for (const tagName of validatedData.tags) {
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: { usage_count: { increment: 1 } },
            create: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, '-'),
              usage_count: 1
            }
          });

          await tx.articleTag.create({
            data: {
              article_id: id,
              tag_id: tag.id
            }
          });
        }
      }

      // تحديث حالة سير العمل إذا تغيرت الحالة
      if (validatedData.status && validatedData.status !== existingArticle.status) {
        await tx.workflowStatus.create({
          data: {
            article_id: id,
            status: validatedData.status,
            changed_by: user.id,
            notes: `Status changed from ${existingArticle.status} to ${validatedData.status}`
          }
        });
      }

      return article;
    });

    // جلب المقال المحدث مع العلاقات
    const fullArticle = await prisma.article.findUnique({
      where: { id },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true }
        },
        article_tags: {
          include: { tag: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        article: {
          ...fullArticle,
          tags: fullArticle?.article_tags.map(at => at.tag) || [],
          article_tags: undefined
        }
      }
    });

  } catch (error) {
    console.error('Error updating article:', error);
    
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
 * DELETE /api/articles/[id]
 * حذف مقال (soft delete للمقالات المنشورة)
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

    // التحقق من صحة معرف المقال
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    // التحقق من وجود المقال
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحيات
    const canDelete = 
      user.role === 'admin' ||
      (existingArticle.author_id === user.id && existingArticle.status === 'draft');

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this article' },
        { status: 403 }
      );
    }

    // حذف ناعم للمقالات المنشورة، حذف فعلي للمسودات
    if (existingArticle.status === 'published') {
      // حذف ناعم - تغيير الحالة إلى archived
      await prisma.$transaction(async (tx) => {
        await tx.article.update({
          where: { id },
          data: {
            status: 'archived',
            archived_at: new Date()
          }
        });

        await tx.workflowStatus.create({
          data: {
            article_id: id,
            status: 'archived',
            changed_by: user.id,
            notes: 'Article archived (soft delete)'
          }
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Article archived successfully'
      });
    } else {
      // حذف فعلي للمسودات
      await prisma.article.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: 'Article deleted successfully'
      });
    }

  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 