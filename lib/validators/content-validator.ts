/**
 * Content Validator
 * يمنع إدخال البيانات التجريبية في البيئة الإنتاجية
 */

// كلمات ممنوعة في المحتوى الإنتاجي
const FORBIDDEN_KEYWORDS = [
  'test',
  'تجربة',
  'dummy',
  'demo',
  'example',
  'اختبار',
  'lorem ipsum',
  'placeholder'
];

// كلمات ممنوعة في البريد الإلكتروني
const FORBIDDEN_EMAIL_DOMAINS = [
  '@test.',
  '@example.',
  '@dummy.',
  '@demo.',
  '@mailinator.',
  '@tempmail.'
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * التحقق من صحة عنوان المقال
 */
export function validateArticleTitle(title: string): ValidationResult {
  const errors: string[] = [];
  
  // التحقق من الطول
  if (!title || title.length < 10) {
    errors.push('العنوان قصير جداً (يجب أن يكون 10 أحرف على الأقل)');
  }
  
  if (title.length > 200) {
    errors.push('العنوان طويل جداً (الحد الأقصى 200 حرف)');
  }
  
  // التحقق من الكلمات الممنوعة
  const lowerTitle = title.toLowerCase();
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (lowerTitle.includes(keyword)) {
      errors.push(`العنوان يحتوي على كلمة ممنوعة: "${keyword}"`);
    }
  }
  
  // التحقق من العناوين المتكررة
  if (title === 'السلام عليكم ورحمة الله وبركاته' || 
      title === 'السلام عليكم' ||
      title === 'مرحبا') {
    errors.push('يرجى استخدام عنوان وصفي للمقال');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * التحقق من صحة محتوى المقال
 */
export function validateArticleContent(content: string): ValidationResult {
  const errors: string[] = [];
  
  // إزالة HTML tags للحصول على النص الخام
  const plainText = content.replace(/<[^>]*>/g, '').trim();
  
  // التحقق من الطول
  if (!plainText || plainText.length < 200) {
    errors.push('المحتوى قصير جداً (يجب أن يكون 200 حرف على الأقل)');
  }
  
  // التحقق من المحتوى المتكرر
  const words = plainText.split(/\s+/);
  if (words.length > 10) {
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    
    if (repetitionRatio < 0.3) {
      errors.push('المحتوى يحتوي على تكرار مفرط للكلمات');
    }
  }
  
  // التحقق من الكلمات الممنوعة في البيئة الإنتاجية
  if (process.env.NODE_ENV === 'production') {
    const lowerContent = plainText.toLowerCase();
    for (const keyword of FORBIDDEN_KEYWORDS) {
      // السماح ببعض الكلمات في سياق معين
      if (keyword === 'test' && lowerContent.includes('latest')) continue;
      
      if (lowerContent.includes(keyword)) {
        errors.push(`المحتوى يحتوي على كلمة ممنوعة في البيئة الإنتاجية: "${keyword}"`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * التحقق من صحة بيانات المستخدم
 */
export function validateUserData(name: string, email: string): ValidationResult {
  const errors: string[] = [];
  
  // التحقق من الاسم
  if (!name || name.length < 3) {
    errors.push('الاسم قصير جداً (يجب أن يكون 3 أحرف على الأقل)');
  }
  
  const lowerName = name.toLowerCase();
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (lowerName.includes(keyword)) {
      errors.push(`الاسم يحتوي على كلمة ممنوعة: "${keyword}"`);
    }
  }
  
  // التحقق من البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('البريد الإلكتروني غير صحيح');
  }
  
  const lowerEmail = email.toLowerCase();
  for (const domain of FORBIDDEN_EMAIL_DOMAINS) {
    if (lowerEmail.includes(domain)) {
      errors.push(`البريد الإلكتروني يستخدم نطاق ممنوع: "${domain}"`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * التحقق من صحة مقال كامل
 */
export function validateArticle(article: {
  title: string;
  content: string;
  excerpt?: string;
}): ValidationResult {
  const errors: string[] = [];
  
  // التحقق من العنوان
  const titleValidation = validateArticleTitle(article.title);
  if (!titleValidation.isValid) {
    errors.push(...titleValidation.errors);
  }
  
  // التحقق من المحتوى
  const contentValidation = validateArticleContent(article.content);
  if (!contentValidation.isValid) {
    errors.push(...contentValidation.errors);
  }
  
  // التحقق من الملخص إذا كان موجوداً
  if (article.excerpt && article.excerpt.length < 50) {
    errors.push('الملخص قصير جداً (يجب أن يكون 50 حرف على الأقل)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * رسالة خطأ موحدة للمستخدم
 */
export function getValidationErrorMessage(errors: string[]): string {
  if (errors.length === 0) return '';
  
  return `يرجى تصحيح الأخطاء التالية:\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
} 