import fs from 'fs/promises';
import path from 'path';

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

// ===============================
// دوال مساعدة لإدارة البيانات
// ===============================
const DATA_FILE = path.join(process.cwd(), 'data', 'articles.json');

export async function loadArticles(): Promise<Article[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // إذا لم يكن الملف موجوداً، أنشئ مصفوفة فارغة
    return [];
  }
}

export async function saveArticles(articles: Article[]): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(articles, null, 2));
}

export async function addArticle(article: Article): Promise<void> {
  const articles = await loadArticles();
  articles.push(article);
  await saveArticles(articles);
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
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
  return articles[index];
}

export async function softDeleteArticles(ids: string[]): Promise<void> {
  const articles = await loadArticles();
  
  articles.forEach(article => {
    if (ids.includes(article.id)) {
      article.is_deleted = true;
      article.status = 'deleted';
      article.updated_at = new Date().toISOString();
    }
  });
  
  await saveArticles(articles);
} 