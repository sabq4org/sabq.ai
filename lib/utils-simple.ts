/**
 * دالة لدمج فئات CSS مع Tailwind CSS
 * @param inputs - فئات CSS للدمج
 * @returns فئات CSS مدمجة
 */
export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * دالة لتنسيق التاريخ باللغة العربية
 * @param date - التاريخ المراد تنسيقه
 * @param format - نوع التنسيق (full, short, relative)
 * @returns التاريخ منسق
 */
export function formatDate(date: Date | string, format: 'full' | 'short' | 'relative' = 'full'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    } else if (hours > 0) {
      return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    } else if (minutes > 0) {
      return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
    } else {
      return 'منذ قليل';
    }
  }
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Riyadh',
    ...(format === 'full' 
      ? { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }
      : { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        }
    )
  };
  
  return dateObj.toLocaleDateString('ar-SA', options);
}

/**
 * دالة لتنسيق الأرقام باللغة العربية
 * @param num - الرقم المراد تنسيقه
 * @param format - نوع التنسيق (decimal, percentage, currency, compact)
 * @returns الرقم منسق
 */
export function formatNumber(num: number, format: 'decimal' | 'percentage' | 'currency' | 'compact' = 'decimal'): string {
  const options: Intl.NumberFormatOptions = {};
  
  switch (format) {
    case 'percentage':
      options.style = 'percent';
      break;
    case 'currency':
      options.style = 'currency';
      options.currency = 'SAR';
      break;
    case 'compact':
      options.notation = 'compact';
      options.compactDisplay = 'short';
      break;
    default:
      options.style = 'decimal';
  }
  
  return num.toLocaleString('ar-SA', options);
}

/**
 * دالة لإنشاء Slug من النص العربي
 * @param text - النص المراد تحويله
 * @returns Slug منسق
 */
export function createSlug(text: string): string {
  // إزالة الحروف الخاصة والمسافات الزائدة
  const slug = text
    .trim()
    .toLowerCase()
    // تحويل الحروف العربية إلى حروف لاتينية
    .replace(/[أإآا]/g, 'a')
    .replace(/[ة]/g, 'h')
    .replace(/[ى]/g, 'y')
    .replace(/[ء]/g, '')
    // إزالة الحروف الخاصة
    .replace(/[^\w\s-]/g, '')
    // تحويل المسافات إلى شرطات
    .replace(/\s+/g, '-')
    // إزالة الشرطات المتتالية
    .replace(/-+/g, '-')
    // إزالة الشرطات من البداية والنهاية
    .replace(/^-+|-+$/g, '');
  
  // إضافة معرف عشوائي للتأكد من التفرد
  const randomId = Math.random().toString(36).substr(2, 6);
  return `${slug}-${randomId}`;
}

/**
 * دالة لقص النص مع الحفاظ على الكلمات الكاملة
 * @param text - النص المراد قصه
 * @param maxLength - الحد الأقصى للطول
 * @returns النص مقصوص
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  const truncated = text.substr(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substr(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * دالة لحساب وقت القراءة المتوقع
 * @param content - المحتوى المراد حساب وقت قراءته
 * @param wordsPerMinute - عدد الكلمات في الدقيقة (افتراضي: 200)
 * @returns وقت القراءة بالدقائق
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
}

/**
 * دالة لتنسيق حجم الملف
 * @param bytes - حجم الملف بالبايت
 * @returns حجم الملف منسق
 */
export function formatFileSize(bytes: number): string {
  const units = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * دالة للتحقق من صحة البريد الإلكتروني
 * @param email - البريد الإلكتروني المراد التحقق منه
 * @returns true إذا كان صحيحاً، false إذا كان غير صحيح
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * دالة للتحقق من صحة رقم الهاتف السعودي
 * @param phone - رقم الهاتف المراد التحقق منه
 * @returns true إذا كان صحيحاً، false إذا كان غير صحيح
 */
export function validateSaudiPhone(phone: string): boolean {
  const phoneRegex = /^(\+966|0)?5[0-9]{8}$/;
  return phoneRegex.test(phone);
}

/**
 * دالة لإنشاء رقم عشوائي آمن
 * @param length - طول الرقم المطلوب
 * @returns رقم عشوائي آمن
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * دالة لتحويل النص إلى لون هاشي
 * @param text - النص المراد تحويله
 * @returns كود اللون الهاشي
 */
export function stringToColor(text: string): string {
  let hash = 0;
  
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * دالة لتأخير التنفيذ (للاستخدام مع async/await)
 * @param ms - مدة التأخير بالميلي ثانية
 * @returns Promise للتأخير
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * دالة لمعالجة أخطاء API
 * @param error - خطأ المعالجة
 * @returns رسالة خطأ منسقة
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'حدث خطأ غير متوقع';
}

/**
 * دالة لإزالة العلامات HTML من النص
 * @param html - النص المحتوي على HTML
 * @returns النص بدون علامات HTML
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * دالة لتحويل كائن إلى مصفوفة من المعاملات لـ URL
 * @param obj - الكائن المراد تحويله
 * @returns مصفوفة من المعاملات
 */
export function objectToQueryString(obj: Record<string, string | number | boolean>): string {
  const params = new URLSearchParams();
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

/**
 * دالة لتحويل أول حرف إلى كبير
 * @param text - النص المراد تحويله
 * @returns النص مع أول حرف كبير
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * دالة لإزالة العناصر المكررة من مصفوفة
 * @param array - المصفوفة المراد إزالة المكررات منها
 * @returns مصفوفة بدون عناصر مكررة
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * دالة لترتيب مصفوفة من الكائنات حسب خاصية معينة
 * @param array - المصفوفة المراد ترتيبها
 * @param key - مفتاح الخاصية للترتيب
 * @param direction - اتجاه الترتيب (تصاعدي أو تنازلي)
 * @returns مصفوفة مرتبة
 */
export function sortByKey<T>(
  array: T[], 
  key: keyof T, 
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * نوع لتعريف الاستجابة العامة من API
 */
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * دالة لإنشاء استجابة ناجحة من API
 * @param data - البيانات المراد إرسالها
 * @param message - رسالة اختيارية
 * @returns استجابة ناجحة
 */
export function createSuccessResponse<T>(
  data: T, 
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

/**
 * دالة لإنشاء استجابة خطأ من API
 * @param error - رسالة الخطأ
 * @returns استجابة خطأ
 */
export function createErrorResponse(error: string): ApiResponse<null> {
  return {
    success: false,
    error
  };
}

/**
 * دالة للتحقق من صحة كلمة المرور
 * @param password - كلمة المرور المراد التحقق منها
 * @returns كائن يحتوي على نتيجة التحقق والأخطاء
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * دالة لتحويل النص العربي إلى نص قابل للبحث
 * @param text - النص المراد تحويله
 * @returns النص قابل للبحث
 */
export function normalizeArabicText(text: string): string {
  return text
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ئ]/g, 'ي')
    .replace(/[ؤ]/g, 'و')
    .toLowerCase()
    .trim();
} 