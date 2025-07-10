import crypto from 'crypto';
import { z } from 'zod';

/**
 * مفاتيح التشفير والأمان
 */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_IV_LENGTH = 16;

/**
 * أنواع البيانات الحساسة
 */
export const SENSITIVE_KEYS = [
  'apiKey',
  'apiSecret',
  'secretKey',
  'privateKey',
  'password',
  'token',
  'secret',
  'key',
  'credential',
  'auth',
  'bearer',
  'oauth',
  'webhook_secret',
  'client_secret',
  'refresh_token',
  'access_token'
];

/**
 * Schema للتحقق من صحة التوقيع
 */
const WebhookSignatureSchema = z.object({
  signature: z.string().min(1, 'التوقيع مطلوب'),
  payload: z.string().min(1, 'المحتوى مطلوب'),
  secret: z.string().min(1, 'السر مطلوب'),
  algorithm: z.enum(['sha256', 'sha1', 'md5']).default('sha256')
});

/**
 * Schema للتحقق من صحة البيانات المشفرة
 */
const EncryptedDataSchema = z.object({
  data: z.string().min(1, 'البيانات المشفرة مطلوبة'),
  iv: z.string().min(1, 'IV مطلوب'),
  authTag: z.string().min(1, 'AuthTag مطلوب')
});

/**
 * تشفير البيانات الحساسة
 */
export function encrypt(text: string): string {
  try {
    if (!text) return '';
    
    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
    cipher.setAAD(Buffer.from('sabq-ai-cms'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      data: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  } catch (error) {
    console.error('خطأ في التشفير:', error);
    throw new Error('فشل في تشفير البيانات');
  }
}

/**
 * فك تشفير البيانات
 */
export function decrypt(encryptedData: string): string {
  try {
    if (!encryptedData) return '';
    
    const validation = EncryptedDataSchema.safeParse(JSON.parse(encryptedData));
    if (!validation.success) {
      throw new Error('بيانات التشفير غير صالحة');
    }
    
    const { data, iv, authTag } = validation.data;
    
    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('sabq-ai-cms'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('خطأ في فك التشفير:', error);
    throw new Error('فشل في فك تشفير البيانات');
  }
}

/**
 * تشفير كائن كامل مع البيانات الحساسة
 */
export function encryptObject(obj: Record<string, any>): Record<string, any> {
  const encrypted = { ...obj };
  
  for (const key in encrypted) {
    if (isSensitiveKey(key) && typeof encrypted[key] === 'string') {
      encrypted[key] = encrypt(encrypted[key]);
    } else if (typeof encrypted[key] === 'object' && encrypted[key] !== null) {
      encrypted[key] = encryptObject(encrypted[key]);
    }
  }
  
  return encrypted;
}

/**
 * فك تشفير كائن كامل
 */
export function decryptObject(obj: Record<string, any>): Record<string, any> {
  const decrypted = { ...obj };
  
  for (const key in decrypted) {
    if (isSensitiveKey(key) && typeof decrypted[key] === 'string') {
      try {
        decrypted[key] = decrypt(decrypted[key]);
      } catch (error) {
        console.warn(`فشل في فك تشفير ${key}:`, error);
      }
    } else if (typeof decrypted[key] === 'object' && decrypted[key] !== null) {
      decrypted[key] = decryptObject(decrypted[key]);
    }
  }
  
  return decrypted;
}

/**
 * التحقق من كون المفتاح حساس
 */
export function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitiveKey => 
    lowerKey.includes(sensitiveKey.toLowerCase())
  );
}

/**
 * إنشاء توقيع HMAC
 */
export function createHmacSignature(
  payload: string, 
  secret: string, 
  algorithm: string = 'sha256'
): string {
  try {
    return crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex');
  } catch (error) {
    console.error('خطأ في إنشاء التوقيع:', error);
    throw new Error('فشل في إنشاء التوقيع');
  }
}

/**
 * التحقق من صحة توقيع Webhook
 */
export function verifyWebhookSignature(
  signature: string,
  payload: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  try {
    const validation = WebhookSignatureSchema.safeParse({
      signature,
      payload,
      secret,
      algorithm
    });
    
    if (!validation.success) {
      console.error('بيانات التحقق غير صالحة:', validation.error);
      return false;
    }
    
    const expectedSignature = createHmacSignature(payload, secret, algorithm);
    
    // إزالة البادئة إذا كانت موجودة (مثل sha256=)
    const cleanSignature = signature.replace(/^(sha256|sha1|md5)=/, '');
    
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('خطأ في التحقق من التوقيع:', error);
    return false;
  }
}

/**
 * إنشاء مفتاح API آمن
 */
export function generateApiKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * إنشاء رمز JWT بسيط
 */
export function createSimpleJWT(
  payload: Record<string, any>,
  secret: string,
  expiresIn: number = 3600 // بالثواني
): string {
  try {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  } catch (error) {
    console.error('خطأ في إنشاء JWT:', error);
    throw new Error('فشل في إنشاء JWT');
  }
}

/**
 * التحقق من صحة رمز JWT
 */
export function verifySimpleJWT(token: string, secret: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('JWT غير صالح');
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    
    // التحقق من التوقيع
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    if (!crypto.timingSafeEqual(
      Buffer.from(signature, 'base64url'),
      Buffer.from(expectedSignature, 'base64url')
    )) {
      throw new Error('توقيع JWT غير صالح');
    }
    
    // فك تشفير المحتوى
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    
    // التحقق من انتهاء الصلاحية
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('انتهت صلاحية JWT');
    }
    
    return payload;
  } catch (error) {
    console.error('خطأ في التحقق من JWT:', error);
    throw new Error('فشل في التحقق من JWT');
  }
}

