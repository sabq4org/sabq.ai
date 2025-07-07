import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 اختبار اتصال Cloudinary...');
    
    // اختبار الاتصال
    const result = await cloudinary.api.ping();
    
    console.log('✅ نجح الاتصال مع Cloudinary:', result);
    
    return NextResponse.json({
      success: true,
      message: 'تم الاتصال بنجاح مع Cloudinary',
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret_set: !!process.env.CLOUDINARY_API_SECRET
      },
      result
    });
  } catch (error) {
    console.error('❌ فشل الاتصال مع Cloudinary:', error);
    
    return NextResponse.json({
      success: false,
      message: 'فشل الاتصال مع Cloudinary',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret_set: !!process.env.CLOUDINARY_API_SECRET
      }
    }, { status: 500 });
  }
} 