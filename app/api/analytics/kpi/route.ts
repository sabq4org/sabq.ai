import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // قراءة بيانات المقالات
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await fs.readFile(articlesPath, 'utf8');
    const articles = JSON.parse(articlesData);
    
    // حساب الإحصائيات
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // المقالات المنشورة هذا الأسبوع
    const publishedThisWeek = articles.filter((article: any) => {
      const publishDate = new Date(article.published_at || article.created_at);
      return article.status === 'published' && publishDate >= oneWeekAgo;
    }).length;
    
    // المسودات الحالية
    const currentDrafts = articles.filter((article: any) => article.status === 'draft').length;
    
    // أكثر تصنيف نشاطاً
    const categoryCount: { [key: string]: number } = {};
    articles.forEach((article: any) => {
      if (article.category_id) {
        categoryCount[article.category_id] = (categoryCount[article.category_id] || 0) + 1;
      }
    });
    
    const mostActiveCategoryId = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    const categories: { [key: string]: string } = {
      '1': 'محليات',
      '2': 'تقنية',
      '3': 'اقتصاد',
      '4': 'رياضة',
      '5': 'سياسة',
      '6': 'ترفيه',
      '7': 'صحة',
      '8': 'تعليم',
      '9': 'ثقافة',
      '10': 'دولي'
    };
    
    const mostActiveCategory = {
      name: categories[mostActiveCategoryId] || 'غير محدد',
      count: categoryCount[mostActiveCategoryId] || 0
    };
    
    // أكثر محرر نشاطاً
    const authorCount: { [key: string]: number } = {};
    articles.forEach((article: any) => {
      if (article.author_name) {
        authorCount[article.author_name] = (authorCount[article.author_name] || 0) + 1;
      }
    });
    
    const mostActiveEditorName = Object.entries(authorCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    const mostActiveEditor = {
      name: mostActiveEditorName || 'غير محدد',
      count: authorCount[mostActiveEditorName] || 0
    };
    
    // معدل النشر اليومي (آخر 30 يوم)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const publishedLastMonth = articles.filter((article: any) => {
      const publishDate = new Date(article.published_at || article.created_at);
      return article.status === 'published' && publishDate >= thirtyDaysAgo;
    }).length;
    
    const dailyPublishingRate = publishedLastMonth / 30;
    
    // معدل التعديل قبل النشر (نسبة المقالات التي تم تعديلها)
    const editedArticles = articles.filter((article: any) => 
      article.updated_at && article.updated_at !== article.created_at
    ).length;
    
    const editRateBeforePublish = (editedArticles / articles.length) * 100;
    
    return NextResponse.json({
      publishedThisWeek,
      currentDrafts,
      mostActiveCategory,
      mostActiveEditor,
      dailyPublishingRate: Math.round(dailyPublishingRate * 10) / 10,
      editRateBeforePublish: Math.round(editRateBeforePublish)
    });
    
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
} 