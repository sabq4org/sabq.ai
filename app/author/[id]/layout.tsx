import { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';

interface PageParams {
  params: Promise<{ id: string }>;
}

interface Author {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatar?: string;
}

async function getAuthorInfo(authorId: string): Promise<Author | null> {
  try {
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await fs.readFile(articlesPath, 'utf-8');
    const data = JSON.parse(articlesData);
    const articles = data.articles || data;
    
    // البحث عن مقالات المؤلف
    const authorArticle = articles.find((article: any) => {
      if (article.author_id === authorId) return true;
      
      if (authorId === 'ali-abdah') {
        return article.author === 'علي عبده' || 
               article.author_name === 'علي عبده';
      }
      if (authorId === 'team' || authorId === 'editorial-team') {
        return article.author === 'فريق التحرير' || 
               article.author_name === 'فريق التحرير';
      }
      if (authorId === 'current-user-id' || authorId === '1') {
        return article.author_id === '1' || 
               article.author === 'محمد أحمد' ||
               article.author_name === 'محمد أحمد';
      }
      
      return false;
    });
    
    if (!authorArticle) {
      return null;
    }
    
    // استخراج اسم المؤلف
    let authorName = '';
    if (authorArticle.author && typeof authorArticle.author === 'string') {
      authorName = authorArticle.author;
    } else if (authorArticle.author_name) {
      authorName = authorArticle.author_name;
    } else if (authorArticle.reporter || authorArticle.reporter_name) {
      authorName = authorArticle.reporter || authorArticle.reporter_name;
    } else {
      authorName = 'كاتب صحفي';
    }
    
    return {
      id: authorId,
      name: authorName,
      title: getAuthorTitle(authorId),
      bio: getAuthorBio(authorId, authorName)
    };
  } catch (error) {
    console.error('Error fetching author:', error);
    return null;
  }
}

function getAuthorTitle(authorId: string): string {
  const titles: { [key: string]: string } = {
    'ali-abdah': 'محرر صحفي متخصص',
    'team': 'فريق تحرير سبق',
    'editorial-team': 'فريق التحرير الرقمي',
    'current-user-id': 'كاتب صحفي',
    '1': 'كاتب صحفي'
  };
  return titles[authorId] || 'محرر صحفي';
}

function getAuthorBio(authorId: string, authorName: string): string {
  const bios: { [key: string]: string } = {
    'ali-abdah': 'محرر صحفي متخصص في الشؤون المحلية والاقتصادية',
    'team': 'فريق متخصص من المحررين والصحفيين',
    'editorial-team': 'فريق التحرير الرقمي في صحيفة سبق'
  };
  return bios[authorId] || `${authorName} - كاتب صحفي في صحيفة سبق الإلكترونية`;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthorInfo(id);
  
  if (!author) {
    return {
      title: 'الكاتب غير موجود',
      description: 'عذراً، لم نتمكن من العثور على الكاتب المطلوب'
    };
  }

  const description = author.bio || `صفحة الكاتب ${author.name} في صحيفة سبق الإلكترونية. اقرأ جميع مقالات وتحليلات ${author.name}.`;

  return {
    title: `${author.name} - ${author.title}`,
    description: description,
    keywords: `${author.name}, صحيفة سبق, مقالات ${author.name}, كتاب سبق, صحفيين سعوديين`,
    authors: [{ name: author.name }],
    openGraph: {
      title: `${author.name} - ${author.title}`,
      description: description,
      type: 'profile',
      images: [
        {
          url: `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=3B82F6&color=fff&size=200&font-size=0.5&bold=true`,
          width: 200,
          height: 200,
          alt: author.name
        }
      ],
      siteName: 'صحيفة سبق الإلكترونية',
      locale: 'ar_SA'
    },
    twitter: {
      card: 'summary',
      title: `${author.name} - ${author.title}`,
      description: description,
      images: [`https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=3B82F6&color=fff&size=200&font-size=0.5&bold=true`],
    },
    alternates: {
      canonical: `https://sabq.org/author/${id}`
    }
  };
}

export default function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 