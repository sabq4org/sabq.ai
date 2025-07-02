import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'articles.json');

// قراءة المقالات من الملف
async function loadArticles(): Promise<any[]> {
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
async function saveArticles(articles: any[]): Promise<void> {
  try {
    const dataToSave = { articles };
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (error) {
    console.error('خطأ في حفظ المقالات:', error);
    throw new Error('فشل في حفظ المقالات');
  }
}

// GET: التحقق من المقالات المجدولة ونشرها
export async function GET(request: NextRequest) {
  try {
    const articles = await loadArticles();
    const now = new Date();
    let publishedCount = 0;
    
    // البحث عن المقالات المجدولة التي حان وقت نشرها
    const updatedArticles = articles.map(article => {
      if (article.status === 'scheduled' && article.publish_at) {
        const publishDate = new Date(article.publish_at);
        
        if (publishDate <= now) {
          // نشر المقال
          publishedCount++;
          return {
            ...article,
            status: 'published',
            published_at: publishDate.toISOString(),
            updated_at: now.toISOString()
          };
        }
      }
      
      return article;
    });
    
    // حفظ التحديثات إذا كان هناك مقالات تم نشرها
    if (publishedCount > 0) {
      await saveArticles(updatedArticles);
    }
    
    return NextResponse.json({
      success: true,
      message: `تم نشر ${publishedCount} مقال مجدول`,
      publishedCount,
      timestamp: now.toISOString()
    });
    
  } catch (error) {
    console.error('خطأ في التحقق من المقالات المجدولة:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في التحقق من المقالات المجدولة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// POST: جدولة التحقق الدوري (يمكن استدعاؤها من cron job)
export async function POST(request: NextRequest) {
  return GET(request);
} 