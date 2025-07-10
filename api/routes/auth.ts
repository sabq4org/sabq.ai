/**
 * مسارات المصادقة والتحقق من الهوية
 * Authentication & Authorization Routes
 * @version 2.1.0
 * @author Sabq AI Team
 */

import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { ApiError } from "../utils/errors";
import { generateTokens, verifyRefreshToken } from "../utils/auth";
import { trackEvent } from "../utils/analytics";

const router = Router();

// تحديد معدل الطلبات لتسجيل الدخول
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات كحد أقصى
  message: {
    error: "تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// تحديد معدل الطلبات للتسجيل
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 3, // 3 محاولات كحد أقصى
  message: {
    error: "تم تجاوز الحد الأقصى لمحاولات التسجيل. يرجى المحاولة بعد ساعة.",
  },
});

// مخططات التحقق من الصحة
const registerSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جداً"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة ورقم ورمز خاص"),
  phone: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, "يجب الموافقة على الشروط والأحكام"),
});

const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  rememberMe: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
});

// تسجيل مستخدم جديد
router.post("/register", 
  registerLimiter,
  validateRequest(registerSchema),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, phone } = req.body;
      const prisma = req.prisma!;

      // التحقق من وجود المستخدم
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ApiError(400, "البريد الإلكتروني مستخدم بالفعل");
      }

      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(password, 12);

      // إنشاء المستخدم
      const user = await prisma.user.create({
        data: {
          name,
          email,
          hashedPassword,
          phone,
          status: "active",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      });

      // إنشاء دور المستخدم الافتراضي
      const defaultRole = await prisma.role.findFirst({
        where: { name: "user" },
      });

      if (defaultRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: defaultRole.id,
          },
        });
      }

      // إنشاء الرموز المميزة
      const tokens = generateTokens(user.id);

      // حفظ جلسة المستخدم
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 أيام
          deviceInfo: req.headers["user-agent"] || "Unknown",
        },
      });

      // تتبع حدث التسجيل
      await trackEvent(prisma, {
        type: "USER_REGISTERED",
        userId: user.id,
        data: {
          method: "email",
          timestamp: new Date(),
        },
      });

      res.status(201).json({
        success: true,
        message: "تم إنشاء الحساب بنجاح",
        user,
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// تسجيل الدخول
router.post("/login",
  loginLimiter,
  validateRequest(loginSchema),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const { email, password, rememberMe } = req.body;
      const prisma = req.prisma!;

      // البحث عن المستخدم
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new ApiError(401, "البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }

      // التحقق من حالة المستخدم
      if (user.status !== "active") {
        throw new ApiError(401, "حسابك غير مفعل أو محظور");
      }

      // التحقق من كلمة المرور
      const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
      if (!isPasswordValid) {
        throw new ApiError(401, "البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }

      // تحديث تاريخ آخر تسجيل دخول
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // إنشاء الرموز المميزة
      const tokens = generateTokens(user.id, rememberMe ? "30d" : "7d");

      // حفظ جلسة المستخدم
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
          deviceInfo: req.headers["user-agent"] || "Unknown",
        },
      });

      // تتبع حدث تسجيل الدخول
      await trackEvent(prisma, {
        type: "USER_LOGIN",
        userId: user.id,
        data: {
          method: "email",
          rememberMe,
          timestamp: new Date(),
        },
      });

      // إرسال الاستجابة
      res.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          roles: user.roles.map(ur => ur.role.name),
          lastLoginAt: user.lastLoginAt,
        },
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// تسجيل الخروج
router.post("/logout",
  authenticateToken,
  async (req: Request & { prisma?: PrismaClient, user?: any }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const userId = req.user.id;

      // حذف جلسة المستخدم
      const refreshToken = req.headers.authorization?.split(" ")[1];
      if (refreshToken) {
        await prisma.session.deleteMany({
          where: {
            userId,
            token: refreshToken,
          },
        });
      }

      // تتبع حدث تسجيل الخروج
      await trackEvent(prisma, {
        type: "USER_LOGOUT",
        userId,
        data: {
          timestamp: new Date(),
        },
      });

      res.json({
        success: true,
        message: "تم تسجيل الخروج بنجاح",
      });
    } catch (error) {
      next(error);
    }
  }
);

// تجديد الرمز المميز
router.post("/refresh",
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const prisma = req.prisma!;

      if (!refreshToken) {
        throw new ApiError(401, "رمز التجديد مطلوب");
      }

      // التحقق من صحة رمز التجديد
      const decoded = verifyRefreshToken(refreshToken);
      const userId = decoded.userId;

      // التحقق من وجود الجلسة
      const session = await prisma.session.findFirst({
        where: {
          userId,
          token: refreshToken,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!session) {
        throw new ApiError(401, "جلسة غير صالحة أو منتهية الصلاحية");
      }

      // إنشاء رموز جديدة
      const newTokens = generateTokens(userId);

      // تحديث الجلسة
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: newTokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.json({
        success: true,
        tokens: newTokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// الحصول على معلومات المستخدم الحالي
router.get("/me",
  authenticateToken,
  async (req: Request & { prisma?: PrismaClient, user?: any }, res: Response, next: NextFunction) => {
    try {
      const prisma = req.prisma!;
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          roles: {
            include: {
              role: true,
            },
          },
          preferences: true,
        },
      });

      if (!user) {
        throw new ApiError(404, "المستخدم غير موجود");
      }

      res.json({
        success: true,
        user: {
          ...user,
          roles: user.roles.map(ur => ur.role.name),
          permissions: user.roles.flatMap(ur => ur.role.permissions),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// تغيير كلمة المرور
router.post("/change-password",
  authenticateToken,
  validateRequest(changePasswordSchema),
  async (req: Request & { prisma?: PrismaClient, user?: any }, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const prisma = req.prisma!;
      const userId = req.user.id;

      // الحصول على كلمة المرور الحالية
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { hashedPassword: true },
      });

      if (!user) {
        throw new ApiError(404, "المستخدم غير موجود");
      }

      // التحقق من كلمة المرور الحالية
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);
      if (!isCurrentPasswordValid) {
        throw new ApiError(400, "كلمة المرور الحالية غير صحيحة");
      }

      // تشفير كلمة المرور الجديدة
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // تحديث كلمة المرور
      await prisma.user.update({
        where: { id: userId },
        data: { hashedPassword: hashedNewPassword },
      });

      // إبطال جميع الجلسات الأخرى
      await prisma.session.deleteMany({
        where: { userId },
      });

      // تتبع حدث تغيير كلمة المرور
      await trackEvent(prisma, {
        type: "PASSWORD_CHANGED",
        userId,
        data: {
          timestamp: new Date(),
        },
      });

      res.json({
        success: true,
        message: "تم تغيير كلمة المرور بنجاح",
      });
    } catch (error) {
      next(error);
    }
  }
);

// إعادة تعيين كلمة المرور
router.post("/reset-password",
  validateRequest(resetPasswordSchema),
  async (req: Request & { prisma?: PrismaClient }, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const prisma = req.prisma!;

      // البحث عن المستخدم
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // لا نكشف عن عدم وجود المستخدم لأسباب أمنية
        res.json({
          success: true,
          message: "إذا كان البريد الإلكتروني موجوداً، ستتلقى رسالة إعادة تعيين كلمة المرور",
        });
        return;
      }

      // إنشاء رمز إعادة تعيين كلمة المرور
      const resetToken = jwt.sign(
        { userId: user.id, type: "password-reset" },
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
      );

      // TODO: إرسال بريد إلكتروني مع رمز إعادة التعيين
      // await sendPasswordResetEmail(user.email, resetToken);

      // تتبع حدث طلب إعادة تعيين كلمة المرور
      await trackEvent(prisma, {
        type: "PASSWORD_RESET_REQUESTED",
        userId: user.id,
        data: {
          timestamp: new Date(),
        },
      });

      res.json({
        success: true,
        message: "تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 