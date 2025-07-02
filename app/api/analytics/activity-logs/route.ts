import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // قراءة بيانات المقالات
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await fs.readFile(articlesPath, 'utf8');
    const articles = JSON.parse(articlesData);
    
    // إنشاء سجل النشاطات من بيانات المقالات
    const activityLogs: any[] = [];
    
    // إضافة نشاطات النشر والتعديل
    articles.forEach((article: any) => {
      // نشاط النشر
      if (article.status === 'published' && article.published_at) {
        activityLogs.push({
          id: `publish-${article.id}`,
          user: article.author_name || 'محرر غير معروف',
          action: 'نشر',
          type: 'article',
          articleTitle: article.title,
          timestamp: article.published_at
        });
      }
      
      // نشاط التعديل
      if (article.updated_at && article.updated_at !== article.created_at) {
        activityLogs.push({
          id: `edit-${article.id}`,
          user: article.editor_name || article.author_name || 'محرر غير معروف',
          action: 'تعديل',
          type: 'article',
          articleTitle: article.title,
          timestamp: article.updated_at
        });
      }
      
      // نشاط الحذف
      if (article.status === 'deleted') {
        activityLogs.push({
          id: `delete-${article.id}`,
          user: article.editor_name || article.author_name || 'محرر غير معروف',
          action: 'حذف',
          type: 'article',
          articleTitle: article.title,
          timestamp: article.deleted_at || article.updated_at || article.created_at
        });
      }
    });
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // إرجاع آخر 20 نشاط
    const recentLogs = activityLogs.slice(0, 20);
    
    // إذا لم نجد نشاطات، نرجع بيانات تجريبية
    if (recentLogs.length === 0) {
      return NextResponse.json([
        { 
          id: '1', 
          user: 'أحمد محمد', 
          action: 'نشر', 
          type: 'article', 
          articleTitle: 'الذكاء الاصطناعي يغير مستقبل التعليم', 
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: '2', 
          user: 'فاطمة علي', 
          action: 'تعديل', 
          type: 'article', 
          articleTitle: 'تحليل اقتصادي لسوق الأسهم', 
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: '3', 
          user: 'محمد خالد', 
          action: 'حذف', 
          type: 'article', 
          articleTitle: 'مسودة قديمة', 
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: '4', 
          user: 'نورا سالم', 
          action: 'نشر', 
          type: 'article', 
          articleTitle: 'نتائج مباراة الهلال والنصر', 
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: '5', 
          user: 'خالد أحمد', 
          action: 'تعديل', 
          type: 'article', 
          articleTitle: 'تطورات سوق العقار السعودي', 
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: '6', 
          user: 'سارة محمد', 
          action: 'نشر', 
          type: 'article', 
          articleTitle: 'افتتاح معرض الكتاب الدولي', 
          timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: '7', 
          user: 'عبدالله سعد', 
          action: 'مشاركة', 
          type: 'article', 
          articleTitle: 'رؤية 2030 تحقق إنجازات جديدة', 
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: '8', 
          user: 'منى عبدالرحمن', 
          action: 'تعديل', 
          type: 'article', 
          articleTitle: 'التحول الرقمي في القطاع الصحي', 
          timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString() 
        }
      ]);
    }
    
    return NextResponse.json(recentLogs);
    
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    
    // بيانات تجريبية في حالة الخطأ
    return NextResponse.json([
      { id: '1', user: 'أحمد محمد', action: 'نشر', type: 'article', articleTitle: 'الذكاء الاصطناعي يغير مستقبل التعليم', timestamp: '2024-01-16T10:30:00' },
      { id: '2', user: 'فاطمة علي', action: 'تعديل', type: 'article', articleTitle: 'تحليل اقتصادي لسوق الأسهم', timestamp: '2024-01-16T09:15:00' },
      { id: '3', user: 'محمد خالد', action: 'حذف', type: 'article', articleTitle: 'مسودة قديمة', timestamp: '2024-01-16T08:45:00' },
      { id: '4', user: 'نورا سالم', action: 'نشر', type: 'article', articleTitle: 'نتائج مباراة الهلال والنصر', timestamp: '2024-01-16T07:20:00' }
    ]);
  }
} 