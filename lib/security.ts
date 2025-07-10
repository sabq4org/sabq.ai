// نظام أمان شامل لمشروع Sabq AI CMS
// يتضمن التشفير، المصادقة، وحماية البيانات

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

// ============================================================================
// تشفير كلمات المرور
// ============================================================================

/**
 * تشفير كلمة مرور باستخدام bcrypt
 * @param password كلمة المرور الخام
 * @param saltRounds عدد جولات التشفير (افتراضي 12)
 * @returns Promise<string> كلمة المرور المشفرة
 */
export const hashPassword = async (
  password: string,
  saltRounds: number = 12
): Promise<string> => {
  if (!password) {
    throw new Error('كلمة المرور مطلوبة');
  }
  
  if (password.length < 8) {
    throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  }

  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error('فشل في تشفير كلمة المرور');
  }
};

/**
 * التحقق من كلمة مرور
 * @param password كلمة المرور الخام
 * @param hashedPassword كلمة المرور المشفرة
 * @returns Promise<boolean> true إذا كانت متطابقة
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  if (!password || !hashedPassword) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    return false;
  }
};

// ============================================================================
// توليد كلمات مرور وأرقام آمنة
// ============================================================================

/**
 * توليد كلمة مرور قوية
 * @param length الطول المطلوب
 * @param includeSpecialChars تضمين أحرف خاصة
 * @returns string كلمة مرور قوية
 */
export const generateSecurePassword = (
  length: number = 16,
  includeSpecialChars: boolean = true
): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = lowercase + uppercase + numbers;
  if (includeSpecialChars) {
    charset += specialChars;
  }

  let password = '';
  
  // ضمان وجود نوع واحد على الأقل من كل فئة
  password += getRandomChar(lowercase);
  password += getRandomChar(uppercase);
  password += getRandomChar(numbers);
  if (includeSpecialChars) {
    password += getRandomChar(specialChars);
  }

  // إكمال الطول المطلوب
  for (let i = password.length; i < length; i++) {
    password += getRandomChar(charset);
  }

  // خلط الأحرف
  return shuffleString(password);
};

/**
 * توليد رمز تحقق رقمي
 * @param length عدد الأرقام
 * @returns string رمز التحقق
 */
export const generateVerificationCode = (length: number = 6): string => {
  const numbers = '0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    code += getRandomChar(numbers);
  }

  return code;
};

/**
 * توليد رمز آمن للجلسات
 * @param length الطول بالبايت
 * @returns string الرمز المشفر hex
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// ============================================================================
// تشفير النصوص
// ============================================================================

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  authTag: string;
}

/**
 * تشفير نص باستخدام AES-256-GCM
 * @param text النص المراد تشفيره
 * @param key مفتاح التشفير (32 بايت)
 * @returns EncryptionResult نتيجة التشفير
 */
