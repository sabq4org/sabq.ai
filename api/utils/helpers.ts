/**
 * دوال مساعدة عامة
 * General Helper Functions
 * @version 2.1.0
 * @author Sabq AI Team
 */

import slugify from "slugify";
import validator from "validator";
import crypto from "crypto";

// إنشاء slug من النص العربي
export function generateSlug(text: string, options?: {
  replacement?: string;
  lower?: boolean;
  strict?: boolean;
}): string {
  const defaultOptions = {
    replacement: "-",
    lower: true,
    strict: true,
    locale: "ar",
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // معالجة النص العربي
  let processedText = text
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي");

  // إنشاء slug
  const slug = slugify(processedText, mergedOptions);

  // إضافة معرف فريد إذا كان الـ slug فارغاً
  if (!slug || slug.length < 2) {
    return `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  return slug;
}

// التحقق من صحة البريد الإلكتروني
export function isValidEmail(email: string): boolean {
  return validator.isEmail(email);
}

// التحقق من صحة رقم الهاتف السعودي
export function isValidSaudiPhone(phone: string): boolean {
  const saudiPhoneRegex = /^(\+966|0)?5\d{8}$/;
  return saudiPhoneRegex.test(phone.replace(/\s/g, ""));
}

// تنسيق رقم الهاتف السعودي
export function formatSaudiPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith("966")) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith("05")) {
    return `+966${cleaned.substring(1)}`;
  } else if (cleaned.startsWith("5")) {
    return `+966${cleaned}`;
  }
  
  return phone;
}

// التحقق من قوة كلمة المرور
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  // التحقق من الطول
  if (password.length < 8) {
    errors.push("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  } else {
    score += 1;
  }

  // التحقق من وجود أحرف صغيرة
  if (!/[a-z]/.test(password)) {
    errors.push("يجب أن تحتوي على أحرف صغيرة");
  } else {
    score += 1;
  }

  // التحقق من وجود أحرف كبيرة
  if (!/[A-Z]/.test(password)) {
    errors.push("يجب أن تحتوي على أحرف كبيرة");
  } else {
    score += 1;
  }

  // التحقق من وجود أرقام
  if (!/\d/.test(password)) {
    errors.push("يجب أن تحتوي على أرقام");
  } else {
    score += 1;
  }

  // التحقق من وجود رموز خاصة
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("يجب أن تحتوي على رموز خاصة");
  } else {
    score += 1;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score,
  };
}

// حساب وقت القراءة المتوقع
export function calculateReadingTime(text: string, wordsPerMinute: number = 200): number {
  const wordCount = text.trim().split(/\s+/).length;
  const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readingTimeMinutes);
}

// استخراج النص من HTML
export function extractTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // إزالة العلامات
    .replace(/\s+/g, " ") // تقليل المسافات
    .trim();
}

// تحويل النص إلى تنسيق آمن لـ HTML
export function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// إنشاء مقتطف من النص
export function createExcerpt(text: string, length: number = 150): string {
  const plainText = extractTextFromHtml(text);
  
  if (plainText.length <= length) {
    return plainText;
  }

  const truncated = plainText.substring(0, length);
  const lastSpace = truncated.lastIndexOf(" ");
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + "...";
  }
  
  return truncated + "...";
}

// تحويل التاريخ إلى تنسيق عربي
export function formatArabicDate(date: Date): string {
  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const day = date.getDate();
  const month = arabicMonths[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

// تحويل الوقت إلى تنسيق "منذ..."
export function timeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    سنة: 31536000,
    شهر: 2592000,
    أسبوع: 604800,
    يوم: 86400,
    ساعة: 3600,
    دقيقة: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `منذ ${interval} ${unit}${interval > 1 ? (unit === "ساعة" ? "ات" : unit === "دقيقة" ? "ة" : "") : ""}`;
    }
  }

  return "منذ لحظات";
}

// تحويل الحجم إلى تنسيق قابل للقراءة
export function formatFileSize(bytes: number): string {
  const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت", "تيرابايت"];
  
  if (bytes === 0) return "0 بايت";
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(2)} ${sizes[i]}`;
}

// التحقق من نوع الملف
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

// إنشاء معرف فريد
export function generateUniqueId(length: number = 8): string {
  return crypto.randomBytes(length).toString("hex");
}

// تحويل الكائن إلى query string
export function objectToQueryString(obj: Record<string, any>): string {
  const params = new URLSearchParams();
  
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null) {
      params.append(key, obj[key].toString());
    }
  });
  
  return params.toString();
}

// تحويل query string إلى كائن
export function queryStringToObject(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

// التحقق من صحة URL
export function isValidUrl(url: string): boolean {
  return validator.isURL(url);
}

// تنظيف وتنسيق رقم الهاتف
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

// تحويل النص إلى حالة العنوان
export function toTitleCase(text: string): string {
  return text.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// إنشاء hash للنص
export function createHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// تحويل الكائن إلى JSON آمن
export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    return "{}";
  }
}

// تحويل JSON إلى كائن آمن
export function safeJsonParse(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return {};
  }
}

// إنشاء رمز التحقق
export function generateVerificationCode(length: number = 6): string {
  const chars = "0123456789";
  let result = "";
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// التحقق من التاريخ
export function isValidDate(date: string): boolean {
  return !isNaN(Date.parse(date));
}

// تحويل التاريخ إلى ISO string
export function toISOString(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }
  return date.toISOString();
} 