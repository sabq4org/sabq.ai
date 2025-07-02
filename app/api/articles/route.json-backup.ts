import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { filterTestContent, rejectTestContent } from '@/lib/data-protection';

// ===============================
// أنواع البيانات
// ===============================

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  author_id: string;
  author?: any;
  editor_id?: string;
  category_id?: number;
  section_id?: number;
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived' | 'deleted';
  featured_image?: string;
  featured_image_caption?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  is_breaking: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  publish_at?: string;
  published_at?: string;
  views_count: number;
  reading_time?: number;
  content_blocks?: any[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

interface CreateArticleRequest {
  title: string;
  content: string;
  summary?: string;
  category_id?: number;
  section_id?: number;
  status?: string;
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  is_breaking?: boolean;
  is_featured?: boolean;
  publish_at?: string;
  content_blocks?: any[];
  author_id?: string;
  author?: any;
}

// ===============================
// إدارة تخزين البيانات
// ===============================

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'articles.json');

// قراءة المقالات من الملف
async function loadArticles(): Promise<Article[]> {
  try {
    // التأكد من وجود مجلد البيانات
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // قراءة الملف
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // التعامل مع البنية الجديدة للملف
    if (data.articles && Array.isArray(data.articles)) {
      return data.articles;
    }
    
    // إذا كانت البيانات مصفوفة مباشرة (للتوافق مع البنية القديمة)
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  } catch (error) {
    // إذا لم يكن الملف موجودًا، إرجاع مصفوفة فارغة
    return [];
  }
}

// حفظ المقالات في الملف
async function saveArticles(articles: Article[]): Promise<void> {
  try {
    // التأكد من وجود مجلد البيانات
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    // حفظ البيانات بنفس البنية الموجودة
    const dataToSave = { articles };
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (error) {
    console.error('خطأ في حفظ المقالات:', error);
    throw new Error('فشل في حفظ المقالات');
  }
}

// إضافة مقال جديد
async function addArticle(article: Article): Promise<void> {
  const articles = await loadArticles();
  articles.unshift(article);
  await saveArticles(articles);
}

// تحديث مقال
async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
  const articles = await loadArticles();
  const index = articles.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  articles[index] = { ...articles[index], ...updates, updated_at: new Date().toISOString() };
  await saveArticles(articles);
  
  return articles[index];
}

// حذف مقالات (حذف ناعم)
async function softDeleteArticles(ids: string[]): Promise<number> {
  const articles = await loadArticles();
  let affected = 0;
  
  const updatedArticles = articles.map(article => {
    if (ids.includes(article.id)) {
      affected++;
      return { 
        ...article, 
        status: 'deleted' as const, 
        is_deleted: true, 
        updated_at: new Date().toISOString() 
      };
    }
    return article;
  });
  
  await saveArticles(updatedArticles);
  return affected;
}

// TODO: تنفيذ دوال قاعدة البيانات الحقيقية
const fetchArticlesFromDatabase = async (filters: any = {}) => {
  // يجب تنفيذ استدعاء قاعدة البيانات هنا
  // مثال: return await prisma.articles.findMany({ where: filters });
  return [];
};

const createArticleInDatabase = async (articleData: CreateArticleRequest) => {
  // يجب تنفيذ إنشاء المقال في قاعدة البيانات
  // مثال: return await prisma.articles.create({ data: articleData });
  return null;
};

// ===============================
// وظائف مساعدة
// ===============================

// توليد slug من العنوان
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// حساب وقت القراءة (بناء على 200 كلمة في الدقيقة)
function calculateReadingTime(content: string): number {
  const wordsCount = content.split(/\s+/).length;
  return Math.ceil(wordsCount / 200);
}