export const encryptText = (text: string, key: string): EncryptionResult => {
  if (!text) {
    throw new Error('النص مطلوب للتشفير');
  }

  if (!key || key.length !== 64) { // 32 bytes = 64 hex chars
    throw new Error('مفتاح التشفير يجب أن يكون 64 حرف hex (32 بايت)');
  }

  const keyBuffer = Buffer.from(key, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  cipher.setAAD(Buffer.from('sabq-cms-aad'));

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
};

/**
 * فك تشفير نص
 * @param encryptionResult نتيجة التشفير
 * @param key مفتاح التشفير
 * @returns string النص المفكوك
 */
export const decryptText = (
  encryptionResult: EncryptionResult,
  key: string
): string => {
  if (!encryptionResult.encryptedData || !encryptionResult.iv || !encryptionResult.authTag) {
    throw new Error('بيانات التشفير غير مكتملة');
  }

  if (!key || key.length !== 64) {
    throw new Error('مفتاح التشفير يجب أن يكون 64 حرف hex');
  }

  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = Buffer.from(encryptionResult.iv, 'hex');
    const authTag = Buffer.from(encryptionResult.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAAD(Buffer.from('sabq-cms-aad'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptionResult.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('فشل في فك التشفير - مفتاح خاطئ أو بيانات تالفة');
  }
};

// ============================================================================
// Hash و HMAC
// ============================================================================

/**
 * إنشاء hash للنص
 * @param text النص
 * @param algorithm الخوارزمية (افتراضي sha256)
 * @returns string الهاش hex
 */
export const createHash = (
  text: string,
  algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): string => {
  if (!text) {
    throw new Error('النص مطلوب لإنشاء الهاش');
  }

  return crypto.createHash(algorithm).update(text, 'utf8').digest('hex');
};

/**
 * إنشاء HMAC
 * @param text النص
 * @param key المفتاح السري
 * @param algorithm الخوارزمية
 * @returns string الـ HMAC hex
 */
export const createHMAC = (
  text: string,
  key: string,
  algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): string => {
  if (!text || !key) {
    throw new Error('النص والمفتاح مطلوبان لإنشاء HMAC');
  }

  return crypto.createHmac(algorithm, key).update(text, 'utf8').digest('hex');
};

/**
 * التحقق من HMAC
 * @param text النص الأصلي
 * @param key المفتاح السري
 * @param providedHMAC الـ HMAC المقدم للتحقق
 * @param algorithm الخوارزمية
 * @returns boolean true إذا كان صحيح
 */
export const verifyHMAC = (
  text: string,
  key: string,
  providedHMAC: string,
  algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): boolean => {
  try {
    const computedHMAC = createHMAC(text, key, algorithm);
    return crypto.timingSafeEqual(
      Buffer.from(computedHMAC, 'hex'),
      Buffer.from(providedHMAC, 'hex')
    );
  } catch (error) {
    return false;
  }
};

// ============================================================================
// JWT بسيط (بدون مكتبة خارجية)
// ============================================================================

export interface JWTPayload {
  [key: string]: any;
  exp?: number;
  iat?: number;
}

/**
 * إنشاء JWT بسيط
 * @param payload البيانات
 * @param secret المفتاح السري
 * @param expiresIn انتهاء الصلاحية بالثواني
 * @returns string JWT
 */
export const createSimpleJWT = (
  payload: JWTPayload,
  secret: string,
  expiresIn?: number
): string => {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    ...(expiresIn && { exp: now + expiresIn }),
  };

  const encodedHeader = base64URLEncode(JSON.stringify(header));
  const encodedPayload = base64URLEncode(JSON.stringify(fullPayload));
  const signature = createHMAC(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

/**
 * التحقق من JWT بسيط
 * @param token الرمز
 * @param secret المفتاح السري
 * @returns JWTPayload | null البيانات أو null إذا كان غير صحيح
 */
export const verifySimpleJWT = (
  token: string,
  secret: string
): JWTPayload | null => {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }

    // التحقق من التوقيع
    const expectedSignature = createHMAC(`${encodedHeader}.${encodedPayload}`, secret);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    // فك تشفير البيانات
    const payload = JSON.parse(base64URLDecode(encodedPayload)) as JWTPayload;

    // التحقق من انتهاء الصلاحية
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
};

// ============================================================================
// إدارة الجلسات
// ============================================================================

/**
 * إنشاء معرف جلسة آمن
 * @returns string معرف الجلسة
 */
export const generateSessionId = (): string => {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const combined = `${timestamp}-${randomBytes}`;
  return createHash(combined);
};

/**
 * تشفير معرف المستخدم للجلسة
 * @param userId معرف المستخدم
 * @param secret المفتاح السري
 * @returns string المعرف المشفر
 */
export const encryptUserId = (userId: string, secret: string): string => {
  const key = createHash(secret + 'user-id-salt').substring(0, 64);
  const result = encryptText(userId, key);
  return `${result.encryptedData}.${result.iv}.${result.authTag}`;
};

/**
 * فك تشفير معرف المستخدم من الجلسة
 * @param encryptedUserId المعرف المشفر
 * @param secret المفتاح السري
 * @returns string | null معرف المستخدم أو null
 */
export const decryptUserId = (
  encryptedUserId: string,
  secret: string
): string | null => {
  try {
    const [encryptedData, iv, authTag] = encryptedUserId.split('.');
    if (!encryptedData || !iv || !authTag) {
      return null;
    }

    const key = createHash(secret + 'user-id-salt').substring(0, 64);
    return decryptText({ encryptedData, iv, authTag }, key);
  } catch (error) {
    return null;
  }
};

// ============================================================================
// تقييم قوة كلمة المرور
// ============================================================================

export interface PasswordStrength {
  score: number; // 0-100
  level: 'ضعيف' | 'متوسط' | 'قوي' | 'قوي جداً';
  feedback: string[];
}

/**
 * تقييم قوة كلمة المرور
 * @param password كلمة المرور
 * @returns PasswordStrength تقييم القوة
 */
export const evaluatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // التحقق من الطول
  if (password.length >= 8) {
    score += 20;
  } else {
    feedback.push('كلمة المرور قصيرة جداً (أقل من 8 أحرف)');
  }

  if (password.length >= 12) {
    score += 10;
  }

  // التحقق من الأحرف الصغيرة
  if (/[a-z]/.test(password)) {
    score += 10;
  } else {
    feedback.push('أضف أحرف صغيرة (a-z)');
  }

  // التحقق من الأحرف الكبيرة
  if (/[A-Z]/.test(password)) {
    score += 10;
  } else {
    feedback.push('أضف أحرف كبيرة (A-Z)');
  }

  // التحقق من الأرقام
  if (/[0-9]/.test(password)) {
    score += 10;
  } else {
    feedback.push('أضف أرقام (0-9)');
  }

  // التحقق من الأحرف الخاصة
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push('أضف أحرف خاصة (!@#$%^&*)');
  }

  // التحقق من التنوع
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.8) {
    score += 15;
  } else {
    feedback.push('تجنب تكرار الأحرف كثيراً');
  }

  // التحقق من الأنماط الشائعة
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /(.)\1{3,}/, // تكرار الحرف نفسه
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score -= 20;
      feedback.push('تجنب الأنماط الشائعة والتسلسلات');
      break;
    }
  }

  // تحديد المستوى
  let level: PasswordStrength['level'];
  if (score >= 80) {
    level = 'قوي جداً';
  } else if (score >= 60) {
    level = 'قوي';
  } else if (score >= 40) {
    level = 'متوسط';
  } else {
    level = 'ضعيف';
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    level,
    feedback: feedback.length === 0 ? ['كلمة مرور ممتازة!'] : feedback,
  };
};

// ============================================================================
// دوال مساعدة
// ============================================================================

/**
 * الحصول على حرف عشوائي من مجموعة أحرف
 */
const getRandomChar = (charset: string): string => {
  const randomIndex = crypto.randomInt(0, charset.length);
  return charset[randomIndex];
};

/**
 * خلط أحرف النص
 */
const shuffleString = (str: string): string => {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
};

/**
 * ترميز Base64 URL آمن
 */
const base64URLEncode = (str: string): string => {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * فك ترميز Base64 URL آمن
 */
const base64URLDecode = (str: string): string => {
  str += '='.repeat((4 - str.length % 4) % 4);
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}; 