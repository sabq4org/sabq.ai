/**
 * API Routes for Individual Article Management
 * 
 * @description Handles CRUD operations for specific article by ID
 * @author Sabq AI CMS Team
 * @version 1.0.0
 * @created 2024-01-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit-logger';
import { validateUserPermissions } from '@/lib/permissions';
import { generateSlug } from '@/lib/utils';
import { analyzeReadability } from '@/lib/readability';
import { extractKeywords } from '@/lib/seo-utils';
import { processImages } from '@/lib/image-processor';
import { sendNotification } from '@/lib/notification-service';

// Validation schemas
const articleUpdateSchema = z.object({
  title: z.string().min(1, 'عنوان المقال مطلوب').max(200, 'عنوان المقال طويل جداً').optional(),
  content: z.string().min(1, 'محتوى المقال مطلوب').optional(),
  excerpt: z.string().max(500, 'المقتطف طويل جداً').optional(),
  slug: z.string().min(1, 'الرابط التعريفي مطلوب').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'الرابط التعريفي غير صحيح').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
  publishedAt: z.string().datetime().optional(),
  sectionId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  featuredImageUrl: z.string().url().optional(),
  metaTitle: z.string().max(70, 'عنوان SEO طويل جداً').optional(),
  metaDescription: z.string().max(160, 'وصف SEO طويل جداً').optional(),
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.number().min(1).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  allowComments: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isBreaking: z.boolean().optional(),
  customFields: z.record(z.any()).optional(),
  socialMediaConfig: z.object({
    facebook: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().url().optional(),
    }).optional(),
    twitter: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().url().optional(),
    }).optional(),
    linkedin: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().url().optional(),
    }).optional(),
  }).optional(),
});

const paramsSchema = z.object({
  id: z.string().uuid('معرف المقال غير صحيح'),
});

/**
 * Helper function to get article by ID with full details
 */
async function getArticleById(id: string, includeStats: boolean = false) {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              avatar: true,
              bio: true,
              socialLinks: true,
            },
          },
        },
      },
      section: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
        },
      },
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
        },
      },
      comments: includeStats ? {
        select: {
          id: true,
          createdAt: true,
          isApproved: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      } : false,
      views: includeStats ? {
        select: {
          id: true,
          createdAt: true,
          userId: true,
          ipAddress: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      } : false,
      _count: {
        select: {
          comments: true,
          views: true,
          likes: true,
          shares: true,
        },
      },
    },
  });

  if (!article) {
    return null;
  }

  // Calculate additional metrics if stats are requested
  if (includeStats) {
    const analytics = await prisma.analytics.aggregate({
      where: {
        articleId: id,
      },
      _sum: {
        views: true,
        uniqueViews: true,
        readTime: true,
        bounceRate: true,
      },
      _avg: {
        readTime: true,
        bounceRate: true,
        engagementRate: true,
      },
    });

    return {
      ...article,
      analytics,
    };
  }

  return article;
}

/**
 * Helper function to validate article permissions
 */
async function validateArticlePermissions(
  userId: string,
  articleId: string,
  action: 'read' | 'update' | 'delete' | 'publish'
) {
  // Check general permissions
  const hasGeneralPermission = await validateUserPermissions(
    userId,
    'articles',
    action
  );

  if (hasGeneralPermission) {
    return true;
  }

  // Check if user is the author
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { authorId: true },
  });

  if (article?.authorId === userId) {
    return true;
  }

  // Check section-specific permissions
  const articleWithSection = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      section: {
        include: {
          editors: {
            where: { userId },
          },
        },
      },
    },
  });

  return articleWithSection?.section?.editors.length > 0;
}

