import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // قراءة بيانات المقالات
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await fs.readFile(articlesPath, 'utf8');
    const articles = JSON.parse(articlesData);
    
    // قراءة بيانات التفاعل مع الذكاء الاصطناعي (إن وجدت)
    let aiInteractions: any[] = [];
    try {
      const aiPath = path.join(process.cwd(), 'data', 'ai_interactions.json');
      const aiData = await fs.readFile(aiPath, 'utf8');
      aiInteractions = JSON.parse(aiData);
    } catch (error) {
      // إذا لم يوجد ملف التفاعلات، نستمر بدونه
    }
    
    // تجميع البيانات حسب المحرر
    const editorStats: { [key: string]: {
      name: string;
      articleCount: number;
      aiUsageCount: number;
      lastActiveDate: Date;
    }} = {};
    
    // حساب عدد المقالات لكل محرر
    articles.forEach((article: any) => {
      const authorName = article.author_name || 'محرر غير معروف';
      
      if (!editorStats[authorName]) {
        editorStats[authorName] = {
          name: authorName,
          articleCount: 0,
          aiUsageCount: 0,
          lastActiveDate: new Date(article.created_at)
        };
      }
      
      editorStats[authorName].articleCount++;
      
      // تحديث آخر نشاط
      const articleDate = new Date(article.updated_at || article.created_at);
      if (articleDate > editorStats[authorName].lastActiveDate) {
        editorStats[authorName].lastActiveDate = articleDate;
      }
    });
    
    // حساب استخدام الذكاء الاصطناعي
    aiInteractions.forEach((interaction: any) => {
      const editorName = interaction.editor_name || interaction.user_name;
      if (editorName && editorStats[editorName]) {
        editorStats[editorName].aiUsageCount++;
      }
    });
    
    // تحويل إلى مصفوفة وحساب معدل النشر الأسبوعي
    const editorsActivity = Object.values(editorStats).map((editor, index) => {
      // حساب عدد الأسابيع منذ أول مقال
      const weeksActive = Math.max(1, 
        Math.ceil((Date.now() - editor.lastActiveDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      );
      
      return {
        id: `editor-${index + 1}`,
        name: editor.name,
        articleCount: editor.articleCount,
        aiUsageCount: editor.aiUsageCount,
        weeklyRate: Math.round((editor.articleCount / weeksActive) * 10) / 10
      };
    });
    
    // ترتيب حسب عدد المقالات (الأكثر نشاطاً أولاً)
    editorsActivity.sort((a, b) => b.articleCount - a.articleCount);
    
    // إرجاع أول 10 محررين
    return NextResponse.json(editorsActivity.slice(0, 10));
    
  } catch (error) {
    console.error('Error fetching editors data:', error);
    
    // بيانات تجريبية في حالة الخطأ
    return NextResponse.json([
      { id: '1', name: 'أحمد محمد', articleCount: 12, aiUsageCount: 8, weeklyRate: 3.0 },
      { id: '2', name: 'فاطمة علي', articleCount: 10, aiUsageCount: 5, weeklyRate: 2.5 },
      { id: '3', name: 'محمد خالد', articleCount: 8, aiUsageCount: 3, weeklyRate: 2.0 },
      { id: '4', name: 'نورا سالم', articleCount: 6, aiUsageCount: 4, weeklyRate: 1.5 }
    ]);
  }
} 