import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { filterTestContent, rejectTestContent } from '@/lib/data-protection'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// دالة مساعدة لإضافة CORS headers
function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// دالة لإنشاء response مع CORS headers
function corsResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  return addCorsHeaders(response);
}

// دالة لمعالجة طلبات OPTIONS
function handleOptions(): NextResponse {
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

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return handleOptions();
}

export const runtime = 'nodejs'

// جلب المقالات
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 بدء معالجة طلب المقالات...')
    const { searchParams } = new URL(request.url)
    
    // بناء شروط البحث
    const where: any = {}
    
    // فلترة حسب الحالة
    const status = searchParams.get('status')
    if (status) {
      where.status = status
    } else {
      // استبعاد المقالات المحذوفة بشكل افتراضي
      where.status = { not: 'deleted' }
    }

    // فلترة حسب التصنيف
    const categoryId = searchParams.get('category_id')
    if (categoryId) {
      where.category_id = categoryId
    }

    // فلترة حسب المؤلف
    const authorId = searchParams.get('author_id')
    if (authorId) {
      where.author_id = authorId
    }

    // البحث في العنوان والمحتوى
    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { excerpt: { contains: search } }
      ]
    }

    // فلترة المقالات المميزة
    const featured = searchParams.get('featured')
    if (featured === 'true') {
      where.featured = true
    }

    // فلترة الأخبار العاجلة
    const breaking = searchParams.get('breaking')
    if (breaking === 'true') {
      where.breaking = true
    }

    // الترتيب
    const sort = searchParams.get('sort') || 'oldest'
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'
    
    let orderBy: any = {}
    if (sort === 'oldest') {
      orderBy.created_at = 'asc'
    } else if (sort === 'popular') {
      orderBy.views = 'desc'
    } else {
      orderBy.created_at = 'desc'
    }

    // التقسيم (Pagination)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '6')
    const skip = (page - 1) * limit

    // جلب المقالات من قاعدة البيانات البعيدة
    console.time('🔍 جلب المقالات من قاعدة البيانات')
    let articles = []
    try {
      articles = await prisma.articles.findMany({
        where,
        orderBy,
        skip,
        take: limit
      })
    } catch (dbError) {
      console.error('خطأ في قاعدة البيانات:', dbError)
      throw dbError
    }
    console.timeEnd('🔍 جلب المقالات من قاعدة البيانات')

    // جلب العدد الإجمالي
    console.time('📊 جلب العدد الإجمالي للمقالات')
    const total = await prisma.articles.count({ where })
    console.timeEnd('📊 جلب العدد الإجمالي للمقالات')

    // جلب التصنيفات إذا كانت هناك مقالات
    let categoriesMap: any = {}
    if (articles.length > 0) {
      const categoryIds = [...new Set(articles.map((a: any) => a.category_id).filter(Boolean))]
      if (categoryIds.length > 0) {
        const categories = await prisma.categories.findMany({
          where: { id: { in: categoryIds } }
        })
        categoriesMap = categories.reduce((acc: any, cat: any) => {
          acc[cat.id] = cat
          return acc
        }, {})
      }
    }

    // تحويل البيانات للتوافق مع الواجهة
    console.time('🔄 تحويل وتنسيق البيانات')
    const formattedArticles = articles.map((article: any) => ({
      ...article,
      author: { id: article.author_id, name: 'كاتب مجهول' },
      category: categoriesMap[article.category_id] || { 
        id: article.category_id, 
        name: 'غير مصنف',
        slug: 'uncategorized'
      },
      featuredImage: article.featured_image,
      readingTime: article.reading_time,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      publishedAt: article.published_at
    }))
    console.timeEnd('🔄 تحويل وتنسيق البيانات')

    // تصفية المحتوى التجريبي إذا كان مطلوباً
    // const filteredArticles = filterTestContent(formattedArticles);
    const filteredArticles = formattedArticles; // تعطيل التصفية مؤقتاً
    
    // إحصائيات التقسيم
    const stats = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1
    }

    console.log(`✅ تم جلب ${filteredArticles.length} مقال من أصل ${total}`)

    return corsResponse({
      success: true,
      articles: filteredArticles,
      data: filteredArticles,
      pagination: stats,
      filters: {
        status: searchParams.get('status'),
        category_id: searchParams.get('category_id'),
        search: searchParams.get('search'),
        featured: searchParams.get('featured'),
        breaking: searchParams.get('breaking')
      }
    })
  } catch (error) {
    console.error('خطأ في جلب المقالات:', error)
    return corsResponse({
      success: false,
      error: 'فشل في استرجاع المقالات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, 500)
  }
}

// إنشاء مقال جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      content,
      excerpt,
      category_id,
      author_id,
      author_name,
      status = 'draft',
      featured_image,
      metadata = {}
    } = body

    // التحقق من البيانات المطلوبة
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'العنوان والمحتوى مطلوبان' },
        { status: 400 }
      )
    }

    // إنشاء المقال في قاعدة البيانات البعيدة
    const article = await prisma.articles.create({
      data: {
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category_id: category_id || null,
        status,
        featured_image: featured_image,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          isSmartDraft: metadata.isSmartDraft || false,
          aiEditor: metadata.aiEditor || false,
          author_name: author_name || undefined // حفظ اسم المؤلف في metadata
        },
        author_id: author_id || 'default-author-id', // استخدام author_id المرسل أو القيمة الافتراضية
        slug: generateSlug(title),
        views: 0,
        reading_time: Math.ceil(content.split(' ').length / 200) // تقدير وقت القراءة
      }
    })

    console.log('✅ تم إنشاء المقال:', {
      id: article.id,
      title: article.title,
      status: article.status,
      isSmartDraft: metadata.isSmartDraft
    })

    return NextResponse.json({
      success: true,
      article,
      message: 'تم حفظ المقال بنجاح'
    })
  } catch (error) {
    console.error('❌ خطأ في إنشاء المقال:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطأ في حفظ المقال',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}

// دوال مساعدة
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\w\s-]/g, '') // إزالة الأحرف غير المسموحة
    .replace(/\s+/g, '-') // استبدال المسافات بشرطة
    .replace(/-+/g, '-') // إزالة الشرطات المتكررة
    .trim()
    .substring(0, 100) // تحديد الطول
}

