/**
 * أدوات تنسيق التاريخ الميلادي
 */

/**
 * تنسيق التاريخ الميلادي الكامل مع الوقت
 * مثال: 20 يونيو 2025 - 02:45 ص
 */
export function formatFullDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Riyadh'
  };
  
  // استخدام التقويم الميلادي مع الأرقام العربية
  return date.toLocaleDateString('ar-SA-u-nu-latn', options);
}

/**
 * تنسيق التاريخ فقط بدون وقت
 * مثال: 20 يونيو 2025
 */
export function formatDateOnly(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Riyadh'
  };
  
  return date.toLocaleDateString('ar-SA-u-nu-latn', options);
}

/**
 * تنسيق الوقت فقط
 * مثال: 02:45 ص
 */
export function formatTimeOnly(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Riyadh'
  };
  
  return date.toLocaleTimeString('ar-SA-u-nu-latn', options);
}

/**
 * تنسيق التاريخ النسبي (منذ...)
 * مثال: منذ 5 دقائق، منذ ساعتين، أمس
 */
export function formatRelativeDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) {
    return 'الآن';
  } else if (diffMins < 60) {
    return `منذ ${diffMins} ${diffMins === 1 ? 'دقيقة' : diffMins === 2 ? 'دقيقتين' : diffMins <= 10 ? 'دقائق' : 'دقيقة'}`;
  } else if (diffHours < 24) {
    return `منذ ${diffHours} ${diffHours === 1 ? 'ساعة' : diffHours === 2 ? 'ساعتين' : diffHours <= 10 ? 'ساعات' : 'ساعة'}`;
  } else if (diffDays === 0) {
    return 'اليوم';
  } else if (diffDays === 1) {
    return 'أمس';
  } else if (diffDays === 2) {
    return 'أول أمس';
  } else if (diffDays < 7) {
    return `منذ ${diffDays} أيام`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : weeks === 2 ? 'أسبوعين' : 'أسابيع'}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `منذ ${months} ${months === 1 ? 'شهر' : months === 2 ? 'شهرين' : months <= 10 ? 'أشهر' : 'شهر'}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `منذ ${years} ${years === 1 ? 'سنة' : years === 2 ? 'سنتين' : years <= 10 ? 'سنوات' : 'سنة'}`;
  }
}

/**
 * تنسيق التاريخ للجداول (مختصر)
 * مثال: 20/06/2025 - 02:45 ص
 */
export function formatTableDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Riyadh'
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Riyadh'
  };
  
  const dateStr = date.toLocaleDateString('ar-SA-u-nu-latn', dateOptions);
  const timeStr = date.toLocaleTimeString('ar-SA-u-nu-latn', timeOptions);
  
  return `${dateStr} - ${timeStr}`;
}

/**
 * التحقق من صحة التاريخ
 */
export function isValidDate(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * الحصول على التاريخ الحالي بتوقيت السعودية
 */
export function getSaudiNow(): Date {
  const now = new Date();
  const saudiOffset = 3 * 60 * 60 * 1000; // +3 hours
  return new Date(now.getTime() + saudiOffset);
} 