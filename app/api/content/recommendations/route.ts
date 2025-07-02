import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category_id: number;
  image_url: string;
  author: string;
  status: string;
  is_deleted?: boolean;
  created_at: string;
  views_count?: number;
  likes_count?: number;
  shares_count?: number;
  ai_tags?: string[];
}

interface UserPreference {
  user_id: string;
  preferences: {
    categories: { [key: string]: number };
    topics: string[];
    reading_time: string;
    notification_settings: any;
  };
  preferred_categories?: number[];
  preferred_topics?: string[];
  category_id?: number;
  last_updated: string;
}

interface Category {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  color_hex?: string;
}

// دوال تحميل البيانات المحلية
async function loadCategoriesData(): Promise<Category[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'categories.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.categories || [];
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

async function loadArticlesData(): Promise<Article[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'articles.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.articles || [];
  } catch (error) {
    console.error('Error loading articles:', error);
    return [];
  }
}

async function loadUserPreferencesData(): Promise<UserPreference[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'user_preferences.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.preferences || [];
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return [];
  }
}

// حساب مدى ملاءمة المقال لتفضيلات المستخدم
function calculateRelevanceScore(article: Article, userPref: UserPreference): number {
  let score = 0;
  
  // نقاط بناءً على التصنيف المفضل
  const categoryWeight = userPref.preferences.categories[article.category_id?.toString()] || 0;
  score += categoryWeight * 10;
  
  // نقاط بناءً على التاقات AI والمواضيع المفضلة
  if (article.ai_tags && userPref.preferences.topics) {
    const matchingTopics = article.ai_tags.filter(tag => 
      userPref.preferences.topics.some(topic => 
        tag.toLowerCase().includes(topic.toLowerCase()) || 
        topic.toLowerCase().includes(tag.toLowerCase())
      )
    );
    score += matchingTopics.length * 5;
  }
  
  // نقاط إضافية للمقالات الأحدث
  const articleDate = new Date(article.created_at);
  const daysSincePublished = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublished < 7) {
    score += 10 - Math.floor(daysSincePublished);
  }
  
  // نقاط بناءً على التفاعل
  score += (article.views_count || 0) * 0.001;
  score += (article.likes_count || 0) * 0.01;
  score += (article.shares_count || 0) * 0.02;
  
  return score;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const currentArticleId = searchParams.get('current_article_id');
    const limit = parseInt(searchParams.get('limit') || '4');

    if (!userId || userId === 'anonymous') {
      return NextResponse.json({
        success: false,
        message: 'يجب تسجيل الدخول للحصول على توصيات مخصصة'
      }, { status: 401 });
    }

    // جلب المقالات والتفضيلات والتصنيفات
    const articles = await loadArticlesData();
    const preferences = await loadUserPreferencesData();
    const categories = await loadCategoriesData();

    // البحث عن تفضيلات المستخدم
    const userPref = preferences.find((p: any) => p.user_id === userId);
    
    // جمع التصنيفات المفضلة للمستخدم من البنية الجديدة
    const userCategoryPrefs = preferences
      .filter((p: any) => p.user_id === userId && p.category_id)
      .map((p: any) => p.category_id);
    
    // إذا لم توجد تفضيلات بالبنية القديمة، ولا توجد تفضيلات بالبنية الجديدة
    if (!userPref && userCategoryPrefs.length === 0) {
      const randomArticles = articles
        .filter((a: any) => a.id !== currentArticleId && !a.is_deleted && a.status === 'published')
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);

      return NextResponse.json({
        success: true,
        data: {
          recommendations: randomArticles.map((article: any) => ({
            ...article,
            recommendation_reason: 'محتوى متنوع',
            recommendation_score: Math.random() * 5
          }))
        }
      });
    }

    // حساب نقاط التوصية لكل مقال
    const scoredArticles = articles
      .filter((article: any) => 
        article.id !== currentArticleId && 
        !article.is_deleted && 
        article.status === 'published'
      )
      .map((article: any) => {
        let score = 0;
        let reasons = [];

        // نقاط للتصنيفات المفضلة (البنية القديمة)
        if (userPref?.preferred_categories?.includes(article.category_id)) {
          score += 3;
          const category = categories.find((c: any) => c.id === article.category_id);
          reasons.push(`من اهتماماتك في ${category?.name_ar || 'هذا المجال'}`);
        }
        
        // نقاط للتصنيفات المفضلة (البنية الجديدة)
        if (userCategoryPrefs.includes(article.category_id)) {
          score += 3;
          const category = categories.find((c: any) => c.id === article.category_id);
          reasons.push(`من اهتماماتك في ${category?.name_ar || 'هذا المجال'}`);
        }

        // نقاط للمواضيع المفضلة
        if (userPref?.preferred_topics?.some((topic: string) => 
          article.title?.includes(topic) || 
          article.content?.includes(topic) ||
          article.seo_keywords?.includes(topic)
        )) {
          score += 2;
          reasons.push('يتناول مواضيع تهمك');
        }

        // نقاط للمقالات الحديثة
        const articleDate = new Date(article.created_at);
        const daysSincePublished = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublished < 3) {
          score += 1;
          reasons.push('محتوى جديد');
        }

        // نقاط للمقالات المميزة
        if (article.is_featured) {
          score += 1;
          reasons.push('محتوى مميز');
        }

        // نقاط للمقالات الشائعة
        if (article.views_count > 1000) {
          score += 0.5;
          reasons.push('محتوى شائع');
        }

        return {
          ...article,
          recommendation_score: score,
          recommendation_reason: reasons[0] || 'قد يعجبك'
        };
      })
      .filter((article: any) => article.recommendation_score > 0)
      .sort((a: any, b: any) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit);

    // إذا لم نجد مقالات كافية بناءً على التفضيلات، نضيف مقالات عشوائية
    if (scoredArticles.length < limit) {
      const remainingCount = limit - scoredArticles.length;
      const excludeIds = [...scoredArticles.map((a: any) => a.id), currentArticleId];
      
      const additionalArticles = articles
        .filter((a: any) => 
          !excludeIds.includes(a.id) && 
          !a.is_deleted && 
          a.status === 'published'
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, remainingCount)
        .map((article: any) => ({
          ...article,
          recommendation_score: 0.1,
          recommendation_reason: 'محتوى قد يثير اهتمامك'
        }));

      scoredArticles.push(...additionalArticles);
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations: scoredArticles,
        user_preferences: userPref?.preferred_categories || []
      }
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({
      success: false,
      message: 'حدث خطأ في جلب التوصيات'
    }, { status: 500 });
  }
}

// الحصول على سبب التوصية
function getRecommendationReason(article: Article, userPref: UserPreference): string {
  const categoryWeight = userPref.preferences.categories[article.category_id?.toString()] || 0;
  
  if (categoryWeight > 0.7) {
    return 'من تصنيفاتك المفضلة';
  }
  
  if (article.ai_tags && userPref.preferences.topics) {
    const hasMatchingTopic = article.ai_tags.some(tag => 
      userPref.preferences.topics.some(topic => 
        tag.toLowerCase().includes(topic.toLowerCase())
      )
    );
    if (hasMatchingTopic) {
      return 'يتناسب مع اهتماماتك';
    }
  }
  
  if ((article.views_count || 0) > 1000) {
    return 'الأكثر قراءة';
  }
  
  return 'مقترح لك';
} 