// فلترة المقالات حسب المعايير
async function filterArticles(query: URLSearchParams) {
  // تحميل المقالات من الملف
  const articles = await loadArticles();
  let filteredArticles = [...articles];

  // فلترة المقالات المحذوفة بشكل افتراضي (ما لم يطلبها المستخدم صراحة)
  const requestedStatus = query.get('status');
  if (requestedStatus !== 'deleted') {
    filteredArticles = filteredArticles.filter(article => !article.is_deleted && article.status !== 'deleted');
  }

  // فلترة حسب الحالة
  const status = query.get('status');
  if (status) {
    filteredArticles = filteredArticles.filter(article => article.status === status);
  }

  // فلترة حسب التصنيف
  const categoryId = query.get('category_id');
  if (categoryId) {
    filteredArticles = filteredArticles.filter(article => article.category_id === parseInt(categoryId));
  }

  // فلترة حسب القسم
  const section = query.get('section_id');
  if (section) {
    filteredArticles = filteredArticles.filter(article => article.section_id === parseInt(section));
  }

  // فلترة حسب المؤلف
  const author = query.get('author_id');
  if (author) {
    filteredArticles = filteredArticles.filter(article => article.author_id === author);
  }

  // البحث في العنوان والمحتوى
  const search = query.get('search');
  if (search) {
    filteredArticles = filteredArticles.filter(article => 
      article.title.includes(search) || 
      article.content.includes(search) ||
      article.summary?.includes(search)
    );
  }

  // فلترة المقالات المميزة
  const featured = query.get('featured');
  if (featured === 'true') {
    filteredArticles = filteredArticles.filter(article => article.is_featured);
  }

  // فلترة الأخبار العاجلة
  const breaking = query.get('breaking');
  if (breaking === 'true') {
    filteredArticles = filteredArticles.filter(article => article.is_breaking);
  }

  // فلترة حسب الكلمة المفتاحية
  const keyword = query.get('keyword');
  if (keyword) {
    filteredArticles = filteredArticles.filter(article => {
      const kws = Array.isArray(article.seo_keywords)
        ? article.seo_keywords
        : typeof article.seo_keywords === 'string'
          ? (article.seo_keywords as string).split(',').map((k: string) => k.trim())
          : [];
      return kws.includes(keyword);
    });
  }

  return filteredArticles;
}

// ترتيب المقالات
function sortArticles(articles: Article[], sortBy: string = 'created_at', order: string = 'desc') {
  return articles.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'views':
        aValue = a.views_count;
        bValue = b.views_count;
        break;
      case 'published_at':
        aValue = a.published_at || a.created_at;
        bValue = b.published_at || b.created_at;
        break;
      default:
        aValue = a.created_at;
        bValue = b.created_at;
    }

    if (order === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
}

// ===============================
// معالجات API
// ===============================

