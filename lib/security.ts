// نظام أمان شامل لمشروع Sabq AI CMS
// يتضمن التشفير، المصادقة، وحماية البيانات

import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// إعدادات الأمان
export const SECURITY_CONFIG = {
  // حد أقصى لعدد الطلبات لكل دقيقة
  RATE_LIMIT_PER_MINUTE: 60,
  // حد أقصى لعدد محاولات تسجيل الدخول الفاشلة
  MAX_LOGIN_ATTEMPTS: 5,
  // مدة قفل الحساب بالدقائق
  ACCOUNT_LOCKOUT_DURATION: 30,
  // طول كلمة المرور الأدنى
  MIN_PASSWORD_LENGTH: 8,
  // أنماط كلمات المرور المطلوبة
  PASSWORD_REQUIREMENTS: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  }
};

/**
 * تنظيف HTML من الأكواد الخبيثة
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // إعدادات DOMPurify للمحرر
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'strike', 'sub', 'sup',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img', 'video', 'audio', 'iframe',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'width', 'height',
      'class', 'id', 'style', 'target', 'rel',
      'controls', 'autoplay', 'loop', 'muted',
      'frameborder', 'allowfullscreen'
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false
  };

  try {
    return DOMPurify.sanitize(html, config);
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return '';
  }
}

/**
 * تنظيف النص من الأحرف الخطيرة
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/[<>]/g, '') // إزالة أقواس HTML
    .replace(/javascript:/gi, '') // إزالة JavaScript URLs
    .replace(/on\w+=/gi, '') // إزالة event handlers
    .trim();
}

/**
 * التحقق من صحة عنوان URL
 */
export function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * تشفير كلمة المرور
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * التحقق من كلمة المرور
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

/**
 * إنشاء رمز عشوائي آمن
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * تشفير البيانات الحساسة
 */
export function encryptData(data: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * فك تشفير البيانات
 */
export function decryptData(encryptedData: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * التحقق من قوة كلمة المرور
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  // الطول الأدنى
  if (password.length < SECURITY_CONFIG.PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else {
    score += 20;
  }

  // الأحرف الكبيرة
  if (SECURITY_CONFIG.PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 20;
  }

  // الأحرف الصغيرة
  if (SECURITY_CONFIG.PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 20;
  }

  // الأرقام
  if (SECURITY_CONFIG.PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/[0-9]/.test(password)) {
    score += 20;
  }

  // الأحرف الخاصة
  if (SECURITY_CONFIG.PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 20;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score
  };
}

/**
 * التحقق من صحة عنوان البريد الإلكتروني
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * التحقق من صحة رقم الهاتف
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * منع حقن SQL
 */
export function preventSqlInjection(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments start
    .replace(/\*\//g, '') // Remove SQL block comments end
    .replace(/xp_/gi, '') // Remove xp_ stored procedures
    .replace(/sp_/gi, '') // Remove sp_ stored procedures
    .replace(/exec/gi, '') // Remove exec statements
    .replace(/union/gi, '') // Remove union statements
    .replace(/select/gi, '') // Remove select statements
    .replace(/insert/gi, '') // Remove insert statements
    .replace(/update/gi, '') // Remove update statements
    .replace(/delete/gi, '') // Remove delete statements
    .replace(/drop/gi, '') // Remove drop statements
    .replace(/create/gi, '') // Remove create statements
    .replace(/alter/gi, ''); // Remove alter statements
}

/**
 * تنظيف معاملات الاستعلام
 */
export function sanitizeQueryParams(params: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'number') {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * التحقق من صحة المدخلات باستخدام Zod
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: any): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * حماية من هجمات CSRF
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * التحقق من رمز CSRF
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expectedToken, 'hex')
  );
}

/**
 * تنظيف اسم الملف
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
}

/**
 * التحقق من نوع الملف المسموح
 */
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * حماية من هجمات XSS في JSON
 */
export function sanitizeJsonData(data: any): any {
  if (typeof data === 'string') {
    return sanitizeText(data);
  } else if (Array.isArray(data)) {
    return data.map(item => sanitizeJsonData(item));
  } else if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[sanitizeText(key)] = sanitizeJsonData(value);
    }
    return sanitized;
  }
  return data;
}

/**
 * تسجيل محاولات الأمان المشبوهة
 */
export function logSecurityEvent(event: {
  type: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}) {
  console.warn('Security Event:', {
    timestamp: new Date().toISOString(),
    ...event
  });
  
  // يمكن إضافة تسجيل في قاعدة البيانات أو خدمة مراقبة خارجية
}

/**
 * التحقق من حد الطلبات (Rate Limiting)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, limit: number = SECURITY_CONFIG.RATE_LIMIT_PER_MINUTE): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // دقيقة واحدة
  
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // إنشاء سجل جديد أو إعادة تعيين السجل المنتهي الصلاحية
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (record.count >= limit) {
    return false; // تجاوز الحد المسموح
  }
  
  record.count++;
  return true;
}

/**
 * تنظيف ذاكرة Rate Limiting
 */
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// تنظيف دوري لذاكرة Rate Limiting
setInterval(cleanupRateLimit, 5 * 60 * 1000); // كل 5 دقائق 