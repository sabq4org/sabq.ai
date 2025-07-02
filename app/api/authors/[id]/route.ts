import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface Author {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatar?: string;
  joinDate?: string;
  articlesCount?: number;
  viewsCount?: number;
  likesCount?: number;
  specialization?: string[];
  awards?: string[];
  social?: {
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: authorId } = await params;
    
    // جلب المؤلف من قاعدة البيانات
    const dbAuthor = await prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!dbAuthor) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // جلب مقالات المؤلف
    const dbArticles = await prisma.article.findMany({
      where: { authorId: authorId, status: 'published' },
      include: {
        category: true
      },
      orderBy: { publishedAt: 'desc' }
    });

    // حساب الإحصائيات
    const totalViews = dbArticles.reduce((sum, a) => sum + a.views, 0);

    // likes via interactions
    const likesAggregate = await prisma.interaction.count({
      where: { article: { authorId }, type: 'like' }
    });

    // تجهيز مقالات للإرسال
    const articlesWithStats = await Promise.all(dbArticles.slice(0,12).map(async (a)=>{
      const likeCount = await prisma.interaction.count({ where: { articleId: a.id, type: 'like' } });
      return {
        id: a.id,
        title: a.title,
        summary: a.excerpt,
        category: (a.category as any)?.name_ar || a.category?.name || 'عام',
        category_id: a.categoryId,
        date: a.publishedAt?.toISOString() || a.createdAt.toISOString(),
        image: a.featuredImage,
        views: a.views,
        likes: likeCount,
        comments: await prisma.comment.count({ where: { articleId: a.id, status: 'approved' } }),
        readTime: a.readingTime ? `${a.readingTime} دقائق` : undefined,
        is_breaking: a.breaking,
        is_featured: a.featured
      };
    }));

    const author: Author = {
      id: dbAuthor.id,
      name: dbAuthor.name || 'كاتب صحفي',
      avatar: dbAuthor.avatar || undefined,
      joinDate: dbAuthor.createdAt.toISOString().split('T')[0],
      articlesCount: dbArticles.length,
      viewsCount: totalViews,
      likesCount: likesAggregate,
      bio: '',
      social: {}
    };

    return NextResponse.json({ author, articles: articlesWithStats, totalArticles: dbArticles.length });

  } catch (error) {
    console.error('Error fetching author data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// دوال مساعدة محسنة
function getAuthorNameById(authorId: string): string {
  const names: { [key: string]: string } = {
    'ali-abdah': 'علي عبده',
    'team': 'فريق التحرير',
    'editorial-team': 'فريق التحرير',
    'current-user-id': 'محمد أحمد',
    '1': 'محمد أحمد'
  };
  return names[authorId] || 'كاتب صحفي';
}

function getAuthorTitle(authorId: string, authorName: string, articlesCount: number): string {
  // عناوين ديناميكية بناءً على عدد المقالات
  if (articlesCount > 50) {
    return 'كاتب صحفي خبير';
  } else if (articlesCount > 20) {
    return 'محرر صحفي متخصص';
  } else if (articlesCount > 10) {
    return 'كاتب صحفي';
  }
  
  const titles: { [key: string]: string } = {
    'ali-abdah': 'محرر صحفي متخصص',
    'team': 'فريق تحرير سبق',
    'editorial-team': 'فريق التحرير الرقمي'
  };
  
  return titles[authorId] || 'محرر صحفي';
}

function getAuthorBio(authorId: string, authorName: string, specializations: string[]): string {
  const specializationText = specializations.length > 0 
    ? `متخصص في ${specializations.slice(0, 3).join(' و')}. ` 
    : '';
  
  const bios: { [key: string]: string } = {
    'ali-abdah': `محرر صحفي متخصص في الشؤون المحلية والاقتصادية. ${specializationText}يتمتع بخبرة واسعة في مجال الصحافة الرقمية وله العديد من التحقيقات الصحفية المميزة.`,
    'team': `فريق متخصص من المحررين والصحفيين يعملون على تقديم محتوى إخباري متميز وموثوق. ${specializationText}نغطي جميع جوانب الأخبار المحلية والعالمية.`,
    'editorial-team': 'فريق التحرير الرقمي في صحيفة سبق، نعمل على مدار الساعة لتقديم أحدث الأخبار والتقارير.'
  };
  
  return bios[authorId] || `${authorName} - كاتب صحفي في صحيفة سبق الإلكترونية. ${specializationText}يساهم في تغطية الأحداث المحلية والعالمية.`;
}

function getAuthorAvatar(authorId: string, authorName: string): string {
  // توليد صورة رمزية بناءً على الاسم
  const colors = ['3B82F6', '8B5CF6', '10B981', 'EF4444', 'F59E0B', 'EC4899'];
  const colorIndex = authorName.charCodeAt(0) % colors.length;
  const initial = authorName.charAt(0);
  
  // استخدام صور حقيقية إن وجدت
  const avatars: { [key: string]: string } = {
    'ali-abdah': `https://ui-avatars.com/api/?name=${encodeURIComponent('علي عبده')}&background=${colors[colorIndex]}&color=fff&size=200&font-size=0.5&bold=true`,
    'team': `https://ui-avatars.com/api/?name=FT&background=3B82F6&color=fff&size=200&font-size=0.5&bold=true`,
    'editorial-team': `https://ui-avatars.com/api/?name=ET&background=8B5CF6&color=fff&size=200&font-size=0.5&bold=true`
  };
  
  return avatars[authorId] || `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${colors[colorIndex]}&color=fff&size=200&font-size=0.5&bold=true`;
}

function getAuthorSpecializations(articles: any[]): string[] {
  // استخراج التخصصات من فئات المقالات
  const categoryCount: { [key: string]: number } = {};
  
  articles.forEach(article => {
    const category = article.category_name || article.category?.name_ar;
    if (category) {
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
  });
  
  // ترتيب التخصصات حسب عدد المقالات
  return Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .map(([category]) => category)
    .slice(0, 5);
}

function getJoinDate(articles: any[]): string {
  // الحصول على تاريخ أقدم مقال
  if (articles.length === 0) {
    return '2020-01-15';
  }
  
  const dates = articles
    .map(article => new Date(article.published_at || article.created_at))
    .filter(date => !isNaN(date.getTime()));
  
  if (dates.length === 0) {
    return '2020-01-15';
  }
  
  const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  return oldestDate.toISOString().split('T')[0];
}

function getAuthorAwards(authorId: string, articlesCount: number, viewsCount: number): string[] {
  const awards: string[] = [];
  
  // جوائز بناءً على الإحصائيات
  if (viewsCount > 1000000) {
    awards.push('كاتب المليون مشاهدة');
  }
  
  if (articlesCount > 100) {
    awards.push('كاتب متميز - أكثر من 100 مقال');
  } else if (articlesCount > 50) {
    awards.push('كاتب نشط - أكثر من 50 مقال');
  }
  
  // جوائز خاصة لبعض المؤلفين
  const specialAwards: { [key: string]: string[] } = {
    'ali-abdah': [
      'جائزة التميز الصحفي 2023',
      'أفضل تحقيق صحفي 2022'
    ],
    'team': [
      'جائزة أفضل فريق تحريري 2023'
    ]
  };
  
  if (specialAwards[authorId]) {
    awards.push(...specialAwards[authorId]);
  }
  
  return awards.slice(0, 5);
}

function getAuthorSocial(authorId: string, authorName: string): any {
  // توليد معرفات وسائل التواصل بناءً على الاسم
  const username = authorName.toLowerCase().replace(/\s+/g, '');
  
  const social: { [key: string]: any } = {
    'ali-abdah': {
      twitter: 'https://twitter.com/aliabdah',
      email: 'ali.abdah@sabq.org'
    },
    'team': {
      twitter: 'https://twitter.com/sabqorg',
      email: 'team@sabq.org'
    },
    'editorial-team': {
      twitter: 'https://twitter.com/sabqorg',
      linkedin: 'https://linkedin.com/company/sabq',
      email: 'editorial@sabq.org'
    }
  };
  
  return social[authorId] || {
    twitter: `https://twitter.com/${username}`,
    email: `${username}@sabq.org`
  };
} 