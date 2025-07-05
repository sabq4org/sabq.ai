import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DatabaseProtection } from './lib/database-protection';

// قائمة المسارات المحمية
const protectedPaths = [
  '/dashboard',
  '/admin',
  '/api/dashboard',
  '/api/admin',
  '/api/users',
  '/api/roles',
  '/api/team-members',
  '/api/permissions',
  '/api/templates/create',
  '/api/templates/update',
  '/api/templates/delete',
  '/api/smart-blocks/create',
  '/api/smart-blocks/update',
  '/api/smart-blocks/delete',
  '/api/deep-analyses',
  '/api/analytics',
  '/api/ai/settings',
  '/api/messages'
];

// قائمة المسارات المحمية للمدراء فقط
const adminOnlyPaths = [
  '/dashboard/users',
  '/dashboard/roles',
  '/dashboard/team',
  '/dashboard/console',
  '/dashboard/system',
  '/dashboard/analytics',
  '/api/users',
  '/api/roles',
  '/api/team-members',
  '/api/permissions',
  '/api/analytics/activity-logs'
];

// قائمة المسارات العامة (لا تحتاج تسجيل دخول)
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify',
  '/contact',
  '/news',
  '/categories',
  '/article',
  '/author',
  '/search',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/articles',
  '/api/categories',
  '/api/templates/active',
  '/api/templates/active-header',
  '/api/smart-blocks',
  '/api/deep-insights',
  '/api/content/personalized',
  '/api/interactions/track',
  '/api/interactions/track-activity',
  '/test',
  '/for-you',
  '/home'
];

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  
  // حماية إضافية لـ API حذف المقالات
  if (pathname === '/api/articles' && request.method === 'DELETE') {
    const authToken = request.cookies.get('auth-token')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      console.log('🚫 محاولة حذف مقالات بدون مصادقة - تم الرفض');
      return NextResponse.json(
        { success: false, error: 'مصادقة مطلوبة لحذف المقالات' },
        { status: 401 }
      );
    }
  }

  // حماية صفحات لوحة التحكم
  if (pathname.startsWith('/dashboard')) {
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // تسجيل المسار للتشخيص
  console.log('Middleware processing:', pathname);
  
  // معالجة خاصة لملفات JavaScript و CSS في الإنتاج لحل مشكلة MIME types
  if (pathname.startsWith('/_next/static/')) {
    const response = NextResponse.next();
    
    // تحديد Content-Type الصحيح بناءً على نوع الملف
    if (pathname.endsWith('.js') || pathname.includes('/chunks/') || pathname.includes('vendor-chunks')) {
      response.headers.set('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (pathname.endsWith('.css')) {
      response.headers.set('Content-Type', 'text/css; charset=UTF-8');
    }
    
    // إضافة Cache headers للملفات الثابتة
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    // حل مشاكل vendor chunks
    if (pathname.includes('vendor-chunks')) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    return response;
  }
  
  // معالجة طلبات الصور من /uploads
  if (pathname.startsWith('/uploads/')) {
    // في بيئة الإنتاج، تحقق من وجود الملف محلياً أولاً
    // إذا لم يكن موجوداً، أعد توجيه إلى صورة افتراضية
    const url = request.nextUrl.clone();
    
    // يمكن إضافة منطق للتحقق من وجود الملف هنا
    // لكن حالياً سنترك Next.js يتعامل مع الملفات الثابتة
    
    return NextResponse.next();
  }
  
  // معالجة CORS لمسارات API
  if (pathname.startsWith('/api/')) {
    console.log('Processing API route:', pathname);
    
    // معالجة طلبات OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization, Accept',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // إضافة CORS headers لجميع طلبات API
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }
  
  // التحقق من ملفات الأصول الثابتة
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/_next')
  ) {
    return NextResponse.next();
  }

  // التحقق من المسارات العامة
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  // التحقق من المسارات المحمية
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );

  // التحقق من المسارات الخاصة بالمدراء
  const isAdminOnlyPath = adminOnlyPaths.some(path => 
    pathname.startsWith(path)
  );

  // إذا كان المسار عام، السماح بالوصول
  if (isPublicPath && !isProtectedPath) {
    return NextResponse.next();
  }

  // الحصول على معلومات المستخدم من الكوكيز
  const userCookie = request.cookies.get('user');
  const tokenCookie = request.cookies.get('auth-token');
  
  let user = null;
  if (userCookie) {
    const raw = userCookie.value;
    const attempts = [raw];
    try {
      attempts.push(decodeURIComponent(raw));
    } catch (_) {}
    for (const val of attempts) {
      try {
        user = JSON.parse(val);
        break;
      } catch (_) {
        /* ignore */
      }
    }
    if (!user) {
      console.error('Failed to parse user cookie');
    }
  }

  // التحقق من تسجيل الدخول للمسارات المحمية
  if (isProtectedPath) {
    // إذا لم يكن المستخدم مسجل دخول
    if (!user && !tokenCookie) {
      console.log('Redirecting to login, no auth found for:', pathname);
      // حفظ الصفحة المطلوبة للعودة إليها بعد تسجيل الدخول
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // التحقق من صلاحيات المدير للمسارات الخاصة
    if (isAdminOnlyPath && user) {
      const isAdmin = user.is_admin === true || 
                     user.role === 'admin' || 
                     user.role === 'super_admin';
      
      if (!isAdmin) {
        console.log('Access denied for non-admin user:', pathname);
        // توجيه إلى صفحة عدم الصلاحية
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  // إضافة headers للأمان
  const response = NextResponse.next();
  
  // حماية ضد Clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // حماية ضد XSS
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // إضافة CSP للحماية مع السماح بمصادر Next.js وGoogle Fonts
  if (process.env.NODE_ENV !== 'production' || !pathname.startsWith('/api/')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://platform.twitter.com https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https: blob: http://localhost:*; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "connect-src 'self' http://localhost:* ws://localhost:* https://api.openai.com https://images.unsplash.com; " +
      "frame-src https://platform.twitter.com; " +
      "media-src 'self' blob: data:;"
    );
  }

  // حماية قاعدة البيانات من عمليات الحذف
  if (request.method === 'DELETE' && request.nextUrl.pathname.startsWith('/api/')) {
    // استخراج اسم الجدول من المسار
    const pathParts = request.nextUrl.pathname.split('/');
    const tableName = pathParts[2]; // /api/[tableName]/...
    
    // التحقق من الجداول المحمية
    if (DatabaseProtection.isProtectedTable(tableName)) {
      console.error(`⚠️ محاولة حذف محظورة على ${tableName}`);
      
      return NextResponse.json(
        { 
          error: `عمليات الحذف محظورة على جدول ${tableName}`,
          code: 'DELETE_NOT_ALLOWED',
          message: 'هذا الجدول محمي من الحذف لأسباب أمنية'
        },
        { status: 403 }
      );
    }
  }
  
  // في بيئة الإنتاج فقط
  if (process.env.NODE_ENV === 'production') {
    
    // 1. منع الوصول لملفات البيانات التجريبية
    const blockedPaths = [
      '/data/mock/',
      '/data/seed/',
      '/data/test/',
      '/api/seed',
      '/api/reset',
      '/api/mock'
    ];
    
    for (const blocked of blockedPaths) {
      if (pathname.startsWith(blocked)) {
        console.error(`🚫 محاولة وصول محظورة: ${pathname}`);
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden in production' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // 2. حماية APIs الحساسة
    if (pathname.startsWith('/api/')) {
      // التحقق من API Secret للعمليات الحساسة
      const protectedEndpoints = [
        '/api/backup',
        '/api/restore',
        '/api/admin/reset',
        '/api/admin/seed'
      ];
      
      for (const endpoint of protectedEndpoints) {
        if (pathname.startsWith(endpoint)) {
          const apiSecret = request.headers.get('x-api-secret');
          if (apiSecret !== process.env.API_SECRET_KEY) {
            return new NextResponse(
              JSON.stringify({ error: 'Unauthorized' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }
    
    // 3. إضافة رؤوس أمان
    const response = NextResponse.next();
    
    // رؤوس الأمان
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    if (!pathname.startsWith('/api/')) {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data: https://fonts.gstatic.com; " +
        "connect-src 'self' https://api.jur3a.ai;"
      );
    }
    
    return response;
  }
  
  // في بيئة التطوير - السماح بكل شيء
  return NextResponse.next();
}

// تحديد المسارات التي يعمل عليها middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 