/**
 * معالج الأخطاء العام
 * Global Error Handler Middleware
 * @version 2.1.0
 * @author Sabq AI Team
 */

import { Request, Response, NextFunction } from "express";
import { ApiError, logError, sanitizeErrorMessage, handlePrismaError, handleJwtError, handleZodError } from "../utils/errors";
import { ZodError } from "zod";

// معالج الأخطاء الرئيسي
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // تسجيل الخطأ
  logError(error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    user: (req as any).user?.id,
  });

  // معالجة أنواع مختلفة من الأخطاء
  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error.name === "PrismaClientKnownRequestError") {
    apiError = handlePrismaError(error);
  } else if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    apiError = handleJwtError(error);
  } else if (error instanceof ZodError) {
    apiError = handleZodError(error);
  } else {
    // خطأ غير متوقع
    apiError = new ApiError(500, "حدث خطأ غير متوقع", "INTERNAL_SERVER_ERROR", null, false);
  }

  // إنشاء استجابة الخطأ
  const errorResponse = {
    success: false,
    error: {
      message: sanitizeErrorMessage(apiError),
      code: apiError.errorCode || "UNKNOWN_ERROR",
      statusCode: apiError.statusCode,
      timestamp: new Date().toISOString(),
    },
  };

  // إضافة التفاصيل في بيئة التطوير
  if (process.env.NODE_ENV === "development") {
    errorResponse.error.details = apiError.details;
    errorResponse.error.stack = apiError.stack;
  }

  // إرسال الاستجابة
  res.status(apiError.statusCode).json(errorResponse);
}

// معالج الصفحات غير الموجودة
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = new ApiError(404, `المسار ${req.originalUrl} غير موجود`, "NOT_FOUND");
  next(error);
} 