/**
 * GET /api/articles/[id]
 * Retrieves a specific article by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    // Validate params
    const validatedParams = paramsSchema.parse(params);
    
    // Check permissions
    const hasPermission = await validateArticlePermissions(
      session.user.id,
      validatedParams.id,
      'read'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية لعرض هذا المقال' },
        { status: 403 }
      );
    }

    // Get article with stats
    const article = await getArticleById(validatedParams.id, true);
    
    if (!article) {
      return NextResponse.json(
        { error: 'المقال غير موجود' },
        { status: 404 }
      );
    }

    // Record view if not the author
    if (article.authorId !== session.user.id) {
      await prisma.view.create({
        data: {
          articleId: validatedParams.id,
          userId: session.user.id,
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      }).catch(() => {
        // Ignore duplicate view errors
      });
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'VIEW_ARTICLE',
      resource: 'articles',
      resourceId: article.id,
      metadata: {
        title: article.title,
        slug: article.slug,
        status: article.status,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: article,
      message: 'تم جلب المقال بنجاح',
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'معرف المقال غير صحيح',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Log error
    await logAuditEvent({
      userId: session?.user?.id || 'unknown',
      action: 'VIEW_ARTICLE_ERROR',
      resource: 'articles',
      resourceId: params.id,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في جلب المقال',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/articles/[id]
 * Updates a specific article
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    // Validate params
    const validatedParams = paramsSchema.parse(params);
    
    // Check permissions
    const hasPermission = await validateArticlePermissions(
      session.user.id,
      validatedParams.id,
      'update'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية لتحديث هذا المقال' },
        { status: 403 }
      );
    }

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: validatedParams.id },
    });
    
    if (!existingArticle) {
      return NextResponse.json(
        { error: 'المقال غير موجود' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = articleUpdateSchema.parse(body);

    // Generate slug if title is provided and slug is not
    if (validatedData.title && !validatedData.slug) {
      validatedData.slug = generateSlug(validatedData.title);
    }

    // Check for duplicate slug (if slug is being updated)
    if (validatedData.slug && validatedData.slug !== existingArticle.slug) {
      const duplicateArticle = await prisma.article.findFirst({
        where: {
          slug: validatedData.slug,
          id: { not: validatedParams.id },
        },
      });

      if (duplicateArticle) {
        return NextResponse.json(
          { error: 'يوجد مقال آخر بنفس الرابط التعريفي' },
          { status: 400 }
        );
      }
    }

    // Process content if provided
    let processedContent = validatedData.content;
    let readingTime = validatedData.readingTime;
    let keywords = validatedData.keywords;

    if (validatedData.content) {
      // Process images in content
      processedContent = await processImages(validatedData.content);
      
      // Calculate reading time
      const words = validatedData.content.split(/\s+/).length;
      readingTime = Math.ceil(words / 200); // 200 words per minute

      // Extract keywords if not provided
      if (!keywords) {
        keywords = extractKeywords(validatedData.content);
      }

      // Analyze readability
      const readabilityScore = analyzeReadability(validatedData.content);
      
      // Add readability to custom fields
      validatedData.customFields = {
        ...validatedData.customFields,
        readabilityScore,
      };
    }

    // Check publication permissions
    if (validatedData.status === 'PUBLISHED') {
      const hasPublishPermission = await validateArticlePermissions(
        session.user.id,
        validatedParams.id,
        'publish'
      );

      if (!hasPublishPermission) {
        return NextResponse.json(
          { error: 'لا تملك صلاحية لنشر هذا المقال' },
          { status: 403 }
        );
      }

      // Set published date if not provided
      if (!validatedData.publishedAt) {
        validatedData.publishedAt = new Date().toISOString();
      }
    }

    // Update article
    const updatedArticle = await prisma.article.update({
      where: { id: validatedParams.id },
      data: {
        ...validatedData,
        content: processedContent,
        readingTime,
        keywords,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : undefined,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            comments: true,
            views: true,
            likes: true,
            shares: true,
          },
        },
      },
    });

    // Send notifications if article was published
    if (validatedData.status === 'PUBLISHED' && existingArticle.status !== 'PUBLISHED') {
      await sendNotification({
        type: 'ARTICLE_PUBLISHED',
        articleId: updatedArticle.id,
        title: updatedArticle.title,
        authorId: updatedArticle.authorId,
        sectionId: updatedArticle.sectionId,
      });
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'UPDATE_ARTICLE',
      resource: 'articles',
      resourceId: updatedArticle.id,
      metadata: {
        title: updatedArticle.title,
        slug: updatedArticle.slug,
        status: updatedArticle.status,
        changes: validatedData,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedArticle,
      message: 'تم تحديث المقال بنجاح',
    });

  } catch (error) {
    console.error('Error updating article:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Log error
    await logAuditEvent({
      userId: session?.user?.id || 'unknown',
      action: 'UPDATE_ARTICLE_ERROR',
      resource: 'articles',
      resourceId: params.id,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في تحديث المقال',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[id]
 * Deletes a specific article (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    // Validate params
    const validatedParams = paramsSchema.parse(params);
    
    // Check permissions
    const hasPermission = await validateArticlePermissions(
      session.user.id,
      validatedParams.id,
      'delete'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية لحذف هذا المقال' },
        { status: 403 }
      );
    }

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: validatedParams.id },
    });
    
    if (!existingArticle) {
      return NextResponse.json(
        { error: 'المقال غير موجود' },
        { status: 404 }
      );
    }

    // Check if article is published (require admin for published articles)
    if (existingArticle.status === 'PUBLISHED') {
      const hasAdminPermission = await validateUserPermissions(
        session.user.id,
        'articles',
        'admin'
      );

      if (!hasAdminPermission) {
        return NextResponse.json(
          { error: 'لا يمكن حذف المقال المنشور بدون صلاحية المدير' },
          { status: 403 }
        );
      }
    }

    // Soft delete article
    const deletedArticle = await prisma.article.update({
      where: { id: validatedParams.id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Send notification
    await sendNotification({
      type: 'ARTICLE_DELETED',
      articleId: deletedArticle.id,
      title: deletedArticle.title,
      authorId: deletedArticle.authorId,
      sectionId: deletedArticle.sectionId,
      deletedBy: session.user.id,
    });

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'DELETE_ARTICLE',
      resource: 'articles',
      resourceId: deletedArticle.id,
      metadata: {
        title: deletedArticle.title,
        slug: deletedArticle.slug,
        status: existingArticle.status,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: deletedArticle,
      message: 'تم حذف المقال بنجاح',
    });

  } catch (error) {
    console.error('Error deleting article:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'معرف المقال غير صحيح',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Log error
    await logAuditEvent({
      userId: session?.user?.id || 'unknown',
      action: 'DELETE_ARTICLE_ERROR',
      resource: 'articles',
      resourceId: params.id,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في حذف المقال',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
} 