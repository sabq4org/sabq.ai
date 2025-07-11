import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { validateInput, sanitizeHtml } from '@/lib/security';

const prisma = new PrismaClient();

// Validation schemas
const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  summary: z.string().optional(),
  featured_image: z.string().url().optional(),
  category_id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived', 'in_review']).default('draft'),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  scheduled_at: z.string().datetime().optional(),
  seo_data: z.object({
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional()
});

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  featured: z.boolean().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['created_at', 'updated_at', 'published_at', 'title', 'view_count']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional()
});

/**
 * GET /api/articles
 * جلب قائمة المقالات مع البحث والفلترة
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // التحقق من صحة المعاملات
    const params = searchSchema.parse({
      q: searchParams.get('q'),
      status: searchParams.get('status'),
      category: searchParams.get('category'),
      author: searchParams.get('author'),
      featured: searchParams.get('featured') === 'true',
      tags: searchParams.get('tags'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to')
    });

    // بناء شروط البحث
    const whereClause: any = {};

    // البحث النصي
    if (params.q) {
      whereClause.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { summary: { contains: params.q, mode: 'insensitive' } },
        { content: { contains: params.q, mode: 'insensitive' } }
      ];
    }

    // فلترة حسب الحالة
    if (params.status) {
      whereClause.status = params.status;
    }

    // فلترة حسب الفئة
    if (params.category) {
      whereClause.category_id = params.category;
    }

    // فلترة حسب الكاتب
    if (params.author) {
      whereClause.author_id = params.author;
    }

    // فلترة المقالات المميزة
    if (params.featured !== undefined) {
      whereClause.featured = params.featured;
    }

    // فلترة حسب الوسوم
    if (params.tags) {
      const tagsList = params.tags.split(',');
      whereClause.article_tags = {
        some: {
          tag: {
            slug: { in: tagsList }
          }
        }
      };
    }

    // فلترة حسب التاريخ
    if (params.date_from || params.date_to) {
      whereClause.created_at = {};
      if (params.date_from) {
        whereClause.created_at.gte = new Date(params.date_from);
      }
      if (params.date_to) {
        whereClause.created_at.lte = new Date(params.date_to);
      }
    }

    // حساب الإزاحة للصفحات
    const skip = (params.page - 1) * params.limit;

    // ترتيب النتائج
    const orderBy: any = {};
    orderBy[params.sort] = params.order;

    // جلب المقالات
    const [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where: whereClause,
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          author: {
            select: { id: true, name: true, email: true }
          },
          article_tags: {
            include: {
              tag: {
                select: { id: true, name: true, slug: true }
              }
            }
          },
          _count: {
            select: {
              comments: true,
              article_likes: true,
              revisions: true
            }
          }
        },
        orderBy,
        skip,
        take: params.limit
      }),
      prisma.article.count({ where: whereClause })
    ]);

    // تنسيق النتائج
    const formattedArticles = articles.map(article => ({
      ...article,
      tags: article.article_tags.map(at => at.tag),
      article_tags: undefined,
      stats: {
        comments: article._count.comments,
        likes: article._count.article_likes,
        revisions: article._count.revisions
      },
      _count: undefined
    }));

    return NextResponse.json({
      success: true,
      data: {
        articles: formattedArticles,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / params.limit)
        },
        filters: {
          q: params.q,
          status: params.status,
          category: params.category,
          author: params.author,
          featured: params.featured,
          tags: params.tags
        }
      }
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    
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
 * POST /api/articles
 * إنشاء مقال جديد
 */
export async function POST(request: NextRequest) {
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
    if (!['editor', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // التحقق من صحة البيانات
    const validatedData = createArticleSchema.parse(body);

    // تنظيف المحتوى من أكواد خبيثة
    const sanitizedContent = sanitizeHtml(validatedData.content);

    // التحقق من عدم تكرار الـ slug
    const existingArticle = await prisma.article.findUnique({
      where: { slug: validatedData.slug }
    });

    if (existingArticle) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 409 }
      );
    }

    // التحقق من وجود الفئة
    const category = await prisma.category.findUnique({
      where: { id: validatedData.category_id }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // حساب وقت القراءة التقديري
    const wordCount = sanitizedContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 كلمة في الدقيقة

    // إنشاء المقال
    const article = await prisma.$transaction(async (tx) => {
      // إنشاء المقال
      const newArticle = await tx.article.create({
        data: {
          title: validatedData.title,
          slug: validatedData.slug,
          content: sanitizedContent,
          summary: validatedData.summary,
          featured_image: validatedData.featured_image,
          category_id: validatedData.category_id,
          author_id: user.id,
          status: validatedData.status,
          featured: validatedData.featured,
          reading_time: readingTime,
          seo_data: validatedData.seo_data,
          scheduled_at: validatedData.scheduled_at ? new Date(validatedData.scheduled_at) : null,
          published_at: validatedData.status === 'published' ? new Date() : null
        }
      });

      // إضافة الوسوم إذا كانت موجودة
      if (validatedData.tags && validatedData.tags.length > 0) {
        for (const tagName of validatedData.tags) {
          // البحث عن الوسم أو إنشاؤه
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: { usage_count: { increment: 1 } },
            create: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, '-'),
              usage_count: 1
            }
          });

          // ربط الوسم بالمقال
          await tx.articleTag.create({
            data: {
              article_id: newArticle.id,
              tag_id: tag.id
            }
          });
        }
      }

      // إنشاء أول مراجعة
      await tx.articleRevision.create({
        data: {
          article_id: newArticle.id,
          title: validatedData.title,
          content: sanitizedContent,
          summary: validatedData.summary,
          author_id: user.id,
          revision_number: 1,
          change_summary: 'Initial version'
        }
      });

      // إنشاء حالة سير العمل
      await tx.workflowStatus.create({
        data: {
          article_id: newArticle.id,
          status: validatedData.status,
          changed_by: user.id,
          notes: 'Article created'
        }
      });

      return newArticle;
    });

    // جلب المقال مع العلاقات
    const fullArticle = await prisma.article.findUnique({
      where: { id: article.id },
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
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating article:', error);
    
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