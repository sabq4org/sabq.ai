/**
 * مسارات إدارة المقالات (CRUD Operations)
 * Articles Management Routes
 * @version 2.1.0
 * @author Sabq AI Team
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { requirePermission } from "../middleware/permissions";
import { ApiError } from "../utils/errors";
import { trackEvent } from "../utils/analytics";
import { generateSlug } from "../utils/helpers";

const router = Router();

// مخططات التحقق من الصحة
const createArticleSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب").max(200, "العنوان طويل جداً"),
  summary: z.string().min(1, "الملخص مطلوب").max(500, "الملخص طويل جداً"),
  content: z.string().min(1, "المحتوى مطلوب"),
  categoryId: z.string().uuid("معرف التصنيف غير صالح"),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  publishedAt: z.string().datetime().optional(),
  featured: z.boolean().default(false),
});

const updateArticleSchema = createArticleSchema.partial();

const querySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(["draft", "published", "archived", "all"]).optional(),
  sort: z.enum(["newest", "oldest", "popular", "views"]).default("newest"),
  featured: z.string().transform(val => val === "true").optional(),
});

// الحصول على جميع المقالات مع الفلترة والبحث
router.get("/",
  validateRequest(querySchema, "query"),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const { page = 1, limit = 20, search, category, author, status, sort, featured } = req.query as any;

      // بناء شروط البحث
      const where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { summary: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ];
      }

      if (category) {
        where.categoryId = category;
      }

      if (author) {
        where.authorId = author;
      }

      if (status && status !== "all") {
        where.status = status;
      } else if (!status) {
        where.status = "published";
      }

      if (featured !== undefined) {
        where.featured = featured;
      }

      // بناء ترتيب النتائج
      let orderBy: any = {};
      switch (sort) {
        case "oldest":
          orderBy = { publishedAt: "asc" };
          break;
        case "popular":
          orderBy = { likesCount: "desc" };
          break;
        case "views":
          orderBy = { viewsCount: "desc" };
          break;
        default:
          orderBy = { publishedAt: "desc" };
      }

      // حساب الإزاحة
      const skip = (page - 1) * limit;

      // جلب المقالات
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
            _count: {
              select: {
                comments: true,
                analytics: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.article.count({ where }),
      ]);

      // تحضير النتائج
      const formattedArticles = articles.map(article => ({
        ...article,
        tags: article.tags.map(at => at.tag),
        commentsCount: article._count.comments,
        analyticsCount: article._count.analytics,
        _count: undefined,
      }));

      res.json({
        success: true,
        articles: formattedArticles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// الحصول على مقال بواسطة المعرف أو الـ slug
router.get("/:identifier",
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const { identifier } = req.params;

      // تحديد ما إذا كان المعرف UUID أم slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

      const article = await prisma.article.findFirst({
        where: isUuid ? { id: identifier } : { slug: identifier },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              bio: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              color: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          comments: {
            where: { status: "approved" },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!article) {
        throw new ApiError(404, "المقال غير موجود");
      }

      // زيادة عدد المشاهدات
      await prisma.article.update({
        where: { id: article.id },
        data: { viewsCount: { increment: 1 } },
      });

      // تتبع مشاهدة المقال
      await trackEvent(prisma, {
        type: "ARTICLE_VIEW",
        data: {
          articleId: article.id,
          articleTitle: article.title,
          category: article.category.name,
          timestamp: new Date(),
        },
      });

      // تحضير النتيجة
      const formattedArticle = {
        ...article,
        tags: article.tags.map(at => at.tag),
        commentsCount: article.comments.length,
      };

      res.json({
        success: true,
        article: formattedArticle,
      });
    } catch (error) {
      next(error);
    }
  }
);

// إنشاء مقال جديد
router.post("/",
  authenticateToken,
  requirePermission("create:article"),
  validateRequest(createArticleSchema),
  async (req: Request & { prisma?: PrismaClient, user?: any }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const userId = req.user.id;
      const { title, summary, content, categoryId, tags, imageUrl, imageAlt, metaTitle, metaDescription, status, publishedAt, featured } = req.body;

      // إنشاء slug فريد
      const baseSlug = generateSlug(title);
      let slug = baseSlug;
      let counter = 1;

      while (await prisma.article.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // إنشاء المقال
      const article = await prisma.article.create({
        data: {
          title,
          slug,
          summary,
          content,
          authorId: userId,
          categoryId,
          imageUrl,
          imageAlt,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || summary,
          status,
          publishedAt: status === "published" ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
          featured,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // إضافة العلامات
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // البحث عن العلامة أو إنشاؤها
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: {
              name: tagName,
              slug: generateSlug(tagName),
            },
          });

          // ربط العلامة بالمقال
          await prisma.articleTag.create({
            data: {
              articleId: article.id,
              tagId: tag.id,
            },
          });
        }
      }

      // تتبع إنشاء المقال
      await trackEvent(prisma, {
        type: "ARTICLE_CREATED",
        userId,
        data: {
          articleId: article.id,
          articleTitle: article.title,
          status: article.status,
          timestamp: new Date(),
        },
      });

      res.status(201).json({
        success: true,
        message: "تم إنشاء المقال بنجاح",
        article,
      });
    } catch (error) {
      next(error);
    }
  }
);

// تحديث مقال
router.put("/:id",
  authenticateToken,
  requirePermission("update:article"),
  validateRequest(updateArticleSchema),
  async (req: Request & { prisma?: PrismaClient, user?: any }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;

      // التحقق من وجود المقال
      const existingArticle = await prisma.article.findUnique({
        where: { id },
        include: { author: true },
      });

      if (!existingArticle) {
        throw new ApiError(404, "المقال غير موجود");
      }

      // التحقق من الصلاحية
      const userRoles = req.user.roles || [];
      const isOwner = existingArticle.authorId === userId;
      const canUpdateAny = userRoles.includes("admin") || userRoles.includes("editor");

      if (!isOwner && !canUpdateAny) {
        throw new ApiError(403, "ليس لديك صلاحية لتعديل هذا المقال");
      }

      // تحديث الـ slug إذا تم تغيير العنوان
      if (updateData.title && updateData.title !== existingArticle.title) {
        const baseSlug = generateSlug(updateData.title);
        let slug = baseSlug;
        let counter = 1;

        while (await prisma.article.findFirst({ where: { slug, NOT: { id } } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        updateData.slug = slug;
      }

      // تحديث تاريخ النشر إذا تم تغيير الحالة إلى منشور
      if (updateData.status === "published" && existingArticle.status !== "published") {
        updateData.publishedAt = updateData.publishedAt ? new Date(updateData.publishedAt) : new Date();
      }

      // تحديث المقال
      const article = await prisma.article.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // تحديث العلامات إذا تم تمريرها
      if (updateData.tags) {
        // حذف العلامات الحالية
        await prisma.articleTag.deleteMany({
          where: { articleId: id },
        });

        // إضافة العلامات الجديدة
        for (const tagName of updateData.tags) {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: {
              name: tagName,
              slug: generateSlug(tagName),
            },
          });

          await prisma.articleTag.create({
            data: {
              articleId: id,
              tagId: tag.id,
            },
          });
        }
      }

      // تتبع تحديث المقال
      await trackEvent(prisma, {
        type: "ARTICLE_UPDATED",
        userId,
        data: {
          articleId: article.id,
          articleTitle: article.title,
          changes: Object.keys(updateData),
          timestamp: new Date(),
        },
      });

      res.json({
        success: true,
        message: "تم تحديث المقال بنجاح",
        article,
      });
    } catch (error) {
      next(error);
    }
  }
);

// حذف مقال
router.delete("/:id",
  authenticateToken,
  requirePermission("delete:article"),
  async (req: Request & { prisma?: PrismaClient, user?: any }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const userId = req.user.id;
      const { id } = req.params;

      // التحقق من وجود المقال
      const article = await prisma.article.findUnique({
        where: { id },
        include: { author: true },
      });

      if (!article) {
        throw new ApiError(404, "المقال غير موجود");
      }

      // التحقق من الصلاحية
      const userRoles = req.user.roles || [];
      const isOwner = article.authorId === userId;
      const canDeleteAny = userRoles.includes("admin");

      if (!isOwner && !canDeleteAny) {
        throw new ApiError(403, "ليس لديك صلاحية لحذف هذا المقال");
      }

      // حذف المقال (سيتم حذف العلاقات تلقائياً بسبب CASCADE)
      await prisma.article.delete({
        where: { id },
      });

      // تتبع حذف المقال
      await trackEvent(prisma, {
        type: "ARTICLE_DELETED",
        userId,
        data: {
          articleId: id,
          articleTitle: article.title,
          timestamp: new Date(),
        },
      });

      res.json({
        success: true,
        message: "تم حذف المقال بنجاح",
      });
    } catch (error) {
      next(error);
    }
  }
);

// نشر/إلغاء نشر مقال
router.patch("/:id/publish",
  authenticateToken,
  requirePermission("publish:article"),
  async (req: Request & { prisma?: PrismaClient, user?: any }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const userId = req.user.id;
      const { id } = req.params;
      const { publish } = req.body;

      const article = await prisma.article.findUnique({
        where: { id },
      });

      if (!article) {
        throw new ApiError(404, "المقال غير موجود");
      }

      const newStatus = publish ? "published" : "draft";
      const publishedAt = publish ? new Date() : null;

      const updatedArticle = await prisma.article.update({
        where: { id },
        data: {
          status: newStatus,
          publishedAt,
        },
      });

      // تتبع تغيير حالة النشر
      await trackEvent(prisma, {
        type: publish ? "ARTICLE_PUBLISHED" : "ARTICLE_UNPUBLISHED",
        userId,
        data: {
          articleId: id,
          articleTitle: article.title,
          timestamp: new Date(),
        },
      });

      res.json({
        success: true,
        message: publish ? "تم نشر المقال بنجاح" : "تم إلغاء نشر المقال بنجاح",
        article: updatedArticle,
      });
    } catch (error) {
      next(error);
    }
  }
);

// إضافة/إزالة إعجاب
router.post("/:id/like",
  authenticateToken,
  async (req: Request & { prisma?: PrismaClient, user?: any }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const userId = req.user.id;
      const { id } = req.params;

      const article = await prisma.article.findUnique({
        where: { id },
      });

      if (!article) {
        throw new ApiError(404, "المقال غير موجود");
      }

      // البحث عن إعجاب سابق
      const existingLike = await prisma.articleLike.findUnique({
        where: {
          articleId_userId: {
            articleId: id,
            userId,
          },
        },
      });

      if (existingLike) {
        // إزالة الإعجاب
        await prisma.articleLike.delete({
          where: { id: existingLike.id },
        });

        await prisma.article.update({
          where: { id },
          data: { likesCount: { decrement: 1 } },
        });

        res.json({
          success: true,
          message: "تم إزالة الإعجاب",
          liked: false,
        });
      } else {
        // إضافة الإعجاب
        await prisma.articleLike.create({
          data: {
            articleId: id,
            userId,
          },
        });

        await prisma.article.update({
          where: { id },
          data: { likesCount: { increment: 1 } },
        });

        // تتبع الإعجاب
        await trackEvent(prisma, {
          type: "ARTICLE_LIKED",
          userId,
          data: {
            articleId: id,
            articleTitle: article.title,
            timestamp: new Date(),
          },
        });

        res.json({
          success: true,
          message: "تم إضافة الإعجاب",
          liked: true,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router; 