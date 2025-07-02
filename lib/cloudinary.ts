// ملف Cloudinary للعميل - بدون استيراد المكتبة التي تحتاج fs
// يستخدم فقط في المتصفح لتوليد روابط الصور

// تكوين Cloudinary من متغيرات البيئة
const cloudinaryConfig = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dybhezmvb',
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '559894124915114',
};

// دالة تنظيف أسماء الملفات
export const cleanFileName = (fileName: string): string => {
  return fileName
    .replace(/[^\w\s.-]/g, '') // إزالة الرموز الخاصة
    .replace(/\s+/g, '-') // استبدال المسافات بـ -
    .replace(/[^\x00-\x7F]/g, '') // إزالة الأحرف غير اللاتينية
    .toLowerCase()
    .substring(0, 100); // تحديد الطول الأقصى
};

// دالة التحقق من وجود الصورة
export const checkImageExists = async (url: string): Promise<boolean> => {
  try {
    // التحقق من أن URL صحيح
    if (!url || !url.startsWith('http')) {
      return false;
    }

    // التحقق من وجود الصورة
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SabqAI-CMS/1.0)'
      },
      // إضافة timeout
      signal: AbortSignal.timeout(5000)
    });
    
    // التحقق من أن الاستجابة ناجحة وليست 404
    if (!response.ok) {
      console.log(`❌ الصورة غير موجودة: ${url} - Status: ${response.status}`);
      return false;
    }
    
    // التحقق من نوع المحتوى
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`❌ الملف ليس صورة: ${url} - Content-Type: ${contentType}`);
      return false;
    }
    
    console.log(`✅ الصورة موجودة: ${url}`);
    return true;
  } catch (error) {
    console.error(`❌ خطأ في التحقق من وجود الصورة: ${url}`, error);
    return false;
  }
};

// دالة إنشاء URL محسن للصور
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    crop?: string;
  } = {}
): string => {
  const transformations = [];
  
  if (options.width || options.height) {
    transformations.push(`w_${options.width || 'auto'},h_${options.height || 'auto'}`);
  }
  
  if (options.crop) {
    transformations.push(`c_${options.crop}`);
  }
  
  if (options.quality) {
    transformations.push(`q_${options.quality}`);
  }
  
  if (options.format) {
    transformations.push(`f_${options.format}`);
  }

  const transformationString = transformations.length > 0 ? transformations.join('/') + '/' : '';
  
  return `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/image/upload/${transformationString}${publicId}`;
};

// دالة التحقق من صحة URL Cloudinary
export const isValidCloudinaryUrl = (url: string): boolean => {
  // التحقق البسيط من أن الرابط من Cloudinary
  return Boolean(url && url.includes('res.cloudinary.com'));
};

// دالة استخراج public_id من URL Cloudinary
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    // استخراج public_id من URL
    const publicIdParts = urlParts.slice(uploadIndex + 2); // تخطي 'upload' و version
    return publicIdParts.join('/').split('.')[0]; // إزالة الامتداد
  } catch (error) {
    console.error('خطأ في استخراج public_id:', error);
    return null;
  }
};

// دالة محسنة للحصول على صورة افتراضية ثابتة
export const getDefaultImageUrl = (type: 'article' | 'avatar' | 'category' = 'article'): string => {
  const defaultImages = {
    article: 'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/defaults/default-article.jpg',
    avatar: 'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/defaults/default-avatar.jpg',
    category: 'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/defaults/default-category.jpg'
  };
  
  return defaultImages[type];
};

// دالة محسنة لتوليد صور افتراضية ثابتة بناءً على العنوان
export const generatePlaceholderImage = (title: string, type: 'article' | 'avatar' | 'category' = 'article'): string => {
  // استخدام صور Cloudinary الافتراضية
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E2'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // إنشاء نص مختصر من العنوان
  const text = encodeURIComponent(title.substring(0, 2).toUpperCase());
  
  // إنشاء رابط صورة ديناميكية من Cloudinary
  return `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/image/upload/w_400,h_300,c_fill,q_auto,f_auto/l_text:Arial_60_bold:${text},co_rgb:FFFFFF,g_center/v1/sabq-cms/defaults/placeholder_${color}.jpg`;
};

// دالة محسنة للحصول على رابط صورة صالح
export const getValidImageUrl = (imageUrl?: string, fallbackTitle?: string, type: 'article' | 'avatar' | 'category' = 'article'): string => {
  // التحقق من وجود الرابط وصحته
  if (!imageUrl || imageUrl === '' || imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
    return generatePlaceholderImage(fallbackTitle || 'مقال', type);
  }
  
  // إذا كان الرابط هو publicId بدون بروتوكول (مثلاً sabq-cms/featured/xyz)
  if (!imageUrl.startsWith('http') && !imageUrl.startsWith('https')) {
    // إنشاء رابط كامل إلى Cloudinary
    return `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/image/upload/${imageUrl}`;
  }
  
  // التحقق من أن الرابط من Cloudinary
  if (!isValidCloudinaryUrl(imageUrl)) {
    // في بيئة التطوير فقط، نعرض تحذير
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.warn('رابط الصورة ليس من Cloudinary:', imageUrl);
    }
    return imageUrl;
  }
  
  return imageUrl;
}; 