/**
 * إنشاء hash آمن
 */
export function createHash(data: string, algorithm: string = 'sha256'): string {
  try {
    return crypto
      .createHash(algorithm)
      .update(data)
      .digest('hex');
  } catch (error) {
    console.error('خطأ في إنشاء Hash:', error);
    throw new Error('فشل في إنشاء Hash');
  }
}

/**
 * إنشاء salt عشوائي
 */
export function generateSalt(length: number = 16): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * تشفير كلمة مرور مع salt
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  try {
    const usedSalt = salt || generateSalt();
    const hash = crypto
      .createHash('sha256')
      .update(password + usedSalt)
      .digest('hex');
    
    return { hash, salt: usedSalt };
  } catch (error) {
    console.error('خطأ في تشفير كلمة المرور:', error);
    throw new Error('فشل في تشفير كلمة المرور');
  }
}

/**
 * التحقق من كلمة المرور
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const { hash: computedHash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(computedHash, 'hex')
    );
  } catch (error) {
    console.error('خطأ في التحقق من كلمة المرور:', error);
    return false;
  }
}

/**
 * قناع البيانات الحساسة للسجلات
 */
export function maskSensitiveData(obj: Record<string, any>): Record<string, any> {
  const masked = { ...obj };
  
  for (const key in masked) {
    if (isSensitiveKey(key) && typeof masked[key] === 'string') {
      const value = masked[key];
      if (value.length > 8) {
        masked[key] = value.substring(0, 4) + '****' + value.substring(value.length - 4);
      } else {
        masked[key] = '****';
      }
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  
  return masked;
}

/**
 * تنظيف البيانات الحساسة من الكائن
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (isSensitiveKey(key)) {
      delete sanitized[key];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * واجهة نتيجة التحقق من الأمان
 */
export interface SecurityValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // من 0 إلى 100
}

/**
 * تقييم أمان التكامل
 */
export function validateIntegrationSecurity(config: Record<string, any>): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  
  // التحقق من وجود مفاتيح حساسة
  const sensitiveKeys = Object.keys(config).filter(key => isSensitiveKey(key));
  if (sensitiveKeys.length === 0) {
    warnings.push('لا توجد مفاتيح حساسة في التكوين');
    score -= 10;
  }
  
  // التحقق من تشفير البيانات الحساسة
  for (const key of sensitiveKeys) {
    const value = config[key];
    if (typeof value === 'string') {
      if (value.length < 8) {
        errors.push(`${key}: المفتاح قصير جداً (أقل من 8 أحرف)`);
        score -= 20;
      }
      
      if (!/^[a-zA-Z0-9+/=]+$/.test(value)) {
        // قد يكون مشفراً
        try {
          JSON.parse(value);
          // إذا كان JSON صالح، قد يكون مشفراً
        } catch {
          warnings.push(`${key}: المفتاح قد يكون غير مشفر`);
          score -= 15;
        }
      }
    }
  }
  
  // التحقق من HTTPS في الروابط
  const urlKeys = Object.keys(config).filter(key => 
    key.toLowerCase().includes('url') || key.toLowerCase().includes('endpoint')
  );
  
  for (const key of urlKeys) {
    const value = config[key];
    if (typeof value === 'string' && value.startsWith('http://')) {
      warnings.push(`${key}: استخدام HTTP بدلاً من HTTPS`);
      score -= 10;
    }
  }
  
  // التحقق من إعدادات الأمان
  if (config.ssl === false) {
    warnings.push('SSL معطل');
    score -= 15;
  }
  
  if (config.timeout && config.timeout > 60000) {
    warnings.push('انتهاء المهلة طويل جداً (أكثر من 60 ثانية)');
    score -= 5;
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score)
  };
} 