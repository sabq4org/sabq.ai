import { NextRequest, NextResponse } from 'next/server';
import { generateDeepAnalysis, initializeOpenAI } from '@/lib/services/deepAnalysisService';
import { GenerateAnalysisRequest } from '@/types/deep-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // محاولة الحصول على API key من عدة مصادر
    let apiKey = process.env.OPENAI_API_KEY;
    
    // طباعة معلومات تشخيصية (احذفها بعد حل المشكلة)
    console.log('Environment API Key exists:', !!apiKey);
    console.log('Environment API Key length:', apiKey?.length);
    console.log('API Key starts with:', apiKey?.substring(0, 10));
    
    // إذا كان المفتاح في البيئة موجود لكنه مختصر، ونملك مفتاحاً كاملاً في جسم الطلب، فسنستبدله
    if (apiKey && apiKey.length < 20 && body.openaiKey && body.openaiKey.length >= 20) {
      console.log('Overriding short env key with full key from request body');
      apiKey = body.openaiKey;
    }
    
    // إذا لم يكن موجوداً في البيئة، نحاول من الإعدادات المحفوظة
    if (!apiKey && body.openaiKey) {
      apiKey = body.openaiKey;
      console.log('Using API Key from request body');
    }
    
    // إذا لم يكن موجوداً، نحاول من localStorage (يُرسل من الواجهة)
    if (!apiKey && body.settings?.openaiKey) {
      apiKey = body.settings.openaiKey;
      console.log('Using API Key from settings');
    }
    
    // التحقق من وجود API key
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'مفتاح OpenAI API غير موجود. يرجى إضافته من إعدادات الذكاء الاصطناعي.',
          debug: {
            envExists: !!process.env.OPENAI_API_KEY,
            bodyKeyExists: !!body.openaiKey,
            settingsKeyExists: !!body.settings?.openaiKey
          }
        },
        { status: 401 }
      );
    }
    
    // التحقق من أن المفتاح كامل وليس مختصراً
    if (apiKey === 'sk-...' || apiKey.length < 20) {
      return NextResponse.json(
        { 
          error: 'مفتاح OpenAI API غير كامل. يرجى نسخ المفتاح الكامل من https://platform.openai.com/api-keys',
          debug: {
            keyLength: apiKey.length,
            keyPreview: apiKey.substring(0, 10) + '...'
          }
        },
        { status: 401 }
      );
    }
    
    // تهيئة OpenAI
    initializeOpenAI(apiKey);
    
    // تحضير طلب التوليد
    const generateRequest: GenerateAnalysisRequest = {
      sourceType: body.creationType === 'from_article' ? 'article' : 
                  body.creationType === 'external_link' ? 'external' : 'topic',
      topic: body.title,
      category: body.categories?.[0],
      customPrompt: body.prompt,
      language: 'ar',
      tone: 'professional',
      length: 'long',
      externalUrl: body.externalLink,
      sourceId: body.articleUrl
    };

    // توليد التحليل
    const result = await generateDeepAnalysis(generateRequest);

    if (result.success && result.analysis) {
      // تحويل محتوى JSON إلى HTML منسق لمحرر Tiptap
      const formattedContent = formatAnalysisContent(result.analysis.content);
      
      // تسجيل معلومات التشخيص
      console.log('Analysis quality score:', result.analysis.qualityScore);
      console.log('Analysis content sections:', result.analysis.content?.sections?.length);
      
      return NextResponse.json({
        title: result.analysis.title,
        summary: result.analysis.summary,
        content: formattedContent, // إرسال النص المنسق مباشرة
        rawContent: result.analysis.content, // الاحتفاظ بالمحتوى الخام إذا احتجناه
        tags: extractTagsFromContent(result.analysis.content),
        categories: body.categories || [body.category].filter(Boolean),
        qualityScore: Math.round(result.analysis.qualityScore || 0),
        readingTime: result.analysis.estimatedReadingTime
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'فشل في توليد التحليل' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error generating analysis:', error);
    
    // معالجة أخطاء OpenAI المحددة
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'مفتاح OpenAI API غير صحيح. يرجى التحقق من المفتاح في الإعدادات.' },
          { status: 401 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'تم تجاوز حد الاستخدام. يرجى المحاولة لاحقاً.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// دالة تحويل محتوى JSON إلى HTML منسق لمحرر Tiptap
function formatAnalysisContent(content: any): string {
  if (!content || typeof content !== 'object') {
    return typeof content === 'string' ? content : '';
  }

  const parts: string[] = [];

  // الفهرس
  if (Array.isArray(content.tableOfContents) && content.tableOfContents.length) {
    parts.push('<h2>الفهرس</h2>');
    parts.push('<ul>');
    content.tableOfContents.forEach((item: any) => {
      // التحقق من نوع العنصر وتحويله إلى نص
      const title = typeof item === 'string' ? item : 
                   (item.title || item.name || item.text || 'قسم');
      parts.push(`<li>${title}</li>`);
    });
    parts.push('</ul>');
  }

  // الأقسام الرئيسية
  if (Array.isArray(content.sections)) {
    content.sections.forEach((section: any) => {
      if (section.title) {
        parts.push(`<h2>${section.title}</h2>`);
      }
      if (section.content) {
        // تقسيم المحتوى إلى فقرات
        const paragraphs = section.content.split('\n\n').filter((p: string) => p.trim());
        paragraphs.forEach((paragraph: string) => {
          // التحقق من القوائم
          if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('• ')) {
            const items = paragraph.split('\n').filter((item: string) => item.trim());
            parts.push('<ul>');
            items.forEach((item: string) => {
              const cleanItem = item.replace(/^[-•]\s*/, '');
              parts.push(`<li>${cleanItem}</li>`);
            });
            parts.push('</ul>');
          } else if (paragraph.trim().match(/^\d+\.\s/)) {
            // قوائم مرقمة
            const items = paragraph.split('\n').filter((item: string) => item.trim());
            parts.push('<ol>');
            items.forEach((item: string) => {
              const cleanItem = item.replace(/^\d+\.\s*/, '');
              parts.push(`<li>${cleanItem}</li>`);
            });
            parts.push('</ol>');
          } else {
            // فقرة عادية
            parts.push(`<p>${paragraph}</p>`);
          }
        });
      }
      
      // نقاط فرعية إن وجدت
      if (Array.isArray(section.points)) {
        parts.push('<ul>');
        section.points.forEach((point: string) => {
          parts.push(`<li>${point}</li>`);
        });
        parts.push('</ul>');
      }
    });
  }

  // الرؤى الرئيسية
  if (Array.isArray(content.keyInsights) && content.keyInsights.length) {
    parts.push('<h2>أبرز الرؤى</h2>');
    parts.push('<ul>');
    content.keyInsights.forEach((insight: string) => {
      parts.push(`<li>${insight}</li>`);
    });
    parts.push('</ul>');
  }

  // التوصيات
  if (Array.isArray(content.recommendations) && content.recommendations.length) {
    parts.push('<h2>التوصيات</h2>');
    parts.push('<ul>');
    content.recommendations.forEach((rec: string) => {
      parts.push(`<li>${rec}</li>`);
    });
    parts.push('</ul>');
  }

  // نقاط البيانات
  if (Array.isArray(content.dataPoints) && content.dataPoints.length) {
    parts.push('<h2>نقاط البيانات</h2>');
    parts.push('<ul>');
    content.dataPoints.forEach((dp: any) => {
      if (dp.label && dp.value) {
        parts.push(`<li><strong>${dp.label}:</strong> ${dp.value}</li>`);
      } else if (typeof dp === 'string') {
        parts.push(`<li>${dp}</li>`);
      }
    });
    parts.push('</ul>');
  }

  // الخاتمة إن وجدت
  if (content.conclusion) {
    parts.push('<h2>الخاتمة</h2>');
    const conclusionParagraphs = content.conclusion.split('\n\n').filter((p: string) => p.trim());
    conclusionParagraphs.forEach((paragraph: string) => {
      parts.push(`<p>${paragraph}</p>`);
    });
  }

  return parts.join('\n');
}

// استخراج الوسوم من المحتوى
function extractTagsFromContent(content: any): string[] {
  const tags: string[] = [];
  
  // استخراج الكلمات المفتاحية من الأقسام
  if (content.sections) {
    content.sections.forEach((section: any) => {
      // استخراج كلمات مهمة من العناوين
      const titleWords = section.title.split(' ')
        .filter((word: string) => word.length > 3)
        .slice(0, 2);
      tags.push(...titleWords);
    });
  }
  
  // استخراج من التوصيات
  if (content.recommendations) {
    tags.push(...content.recommendations
      .map((rec: string) => rec.split(' ')[0])
      .filter((word: string) => word.length > 3)
      .slice(0, 3)
    );
  }
  
  // إزالة التكرارات
  return [...new Set(tags)].slice(0, 10);
} 