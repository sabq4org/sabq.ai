/**
 * نظام حماية البيانات من المحتوى التجريبي
 * يمنع إضافة أو عرض أي بيانات وهمية في البيئة الحية
 */

// قائمة الأسماء المحظورة
export const BANNED_AUTHORS = [
  'أحمد الرياضي',
  'محمد الخبير',
  'سارة التحليلية',
  'محرر سبق',
  'سعود الإعلامي',
  'فاطمة المحللة',
  'عبدالله التقني',
  'test',
  'demo',
  'example'
];

// قائمة الكلمات المحظورة في العناوين
export const BANNED_TITLE_WORDS = [
  'test',
  'demo',
  'example',
  'lorem ipsum',
  'تجريبي',
  'اختبار'
];

/**
 * فحص ما إذا كان المحتوى تجريبي
 */
export function isTestContent(content: any): boolean {
  if (!content) return false;
  
  // فحص الأسماء
  if (content.author || content.author_name) {
    // التعامل مع author ككائن أو نص
    let authorName = '';
    if (typeof content.author === 'object' && content.author?.name) {
      authorName = content.author.name.toLowerCase();
    } else if (typeof content.author === 'string') {
      authorName = content.author.toLowerCase();
    } else if (content.author_name) {
      authorName = content.author_name.toLowerCase();
    }
    
    if (authorName && BANNED_AUTHORS.some(banned => authorName.includes(banned.toLowerCase()))) {
      return true;
    }
  }
  
  // فحص العناوين
  if (content.title) {
    const title = content.title.toLowerCase();
    if (BANNED_TITLE_WORDS.some(banned => title.includes(banned))) {
      return true;
    }
  }
  
  // فحص المعرفات
  if (content.id) {
    const id = content.id.toLowerCase();
    if (id.includes('test') || id.includes('demo') || id.includes('example')) {
      return true;
    }
  }
  
  // فحص البريد الإلكتروني
  if (content.email) {
    const email = content.email.toLowerCase();
    if (email.includes('test') || email.includes('demo') || email.includes('example')) {
      return true;
    }
  }
  
  return false;
}

/**
 * تصفية المحتوى التجريبي من مصفوفة
 */
export function filterTestContent<T>(items: T[]): T[] {
  if (process.env.NODE_ENV === 'production' || process.env.FILTER_TEST_CONTENT === 'true') {
    return items.filter(item => !isTestContent(item));
  }
  return items;
}

/**
 * رفض المحتوى التجريبي عند الإضافة
 */
export function rejectTestContent(content: any): { valid: boolean; error?: string } {
  if (process.env.NODE_ENV === 'production' || process.env.REJECT_TEST_CONTENT === 'true') {
    if (isTestContent(content)) {
      return {
        valid: false,
        error: 'المحتوى التجريبي غير مسموح به في البيئة الحية'
      };
    }
  }
  
  return { valid: true };
}

/**
 * Middleware لحماية APIs من البيانات التجريبية
 */
export function protectFromTestData(req: any, res: any, next: any) {
  if (process.env.NODE_ENV === 'production') {
    // فحص البيانات المرسلة
    const validation = rejectTestContent(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error,
        message: 'البيانات التجريبية محظورة في الإنتاج'
      });
    }
  }
  next();
} 