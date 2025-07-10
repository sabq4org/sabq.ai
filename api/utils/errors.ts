/**
 * نظام إدارة الأخطاء المتقدم
 * Advanced Error Management System
 * @version 2.1.0
 * @author Sabq AI Team
 */

// فئة الخطأ المخصصة
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode?: string;
  public details?: any;
  public timestamp: Date;

  constructor(
    statusCode: number,
    message: string,
    errorCode?: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date();

    // التأكد من أن stack trace يشير إلى مكان الخطأ الصحيح
    Error.captureStackTrace(this, this.constructor);
  }
}

// أخطاء التحقق من الصحة
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

// أخطاء المصادقة
export class AuthenticationError extends ApiError {
  constructor(message: string = "المصادقة مطلوبة") {
    super(401, message, "AUTHENTICATION_ERROR");
  }
}

// أخطاء التصريح
export class AuthorizationError extends ApiError {
  constructor(message: string = "ليس لديك صلاحية للوصول") {
    super(403, message, "AUTHORIZATION_ERROR");
  }
}

// أخطاء عدم الوجود
export class NotFoundError extends ApiError {
  constructor(message: string = "المورد غير موجود") {
    super(404, message, "NOT_FOUND_ERROR");
  }
}

// أخطاء التعارض
export class ConflictError extends ApiError {
  constructor(message: string = "البيانات متعارضة") {
    super(409, message, "CONFLICT_ERROR");
  }
}

// أخطاء الحد الأقصى للطلبات
export class RateLimitError extends ApiError {
  constructor(message: string = "تم تجاوز الحد الأقصى للطلبات") {
    super(429, message, "RATE_LIMIT_ERROR");
  }
}

// أخطاء الخادم الداخلية
export class InternalServerError extends ApiError {
  constructor(message: string = "خطأ داخلي في الخادم") {
    super(500, message, "INTERNAL_SERVER_ERROR", null, false);
  }
}

// أخطاء قاعدة البيانات
export class DatabaseError extends ApiError {
  constructor(message: string = "خطأ في قاعدة البيانات", details?: any) {
    super(500, message, "DATABASE_ERROR", details, false);
  }
}

// أخطاء الخدمات الخارجية
export class ExternalServiceError extends ApiError {
  constructor(message: string = "خطأ في الخدمة الخارجية", service?: string) {
    super(502, message, "EXTERNAL_SERVICE_ERROR", { service });
  }
}

// أخطاء البريد الإلكتروني
export class EmailError extends ApiError {
  constructor(message: string = "خطأ في إرسال البريد الإلكتروني") {
    super(500, message, "EMAIL_ERROR", null, false);
  }
}

// أخطاء رفع الملفات
export class FileUploadError extends ApiError {
  constructor(message: string = "خطأ في رفع الملف", details?: any) {
    super(400, message, "FILE_UPLOAD_ERROR", details);
  }
}

// رموز الأخطاء المعرفة مسبقاً
export const ERROR_CODES = {
  // أخطاء عامة
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  
  // أخطاء المصادقة والتصريح
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  
  // أخطاء المستخدم
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  USER_INACTIVE: "USER_INACTIVE",
  USER_BANNED: "USER_BANNED",
  
  // أخطاء المحتوى
  ARTICLE_NOT_FOUND: "ARTICLE_NOT_FOUND",
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
  TAG_NOT_FOUND: "TAG_NOT_FOUND",
  COMMENT_NOT_FOUND: "COMMENT_NOT_FOUND",
  
  // أخطاء الملفات
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_UPLOAD_FAILED: "FILE_UPLOAD_FAILED",
  
  // أخطاء قاعدة البيانات
  DATABASE_CONNECTION_ERROR: "DATABASE_CONNECTION_ERROR",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  FOREIGN_KEY_CONSTRAINT: "FOREIGN_KEY_CONSTRAINT",
  
  // أخطاء الخدمات الخارجية
  EMAIL_SERVICE_ERROR: "EMAIL_SERVICE_ERROR",
  PAYMENT_SERVICE_ERROR: "PAYMENT_SERVICE_ERROR",
  STORAGE_SERVICE_ERROR: "STORAGE_SERVICE_ERROR",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  
  // أخطاء التكامل
  INTEGRATION_NOT_FOUND: "INTEGRATION_NOT_FOUND",
  INTEGRATION_DISABLED: "INTEGRATION_DISABLED",
  INTEGRATION_CONFIG_ERROR: "INTEGRATION_CONFIG_ERROR",
  
  // أخطاء الشبكة
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  CONNECTION_REFUSED: "CONNECTION_REFUSED",
} as const;

