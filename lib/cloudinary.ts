import { v2 as cloudinary } from 'cloudinary';

// تكوين Cloudinary من متغيرات البيئة
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dybhezmvb',
  api_key: process.env.CLOUDINARY_API_KEY || '559894124915114',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'vuiA8rLNm7d1U-UAOTED6FyC4hY',
};

// تكوين Cloudinary
cloudinary.config(cloudinaryConfig);

// التحقق من صحة الإعدادات
if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.warn('⚠️  مفاتيح Cloudinary غير مكتملة في متغيرات البيئة');
}

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

    // التحقق من وجود الصورة في Cloudinary
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

// دالة رفع الصور إلى Cloudinary
export const uploadToCloudinary = async (
  file: File | Buffer,
  options: {
    folder?: string;
    publicId?: string;
    transformation?: any[];
    resourceType?: 'image' | 'video' | 'raw';
    fileName?: string;
  } = {}
): Promise<{
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  secureUrl?: string;
}> => {
  try {
    // تحويل الملف إلى base64 إذا كان File
    let dataURI: string;
    let originalFileName = '';
    
    if (file instanceof File) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64String = buffer.toString('base64');
      dataURI = `data:${file.type};base64,${base64String}`;
      originalFileName = file.name;
    } else {
      // إذا كان Buffer
      const base64String = file.toString('base64');
      dataURI = `data:image/jpeg;base64,${base64String}`;
    }

    // تنظيف اسم الملف
    const cleanName = cleanFileName(originalFileName || options.fileName || 'image');
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    // إنشاء public_id نظيف
    const publicId = options.publicId || `${timestamp}-${cleanName}-${randomId}`;

    // إعدادات الرفع المحسنة
    const uploadOptions = {
      folder: options.folder || 'sabq-cms/featured',
      resource_type: (options.resourceType || 'auto') as 'image' | 'video' | 'raw' | 'auto',
      public_id: publicId,
      transformation: options.transformation || [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        { width: 'auto', height: 'auto', crop: 'limit' }
      ],
      overwrite: false, // منع الكتابة فوق الملفات الموجودة
      invalidate: true, // تحديث الكاش
      tags: ['sabq-cms', 'featured'] // إضافة تاجات للملف
    };

    console.log('📤 رفع الصورة إلى Cloudinary:', {
      folder: uploadOptions.folder,
      publicId: uploadOptions.public_id,
      fileName: cleanName
    });

    // رفع الملف
    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

    if (!result || !result.secure_url) {
      throw new Error('فشل في رفع الملف إلى Cloudinary');
    }

    console.log('✅ تم رفع الصورة بنجاح:', {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      secureUrl: result.secure_url
    };
  } catch (error) {
    console.error('❌ خطأ في رفع الملف إلى Cloudinary:', error);
    throw new Error(`فشل في رفع الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
  }
};

// دالة حذف الصور من Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    console.log('🗑️  حذف الصورة من Cloudinary:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    const success = result.result === 'ok';
    
    if (success) {
      console.log('✅ تم حذف الصورة بنجاح');
    } else {
      console.log('⚠️  فشل في حذف الصورة:', result.result);
    }
    
    return success;
  } catch (error) {
    console.error('❌ خطأ في حذف الملف من Cloudinary:', error);
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
  return Boolean(url && url.includes('res.cloudinary.com') && url.includes(cloudinaryConfig.cloud_name));
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

// دالة إعادة رفع الصورة
export const reuploadImage = async (
  originalUrl: string,
  newFile: File | Buffer,
  options: {
    folder?: string;
    transformation?: any[];
  } = {}
): Promise<{
  oldUrl: string;
  newUrl: string;
  publicId: string;
}> => {
  try {
    // حذف الصورة القديمة
    const publicId = extractPublicIdFromUrl(originalUrl);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }

    // رفع الصورة الجديدة
    const uploadResult = await uploadToCloudinary(newFile, options);

    return {
      oldUrl: originalUrl,
      newUrl: uploadResult.url,
      publicId: uploadResult.publicId
    };
  } catch (error) {
    console.error('خطأ في إعادة رفع الصورة:', error);
    throw error;
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
  // مجموعة من الصور الافتراضية الثابتة من Cloudinary
  const placeholderImages = {
    article: [
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/article-1.jpg',
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/article-2.jpg',
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/article-3.jpg',
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/article-4.jpg',
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/article-5.jpg'
    ],
    avatar: [
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/avatar-1.jpg',
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/avatar-2.jpg',
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/avatar-3.jpg'
    ],
    category: [
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/category-1.jpg',
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/category-2.jpg',
      'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/placeholders/category-3.jpg'
    ]
  };
  
  const images = placeholderImages[type];
  
  // إذا لم يكن هناك عنوان، استخدم الصورة الأولى
  if (!title || typeof title !== 'string') {
    return images[0];
  }
  
  // استخدام hash ثابت لنفس العنوان للحصول على نفس الصورة دائماً
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageIndex = Math.abs(hash) % images.length;
  
  return images[imageIndex];
};

// دالة محسنة للحصول على رابط صورة صالح
export const getValidImageUrl = (imageUrl?: string, fallbackTitle?: string, type: 'article' | 'avatar' | 'category' = 'article'): string => {
  // التحقق من وجود الرابط وصحته
  if (!imageUrl || imageUrl === '' || imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
    return generatePlaceholderImage(fallbackTitle || 'مقال', type);
  }
  
  // التحقق من أن الرابط صحيح
  if (!imageUrl.startsWith('http') && !imageUrl.startsWith('https')) {
    return generatePlaceholderImage(fallbackTitle || 'مقال', type);
  }
  
  // التحقق من أن الرابط من Cloudinary
  if (!isValidCloudinaryUrl(imageUrl)) {
    console.warn('رابط الصورة ليس من Cloudinary:', imageUrl);
    return generatePlaceholderImage(fallbackTitle || 'مقال', type);
  }
  
  return imageUrl;
};

export default cloudinary; 