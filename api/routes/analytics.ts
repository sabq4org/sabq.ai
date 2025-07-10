/**
 * مسارات التحليلات وتتبع الأحداث السلوكية
 * Analytics & Event Tracking Routes
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

const router = Router();

// مخططات التحقق من الصحة
const eventSchema = z.object({
  eventType: z.string().min(1, "نوع الحدث مطلوب"),
  eventData: z.record(z.any()).default({}),
  timestamp: z.string().datetime().optional(),
  sessionId: z.string().optional(),
  userId: z.string().uuid().optional(),
  page: z.string().optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
});

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metric: z.enum([
    "pageViews",
    "uniqueVisitors", 
    "sessions",
    "bounceRate",
    "averageSessionDuration",
    "topPages",
    "topReferrers",
    "deviceTypes",
    "browsers",
    "countries"
  ]).optional(),
  granularity: z.enum(["hour", "day", "week", "month"]).default("day"),
  filters: z.record(z.any()).optional(),
});

// تسجيل حدث تحليلي
router.post("/events",
  validateRequest(eventSchema),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const { eventType, eventData, timestamp, sessionId, userId, page, referrer, userAgent } = req.body;

      // استخراج معلومات إضافية من الطلب
      const ipAddress = req.ip || req.socket.remoteAddress;
      const realUserAgent = userAgent || req.headers["user-agent"];

      // إنشاء الحدث
      const event = await prisma.analyticsEvent.create({
        data: {
          type: eventType,
          data: eventData,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          page,
          referrer,
          userAgent: realUserAgent,
          ipAddress,
        },
      });

      // معالجة أحداث خاصة
      await processSpecialEvents(prisma, event);

      res.json({
        success: true,
        message: "تم تسجيل الحدث بنجاح",
        eventId: event.id,
      });
    } catch (error) {
      next(error);
    }
  }
);

// الحصول على تحليلات عامة
router.get("/dashboard",
  authenticateToken,
  requirePermission("view:analytics"),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      
      // حساب الإحصائيات الأساسية
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalPageViews,
        uniqueVisitors24h,
        totalSessions,
        topArticles,
        topReferrers,
        deviceStats,
        recentEvents
      ] = await Promise.all([
        // إجمالي مشاهدات الصفحات
        prisma.analyticsEvent.count({
          where: {
            type: "PAGE_VIEW",
            timestamp: { gte: last30Days },
          },
        }),

        // الزوار الفريدون في آخر 24 ساعة
        prisma.analyticsEvent.groupBy({
          by: ["sessionId"],
          where: {
            timestamp: { gte: last24Hours },
          },
          _count: true,
        }).then(result => result.length),

        // إجمالي الجلسات
        prisma.analyticsEvent.groupBy({
          by: ["sessionId"],
          where: {
            timestamp: { gte: last7Days },
          },
          _count: true,
        }).then(result => result.length),

        // أشهر المقالات
        prisma.article.findMany({
          select: {
            id: true,
            title: true,
            slug: true,
            viewsCount: true,
            likesCount: true,
          },
          orderBy: { viewsCount: "desc" },
          take: 10,
        }),

        // أشهر المصادر
        prisma.analyticsEvent.groupBy({
          by: ["referrer"],
          where: {
            referrer: { not: null },
            timestamp: { gte: last7Days },
          },
          _count: true,
          orderBy: { _count: { referrer: "desc" } },
          take: 10,
        }),

        // إحصائيات الأجهزة
        prisma.analyticsEvent.groupBy({
          by: ["userAgent"],
          where: {
            userAgent: { not: null },
            timestamp: { gte: last7Days },
          },
          _count: true,
          orderBy: { _count: { userAgent: "desc" } },
          take: 5,
        }),

        // الأحداث الأخيرة
        prisma.analyticsEvent.findMany({
          select: {
            id: true,
            type: true,
            data: true,
            timestamp: true,
            userId: true,
            page: true,
          },
          orderBy: { timestamp: "desc" },
          take: 20,
        }),
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalPageViews,
            uniqueVisitors24h,
            totalSessions,
            avgSessionDuration: 0, // TODO: حساب متوسط مدة الجلسة
          },
          topArticles,
          topReferrers: topReferrers.map(r => ({
            referrer: r.referrer,
            count: r._count,
          })),
          deviceStats: deviceStats.map(d => ({
            userAgent: d.userAgent,
            count: d._count,
          })),
          recentEvents,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// الحصول على تحليلات مفصلة
router.get("/reports",
  authenticateToken,
  requirePermission("view:analytics"),
  validateRequest(analyticsQuerySchema, "query"),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const { startDate, endDate, metric, granularity, filters } = req.query as any;

      const start = new Date(startDate);
      const end = new Date(endDate);

      let result: any = {};

      switch (metric) {
        case "pageViews":
          result = await getPageViewsReport(prisma, start, end, granularity, filters);
          break;
        case "uniqueVisitors":
          result = await getUniqueVisitorsReport(prisma, start, end, granularity, filters);
          break;
        case "sessions":
          result = await getSessionsReport(prisma, start, end, granularity, filters);
          break;
        case "topPages":
          result = await getTopPagesReport(prisma, start, end, filters);
          break;
        case "topReferrers":
          result = await getTopReferrersReport(prisma, start, end, filters);
          break;
        default:
          result = await getOverallReport(prisma, start, end, granularity, filters);
      }

      res.json({
        success: true,
        data: result,
        metadata: {
          startDate,
          endDate,
          metric,
          granularity,
          filters,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// تصدير التحليلات
router.get("/export",
  authenticateToken,
  requirePermission("export:analytics"),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const { format = "json", startDate, endDate } = req.query as any;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // جلب جميع الأحداث في الفترة المحددة
      const events = await prisma.analyticsEvent.findMany({
        where: {
          timestamp: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { timestamp: "desc" },
      });

      if (format === "csv") {
        // تحويل إلى CSV
        const csvData = convertToCSV(events);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=analytics-export.csv");
        res.send(csvData);
      } else {
        // إرجاع JSON
        res.json({
          success: true,
          data: events,
          exportedAt: new Date().toISOString(),
          count: events.length,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// الحصول على الأحداث المباشرة
router.get("/real-time",
  authenticateToken,
  requirePermission("view:analytics"),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);

      const [activeUsers, recentPageViews, topPages] = await Promise.all([
        // المستخدمون النشطون
        prisma.analyticsEvent.groupBy({
          by: ["sessionId"],
          where: {
            timestamp: { gte: last5Minutes },
          },
          _count: true,
        }).then(result => result.length),

        // مشاهدات الصفحات الأخيرة
        prisma.analyticsEvent.count({
          where: {
            type: "PAGE_VIEW",
            timestamp: { gte: last5Minutes },
          },
        }),

        // الصفحات الأكثر نشاطاً
        prisma.analyticsEvent.groupBy({
          by: ["page"],
          where: {
            type: "PAGE_VIEW",
            timestamp: { gte: last5Minutes },
            page: { not: null },
          },
          _count: true,
          orderBy: { _count: { page: "desc" } },
          take: 5,
        }),
      ]);

      res.json({
        success: true,
        data: {
          activeUsers,
          recentPageViews,
          topPages: topPages.map(p => ({
            page: p.page,
            views: p._count,
          })),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// دوال مساعدة
async function processSpecialEvents(prisma: PrismaClient, event: any) {
  switch (event.type) {
    case "ARTICLE_VIEW":
      // تحديث عدد مشاهدات المقال
      const articleId = event.data.articleId;
      if (articleId) {
        await prisma.article.update({
          where: { id: articleId },
          data: { viewsCount: { increment: 1 } },
        }).catch(() => {}); // تجاهل الأخطاء
      }
      break;

    case "USER_REGISTRATION":
      // تتبع تسجيل مستخدم جديد
      await trackEvent(prisma, {
        type: "NEW_USER_REGISTERED",
        data: { timestamp: event.timestamp },
      });
      break;
  }
}

async function getPageViewsReport(prisma: PrismaClient, start: Date, end: Date, granularity: string, filters: any) {
  // تنفيذ تقرير مشاهدات الصفحات
  return await prisma.analyticsEvent.groupBy({
    by: ["timestamp"],
    where: {
      type: "PAGE_VIEW",
      timestamp: { gte: start, lte: end },
      ...filters,
    },
    _count: true,
  });
}

async function getUniqueVisitorsReport(prisma: PrismaClient, start: Date, end: Date, granularity: string, filters: any) {
  // تنفيذ تقرير الزوار الفريدين
  return await prisma.analyticsEvent.groupBy({
    by: ["sessionId"],
    where: {
      timestamp: { gte: start, lte: end },
      ...filters,
    },
    _count: true,
  });
}

async function getSessionsReport(prisma: PrismaClient, start: Date, end: Date, granularity: string, filters: any) {
  // تنفيذ تقرير الجلسات
  return await prisma.analyticsEvent.groupBy({
    by: ["sessionId"],
    where: {
      timestamp: { gte: start, lte: end },
      ...filters,
    },
    _count: true,
  });
}

async function getTopPagesReport(prisma: PrismaClient, start: Date, end: Date, filters: any) {
  return await prisma.analyticsEvent.groupBy({
    by: ["page"],
    where: {
      type: "PAGE_VIEW",
      timestamp: { gte: start, lte: end },
      page: { not: null },
      ...filters,
    },
    _count: true,
    orderBy: { _count: { page: "desc" } },
    take: 20,
  });
}

async function getTopReferrersReport(prisma: PrismaClient, start: Date, end: Date, filters: any) {
  return await prisma.analyticsEvent.groupBy({
    by: ["referrer"],
    where: {
      timestamp: { gte: start, lte: end },
      referrer: { not: null },
      ...filters,
    },
    _count: true,
    orderBy: { _count: { referrer: "desc" } },
    take: 20,
  });
}

async function getOverallReport(prisma: PrismaClient, start: Date, end: Date, granularity: string, filters: any) {
  const [pageViews, uniqueSessions, totalEvents] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        type: "PAGE_VIEW",
        timestamp: { gte: start, lte: end },
        ...filters,
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["sessionId"],
      where: {
        timestamp: { gte: start, lte: end },
        ...filters,
      },
      _count: true,
    }).then(result => result.length),
    prisma.analyticsEvent.count({
      where: {
        timestamp: { gte: start, lte: end },
        ...filters,
      },
    }),
  ]);

  return {
    pageViews,
    uniqueSessions,
    totalEvents,
    period: { start, end },
  };
}

function convertToCSV(events: any[]): string {
  if (events.length === 0) return "";

  const headers = ["id", "type", "timestamp", "sessionId", "userId", "page", "referrer", "userAgent", "data"];
  const csvRows = [headers.join(",")];

  events.forEach(event => {
    const row = [
      event.id,
      event.type,
      event.timestamp,
      event.sessionId || "",
      event.userId || "",
      event.page || "",
      event.referrer || "",
      event.userAgent || "",
      JSON.stringify(event.data || {}),
    ];
    csvRows.push(row.map(field => `"${field}"`).join(","));
  });

  return csvRows.join("\n");
}

export default router; 