/**
 * مكتبة الأدوات المساعدة العامة لمشروع Sabq AI CMS
 */

// Temporary simplified version without external dependencies
// TODO: Install clsx and tailwind-merge packages

/**
 * دمج classNames مع Tailwind CSS (simplified version)
 */
export function cn(...inputs: (string | undefined | boolean)[]): string {
  return inputs.filter(Boolean).join(' ')
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Riyadh'
  }
  
  return new Intl.DateTimeFormat('ar-SA', { ...defaultOptions, ...options }).format(dateObj)
}

/**
 * تنسيق الوقت النسبي (منذ 5 دقائق، منذ ساعة، إلخ)
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  
  if (years > 0) return `منذ ${years} ${years === 1 ? 'سنة' : 'سنوات'}`
  if (months > 0) return `منذ ${months} ${months === 1 ? 'شهر' : 'أشهر'}`
  if (weeks > 0) return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`
  if (days > 0) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`
  if (hours > 0) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
  if (minutes > 0) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`
  return 'الآن'
}

/**
 * حساب وقت القراءة المتوقع
 */
export function calculateReadingTime(text: string, wordsPerMinute: number = 200): number {
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * إنشاء slug من النص العربي
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace Arabic spaces and characters
    .replace(/[\u0600-\u06FF\s]+/g, '-')
    // Replace English spaces and special characters
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * تقطيع النص إلى مقاطع
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * فحص صحة البريد الإلكتروني
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * تنسيق الأرقام بالعربية
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num)
}

/**
 * تحويل الأرقام الإنجليزية للعربية
 */
export function toArabicNumerals(str: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return str.replace(/\d/g, (digit) => arabicNumerals[parseInt(digit)])
}

/**
 * تحويل الأرقام العربية للإنجليزية
 */
export function toEnglishNumerals(str: string): string {
  const englishNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  return str.replace(/[٠-٩]/g, (digit) => {
    const index = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'].indexOf(digit)
    return englishNumerals[index]
  })
}

/**
 * إنشاء معرف فريد
 */
export function generateId(prefix: string = ''): string {
  const id = Math.random().toString(36).substring(2, 15)
  return prefix ? `${prefix}-${id}` : id
}

/**
 * فحص ما إذا كان الرابط خارجي
 */
export function isExternalLink(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname !== window.location.hostname
  } catch {
    return false
  }
}

/**
 * تحديد نوع الملف من الامتداد
 */
export function getFileType(filename: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  if (!extension) return 'other'
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const videoTypes = ['mp4', 'webm', 'ogg', 'mov', 'avi']
  const audioTypes = ['mp3', 'wav', 'ogg', 'aac', 'm4a']
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf']
  
  if (imageTypes.includes(extension)) return 'image'
  if (videoTypes.includes(extension)) return 'video'
  if (audioTypes.includes(extension)) return 'audio'
  if (documentTypes.includes(extension)) return 'document'
  
  return 'other'
}

/**
 * تنسيق حجم الملف
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت'
  
  const k = 1024
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * دالة debounce لتأخير تنفيذ الدوال
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * دالة throttle لتحديد تكرار تنفيذ الدوال
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * نسخ النص للحافظة
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return true
  }
}

/**
 * فحص ما إذا كان المستخدم على جهاز محمول
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * الحصول على اللون من النص (للصور الرمزية)
 */
export function getColorFromText(text: string): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ]
  
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
} 