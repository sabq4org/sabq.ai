import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'articles.json');

interface Article {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category_id: number;
  status: string;
  is_deleted?: boolean;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
  [key: string]: any;
}

// قراءة المقالات من الملف
async function loadArticles(): Promise<Article[]> {
  try {
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (data.articles && Array.isArray(data.articles)) {
      return data.articles;
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  } catch (error) {
    return [];
  }
}

// حفظ المقالات في الملف
async function saveArticles(articles: Article[]): Promise<void> {
  try {
    const dataToSave = { articles };
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (error) {
    console.error('خطأ في حفظ المقالات:', error);
    throw new Error('فشل في حفظ المقالات');
  }
}

// دالة لقراءة أعضاء الفريق
async function loadTeamMembers(): Promise<any[]> {
  try {
    const teamFilePath = path.join(process.cwd(), 'data', 'team_members.json');
    const fileContent = await fs.readFile(teamFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.teamMembers || [];
  } catch (error) {
    console.error('Error loading team members:', error);
    return [];
  }
}

// دالة لقراءة التصنيفات
async function loadCategories(): Promise<any[]> {
  try {
    const categoriesFilePath = path.join(process.cwd(), 'data', 'categories.json');
    const fileContent = await fs.readFile(categoriesFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.categories || [];
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

// تحديث مقال
async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
  const articles = await loadArticles();
  const index = articles.findIndex(a => a.id === id);
  
  if (index === -1) {
    return null;
  }
  
  articles[index] = {
    ...articles[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  await saveArticles(articles);

  // إثراء المقال ببيانات المراسل إن لم تكن موجودة
  if (articles[index].author_id && !articles[index].author_name) {
    const teamMembers = await loadTeamMembers();
    const author = teamMembers.find(member => member.userId === articles[index].author_id || member.id === articles[index].author_id);
    if (author) {
      articles[index].author_name = author.name;
      if (author.avatar) {
        articles[index].author_avatar = author.avatar;
      }
    }
  }

  return articles[index];
}

// Cache بسيط في الذاكرة للمقالات المتكررة
const articleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 ثانية

// GET - جلب مقال واحد
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching article with ID:', id);
    
    // التحقق من Cache أولاً
    const cached = articleCache.get(id);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('Returning cached article');
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        }
      });
    }
    
    // جلب المقال من قاعدة البيانات - استعلام مبسط
    let dbArticle = await prisma.articles.findFirst({
      where: { 
        OR: [
          { id },
          { slug: id }
        ]
      }
    });

    if (!dbArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // زيادة عداد المشاهدات فقط (بدون انتظار النتيجة)
    prisma.articles.update({
      where: { id: dbArticle.id },
      data: { views: { increment: 1 } }
    }).catch((err: any) => console.error('Failed to increment views:', err));

    // حساب إحصائيات بسيطة (بدون groupBy المعقد)
    const interactionCounts = await prisma.interactions.findMany({
      where: { article_id: dbArticle.id },
      select: { type: true }
    }).then(interactions => {
      const counts = { likes: 0, shares: 0, saves: 0 };
      interactions.forEach(i => {
        if (i.type === 'like') counts.likes++;
        else if (i.type === 'share') counts.shares++;
        else if (i.type === 'save') counts.saves++;
      });
      return counts;
    }).catch(() => ({ likes: 0, shares: 0, saves: 0 }));

    // حساب عدد التعليقات
    const commentsCount = await prisma.comments.count({
      where: { article_id: dbArticle.id }
    }).catch(() => 0);

    // جلب بيانات المؤلف والتصنيف بشكل منفصل
    let author = null;
    let category = null;
    let authorName = null;
    
    // محاولة استخراج اسم المؤلف من metadata أولاً
    if (dbArticle.metadata && typeof dbArticle.metadata === 'object' && 'author_name' in dbArticle.metadata) {
      authorName = (dbArticle.metadata as any).author_name;
    }
    
    if (dbArticle.author_id) {
      author = await prisma.users.findUnique({
        where: { id: dbArticle.author_id },
        select: { id: true, name: true, avatar: true }
      }).catch(() => null);
      
      // استخدام اسم المؤلف من قاعدة البيانات إذا لم يكن موجوداً في metadata
      if (!authorName && author) {
        authorName = author.name;
      }
    }
    
    if (dbArticle.category_id) {
      category = await prisma.categories.findUnique({
        where: { id: dbArticle.category_id },
        select: { id: true, name: true }
      }).catch(() => null);
    }

    // تنسيق البيانات للاستجابة
    const formatted = {
      id: dbArticle.id,
      title: dbArticle.title,
      slug: dbArticle.slug,
      content: dbArticle.content,
      summary: dbArticle.excerpt,
      author_id: dbArticle.author_id,
      author: author,
      category_id: dbArticle.category_id,
      category_name: category?.name,
      category: category,
      category_display_name: category?.name,
      category_color: '#3B82F6', // لون افتراضي
      status: dbArticle.status,
      featured_image: dbArticle.featured_image,
      is_breaking: dbArticle.breaking,
      is_featured: dbArticle.featured,
      views_count: dbArticle.views + 1, // إضافة 1 للمشاهدة الحالية
      reading_time: dbArticle.reading_time || Math.ceil((dbArticle.content || '').split(/\s+/).length / 200),
      created_at: dbArticle.created_at.toISOString(),
      updated_at: dbArticle.updated_at.toISOString(),
      published_at: dbArticle.published_at?.toISOString(),
      tags: dbArticle.metadata && typeof dbArticle.metadata === 'object' && 'tags' in dbArticle.metadata ? (dbArticle.metadata as any).tags : [],
      interactions_count: interactionCounts.likes + interactionCounts.shares + interactionCounts.saves,
      comments_count: commentsCount,
      stats: {
        views: dbArticle.views + 1,
        likes: interactionCounts.likes,
        shares: interactionCounts.shares,
        comments: commentsCount,
        saves: interactionCounts.saves
      },
      author_name: authorName || author?.name || null, // استخدام authorName من metadata أو من author relation
      author_avatar: author?.avatar,
      // إضافة حقول إضافية قد تحتاجها صفحة التعديل
      seo_keywords: dbArticle.seo_keywords,
      seo_description: dbArticle.seo_description,
      seo_title: dbArticle.seo_title,
      allow_comments: dbArticle.allow_comments,
      scheduled_for: dbArticle.scheduled_for,
      metadata: dbArticle.metadata
    };

    // معالجة ألبوم الصور من metadata
    if (dbArticle.metadata && typeof dbArticle.metadata === 'object') {
      const metadata = dbArticle.metadata as any;
      
      // إذا كان هناك ألبوم صور في metadata
      if (metadata.gallery && Array.isArray(metadata.gallery) && metadata.gallery.length > 0) {
        // محاولة تحليل المحتوى كـ JSON blocks
        let contentBlocks = [];
        try {
          contentBlocks = JSON.parse(dbArticle.content || '[]');
          if (!Array.isArray(contentBlocks)) {
            contentBlocks = [];
          }
        } catch (e) {
          // إذا لم يكن المحتوى JSON، نحوله إلى بلوك HTML
          if (dbArticle.content) {
            contentBlocks = [{
              type: 'html',
              content: dbArticle.content
            }];
          }
        }
        
        // إضافة بلوك الألبوم في نهاية المحتوى
        contentBlocks.push({
          type: 'gallery',
          id: 'gallery-' + Date.now(),
          images: metadata.gallery.map((img: any) => ({
            url: img.url || img,
            alt: img.alt || '',
            caption: img.caption || ''
          })),
          caption: 'ألبوم الصور'
        });
        
        // تحديث المحتوى ليشمل بلوك الألبوم
        formatted.content = JSON.stringify(contentBlocks);
      }
    }

    // حفظ في Cache
    articleCache.set(id, {
      data: formatted,
      timestamp: Date.now()
    });

    // تنظيف Cache القديم (كل 100 طلب)
    if (Math.random() < 0.01) {
      const now = Date.now();
      for (const [key, value] of articleCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION * 2) {
          articleCache.delete(key);
        }
      }
    }

    return NextResponse.json(formatted, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Content-Type': 'application/json',
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث مقال
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    // حذف من Cache عند التحديث
    articleCache.delete(id);
    
    const updatedArticle = await prisma.articles.update({
      where: { id },
      data: updates
    });
    
    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

// PUT method لتحديث المقال كاملاً (للتحرير)
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // حذف من Cache عند التحديث
    articleCache.delete(id);
    
    // تحويل أسماء الحقول من snake_case إلى camelCase
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // خريطة تحويل الأسماء
    const fieldMapping: Record<string, string> = {
      author_id: 'authorId',
      category_id: 'categoryId',
      featured_image: 'featuredImage',
      is_featured: 'featured',
      is_breaking: 'breaking',
      allow_comments: 'allowComments',
      reading_time: 'readingTime',
      scheduled_for: 'scheduledFor',
      seo_description: 'seoDescription',
      seo_keywords: 'seoKeywords',
      seo_title: 'seoTitle',
      social_image: 'socialImage',
      published_at: 'publishedAt',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    };
    
    // تحويل البيانات
    let needsAuthorName = false;
    let authorNameValue = null;
    
    for (const [key, value] of Object.entries(body)) {
      const mappedKey = fieldMapping[key] || key;
      
      // تأجيل معالجة author_name حتى جلب existingArticle
      if (key === 'author_name' && value) {
        needsAuthorName = true;
        authorNameValue = value;
      }
      // التحقق من مسارات الصور
      else if ((key === 'featured_image' || key === 'social_image') && value) {
        const imageUrl = value as string;
        // منع المسارات المحلية - يجب أن تكون الصور من Cloudinary أو خدمة سحابية
        if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/public/') || 
            (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
          return NextResponse.json({ 
            success: false, 
            error: 'مسار الصورة غير صحيح',
            message: 'يجب رفع الصور إلى Cloudinary. المسارات المحلية غير مسموحة.' 
          }, { status: 400 });
        }
        updateData[fieldMapping[key]] = imageUrl;
      }
      // تحويل keywords إلى seoKeywords كـ string
      else if (key === 'keywords' && Array.isArray(value)) {
        updateData.seoKeywords = value.join(', ');
      } 
      // معالجة الحقول المنطقية
      else if (['is_featured', 'is_breaking', 'allow_comments'].includes(key)) {
        updateData[fieldMapping[key]] = Boolean(value);
      }
      // معالجة summary كـ excerpt
      else if (key === 'summary') {
        updateData.excerpt = value;
      }
      // معالجة التواريخ
      else if (value && (key === 'scheduled_for' || key === 'published_at')) {
        updateData[fieldMapping[key]] = new Date(value as string);
      }
      // الحقول العادية
      else if (value !== undefined && value !== null) {
        updateData[mappedKey] = value;
      }
    }
    
    // التأكد من وجود المقال أولاً
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    });
    
    if (!existingArticle) {
      return NextResponse.json({ 
        success: false, 
        error: 'المقال غير موجود' 
      }, { status: 404 });
    }
    
    // معالجة author_name في metadata بعد جلب existingArticle
    if (needsAuthorName && authorNameValue) {
      if (!updateData.metadata || typeof updateData.metadata !== 'object') {
        updateData.metadata = {};
      }
      updateData.metadata = {
        ...(typeof existingArticle.metadata === 'object' ? existingArticle.metadata : {}),
        author_name: authorNameValue
      };
    }
    
    // تحديث المقال
    const updated = await prisma.article.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      data: updated, 
      message: 'تم تحديث المقال بنجاح' 
    });
  } catch (e) {
    console.error('خطأ في تحديث المقال:', e);
    return NextResponse.json({ 
      success: false, 
      error: 'فشل في تحديث المقال',
      details: e instanceof Error ? e.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}