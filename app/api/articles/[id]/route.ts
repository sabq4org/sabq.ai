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
    let dbArticle = await prisma.article.findFirst({
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
    prisma.article.update({
      where: { id: dbArticle.id },
      data: { views: { increment: 1 } }
    }).catch(err => console.error('Failed to increment views:', err));

    // حساب إحصائيات بسيطة (بدون groupBy المعقد)
    const interactionCounts = await prisma.interaction.findMany({
      where: { articleId: dbArticle.id },
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
    const commentsCount = await prisma.comment.count({
      where: { articleId: dbArticle.id }
    }).catch(() => 0);

    // جلب بيانات المؤلف والتصنيف بشكل منفصل
    let author = null;
    let category = null;
    
    if (dbArticle.authorId) {
      author = await prisma.user.findUnique({
        where: { id: dbArticle.authorId },
        select: { id: true, name: true, avatar: true }
      }).catch(() => null);
    }
    
    if (dbArticle.categoryId) {
      category = await prisma.category.findUnique({
        where: { id: dbArticle.categoryId },
        select: { id: true, name: true, color: true }
      }).catch(() => null);
    }

    // تنسيق البيانات للاستجابة
    const formatted = {
      id: dbArticle.id,
      title: dbArticle.title,
      slug: dbArticle.slug,
      content: dbArticle.content,
      summary: dbArticle.excerpt,
      author_id: dbArticle.authorId,
      author: author,
      category_id: dbArticle.categoryId,
      category_name: category?.name,
      category: category,
      category_display_name: category?.name,
      category_color: category?.color || '#3B82F6',
      status: dbArticle.status,
      featured_image: dbArticle.featuredImage,
      is_breaking: dbArticle.breaking,
      is_featured: dbArticle.featured,
      views_count: dbArticle.views + 1, // إضافة 1 للمشاهدة الحالية
      reading_time: dbArticle.readingTime || Math.ceil((dbArticle.content || '').split(/\s+/).length / 200),
      created_at: dbArticle.createdAt.toISOString(),
      updated_at: dbArticle.updatedAt.toISOString(),
      published_at: dbArticle.publishedAt?.toISOString(),
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
      author_name: author?.name,
      author_avatar: author?.avatar,
      // إضافة حقول إضافية قد تحتاجها صفحة التعديل
      seo_keywords: dbArticle.seoKeywords,
      seo_description: dbArticle.seoDescription,
      seo_title: dbArticle.seoTitle,
      allow_comments: dbArticle.allowComments,
      scheduled_for: dbArticle.scheduledFor
    };

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
    
    const updatedArticle = await prisma.article.update({
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
    for (const [key, value] of Object.entries(body)) {
      const mappedKey = fieldMapping[key] || key;
      
      // التحقق من مسارات الصور
      if ((key === 'featured_image' || key === 'social_image') && value) {
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