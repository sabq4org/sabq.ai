import { prisma } from './prisma'
import { cache, DEFAULT_TTL, getFromCache, setInCache } from './cache'

// ===============================
// أنواع البيانات
// ===============================
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  author_id: string;
  author_name?: string;
  editor_id?: string;
  category_id?: string;
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

// ===============================
// دوال مساعدة لإدارة البيانات باستخدام Prisma
// ===============================

export async function loadArticles(): Promise<Article[]> {
  try {
    // محاولة الحصول على البيانات من التخزين المؤقت
    const cacheKey = cache.articles.list({})
    const cachedData = await getFromCache<Article[]>(cacheKey)
    if (cachedData) return cachedData

    // جلب البيانات من قاعدة البيانات
    const articles = await prisma.articles.findMany({
      where: {
        status: { not: 'deleted' }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // تحويل البيانات إلى الشكل المطلوب
    const transformedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.excerpt || undefined,
      author_id: article.author_id,
      category_id: article.category_id || undefined,
      status: article.status as any,
      featured_image: article.featured_image || undefined,
      seo_title: article.seo_title || undefined,
      seo_description: article.seo_description || undefined,
      seo_keywords: article.seo_keywords?.split(',').filter(k => k) || undefined,
      is_breaking: article.breaking,
      is_featured: article.featured,
      is_pinned: (article.metadata as any)?.is_pinned || false,
      published_at: article.published_at?.toISOString() || undefined,
      views_count: article.views,
      reading_time: article.reading_time || undefined,
      content_blocks: (article.metadata as any)?.content_blocks || undefined,
      created_at: article.created_at.toISOString(),
      updated_at: article.updated_at.toISOString(),
      is_deleted: false
    }))

    // حفظ في التخزين المؤقت
    await setInCache(cacheKey, transformedArticles, DEFAULT_TTL.ARTICLES_LIST)

    return transformedArticles
  } catch (error) {
    console.error('Error loading articles:', error)
    return []
  }
}

export async function saveArticles(articles: Article[]): Promise<void> {
  // هذه الدالة لم تعد مطلوبة مع Prisma
  // يتم الحفظ مباشرة عبر addArticle و updateArticle
  console.warn('saveArticles is deprecated with Prisma. Use addArticle or updateArticle instead.')
}

export async function addArticle(article: Article): Promise<void> {
  try {
    await prisma.articles.create({
      data: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.summary || null,
        author_id: article.author_id,
        category_id: article.category_id || null,
        status: article.status,
        featured: article.is_featured,
        breaking: article.is_breaking,
        featured_image: article.featured_image || null,
        published_at: article.published_at ? new Date(article.published_at) : null,
        scheduled_for: article.publish_at ? new Date(article.publish_at) : null,
        views: article.views_count,
        reading_time: article.reading_time || null,
        seo_title: article.seo_title || null,
        seo_description: article.seo_description || null,
        seo_keywords: article.seo_keywords?.join(',') || null,
        allow_comments: true,
        metadata: {
          content_blocks: article.content_blocks || [],
          featured_image_caption: article.featured_image_caption || null,
          is_pinned: article.is_pinned || false,
          editor_id: article.editor_id || null,
          section_id: article.section_id || null,
        },
        created_at: new Date(article.created_at),
        updated_at: new Date()
      }
    })

    // مسح التخزين المؤقت
    await cache.articles.invalidate()
  } catch (error) {
    console.error('Error adding article:', error)
    throw error
  }
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
  try {
    const updated = await prisma.articles.update({
      where: { id },
      data: {
        title: updates.title,
        slug: updates.slug,
        content: updates.content,
        excerpt: updates.summary,
        author_id: updates.author_id,
        category_id: updates.category_id,
        status: updates.status,
        featured: updates.is_featured,
        breaking: updates.is_breaking,
        featured_image: updates.featured_image,
        published_at: updates.published_at ? new Date(updates.published_at) : undefined,
        scheduled_for: updates.publish_at ? new Date(updates.publish_at) : undefined,
        views: updates.views_count,
        reading_time: updates.reading_time,
        seo_title: updates.seo_title,
        seo_description: updates.seo_description,
        seo_keywords: updates.seo_keywords?.join(','),
        metadata: updates.content_blocks || updates.featured_image_caption || updates.is_pinned !== undefined ? {
          content_blocks: updates.content_blocks || undefined,
          featured_image_caption: updates.featured_image_caption || undefined,
          is_pinned: updates.is_pinned,
          editor_id: updates.editor_id,
          section_id: updates.section_id,
        } : undefined,
        updated_at: new Date()
      }
    })

    // مسح التخزين المؤقت
    await cache.articles.invalidate()

    // تحويل البيانات إلى الشكل المطلوب
    return {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      content: updated.content,
      summary: updated.excerpt || undefined,
      author_id: updated.author_id,
      category_id: updated.category_id || undefined,
      status: updated.status as any,
      featured_image: updated.featured_image || undefined,
      seo_title: updated.seo_title || undefined,
      seo_description: updated.seo_description || undefined,
      seo_keywords: updated.seo_keywords?.split(',').filter(k => k) || undefined,
      is_breaking: updated.breaking,
      is_featured: updated.featured,
      is_pinned: (updated.metadata as any)?.is_pinned || false,
      published_at: updated.published_at?.toISOString() || undefined,
      views_count: updated.views,
      reading_time: updated.reading_time || undefined,
      content_blocks: (updated.metadata as any)?.content_blocks || undefined,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
      is_deleted: false
    }
  } catch (error) {
    console.error('Error updating article:', error)
    return null
  }
}

