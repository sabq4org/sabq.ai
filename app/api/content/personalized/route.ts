import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getPersonalizedContent } from '@/lib/user-interactions';

interface UserInteraction {
  user_id: string;
  article_id: string;
  interaction_type: string;
  category_id?: number;
  timestamp: string;
}

interface Article {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  category_id: number;
  author_id?: string;
  author_name?: string;
  featured_image?: string;
  views_count: number;
  status: string;
  published_at?: string;
  created_at: string;
  reading_time?: number;
  seo_keywords?: string;
  is_breaking?: boolean;
}

// دالة لتحميل المقالات
async function loadPersonalizedArticles() {
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

// دالة لتحميل التفاعلات
async function loadUserInteractions() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'user_article_interactions.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.interactions || [];
  } catch (error) {
    console.error('Error loading interactions:', error);
    return [];
  }
}

// دالة لتحميل تفضيلات المستخدم
async function loadUserPreferencesById(userId: string) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'user_preferences.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    const userPref = data.preferences?.find((p: any) => p.user_id === userId);
    return userPref || null;
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return null;
  }
}

// دالة لحساب نقاط الثقة للمقال بناءً على تفضيلات المستخدم
function calculateArticleScore(article: any, userPreferences: any, interactions: any[]) {
  let score = 0;
  
  // نقاط بناءً على التصنيف المفضل
  if (userPreferences?.preferred_categories?.includes(article.category_id)) {
    score += 10;
  }
  
  // نقاط بناءً على الكلمات المفتاحية
  const articleKeywords = article.seo_keywords || [];
  const preferredKeywords = userPreferences?.preferred_keywords || [];
  const matchingKeywords = articleKeywords.filter((k: string) => 
    preferredKeywords.some((pk: string) => k.includes(pk) || pk.includes(k))
  );
  score += matchingKeywords.length * 5;
  
  // نقاط بناءً على التفاعلات السابقة
  const articleInteractions = interactions.filter(i => i.article_id === article.id);
  score += articleInteractions.length * 2;
  
  // نقاط بناءً على الحداثة
  const articleDate = new Date(article.published_at || article.created_at);
  const daysSincePublished = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublished < 1) score += 8;
  else if (daysSincePublished < 3) score += 5;
  else if (daysSincePublished < 7) score += 2;
  
  // نقاط بناءً على الشعبية
  score += Math.min(article.views_count / 100, 10);
  
  return score;
}

// GET: الحصول على المحتوى المخصص للمستخدم
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    // الحصول على المحتوى المخصص
    const personalizedContent = await getPersonalizedContent(userId, limit);

    return NextResponse.json({
      success: true,
      data: {
        articles: personalizedContent,
        count: personalizedContent.length,
        personalization_active: personalizedContent.some(a => a.recommendation_reason)
      }
    });

  } catch (error) {
    console.error('Error getting personalized content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get personalized content' 
      },
      { status: 500 }
    );
  }
} 