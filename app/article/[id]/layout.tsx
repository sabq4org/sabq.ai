import { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  content?: string;
  featured_image?: string;
  featured_image_alt?: string;
  category_name?: string;
  author?: string | { name: string };
  author_name?: string;
  reporter?: string;
  reporter_name?: string;
  published_at?: string;
  created_at?: string;
  seo_keywords?: string | string[];
  slug?: string;
}

async function getArticle(id: string): Promise<Article | null> {
  try {
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await fs.readFile(articlesPath, 'utf-8');
    const data = JSON.parse(articlesData);
    const articles = data.articles || data;
    
    const article = articles.find((a: any) => a.id === id);
    return article || null;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  
  if (!article) {
    return {
      title: 'مقال غير موجود | صحيفة سبق الإلكترونية',
      description: 'عذراً، المقال الذي تبحث عنه غير موجود'
    };
  }

  // استخراج اسم المؤلف
  let authorName = 'فريق التحرير';
  if (article.author) {
    if (typeof article.author === 'string') {
      authorName = article.author;
    } else if (article.author.name) {
      authorName = article.author.name;
    }
  } else if (article.author_name) {
    authorName = article.author_name;
  } else if (article.reporter || article.reporter_name) {
    authorName = article.reporter || article.reporter_name || 'فريق التحرير';
  }

  // استخراج الكلمات المفتاحية
  let keywords: string[] = [];
  if (article.seo_keywords) {
    if (typeof article.seo_keywords === 'string') {
      keywords = article.seo_keywords.split(',').map(k => k.trim());
    } else if (Array.isArray(article.seo_keywords)) {
      keywords = article.seo_keywords;
    }
  }

  // إضافة كلمات مفتاحية افتراضية
  keywords.push('صحيفة سبق', 'أخبار السعودية', article.category_name || 'أخبار');

  // الوصف - التأكد من وجود قيمة
  const description = article.summary || article.subtitle || 
    (article.content ? article.content.substring(0, 160) + '...' : '') || article.title || 'اقرأ المزيد على صحيفة سبق الإلكترونية';

  // الصورة المميزة
  const imageUrl = article.featured_image || 'https://sabq.org/default-news-image.jpg';

  return {
    title: `${article.title} | صحيفة سبق الإلكترونية`,
    description: description as string,
    keywords: keywords.join(', '),
    authors: [{ name: authorName }],
    openGraph: {
      title: article.title,
      description: description,
      type: 'article',
      publishedTime: article.published_at || article.created_at,
      authors: [authorName],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.featured_image_alt || article.title
        }
      ],
      siteName: 'صحيفة سبق الإلكترونية',
      locale: 'ar_SA'
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: description,
      images: [imageUrl],
      creator: '@sabqorg',
      site: '@sabqorg'
    },
    alternates: {
      canonical: `https://sabq.org/article/${article.slug || article.id}`
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 