function calculateReadingTime(content: string): number {
  const wordsCount = content.split(/\s+/).length
  return Math.ceil(wordsCount / 200)
}

// دالة للتحقق من صلاحيات المستخدم
async function checkUserPermissions(request: NextRequest): Promise<{ valid: boolean, user?: any, error?: string }> {
  try {
    // محاولة الحصول على التوكن من الكوكيز أو من Authorization header
    let token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return { valid: false, error: 'لم يتم العثور على معلومات المصادقة' };
    }

    // التحقق من صحة التوكن
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return { valid: false, error: 'جلسة غير صالحة' };
    }

    // البحث عن المستخدم في قاعدة البيانات
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_admin: true,
        is_verified: true
      }
    });

    if (!user) {
      return { valid: false, error: 'المستخدم غير موجود' };
    }

    // التحقق من أن المستخدم مفعل
    if (!user.is_verified) {
      return { valid: false, error: 'المستخدم غير مفعل' };
    }

    // التحقق من صلاحيات الحذف
    const canDelete = user.is_admin || 
                     user.role === 'admin' || 
                     user.role === 'editor' || 
                     user.role === 'super_admin';

    if (!canDelete) {
      return { valid: false, error: 'ليس لديك صلاحية حذف المقالات' };
    }

    return { valid: true, user };
  } catch (error) {
    return { valid: false, error: 'خطأ في التحقق من الصلاحيات' };
  }
}

// DELETE: حذف مقالات (حذف ناعم) - محمي بالمصادقة
export async function DELETE(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const authCheck = await checkUserPermissions(request);
    if (!authCheck.valid) {
      return NextResponse.json({
        success: false,
        error: authCheck.error || 'غير مصرح بالوصول'
      }, { status: 401 });
    }

    const body = await request.json()
    const ids = body.ids || []

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'معرفات المقالات مطلوبة'
      }, { status: 400 })
    }

    // تسجيل عملية الحذف للمراجعة
    console.log(`🗑️ محاولة حذف ${ids.length} مقال من قبل المستخدم:`, {
      userId: authCheck.user?.id,
      userEmail: authCheck.user?.email,
      userRole: authCheck.user?.role,
      articleIds: ids,
      timestamp: new Date().toISOString()
    });

    // تحديث حالة المقالات إلى "محذوف" في قاعدة البيانات البعيدة
    const result = await prisma.articles.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status: 'deleted',
        updated_at: new Date()
      }
    })

    // تسجيل النشاط في سجل الأنشطة
    await prisma.activity_logs.create({
      data: {
        user_id: authCheck.user.id,
        action: 'articles_deleted',
        entity_type: 'article',
        entity_id: ids.join(','),
        old_value: { status: 'published' },
        new_value: { status: 'deleted', count: result.count }
      }
    });

    console.log(`✅ تم حذف ${result.count} مقال بنجاح من قبل:`, authCheck.user?.email);

    return NextResponse.json({
      success: true,
      affected: result.count,
      message: `تم حذف ${result.count} مقال(ات) بنجاح`,
      deletedBy: {
        userId: authCheck.user.id,
        userEmail: authCheck.user.email,
        userRole: authCheck.user.role
      }
    })
  } catch (error) {
    console.error('خطأ في حذف المقالات:', error)
    return NextResponse.json({
      success: false,
      error: 'فشل في حذف المقالات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 })
  }
} 