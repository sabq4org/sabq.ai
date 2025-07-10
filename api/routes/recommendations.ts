/**
 * نظام التوصيات الذكية
 * AI-Powered Recommendations System
 * @version 2.1.0
 * @author Sabq AI Team
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { ApiError } from "../utils/errors";
import { trackEvent } from "../utils/analytics";

const router = Router();

// مخططات التحقق من الصحة
const recommendationQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)).optional(),
  type: z.enum(["personal", "trending", "similar", "category"]).default("personal"),
  categoryId: z.string().uuid().optional(),
  articleId: z.string().uuid().optional(),
  excludeRead: z.string().transform(val => val === "true").default(true),
});

// الحصول على توصيات شخصية للمستخدم
router.get("/:userId",
  validateRequest(recommendationQuerySchema, "query"),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const { userId } = req.params;
      const { limit = 10, type, categoryId, articleId, excludeRead } = req.query as any;

      let recommendations: any[] = [];

      switch (type) {
        case "personal":
          recommendations = await getPersonalRecommendations(prisma, userId, limit, excludeRead);
          break;
        case "trending":
          recommendations = await getTrendingRecommendations(prisma, limit, categoryId);
          break;
        case "similar":
          if (!articleId) {
            throw new ApiError(400, "معرف المقال مطلوب للتوصيات المشابهة");
          }
          recommendations = await getSimilarRecommendations(prisma, articleId, limit);
          break;
        case "category":
          if (!categoryId) {
            throw new ApiError(400, "معرف التصنيف مطلوب لتوصيات التصنيف");
          }
          recommendations = await getCategoryRecommendations(prisma, categoryId, limit, userId);
          break;
      }

      // حفظ التوصيات في قاعدة البيانات للتتبع
      await saveRecommendations(prisma, userId, recommendations, type);

      // تتبع طلب التوصيات
      await trackEvent(prisma, {
        type: "RECOMMENDATIONS_REQUESTED",
        userId,
        data: {
          recommendationType: type,
          recommendationsCount: recommendations.length,
          categoryId,
          articleId,
          timestamp: new Date(),
        },
      });

      res.json({
        success: true,
        recommendations,
        metadata: {
          type,
          count: recommendations.length,
          userId,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// الحصول على توصيات عامة (بدون مصادقة)
router.get("/",
  validateRequest(recommendationQuerySchema, "query"),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const { limit = 10, type = "trending", categoryId } = req.query as any;

      let recommendations: any[] = [];

      if (type === "trending") {
        recommendations = await getTrendingRecommendations(prisma, limit, categoryId);
      } else if (type === "category" && categoryId) {
        recommendations = await getCategoryRecommendations(prisma, categoryId, limit);
      } else {
        // توصيات افتراضية للزوار غير المسجلين
        recommendations = await getDefaultRecommendations(prisma, limit);
      }

      res.json({
        success: true,
        recommendations,
        metadata: {
          type,
          count: recommendations.length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// تدريب نموذج التوصيات (للمشرفين)
router.post("/train",
  authenticateToken,
  async (req: Request & { prisma?: PrismaClient, user?: any }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const userId = req.user.id;

      // التحقق من الصلاحية
      const userRoles = req.user.roles || [];
      if (!userRoles.includes("admin")) {
        throw new ApiError(403, "ليس لديك صلاحية لتدريب النموذج");
      }

      // جمع بيانات التدريب
      const trainingData = await collectTrainingData(prisma);

      // إرسال البيانات لخدمة الذكاء الاصطناعي للتدريب
      try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
        const response = await axios.post(`${mlServiceUrl}/train`, {
          data: trainingData,
          modelType: "recommendations",
        });

        // تتبع عملية التدريب
        await trackEvent(prisma, {
          type: "MODEL_TRAINING_INITIATED",
          userId,
          data: {
            dataSize: trainingData.length,
            timestamp: new Date(),
          },
        });

        res.json({
          success: true,
          message: "تم بدء تدريب النموذج بنجاح",
          trainingData: {
            recordsCount: trainingData.length,
            trainingId: response.data.trainingId,
          },
        });
      } catch (mlError) {
        throw new ApiError(500, "فشل في الاتصال بخدمة الذكاء الاصطناعي");
      }
    } catch (error) {
      next(error);
    }
  }
);

// تقييم توصية
router.post("/:recommendationId/feedback",
  authenticateToken,
  async (req: Request & { prisma?: PrismaClient, user?: any }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const userId = req.user.id;
      const { recommendationId } = req.params;
      const { rating, action } = req.body; // rating: 1-5, action: "clicked", "ignored", "saved"

      // حفظ تقييم التوصية
      await prisma.recommendationFeedback.create({
        data: {
          recommendationId,
          userId,
          rating: rating || null,
          action,
          timestamp: new Date(),
        },
      });

      // تتبع تقييم التوصية
      await trackEvent(prisma, {
        type: "RECOMMENDATION_FEEDBACK",
        userId,
        data: {
          recommendationId,
          rating,
          action,
          timestamp: new Date(),
        },
      });

      res.json({
        success: true,
        message: "تم حفظ تقييمك للتوصية",
      });
    } catch (error) {
      next(error);
    }
  }
);

// دوال مساعدة
async function getPersonalRecommendations(
  prisma: PrismaClient, 
  userId: string, 
  limit: number, 
  excludeRead: boolean
): Promise<any[]> {
  try {
    // جلب تاريخ المستخدم وتفضيلاته
    const userHistory = await prisma.analyticsEvent.findMany({
      where: {
        userId,
        type: { in: ["ARTICLE_VIEW", "ARTICLE_LIKE", "ARTICLE_SHARE"] },
      },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    // استخراج التصنيفات والمقالات المفضلة
    const articleIds = userHistory
      .filter(event => event.data.articleId)
      .map(event => event.data.articleId);

    if (articleIds.length === 0) {
      // إذا لم يكن للمستخدم تاريخ، أرجع توصيات عامة
      return await getDefaultRecommendations(prisma, limit);
    }

    // جلب تصنيفات المقالات التي تفاعل معها
    const userArticles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { categoryId: true, tags: { include: { tag: true } } },
    });

    const preferredCategories = [...new Set(userArticles.map(a => a.categoryId))];
    const preferredTags = [...new Set(userArticles.flatMap(a => a.tags.map(t => t.tag.name)))];

    // بناء توصيات بناءً على التفضيلات
    let whereClause: any = {
      status: "published",
      OR: [
        { categoryId: { in: preferredCategories } },
        { tags: { some: { tag: { name: { in: preferredTags } } } } },
      ],
    };

    if (excludeRead) {
      whereClause.id = { notIn: articleIds };
    }

    const recommendations = await prisma.article.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [
        { featured: "desc" },
        { viewsCount: "desc" },
        { publishedAt: "desc" },
      ],
      take: limit,
    });

    return recommendations.map(article => ({
      ...article,
      score: calculateRecommendationScore(article, userHistory),
      reason: determineRecommendationReason(article, preferredCategories, preferredTags),
    }));
  } catch (error) {
    console.error("Error getting personal recommendations:", error);
    return await getDefaultRecommendations(prisma, limit);
  }
}

async function getTrendingRecommendations(
  prisma: PrismaClient, 
  limit: number, 
  categoryId?: string
): Promise<any[]> {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const whereClause: any = {
    status: "published",
    publishedAt: { gte: last7Days },
  };

  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  return await prisma.article.findMany({
    where: whereClause,
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
    },
    orderBy: [
      { viewsCount: "desc" },
      { likesCount: "desc" },
      { publishedAt: "desc" },
    ],
    take: limit,
  });
}

async function getSimilarRecommendations(
  prisma: PrismaClient, 
  articleId: string, 
  limit: number
): Promise<any[]> {
  // جلب المقال المرجعي
  const referenceArticle = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!referenceArticle) {
    return [];
  }

  const tagNames = referenceArticle.tags.map(t => t.tag.name);

  return await prisma.article.findMany({
    where: {
      status: "published",
      id: { not: articleId },
      OR: [
        { categoryId: referenceArticle.categoryId },
        { tags: { some: { tag: { name: { in: tagNames } } } } },
      ],
    },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
    },
    orderBy: [
      { viewsCount: "desc" },
      { publishedAt: "desc" },
    ],
    take: limit,
  });
}

async function getCategoryRecommendations(
  prisma: PrismaClient, 
  categoryId: string, 
  limit: number, 
  userId?: string
): Promise<any[]> {
  const whereClause: any = {
    status: "published",
    categoryId,
  };

  // استبعاد المقالات المقروءة إذا كان المستخدم مسجل دخوله
  if (userId) {
    const readArticles = await prisma.analyticsEvent.findMany({
      where: {
        userId,
        type: "ARTICLE_VIEW",
      },
      select: { data: true },
    });

    const readArticleIds = readArticles
      .map(event => event.data.articleId)
      .filter(id => id);

    if (readArticleIds.length > 0) {
      whereClause.id = { notIn: readArticleIds };
    }
  }

  return await prisma.article.findMany({
    where: whereClause,
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
    },
    orderBy: [
      { featured: "desc" },
      { viewsCount: "desc" },
      { publishedAt: "desc" },
    ],
    take: limit,
  });
}

async function getDefaultRecommendations(
  prisma: PrismaClient, 
  limit: number
): Promise<any[]> {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return await prisma.article.findMany({
    where: {
      status: "published",
      publishedAt: { gte: last30Days },
    },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
    },
    orderBy: [
      { featured: "desc" },
      { viewsCount: "desc" },
      { likesCount: "desc" },
    ],
    take: limit,
  });
}

async function saveRecommendations(
  prisma: PrismaClient, 
  userId: string, 
  recommendations: any[], 
  type: string
): Promise<void> {
  try {
    const recommendationRecords = recommendations.map(article => ({
      userId,
      articleId: article.id,
      score: article.score || 0.5,
      reason: article.reason || type,
      recommendedAt: new Date(),
    }));

    await prisma.recommendation.createMany({
      data: recommendationRecords,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Error saving recommendations:", error);
  }
}

async function collectTrainingData(prisma: PrismaClient): Promise<any[]> {
  // جمع بيانات التدريب من تفاعلات المستخدمين
  const interactions = await prisma.analyticsEvent.findMany({
    where: {
      type: { in: ["ARTICLE_VIEW", "ARTICLE_LIKE", "ARTICLE_SHARE"] },
      userId: { not: null },
    },
    include: {
      user: {
        select: { id: true },
      },
    },
    orderBy: { timestamp: "desc" },
    take: 10000, // أخذ آخر 10000 تفاعل
  });

  return interactions.map(interaction => ({
    userId: interaction.userId,
    articleId: interaction.data.articleId,
    action: interaction.type,
    timestamp: interaction.timestamp,
    score: getActionScore(interaction.type),
  }));
}

function calculateRecommendationScore(article: any, userHistory: any[]): number {
  let score = 0.5; // نقطة البداية

  // زيادة النقاط حسب التفاعل مع التصنيف
  const categoryInteractions = userHistory.filter(
    event => event.data.categoryId === article.categoryId
  );
  score += categoryInteractions.length * 0.1;

  // زيادة النقاط حسب العلامات المشتركة
  const userTags = userHistory.flatMap(event => event.data.tags || []);
  const articleTags = article.tags.map((t: any) => t.tag.name);
  const commonTags = articleTags.filter((tag: string) => userTags.includes(tag));
  score += commonTags.length * 0.2;

  // زيادة النقاط للمقالات الشائعة
  score += Math.min(article.viewsCount / 1000, 0.3);

  return Math.min(score, 1.0);
}

function determineRecommendationReason(
  article: any, 
  preferredCategories: string[], 
  preferredTags: string[]
): string {
  if (preferredCategories.includes(article.categoryId)) {
    return "based_on_category_preference";
  }

  const articleTags = article.tags.map((t: any) => t.tag.name);
  const hasCommonTags = articleTags.some((tag: string) => preferredTags.includes(tag));
  
  if (hasCommonTags) {
    return "based_on_tag_preference";
  }

  if (article.featured) {
    return "featured_content";
  }

  return "trending_content";
}

function getActionScore(actionType: string): number {
  switch (actionType) {
    case "ARTICLE_VIEW": return 1;
    case "ARTICLE_LIKE": return 3;
    case "ARTICLE_SHARE": return 5;
    default: return 0;
  }
}

export default router; 