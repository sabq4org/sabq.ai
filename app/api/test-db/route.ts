import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('[test-db] Starting database test...');
  console.log('[test-db] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 30) + '...'
  });

  try {
    // اختبار الاتصال الأساسي
    console.log('[test-db] Testing basic connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[test-db] Basic connection successful:', result);
    
    // اختبار جدول المستخدمين
    console.log('[test-db] Testing users table...');
    const userCount = await prisma.user.count();
    console.log('[test-db] User count:', userCount);
    
    // اختبار جدول الفئات
    console.log('[test-db] Testing categories table...');
    const categoryCount = await prisma.category.count();
    console.log('[test-db] Category count:', categoryCount);
    
    // اختبار جدول المقالات
    console.log('[test-db] Testing articles table...');
    const articleCount = await prisma.article.count();
    console.log('[test-db] Article count:', articleCount);
    
    return NextResponse.json({
      success: true,
      message: 'اتصال قاعدة البيانات يعمل بشكل صحيح',
      environment: {
        node_env: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
        vercel_env: process.env.VERCEL_ENV,
        has_database_url: !!process.env.DATABASE_URL,
        database_url_preview: process.env.DATABASE_URL?.substring(0, 30) + '...'
      },
      data: {
        users: userCount,
        categories: categoryCount,
        articles: articleCount
      }
    });
    
  } catch (error: any) {
    console.error('[test-db] Database test failed:', error);
    
    // تحليل نوع الخطأ
    let errorType = 'unknown';
    let errorDetails = error.message;
    
    if (error.code === 'P1001') {
      errorType = 'connection_failed';
      errorDetails = 'لا يمكن الوصول إلى خادم قاعدة البيانات';
    } else if (error.code === 'P1002') {
      errorType = 'timeout';
      errorDetails = 'انتهت مهلة الاتصال بقاعدة البيانات';
    } else if (error.code === 'P1003') {
      errorType = 'database_not_found';
      errorDetails = 'قاعدة البيانات غير موجودة';
    } else if (error.code === 'P6001') {
      errorType = 'data_proxy_error';
      errorDetails = 'خطأ في إعداد Prisma Data Proxy';
    } else if (error.message?.includes('Unknown arg')) {
      errorType = 'prisma_schema_mismatch';
      errorDetails = 'عدم تطابق بين Prisma Schema وقاعدة البيانات';
    }
    
    return NextResponse.json({
      success: false,
      error: 'فشل اختبار قاعدة البيانات',
      error_type: errorType,
      error_code: error.code,
      error_details: errorDetails,
      environment: {
        node_env: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
        vercel_env: process.env.VERCEL_ENV,
        has_database_url: !!process.env.DATABASE_URL,
        database_url_preview: process.env.DATABASE_URL?.substring(0, 30) + '...' || 'غير موجود'
      },
      suggestions: [
        'تأكد من إعداد DATABASE_URL في متغيرات البيئة',
        'تأكد من أن رابط قاعدة البيانات يبدأ بـ mysql:// وليس prisma://',
        'تأكد من تشغيل prisma generate بعد أي تغيير في Schema',
        'تحقق من أن قاعدة البيانات متاحة وتعمل'
      ]
    }, { status: 500 });
  }
} 