import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * دالة مساعدة لدمج فئات CSS مع دعم Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * تنسيق التاريخ باللغة العربية
 */
export function formatDate(date: Date | string, locale: string = 'ar-SA'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(dateObj)
}

/**
 * تنسيق التاريخ باللغة العربية
 */
export function formatDateAr(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('ar-SA', options).format(date);
}

/**
 * تنسيق الوقت النسبي باللغة العربية
 */
export function formatRelativeTime(date: Date | string, locale: string = 'ar-SA'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  const units = [
    { name: 'year', seconds: 31536000 },
    { name: 'month', seconds: 2592000 },
    { name: 'week', seconds: 604800 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 },
    { name: 'second', seconds: 1 }
  ]
  
  for (const unit of units) {
    const interval = Math.floor(diffInSeconds / unit.seconds)
    if (interval >= 1) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
      return rtf.format(-interval, unit.name as any)
    }
  }
  
  return 'الآن'
}

/**
 * تنسيق الوقت النسبي باللغة العربية
 */
export function getRelativeTimeAr(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'قبل لحظات';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `قبل ${minutes} ${minutes === 1 ? 'دقيقة' : minutes === 2 ? 'دقيقتين' : minutes <= 10 ? 'دقائق' : 'دقيقة'}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `قبل ${hours} ${hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : hours <= 10 ? 'ساعات' : 'ساعة'}`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `قبل ${days} ${days === 1 ? 'يوم' : days === 2 ? 'يومين' : days <= 10 ? 'أيام' : 'يوم'}`;
  } else {
    return formatDateAr(date);
  }
}

/**
 * اختصار النص مع إضافة ...
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * تنسيق الأرقام بالعربية
 */
export function formatNumberAr(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num);
}

/**
 * تحويل الأرقام الكبيرة إلى صيغة مختصرة
 */
export function formatCompactNumberAr(num: number): string {
  if (num < 1000) return formatNumberAr(num);
  if (num < 1000000) return `${formatNumberAr(Math.floor(num / 1000))} ألف`;
  if (num < 1000000000) return `${formatNumberAr(Math.floor(num / 1000000))} مليون`;
  return `${formatNumberAr(Math.floor(num / 1000000000))} مليار`;
}

export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) return '';
  
  // إذا كان المسار URL كامل، أرجعه كما هو
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // إذا كان المسار يبدأ بـ /uploads، تحقق من البيئة
  if (imagePath.startsWith('/uploads/')) {
    // في بيئة الإنتاج، استخدم API route للصور
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // استخدم API route الذي يتعامل مع الصور غير الموجودة
      const cleanPath = imagePath.replace('/uploads/', '');
      return `/api/images/${cleanPath}`;
    }
    // في بيئة التطوير، أرجع المسار كما هو
    return imagePath;
  }
  
  // إذا كان المسار نسبي، أضف / في البداية
  if (!imagePath.startsWith('/')) {
    return `/${imagePath}`;
  }
  
  return imagePath;
} 