/**
 * نقطة الدخول الرئيسية للـ Backend API
 * Express.js مع TypeScript وPrisma
 * @version 2.1.0
 * @author Sabq AI Team
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { json, urlencoded } from "body-parser";
import { PrismaClient } from "@prisma/client";
import morgan from "morgan";
import dotenv from "dotenv";

// استيراد المسارات
import authRouter from "./routes/auth";
import articlesRouter from "./routes/articles";
import analyticsRouter from "./routes/analytics";
import recommendationsRouter from "./routes/recommendations";
import usersRouter from "./routes/users";
import categoriesRouter from "./routes/categories";
import tagsRouter from "./routes/tags";
import commentsRouter from "./routes/comments";
import integrationsRouter from "./routes/integrations";
import uploadsRouter from "./routes/uploads";
import searchRouter from "./routes/search";

// استيراد المتوسطات
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { auditLogger } from "./middleware/auditLogger";
import { securityHeaders } from "./middleware/security";

// تحميل المتغيرات البيئية
dotenv.config();

// إنشاء تطبيق Express
const app = express();

// إنشاء عميل Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
});

// إعدادات الأمان
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // الحد الأقصى للطلبات
  message: {
    error: "تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى لاحقاً.",
    resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// إعدادات CORS
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? ["https://sabq.ai", "https://cms.sabq.ai"] 
    : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// المتوسطات العامة
app.use(helmet()); // أمان الرؤوس
app.use(compression()); // ضغط الاستجابات
app.use(cors(corsOptions)); // إعدادات CORS
app.use(limiter); // تحديد معدل الطلبات
app.use(json({ limit: "10mb" })); // تحليل JSON
app.use(urlencoded({ extended: true, limit: "10mb" })); // تحليل URL
app.use(morgan("combined")); // تسجيل الطلبات
app.use(securityHeaders); // رؤوس أمان إضافية
app.use(auditLogger); // تسجيل عمليات التدقيق

// إضافة Prisma إلى الـ Request
app.use((req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
  req.prisma = prisma;
  next();
});

// المسارات الرئيسية
app.use("/api/auth", authRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/search", searchRouter);

// نقطة فحص الصحة
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "2.1.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
  });
});

// نقطة معلومات النظام
app.get("/api/info", (req: Request, res: Response) => {
  res.json({
    name: "Sabq AI CMS Backend",
    version: "2.1.0",
    description: "نظام إدارة المحتوى الذكي - الواجهة الخلفية",
    author: "Sabq AI Team",
    docs: "/api/docs",
    health: "/api/health",
  });
});

// معالجة الأخطاء
app.use(notFoundHandler);
app.use(errorHandler);

// بدء تشغيل الخادم
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "localhost";

async function startServer() {
  try {
    // اختبار الاتصال بقاعدة البيانات
    await prisma.$connect();
    console.log("✅ تم الاتصال بقاعدة البيانات بنجاح");

    // بدء تشغيل الخادم
    app.listen(PORT, () => {
      console.log(`🚀 الخادم يعمل على http://${HOST}:${PORT}`);
      console.log(`📖 وثائق API: http://${HOST}:${PORT}/api/docs`);
      console.log(`🔍 فحص الصحة: http://${HOST}:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ خطأ في بدء تشغيل الخادم:", error);
    process.exit(1);
  }
}

// إيقاف الخادم بأمان
process.on("SIGTERM", async () => {
  console.log("📴 إيقاف الخادم...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("📴 إيقاف الخادم...");
  await prisma.$disconnect();
  process.exit(0);
});

// بدء تشغيل الخادم
startServer();

export default app;
export { prisma }; 