import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { logAuthEvent } from '@/lib/audit-log';
import { sanitizeInput } from '@/lib/security';
import { generateSlug } from '@/lib/utils-simple';

const prisma = new PrismaClient();

// مخطط التحقق من بيانات المقالة
const articleSchema = z.object({
  title: z.string()
    .min(5, 'العنوان قصير جداً')
    .max(200, 'العنوان طويل جداً'),
  content: z.string()
    .min(50, 'المحتوى قصير جداً')
    .max(50000, 'المحتوى طويل جداً'),
  excerpt: z.string()
    .min(10, 'المقتطف قصير جداً')
    .max(500, 'المقتطف طويل جداً'),
  sectionId: z.string().uuid('معرف القسم غير صحيح'),
  tags: z.array(z.string()).max(10, 'عدد الوسوم كبير جداً'),
  status: z.enum(['draft', 'published', 'archived'], {
    errorMap: () => ({ message: 'حالة المقالة غير صحيحة' })
  }),
  featuredImage: z.string().url().optional(),
  publishAt: z.string().datetime().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  allowComments: z.boolean().default(true),
  isPremium: z.boolean().default(false)
});

// مخطط التحقق من معاملات البحث
const querySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  section: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  author: z.string().optional(),
  tags: z.string().optional(),
  sortBy: z.enum(['createdAt', 'publishedAt', 'title', 'views']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  featured: z.string().transform(val => val === 'true').optional(),
  premium: z.string().transform(val => val === 'true').optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // التحقق من صحة المعاملات
    const queryValidation = querySchema.safeParse(Object.fromEntries(searchParams));
    
    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'معاملات البحث غير صحيحة', details: queryValidation.error.errors },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      search,
      section,
      status,
      author,
      tags,
      sortBy,
      sortOrder,
      featured,
      premium
    } = queryValidation.data;

    // بناء شروط البحث
    const where: any = {};

    // فلترة حسب الحالة
    if (status) {
      where.status = status;
    } else if (!session || session.user?.role !== 'admin') {
      // عرض المقالات المنشورة فقط للمستخدمين العاديين
      where.status = 'published';
      where.publishedAt = { lte: new Date() };
    }

    // البحث النصي
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ];
    }

    // فلترة حسب القسم
    if (section) {
      where.sectionId = section;
    }

    // فلترة حسب المؤلف
    if (author) {
      where.authorId = author;
    }

    // فلترة حسب الوسوم
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      where.tags = {
        hasSome: tagList
      };
    }

    // فلترة المقالات المميزة
    if (featured !== undefined) {
      where.featured = featured;
    }

    // فلترة المقالات المدفوعة
    if (premium !== undefined) {
      where.isPremium = premium;
    }

    // حساب التخطي والترتيب
    const skip = (page - 1) * limit;
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // جلب المقالات مع الإحصائيات
    const [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  avatar: true
                }
              }
            }
          },
          section: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    // تنظيف البيانات للإرجاع
    const cleanedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
      status: article.status,
      featured: article.featured,
      isPremium: article.isPremium,
      views: article.views,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      readingTime: article.readingTime,
      tags: article.tags,
      author: article.author,
      section: article.section,
      stats: {
        comments: article._count.comments,
        likes: article._count.likes,
        shares: article.shares || 0
      }
    }));

    // حساب معلومات التصفح
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // تسجيل الوصول
    await logAuthEvent({
      type: 'articles_accessed',
      ip,
      userId: session?.user?.id,
      success: true,
      reason: 'جلب قائمة المقالات',
      details: {
        page,
        limit,
        search,
        totalCount
      }
    });

    return NextResponse.json({
      articles: cleanedArticles,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      },
      filters: {
        search,
        section,
        status,
        author,
        tags,
        featured,
        premium
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المقالات:', error);

    await logAuthEvent({
      type: 'articles_access_error',
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      success: false,
      reason: 'خطأ داخلي في الخادم',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });

    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المقالات' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'المستخدم غير مسجل دخول' },
        { status: 401 }
      );
    }

    // التحقق من صلاحيات النشر
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        role: {
          select: {
            permissions: true
          }
        }
      }
    });

    if (!user || !user.role.permissions.includes('write_articles')) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لإنشاء المقالات' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // التحقق من صحة البيانات
    const validationResult = articleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'بيانات المقالة غير صحيحة',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const articleData = validationResult.data;

    // تنظيف وتجهيز البيانات
    const cleanTitle = sanitizeInput(articleData.title);
    const cleanContent = sanitizeInput(articleData.content);
    const cleanExcerpt = sanitizeInput(articleData.excerpt);
    
    // إنشاء الـ slug
    const slug = generateSlug(cleanTitle);
    
    // التحقق من عدم تكرار الـ slug
    const existingSlug = await prisma.article.findUnique({
      where: { slug }
    });

    const finalSlug = existingSlug 
      ? `${slug}-${Date.now()}`
      : slug;

    // حساب وقت القراءة (تقريبياً 200 كلمة في الدقيقة)
    const wordCount = cleanContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // التحقق من صحة القسم
    const section = await prisma.section.findUnique({
      where: { id: articleData.sectionId }
    });

    if (!section) {
      return NextResponse.json(
        { error: 'القسم المحدد غير موجود' },
        { status: 400 }
      );
    }

    // تحديد وقت النشر
    const publishedAt = articleData.status === 'published' 
      ? (articleData.publishAt ? new Date(articleData.publishAt) : new Date())
      : null;

    // إنشاء المقالة
    const newArticle = await prisma.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          title: cleanTitle,
          slug: finalSlug,
          content: cleanContent,
          excerpt: cleanExcerpt,
          authorId: user.id,
          sectionId: articleData.sectionId,
          status: articleData.status,
          tags: articleData.tags,
          featuredImage: articleData.featuredImage || null,
          publishedAt,
          readingTime,
          metaTitle: articleData.metaTitle || cleanTitle.substring(0, 60),
          metaDescription: articleData.metaDescription || cleanExcerpt.substring(0, 160),
          allowComments: articleData.allowComments,
          isPremium: articleData.isPremium,
          featured: false,
          views: 0,
          shares: 0
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  avatar: true
                }
              }
            }
          },
          section: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      // إضافة إشعار للمتابعين إذا كانت المقالة منشورة
      if (articleData.status === 'published') {
        await tx.notification.createMany({
          data: await getFollowersNotifications(user.id, article.id, article.title)
        });
      }

      // تحديث إحصائيات المؤلف
      await tx.user.update({
        where: { id: user.id },
        data: {
          articlesCount: {
            increment: 1
          }
        }
      });

      // تحديث إحصائيات القسم
      await tx.section.update({
        where: { id: articleData.sectionId },
        data: {
          articlesCount: {
            increment: 1
          }
        }
      });

      return article;
    });

    // تسجيل إنشاء المقالة
    await logAuthEvent({
      type: 'article_created',
      ip,
      userId: user.id,
      email: user.email,
      success: true,
      reason: 'إنشاء مقالة جديدة',
      details: {
        articleId: newArticle.id,
        title: newArticle.title,
        status: newArticle.status
      }
    });

    return NextResponse.json(
      {
        message: 'تم إنشاء المقالة بنجاح',
        article: {
          id: newArticle.id,
          title: newArticle.title,
          slug: newArticle.slug,
          status: newArticle.status,
          publishedAt: newArticle.publishedAt,
          createdAt: newArticle.createdAt,
          author: newArticle.author,
          section: newArticle.section
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('خطأ في إنشاء المقالة:', error);

    await logAuthEvent({
      type: 'article_creation_error',
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      success: false,
      reason: 'خطأ داخلي في الخادم',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });

    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المقالة' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// إنشاء إشعارات للمتابعين
async function getFollowersNotifications(authorId: string, articleId: string, title: string) {
  const followers = await prisma.userFollow.findMany({
    where: { followingId: authorId },
    select: { followerId: true }
  });

  return followers.map(follow => ({
    userId: follow.followerId,
    type: 'new_article',
    title: 'مقالة جديدة',
    message: `تم نشر مقالة جديدة: ${title}`,
    data: {
      articleId,
      authorId
    },
    read: false
  }));
} 