import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { filterTestContent, rejectTestContent } from '@/lib/data-protection'
import { handleOptions, corsResponse } from '@/lib/cors'

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
      where.categoryId = categoryId
    }

    // فلترة حسب المؤلف
    const authorId = searchParams.get('author_id')
    if (authorId) {
      where.authorId = authorId
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
    const sortField = searchParams.get('sort') || 'created_at'
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'
    
    let orderBy: any = {}
    switch (sortField) {
      case 'title':
        orderBy = { title: order }
        break
      case 'views':
        orderBy = { views: order }
        break
      case 'published_at':
        orderBy = { publishedAt: order }
        break
      default:
        orderBy = { createdAt: order }
    }

    // التقسيم (Pagination)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '6')
    const skip = (page - 1) * limit

    // جلب المقالات مع بيانات التصنيف والمؤلف في استعلام واحد
    console.time('🔍 جلب المقالات من قاعدة البيانات')
    const articles = await prisma.article.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        authorId: true,
        categoryId: true,
        status: true,
        featuredImage: true,
        breaking: true,
        featured: true,
        views: true,
        readingTime: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        metadata: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })
    console.timeEnd('🔍 جلب المقالات من قاعدة البيانات')

    // جلب العدد الإجمالي
    console.time('📊 جلب العدد الإجمالي للمقالات')
    const total = await prisma.article.count({ where })
    console.timeEnd('📊 جلب العدد الإجمالي للمقالات')

    // تحويل البيانات للتوافق مع الواجهة
    console.time('🔄 تحويل وتنسيق البيانات')
    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.excerpt,
      author_id: article.authorId,
      author: article.author,
      category_id: article.categoryId,
      category_name: article.category?.name || 'غير مصنف',
      status: article.status,
      featured_image: article.featuredImage,
      is_breaking: article.breaking,
      is_featured: article.featured,
      views_count: article.views,
      reading_time: article.readingTime || calculateReadingTime(article.content),
      created_at: article.createdAt.toISOString(),
      updated_at: article.updatedAt.toISOString(),
      published_at: article.publishedAt?.toISOString(),
      tags: article.metadata && typeof article.metadata === 'object' && 'tags' in article.metadata ? (article.metadata as any).tags : [],
      interactions_count: 0,
      comments_count: 0
    }))
    console.timeEnd('🔄 تحويل وتنسيق البيانات')

    // تصفية المحتوى التجريبي في الإنتاج
    console.time('🚫 تصفية المحتوى التجريبي')
    const filteredArticles = filterTestContent(formattedArticles)
    console.timeEnd('🚫 تصفية المحتوى التجريبي')

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
    
    // سجل تصحيح مفصل
    console.log('البيانات المستلمة:', {
      title: body.title,
      category_id: body.category_id,
      author_id: body.author_id,
      content_length: body.content?.length || 0,
      content_blocks_count: body.content_blocks?.length || 0,
      status: body.status
    })
    
    // التحقق من البيانات المطلوبة
    if (!body.title) {
      return NextResponse.json({
        success: false,
        error: 'العنوان مطلوب'
      }, { status: 400 })
    }
    
    // التحقق من وجود محتوى (إما content أو content_blocks)
    if (!body.content && (!body.content_blocks || body.content_blocks.length === 0)) {
      return NextResponse.json({
        success: false,
        error: 'المحتوى مطلوب'
      }, { status: 400 })
    }
    
    // التحقق من المحتوى التجريبي
    const validation = rejectTestContent(body)
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 })
    }

    // التحقق من مسارات الصور
    if (body.featured_image) {
      const imageUrl = body.featured_image;
      // منع المسارات المحلية - يجب أن تكون الصور من Cloudinary أو خدمة سحابية
      if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/public/') || 
          (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
        return NextResponse.json({ 
          success: false, 
          error: 'مسار الصورة غير صحيح',
          message: 'يجب رفع الصور إلى Cloudinary. المسارات المحلية غير مسموحة.' 
        }, { status: 400 });
      }
    }

    // إعداد البيانات للحفظ
    const articleData: any = {
      title: body.title.trim(),
      slug: generateSlug(body.title),
      content: body.content || 'محتوى المقال',
      excerpt: body.summary?.trim() || body.excerpt?.trim() || body.description?.trim() || '',
      status: body.status || 'draft',
      featured: body.is_featured || false,
      breaking: body.is_breaking || false,
      views: 0,
      featuredImage: body.featured_image,
      allowComments: body.allow_comments !== false,
      readingTime: body.reading_time || calculateReadingTime(body.content || ''),
      metadata: {
        seo_title: body.seo_title || body.title,
        seo_description: body.seo_description || body.description || body.summary,
        seo_keywords: body.seo_keywords || (body.keywords || []).join(', '),
        tags: body.tags || body.keywords || [],
        content_blocks: body.content_blocks || [],
        scope: body.scope || 'local',
        subtitle: body.subtitle || null,
        featured_image_alt: body.featured_image_alt || null
      }
    }

    // ربط المؤلف (أو تعيين مؤلف افتراضي)
    let finalAuthorId: string | null = null;

    if (body.author_id) {
      const authorExists = await prisma.user.findUnique({ where: { id: String(body.author_id) } });
      if (authorExists) {
        finalAuthorId = authorExists.id;
      } else {
        // إضافة لوج واضح في السيرفر
        console.error('❌ محاولة نشر بمراسل غير موجود:', body.author_id);
        return NextResponse.json({
          success: false,
          error: 'المراسل المحدد غير موجود في قاعدة البيانات. يرجى اختيار مراسل صحيح.'
        }, { status: 400 });
      }
    } else {
      // إذا لم يتم إرسال معرف مراسل
      return NextResponse.json({
        success: false,
        error: 'يجب اختيار مراسل/كاتب للمقال.'
      }, { status: 400 });
    }

    articleData.authorId = finalAuthorId;

    // ربط التصنيف
    if (body.category_id && body.category_id !== '' && body.category_id !== '0') {
      // التحقق من وجود التصنيف
      const categoryExists = await prisma.category.findUnique({
        where: { id: String(body.category_id) }
      })
      
      if (!categoryExists) {
        console.error('التصنيف غير موجود:', body.category_id)
        return NextResponse.json({
          success: false,
          error: 'التصنيف المحدد غير موجود'
        }, { status: 400 })
      }
      
      articleData.categoryId = String(body.category_id)
    }

    // معالجة الجدولة الزمنية
    if (body.publish_at) {
      const publishDate = new Date(body.publish_at)
      const now = new Date()
      
      if (publishDate > now) {
        articleData.status = 'scheduled'
        articleData.scheduledFor = publishDate
      } else {
        articleData.status = 'published'
        articleData.publishedAt = publishDate
      }
    } else if (body.status === 'published') {
      articleData.publishedAt = new Date()
    }

    // التحقق من عدم تكرار الـ slug
    let finalSlug = articleData.slug
    let counter = 1
    while (await prisma.article.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${articleData.slug}-${counter}`
      counter++
    }
    articleData.slug = finalSlug

    console.log('البيانات النهائية للحفظ:', {
      title: articleData.title,
      slug: articleData.slug,
      authorId: articleData.authorId,
      categoryId: articleData.categoryId,
      status: articleData.status,
      hasContent: !!articleData.content,
      contentBlocksCount: articleData.metadata?.content_blocks?.length || 0
    })

    // إنشاء المقال
    const newArticle = await prisma.article.create({
      data: articleData
    })
    
    // جلب بيانات المؤلف والتصنيف
    const [author, category] = await Promise.all([
      newArticle.authorId ? prisma.user.findUnique({
        where: { id: newArticle.authorId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }) : null,
      newArticle.categoryId ? prisma.category.findUnique({
        where: { id: newArticle.categoryId }
      }) : null
    ])

    // إنشاء تحليل عميق للمقال (اختياري)
    if (newArticle.content && newArticle.content.length > 100) {
      try {
        await prisma.deepAnalysis.create({
          data: {
            articleId: newArticle.id,
            readabilityScore: 75.5, // يمكن حسابها بشكل أكثر تطوراً
            sentiment: 'neutral',
            engagementScore: 0.7,
            analyzedAt: new Date()
          }
        })
      } catch (analysisError) {
        console.error('خطأ في إنشاء التحليل العميق:', analysisError)
        // لا نوقف العملية إذا فشل التحليل
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newArticle,
        author,
        category
      },
      message: 'تم إنشاء المقال بنجاح'
    }, { status: 201 })
  } catch (error) {
    console.error('خطأ في إنشاء المقال:', error)
    
    // معالجة أخطاء Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      
      // خطأ في المفتاح الفريد
      if (prismaError.code === 'P2002') {
        return NextResponse.json({
          success: false,
          error: 'العنوان أو الـ slug مستخدم بالفعل'
        }, { status: 400 })
      }
      
      // خطأ في المفتاح الخارجي
      if (prismaError.code === 'P2003') {
        const field = prismaError.meta?.field_name || ''
        let errorMessage = 'بيانات غير صحيحة'
        
        if (field.includes('author')) {
          errorMessage = 'المؤلف المحدد غير موجود'
        } else if (field.includes('category')) {
          errorMessage = 'التصنيف المحدد غير موجود'
        }
        
        return NextResponse.json({
          success: false,
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? prismaError.meta : undefined
        }, { status: 400 })
      }
      
      // خطأ في القيمة المطلوبة
      if (prismaError.code === 'P2025') {
        return NextResponse.json({
          success: false,
          error: 'بيانات مطلوبة مفقودة'
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'فشل في إنشاء المقال',
      message: error instanceof Error ? error.message : 'خطأ غير معروف',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

// دوال مساعدة
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function calculateReadingTime(content: string): number {
  const wordsCount = content.split(/\s+/).length
  return Math.ceil(wordsCount / 200)
}

// DELETE: حذف مقالات (حذف ناعم)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const ids = body.ids || []

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'معرفات المقالات مطلوبة'
      }, { status: 400 })
    }

    // تحديث حالة المقالات إلى "محذوف"
    const result = await prisma.article.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status: 'deleted'
      }
    })

    return NextResponse.json({
      success: true,
      affected: result.count,
      message: `تم حذف ${result.count} مقال(ات) بنجاح`
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