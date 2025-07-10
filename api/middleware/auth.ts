/**
 * Middleware للمصادقة والتحقق من الصلاحيات
 * Authentication & Authorization Middleware
 * @version 2.1.0
 * @author Sabq AI Team
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { ApiError } from "../utils/errors";

// تحديد نوع الطلب مع المعلومات الإضافية
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
  };
  prisma?: PrismaClient;
}

// middleware للتحقق من رمز المصادقة
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      throw new ApiError(401, "رمز المصادقة مطلوب");
    }

    // التحقق من صحة الرمز
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    if (!userId) {
      throw new ApiError(401, "رمز المصادقة غير صالح");
    }

    // جلب معلومات المستخدم مع الأدوار والصلاحيات
    const prisma = req.prisma!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        roles: {
          include: {
            role: {
              select: {
                name: true,
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(401, "المستخدم غير موجود");
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError(401, "حسابك غير مفعل أو محظور");
    }

    // استخراج الأدوار والصلاحيات
    const roles = user.roles.map(ur => ur.role.name);
    const permissions = user.roles.flatMap(ur => ur.role.permissions as string[]);

    // إضافة معلومات المستخدم للطلب
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
      permissions,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, "رمز المصادقة غير صالح"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, "رمز المصادقة منتهي الصلاحية"));
    } else {
      next(error);
    }
  }
}

// middleware اختياري للمصادقة (لا يتطلب تسجيل دخول)
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      // محاولة التحقق من الرمز إذا كان موجوداً
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const userId = decoded.userId;

        if (userId) {
          const prisma = req.prisma!;
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              name: true,
              status: true,
              roles: {
                include: {
                  role: {
                    select: {
                      name: true,
                      permissions: true,
                    },
                  },
                },
              },
            },
          });

          if (user && user.status === "ACTIVE") {
            const roles = user.roles.map(ur => ur.role.name);
            const permissions = user.roles.flatMap(ur => ur.role.permissions as string[]);

            req.user = {
              id: user.id,
              email: user.email,
              name: user.name,
              roles,
              permissions,
            };
          }
        }
      } catch (error) {
        // تجاهل أخطاء المصادقة الاختيارية
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

// middleware للتحقق من الأدوار
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "المصادقة مطلوبة"));
    }

    if (!req.user.roles.includes(role)) {
      return next(new ApiError(403, "ليس لديك الصلاحية المطلوبة"));
    }

    next();
  };
}

// middleware للتحقق من الصلاحيات المتعددة
export function requireRoles(roles: string[], requireAll = false) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "المصادقة مطلوبة"));
    }

    const userRoles = req.user.roles;
    
    if (requireAll) {
      // يجب أن يكون للمستخدم جميع الأدوار
      const hasAllRoles = roles.every(role => userRoles.includes(role));
      if (!hasAllRoles) {
        return next(new ApiError(403, "ليس لديك جميع الصلاحيات المطلوبة"));
      }
    } else {
      // يجب أن يكون للمستخدم دور واحد على الأقل
      const hasAnyRole = roles.some(role => userRoles.includes(role));
      if (!hasAnyRole) {
        return next(new ApiError(403, "ليس لديك الصلاحية المطلوبة"));
      }
    }

    next();
  };
}

// middleware للتحقق من صلاحية معينة
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "المصادقة مطلوبة"));
    }

    if (!req.user.permissions.includes(permission)) {
      return next(new ApiError(403, "ليس لديك الصلاحية المطلوبة لهذا الإجراء"));
    }

    next();
  };
}

// middleware للتحقق من الصلاحيات المتعددة
export function requirePermissions(permissions: string[], requireAll = true) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "المصادقة مطلوبة"));
    }

    const userPermissions = req.user.permissions;
    
    if (requireAll) {
      // يجب أن يكون للمستخدم جميع الصلاحيات
      const hasAllPermissions = permissions.every(permission => userPermissions.includes(permission));
      if (!hasAllPermissions) {
        return next(new ApiError(403, "ليس لديك جميع الصلاحيات المطلوبة"));
      }
    } else {
      // يجب أن يكون للمستخدم صلاحية واحدة على الأقل
      const hasAnyPermission = permissions.some(permission => userPermissions.includes(permission));
      if (!hasAnyPermission) {
        return next(new ApiError(403, "ليس لديك الصلاحية المطلوبة"));
      }
    }

    next();
  };
}

// middleware للتحقق من ملكية المورد
export function requireOwnership(resourceField = "authorId") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, "المصادقة مطلوبة"));
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        return next(new ApiError(400, "معرف المورد مطلوب"));
      }

      // إذا كان المستخدم مشرفاً، السماح بالوصول
      if (req.user.roles.includes("admin")) {
        return next();
      }

      // التحقق من ملكية المورد (يتطلب تنفيذ مخصص لكل نوع مورد)
      const prisma = req.prisma!;
      
      // هذا مثال للمقالات - يجب تخصيصه لكل نوع مورد
      const resource = await prisma.article.findUnique({
        where: { id: resourceId },
        select: { [resourceField]: true },
      });

      if (!resource) {
        return next(new ApiError(404, "المورد غير موجود"));
      }

      if (resource[resourceField] !== req.user.id) {
        return next(new ApiError(403, "ليس لديك صلاحية للوصول لهذا المورد"));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// middleware للتحقق من أن المستخدم مفعل
export function requireVerifiedUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new ApiError(401, "المصادقة مطلوبة"));
  }

  // هنا يمكن إضافة منطق التحقق من تفعيل البريد الإلكتروني
  // if (!req.user.emailVerified) {
  //   return next(new ApiError(403, "يجب تفعيل بريدك الإلكتروني أولاً"));
  // }

  next();
}

// middleware للتحقق من صحة API Key (للتكاملات الخارجية)
export async function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new ApiError(401, "مفتاح API مطلوب");
    }

    // التحقق من صحة API Key
    const prisma = req.prisma!;
    const integration = await prisma.integration.findFirst({
      where: {
        credentials: {
          path: ["apiKey"],
          equals: apiKey,
        },
        isActive: true,
      },
    });

    if (!integration) {
      throw new ApiError(401, "مفتاح API غير صالح");
    }

    // إضافة معلومات التكامل للطلب
    (req as any).integration = integration;

    next();
  } catch (error) {
    next(error);
  }
}

// middleware للحد من معدل الطلبات حسب المستخدم
export function userRateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    // تنظيف الطلبات المنتهية الصلاحية
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key);
      }
    }

    const userRequests = requests.get(userId);
    
    if (!userRequests) {
      // أول طلب للمستخدم
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (now > userRequests.resetTime) {
      // نافذة زمنية جديدة
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      // تجاوز الحد الأقصى
      return next(new ApiError(429, "تم تجاوز الحد الأقصى للطلبات"));
    }

    // زيادة عدد الطلبات
    userRequests.count++;
    next();
  };
} 