export async function softDeleteArticles(ids: string[]): Promise<void> {
  try {
    await prisma.articles.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'deleted',
        updated_at: new Date()
      }
    })

    // مسح التخزين المؤقت
    await cache.articles.invalidate()
  } catch (error) {
    console.error('Error soft deleting articles:', error)
    throw error
  }
}

// دوال إضافية للبحث والفلترة
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const cacheKey = `article:slug:${slug}`
    const cachedData = await getFromCache<Article>(cacheKey)
    if (cachedData) return cachedData

    const article = await prisma.articles.findUnique({
      where: { slug }
    })

    if (!article) return null

    const transformed = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.excerpt || undefined,
      author_id: article.author_id,
      category_id: article.category_id || undefined,
      status: article.status as any,
      featured_image: article.featured_image || undefined,
      seo_title: article.seo_title || undefined,
      seo_description: article.seo_description || undefined,
      seo_keywords: article.seo_keywords?.split(',').filter(k => k) || undefined,
      is_breaking: article.breaking,
      is_featured: article.featured,
      is_pinned: (article.metadata as any)?.is_pinned || false,
      published_at: article.published_at?.toISOString() || undefined,
      views_count: article.views,
      reading_time: article.reading_time || undefined,
      content_blocks: (article.metadata as any)?.content_blocks || undefined,
      created_at: article.created_at.toISOString(),
      updated_at: article.updated_at.toISOString(),
      is_deleted: false
    }

    await setInCache(cacheKey, transformed, DEFAULT_TTL.ARTICLE_DETAIL)
    return transformed
  } catch (error) {
    console.error('Error getting article by slug:', error)
    return null
  }
}

export async function getArticlesByCategory(categoryId: string, page = 1, limit = 10): Promise<{
  articles: Article[];
  total: number;
  pages: number;
}> {
  try {
    const cacheKey = cache.articles.byCategory(categoryId, page)
    const cachedData = await getFromCache<any>(cacheKey)
    if (cachedData) return cachedData

    const [articles, total] = await Promise.all([
      prisma.articles.findMany({
        where: {
          category_id: categoryId,
          status: 'published'
        },
        orderBy: {
          published_at: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.articles.count({
        where: {
          category_id: categoryId,
          status: 'published'
        }
      })
    ])

    const transformedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.excerpt || undefined,
      author_id: article.author_id,
      category_id: article.category_id || undefined,
      status: article.status as any,
      featured_image: article.featured_image || undefined,
      seo_title: article.seo_title || undefined,
      seo_description: article.seo_description || undefined,
      seo_keywords: article.seo_keywords?.split(',').filter(k => k) || undefined,
      is_breaking: article.breaking,
      is_featured: article.featured,
      is_pinned: (article.metadata as any)?.is_pinned || false,
      published_at: article.published_at?.toISOString() || undefined,
      views_count: article.views,
      reading_time: article.reading_time || undefined,
      content_blocks: (article.metadata as any)?.content_blocks || undefined,
      created_at: article.created_at.toISOString(),
      updated_at: article.updated_at.toISOString(),
      is_deleted: false
    }))

    const result = {
      articles: transformedArticles,
      total,
      pages: Math.ceil(total / limit)
    }

    await setInCache(cacheKey, result, DEFAULT_TTL.ARTICLES_LIST)
    return result
  } catch (error) {
    console.error('Error getting articles by category:', error)
    return { articles: [], total: 0, pages: 0 }
  }
} 