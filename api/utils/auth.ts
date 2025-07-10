/**
 * أدوات المصادقة وإدارة الرموز المميزة
 * Authentication Utilities & Token Management
 * @version 2.1.0
 * @author Sabq AI Team
 */

import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ApiError } from "./errors";

// واجهات الرموز المميزة
export interface TokenPayload {
  userId: string;
  type: "access" | "refresh" | "reset" | "verification";
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

// إعدادات الرموز المميزة
const TOKEN_CONFIG = {
  access: {
    secret: process.env.JWT_SECRET!,
    expiresIn: "15m", // 15 دقيقة
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    expiresIn: "7d", // 7 أيام
  },
  reset: {
    secret: process.env.JWT_RESET_SECRET || process.env.JWT_SECRET!,
    expiresIn: "1h", // ساعة واحدة
  },
  verification: {
    secret: process.env.JWT_VERIFICATION_SECRET || process.env.JWT_SECRET!,
    expiresIn: "24h", // 24 ساعة
  },
};

// إنشاء رمز مميز
export function generateToken(
  userId: string, 
  type: TokenPayload["type"] = "access",
  customExpiry?: string
): string {
  const config = TOKEN_CONFIG[type];
  const payload: TokenPayload = {
    userId,
    type,
  };

  return jwt.sign(payload, config.secret, {
    expiresIn: customExpiry || config.expiresIn,
    issuer: "sabq-ai-cms",
    audience: "sabq-ai-users",
  });
}

// إنشاء زوج من الرموز المميزة
export function generateTokens(userId: string, customRefreshExpiry?: string): TokenPair {
  const accessToken = generateToken(userId, "access");
  const refreshToken = generateToken(userId, "refresh", customRefreshExpiry);

  // استخراج وقت انتهاء الصلاحية
  const decoded = jwt.decode(accessToken) as any;
  const expiresIn = decoded.exp - decoded.iat;

  return {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType: "Bearer",
  };
}

// التحقق من صحة الرمز المميز
export function verifyToken(
  token: string, 
  type: TokenPayload["type"] = "access"
): TokenPayload {
  try {
    const config = TOKEN_CONFIG[type];
    const payload = jwt.verify(token, config.secret, {
      issuer: "sabq-ai-cms",
      audience: "sabq-ai-users",
    }) as TokenPayload;

    if (payload.type !== type) {
      throw new ApiError(401, "نوع الرمز المميز غير صحيح");
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "رمز مميز غير صالح");
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "رمز مميز منتهي الصلاحية");
    }
    throw error;
  }
}

// التحقق من رمز التجديد
export function verifyRefreshToken(token: string): TokenPayload {
  return verifyToken(token, "refresh");
}

// التحقق من رمز إعادة تعيين كلمة المرور
export function verifyResetToken(token: string): TokenPayload {
  return verifyToken(token, "reset");
}

// التحقق من رمز التحقق من البريد الإلكتروني
export function verifyVerificationToken(token: string): TokenPayload {
  return verifyToken(token, "verification");
}

// إنشاء رمز إعادة تعيين كلمة المرور
export function generateResetToken(userId: string): string {
  return generateToken(userId, "reset");
}

// إنشاء رمز التحقق من البريد الإلكتروني
export function generateVerificationToken(userId: string): string {
  return generateToken(userId, "verification");
}

// تشفير كلمة المرور
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// التحقق من كلمة المرور
export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// إنشاء مفتاح API آمن
export function generateApiKey(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

// إنشاء رمز عشوائي آمن
export function generateSecureCode(length: number = 6): string {
  const chars = "0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// إنشاء مفتاح تشفير
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

// تشفير البيانات الحساسة
export function encrypt(text: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY!;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher("aes-256-cbc", encryptionKey);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return iv.toString("hex") + ":" + encrypted;
}

// فك تشفير البيانات
export function decrypt(encryptedText: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY!;
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipher("aes-256-cbc", encryptionKey);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

// إنشاء توقيع HMAC
export function createHmacSignature(
  data: string, 
  secret?: string
): string {
  const signingSecret = secret || process.env.WEBHOOK_SECRET!;
  return crypto
    .createHmac("sha256", signingSecret)
    .update(data)
    .digest("hex");
}

// التحقق من توقيع HMAC
export function verifyHmacSignature(
  data: string, 
  signature: string, 
  secret?: string
): boolean {
  const expectedSignature = createHmacSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

// إنشاء hash آمن للملفات
export function createFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// التحقق من قوة كلمة المرور
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // التحقق من الطول
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  }

  // التحقق من الأحرف الصغيرة
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("يجب أن تحتوي على أحرف صغيرة");
  }

  // التحقق من الأحرف الكبيرة
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("يجب أن تحتوي على أحرف كبيرة");
  }

  // التحقق من الأرقام
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push("يجب أن تحتوي على أرقام");
  }

  // التحقق من الرموز الخاصة
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push("يجب أن تحتوي على رموز خاصة");
  }

  // التحقق من كلمات المرور الشائعة
  const commonPasswords = [
    "password", "123456", "password123", "admin", "qwerty",
    "12345678", "welcome", "login", "master", "abc123"
  ];
  
  if (commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  )) {
    score = Math.max(0, score - 2);
    feedback.push("تجنب استخدام كلمات مرور شائعة");
  }

  return {
    score: Math.max(0, Math.min(4, score)),
    feedback,
    isValid: score >= 3,
  };
}

// إنشاء session ID آمن
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

// إنشاء CSRF token
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("base64");
}

// التحقق من CSRF token
export function verifyCsrfToken(token: string, sessionToken: string): boolean {
  // هنا يمكن تنفيذ منطق التحقق من CSRF المناسب
  return token === sessionToken;
}

// إنشاء رمز التحقق بخطوتين
export function generateTwoFactorCode(): string {
  return generateSecureCode(6);
}

// إنشاء backup codes للتحقق بخطوتين
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateSecureCode(8));
  }
  return codes;
}

// إنشاء معرف فريد قصير
export function generateShortId(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// دالة للتحقق من انتهاء صلاحية الرمز المميز
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

// دالة لاستخراج معلومات من الرمز المميز دون التحقق
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

// دالة لحساب وقت انتهاء الصلاحية
export function getTokenExpiryTime(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
} 