// رسائل الأخطاء المترجمة
export const ERROR_MESSAGES = {
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: "حدث خطأ داخلي في الخادم",
  [ERROR_CODES.VALIDATION_ERROR]: "البيانات المدخلة غير صالحة",
  [ERROR_CODES.AUTHENTICATION_ERROR]: "المصادقة مطلوبة",
  [ERROR_CODES.AUTHORIZATION_ERROR]: "ليس لديك صلاحية للوصول",
  [ERROR_CODES.INVALID_TOKEN]: "رمز المصادقة غير صالح",
  [ERROR_CODES.TOKEN_EXPIRED]: "رمز المصادقة منتهي الصلاحية",
  [ERROR_CODES.INVALID_CREDENTIALS]: "بيانات تسجيل الدخول غير صحيحة",
  [ERROR_CODES.USER_NOT_FOUND]: "المستخدم غير موجود",
  [ERROR_CODES.USER_ALREADY_EXISTS]: "المستخدم موجود بالفعل",
  [ERROR_CODES.USER_INACTIVE]: "حساب المستخدم غير مفعل",
  [ERROR_CODES.USER_BANNED]: "حساب المستخدم محظور",
  [ERROR_CODES.ARTICLE_NOT_FOUND]: "المقال غير موجود",
  [ERROR_CODES.CATEGORY_NOT_FOUND]: "التصنيف غير موجود",
  [ERROR_CODES.TAG_NOT_FOUND]: "العلامة غير موجودة",
  [ERROR_CODES.COMMENT_NOT_FOUND]: "التعليق غير موجود",
  [ERROR_CODES.FILE_TOO_LARGE]: "حجم الملف كبير جداً",
  [ERROR_CODES.INVALID_FILE_TYPE]: "نوع الملف غير مدعوم",
  [ERROR_CODES.FILE_UPLOAD_FAILED]: "فشل في رفع الملف",
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: "خطأ في الاتصال بقاعدة البيانات",
  [ERROR_CODES.DUPLICATE_ENTRY]: "البيانات مكررة",
  [ERROR_CODES.FOREIGN_KEY_CONSTRAINT]: "خطأ في الربط بين البيانات",
  [ERROR_CODES.EMAIL_SERVICE_ERROR]: "خطأ في خدمة البريد الإلكتروني",
  [ERROR_CODES.PAYMENT_SERVICE_ERROR]: "خطأ في خدمة الدفع",
  [ERROR_CODES.STORAGE_SERVICE_ERROR]: "خطأ في خدمة التخزين",
  [ERROR_CODES.AI_SERVICE_ERROR]: "خطأ في خدمة الذكاء الاصطناعي",
  [ERROR_CODES.INTEGRATION_NOT_FOUND]: "التكامل غير موجود",
  [ERROR_CODES.INTEGRATION_DISABLED]: "التكامل معطل",
  [ERROR_CODES.INTEGRATION_CONFIG_ERROR]: "خطأ في إعدادات التكامل",
  [ERROR_CODES.NETWORK_ERROR]: "خطأ في الشبكة",
  [ERROR_CODES.TIMEOUT_ERROR]: "انتهت مهلة الاتصال",
  [ERROR_CODES.CONNECTION_REFUSED]: "رُفض الاتصال",
} as const;

// دالة لإنشاء خطأ مخصص
export function createError(
  statusCode: number,
  errorCode: keyof typeof ERROR_CODES,
  customMessage?: string,
  details?: any
): ApiError {
  const message = customMessage || ERROR_MESSAGES[errorCode];
  return new ApiError(statusCode, message, errorCode, details);
}

// دالة للتحقق من أن الخطأ قابل للتشغيل
export function isOperationalError(error: Error): boolean {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
}

// دالة لتحويل أخطاء Prisma إلى أخطاء API
export function handlePrismaError(error: any): ApiError {
  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      return new ConflictError("البيانات مكررة");
    case "P2025":
      // Record not found
      return new NotFoundError("البيانات غير موجودة");
    case "P2003":
      // Foreign key constraint violation
      return new ValidationError("خطأ في الربط بين البيانات");
    case "P2014":
      // Required relation violation
      return new ValidationError("بيانات مطلوبة مفقودة");
    case "P1001":
      // Connection error
      return new DatabaseError("خطأ في الاتصال بقاعدة البيانات");
    default:
      return new InternalServerError("خطأ في قاعدة البيانات");
  }
}

// دالة لتحويل أخطاء JWT إلى أخطاء API
export function handleJwtError(error: any): ApiError {
  switch (error.name) {
    case "JsonWebTokenError":
      return new AuthenticationError("رمز المصادقة غير صالح");
    case "TokenExpiredError":
      return new AuthenticationError("رمز المصادقة منتهي الصلاحية");
    case "NotBeforeError":
      return new AuthenticationError("رمز المصادقة غير نشط بعد");
    default:
      return new AuthenticationError("خطأ في المصادقة");
  }
}

// دالة لتحويل أخطاء Zod إلى أخطاء API
export function handleZodError(error: any): ValidationError {
  const errors = error.errors.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return new ValidationError("خطأ في التحقق من صحة البيانات", { errors });
}

// دالة لتسجيل الأخطاء
export function logError(error: Error, context?: any): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  };

  if (error instanceof ApiError) {
    errorInfo.statusCode = error.statusCode;
    errorInfo.errorCode = error.errorCode;
    errorInfo.details = error.details;
    errorInfo.isOperational = error.isOperational;
  }

  // في بيئة الإنتاج، يجب إرسال الأخطاء إلى خدمة تتبع الأخطاء
  if (process.env.NODE_ENV === "production") {
    // TODO: إرسال إلى Sentry أو خدمة مشابهة
    console.error("ERROR:", JSON.stringify(errorInfo, null, 2));
  } else {
    console.error("ERROR:", errorInfo);
  }
}

// دالة لتنظيف رسالة الخطأ للعرض للمستخدم
export function sanitizeErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.isOperational) {
    return error.message;
  }

  // إخفاء تفاصيل الأخطاء الداخلية في بيئة الإنتاج
  if (process.env.NODE_ENV === "production") {
    return "حدث خطأ غير متوقع";
  }

  return error.message;
} 