// جلب معلومات التصنيفات
async function fetchCategoriesData() {
  try {
    const categoriesFile = path.join(process.cwd(), 'data', 'categories.json');
    const fileContent = await fs.readFile(categoriesFile, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.categories || [];
  } catch (error) {
    return [];
  }
}

// GET: استرجاع المقالات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // تطبيق الفلاتر
    let filteredArticles = await filterArticles(searchParams);
    
    // تصفية المحتوى التجريبي في الإنتاج
    filteredArticles = filterTestContent(filteredArticles);
    
    // جلب معلومات التصنيفات
    const categories = await fetchCategoriesData();
    
    // إثراء المقالات بمعلومات التصنيف
    filteredArticles = filteredArticles.map(article => {
      const category = categories.find((cat: any) => cat.id === article.category_id);
      return {
        ...article,
        category_name: category?.name_ar || 'غير مصنف',
        category_color: category?.color_hex || '#6B7280',
        category_icon: category?.icon || '📁',
        author_name: article.author?.name || 'كاتب غير معروف',
        featured_image: article.featured_image
      };
    });
    
    // تطبيق الترتيب
    const sortBy = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    filteredArticles = sortArticles(filteredArticles, sortBy, order);
    
    // تطبيق التقسيم (Pagination)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
    
    // إحصائيات إضافية
    const stats = {
      total: filteredArticles.length,
      page,
      limit,
      totalPages: Math.ceil(filteredArticles.length / limit),
      hasNext: endIndex < filteredArticles.length,
      hasPrev: page > 1
    };

    return NextResponse.json({
      success: true,
      // للإبقاء على التوافق العكسي مع الواجهات القديمة
      articles: paginatedArticles,
      data: paginatedArticles,
      pagination: stats,
      filters: {
        status: searchParams.get('status'),
        category_id: searchParams.get('category_id'),
        section_id: searchParams.get('section_id'),
        search: searchParams.get('search'),
        featured: searchParams.get('featured'),
        breaking: searchParams.get('breaking')
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'فشل في استرجاع المقالات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// POST: إنشاء مقال جديد
export async function POST(request: NextRequest) {
  try {
    const body: CreateArticleRequest = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!body.title || !body.content) {
      return NextResponse.json({
        success: false,
        error: 'العنوان والمحتوى مطلوبان'
      }, { status: 400 });
    }
    
    // التحقق من المحتوى التجريبي
    const validation = rejectTestContent(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // إنشاء المقال الجديد
    const newArticle: Article = {
      id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: body.title.trim(),
      slug: body.title ? generateSlug(body.title) : `article-${Date.now()}`,
      content: body.content,
      summary: body.summary?.trim(),
      author_id: body.author_id || 'current-user-id',
      category_id: body.category_id,
      section_id: body.section_id,
      status: (body.status as any) || 'draft',
      featured_image: body.featured_image,
      seo_title: body.seo_title?.trim(),
      seo_description: body.seo_description?.trim(),
      is_breaking: body.is_breaking || false,
      is_featured: body.is_featured || false,
      is_pinned: false,
      publish_at: body.publish_at,
      published_at: undefined,
      views_count: 0,
      reading_time: calculateReadingTime(body.content),
      content_blocks: body.content_blocks || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false
    };

    // معالجة الجدولة الزمنية
    if (body.publish_at && body.status === 'published') {
      const publishDate = new Date(body.publish_at);
      const now = new Date();
      
      if (publishDate > now) {
        // إذا كان التوقيت في المستقبل، قم بجدولة المقال
        newArticle.status = 'scheduled';
        newArticle.publish_at = publishDate.toISOString();
      } else {
        // إذا كان التوقيت في الماضي أو الحاضر، قم بنشره مباشرة
        newArticle.status = 'published';
        newArticle.published_at = publishDate.toISOString();
      }
    } else if (body.status === 'published' && !body.publish_at) {
      // إذا كان النشر مباشر بدون توقيت محدد
      newArticle.status = 'published';
      newArticle.published_at = new Date().toISOString();
    }

    // إضافة author من البيانات المرسلة
    if (body.author) {
      newArticle.author = body.author;
    }

    // التحقق من عدم تكرار الـ slug
    const existingArticles = await loadArticles();
    let finalSlug = newArticle.slug;
    let counter = 1;
    while (existingArticles.some((article: Article) => article.slug === finalSlug)) {
      finalSlug = `${newArticle.slug}-${counter}`;
      counter++;
    }
    newArticle.slug = finalSlug;

    // إضافة المقال
    await addArticle(newArticle);

    return NextResponse.json({
      success: true,
      data: newArticle,
      message: 'تم إنشاء المقال بنجاح'
    }, { status: 201 });

  } catch (error) {
    console.error('خطأ في إنشاء المقال:', error);
    
    // معالجة خطأ الكتابة على القرص في Vercel/بيئة الإنتاج
    if (error instanceof Error && error.message.includes('EROFS')) {
      return NextResponse.json({
        success: false,
        error: 'لا يمكن إنشاء المقالات في بيئة الإنتاج باستخدام ملفات JSON',
        message: 'يرجى استخدام قاعدة بيانات حقيقية (Supabase, PostgreSQL, etc.)',
        details: 'النظام يحاول الكتابة في ملفات JSON وهذا غير مدعوم في Vercel'
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'فشل في إنشاء المقال',
      message: error instanceof Error ? error.message : 'خطأ غير معروف',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

// PUT: تحديث مقال (سيتم تنفيذه في route منفصل)
export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'استخدم /api/articles/[id] لتحديث مقال معين'
  }, { status: 405 });
}

// DELETE: حذف متعدد (سيتم تنفيذه حسب الحاجة)
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'قائمة معرفات المقالات مطلوبة'
      }, { status: 400 });
    }

    // حذف ناعم (تغيير الحالة إلى deleted)
    const affected = await softDeleteArticles(ids);

    return NextResponse.json({
      success: true,
      message: `تم نقل ${affected} مقال إلى سلة المحذوفات`,
      affected
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'فشل في حذف المقالات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
} 