import { NextRequest, NextResponse } from 'next/server';
import { handleOptions, corsResponse } from '@/lib/cors';
import OpenAI from 'openai';

// محاولة استيراد prisma مع fallback
let prisma: any;
try {
  const prismaModule = require('@/lib/prisma');
  prisma = prismaModule.prisma || prismaModule.default;
} catch (error) {
  console.warn('Prisma not available, using fallback mode');
  prisma = null;
}

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return handleOptions();
}

export const runtime = 'nodejs';

// تحديد الفترة الزمنية الحالية
function getCurrentPeriod(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 19) return 'evening';
  return 'night';
}

// الحصول على العبارات حسب الفترة
function getPeriodPhrases(period: string) {
  const phrases = {
    morning: [
      { title: 'ابدأ صباحك بالمفيد والمُلهم', subtitle: 'أهم ما تحتاجه اليوم… في دقائق تختصر لك كل شيء' },
      { title: 'أخبارك قبل القهوة', subtitle: 'قراءة سريعة تُهيّئك ليوم أكثر وعيًا وفهمًا' },
      { title: 'موجز الصباح الذكي', subtitle: 'كل جديد… بصيغة مختصرة ووافية من سبق' }
    ],
    afternoon: [
      { title: 'وقتك مهم… هذه خلاصة الظهيرة', subtitle: 'آخر المستجدات والتحليلات التي تهمك الآن' },
      { title: 'منتصف اليوم… جرعة مركزة', subtitle: 'لا تفوت تطورات السياسة والاقتصاد والرياضة' },
      { title: 'نظرة وسط اليوم', subtitle: 'أخبار مختارة بدقة… لتبقى في الصورة' }
    ],
    evening: [
      { title: 'مساؤك يبدأ بالوعي', subtitle: 'تقارير وتحليلات قبل ازدحام الأحداث المسائية' },
      { title: 'موجز المساء الأهم', subtitle: 'أكثر 3 أحداث أثارت التفاعل اليوم… باختصار' },
      { title: 'جرعة ما قبل الزحام', subtitle: 'خُلاصة ذكية لما جرى… قبل المساء الطويل' }
    ],
    night: [
      { title: 'ختام يومك… باختصار تستحقه', subtitle: 'ملخص تحليلي وأبرز ما دار اليوم من سبق' },
      { title: 'قبل أن تنام… اطلع على الأهم', subtitle: 'خلاصة اليوم في 3 بطاقات منتقاة بعناية' },
      { title: 'تلخيص اليوم كما يجب أن يكون', subtitle: 'تحليلات، صوتيات، ونقاط ذكية تهمك الآن' }
    ]
  };

  const periodPhrases = phrases[period as keyof typeof phrases] || phrases.morning;
  return periodPhrases[Math.floor(Math.random() * periodPhrases.length)];
}

// دالة لتحليل المحتوى بالذكاء الاصطناعي
async function analyzeContentWithAI(articles: any[], period: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not found, using fallback');
      return null;
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `أنت محرر ذكي في صحيفة سبق. لديك قائمة بالأخبار المنشورة في فترة ${period === 'morning' ? 'الصباح' : period === 'afternoon' ? 'الظهيرة' : period === 'evening' ? 'المساء' : 'الليل'}.

المقالات:
${articles.map((a, i) => `${i + 1}. ${a.title} - ${a.category?.name || 'عام'}`).join('\n')}

المطلوب:
1. اختر أهم 3 مقالات مناسبة لهذه الفترة
2. لكل مقال، اكتب ملخص جذاب (2-3 جمل)
3. حدد نوع المحتوى المناسب (article, analysis, weather, tip)

قدم الإجابة بصيغة JSON:
{
  "selections": [
    {
      "articleIndex": 0,
      "summary": "ملخص جذاب",
      "contentType": "article"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'أنت محرر صحفي محترف في صحيفة سبق' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const result = completion.choices[0].message.content;
    return JSON.parse(result || '{}');
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}

// GET - جلب الجرعات
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const period = searchParams.get('period') || getCurrentPeriod();
  
  try {
    // التحقق من وجود prisma
    if (!prisma || !prisma.daily_doses) {
      console.warn('Prisma not initialized, returning mock data');
      throw new Error('Database not available');
    }
    
    // محاولة جلب الجرعة الموجودة
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    const existingDose = await prisma.daily_doses.findFirst({
      where: {
        date: dateObj,
        period: period as any
      }
    });

    if (existingDose && existingDose.status === 'published') {
      // تحديث عدد المشاهدات
      await prisma.daily_doses.update({
        where: { id: existingDose.id },
        data: { views: { increment: 1 } }
      });

      // جلب المحتويات
      const contents = await prisma.dose_contents.findMany({
        where: { doseId: existingDose.id },
        orderBy: { displayOrder: 'asc' }
      });

      // إذا كان هناك articleId، جلب تفاصيل المقال
      const enrichedContents = await Promise.all(
        contents.map(async (content: any) => {
          if (content.articleId) {
            const article = await prisma.article.findUnique({
              where: { id: content.articleId },
              select: {
                id: true,
                slug: true,
                category: {
                  select: {
                    name: true,
                    slug: true
                  }
                },
                author: {
                  select: {
                    name: true
                  }
                }
              }
            });
            return {
              ...content,
              article: article ? {
                id: article.id,
                slug: article.slug,
                category: article.category,
                author: article.author
              } : undefined
            };
          }
          return content;
        })
      );

      return corsResponse({
        ...existingDose,
        contents: enrichedContents
      });
    }

    // إذا لم توجد جرعة، إنشاء واحدة جديدة بسرعة
    const phrases = getPeriodPhrases(period);
    
    // جلب المقالات بسرعة - تقليل عدد المقالات وتحسين الاستعلام
    const hoursAgo = period === 'morning' ? 24 : period === 'afternoon' ? 6 : period === 'evening' ? 4 : 8;
    const since = new Date();
    since.setHours(since.getHours() - hoursAgo);

    const articles = await prisma.article.findMany({
      where: {
        status: 'published',
        publishedAt: {
          gte: since
        }
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        views: true,
        publishedAt: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { views: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: 5 // تقليل عدد المقالات
    });

    // إنشاء محتوى الجرعة بسرعة بدون تحليل الذكاء الاصطناعي
    const contents = [];
    
    // استخدام المقالات المتاحة
    const selectedArticles = articles.slice(0, 3);
    for (const [index, article] of selectedArticles.entries()) {
      contents.push({
        articleId: article.id,
        contentType: 'article',
        title: article.title,
        summary: article.excerpt || '',
        imageUrl: article.featuredImage,
        displayOrder: index
      });
    }

    // إضافة محتوى إضافي حسب الفترة
    if (period === 'morning') {
      contents.push({
        contentType: 'tip',
        title: 'نصيحة اليوم',
        summary: 'ابدأ يومك بكوب من الماء وخمس دقائق من التأمل لتحسين تركيزك وإنتاجيتك',
        displayOrder: contents.length
      });
    } else if (period === 'evening') {
      contents.push({
        contentType: 'quote',
        title: 'حكمة المساء',
        summary: 'النجاح ليس نهائياً، والفشل ليس قاتلاً، الشجاعة للاستمرار هي ما يهم - ونستون تشرشل',
        displayOrder: contents.length
      });
    }

    // إنشاء الجرعة الجديدة
    const doseId = require('crypto').randomUUID();
    const newDose = await prisma.daily_doses.create({
      data: {
        id: doseId,
        period: period as any,
        title: phrases.title,
        subtitle: phrases.subtitle,
        date: new Date(date),
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // إنشاء المحتويات
    const createdContents = await Promise.all(
      contents.map(content => 
        prisma.dose_contents.create({
          data: {
            id: require('crypto').randomUUID(),
            doseId: doseId,
            contentType: content.contentType as any,
            title: content.title,
            summary: content.summary,
            imageUrl: content.imageUrl || null,
            audioUrl: (content as any).audioUrl || null,
            articleId: content.articleId || null,
            displayOrder: content.displayOrder
          }
        })
      )
    );

    // إرجاع الجرعة مع المحتويات
    return corsResponse({
      ...newDose,
      contents: createdContents
    });
    
  } catch (error) {
    console.error('Error fetching daily dose:', error);
    
    // إرجاع بيانات وهمية في حالة الخطأ
    const phrases = getPeriodPhrases(period);
    const mockDose = {
      id: 'mock-dose',
      period,
      title: phrases.title,
      subtitle: phrases.subtitle,
      date: new Date(date),
      status: 'published',
      views: 0,
      contents: [
        {
          id: '1',
          contentType: 'article',
          title: 'خبر عاجل: تطورات مهمة في المنطقة',
          summary: 'شهدت المنطقة تطورات مهمة اليوم تتطلب متابعة دقيقة',
          imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
          displayOrder: 0
        },
        {
          id: '2',
          contentType: 'analysis',
          title: 'تحليل: الاقتصاد المحلي في 2024',
          summary: 'نظرة تحليلية على أداء الاقتصاد المحلي والتوقعات المستقبلية',
          imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
          displayOrder: 1
        },
        {
          id: '3',
          contentType: period === 'morning' ? 'weather' : 'tip',
          title: period === 'morning' ? 'حالة الطقس اليوم' : 'نصيحة مسائية',
          summary: period === 'morning' ? 'طقس معتدل مع فرصة لهطول أمطار خفيفة' : 'خذ قسطاً من الراحة واستعد ليوم جديد',
          displayOrder: 2
        }
      ],
      mock: true
    };
    
    return corsResponse(mockDose);
  }
}

// POST - إنشاء جرعة جديدة يدوياً
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period, title, subtitle, date, contents } = body;

    // التحقق من وجود جرعة موجودة
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    const existingDose = await prisma.daily_doses.findFirst({
      where: {
        date: dateObj,
        period: period as any
      }
    });

    if (existingDose) {
      console.log(`🔍 وجدت جرعة موجودة: ${existingDose.id} للفترة ${period}`);
      
      try {
        // حذف المحتويات أولاً
        const deletedContents = await prisma.dose_contents.deleteMany({
          where: { doseId: existingDose.id }
        });
        console.log(`🗑️ تم حذف ${deletedContents.count} محتوى`);
        
        // ثم حذف الجرعة
        await prisma.daily_doses.delete({
          where: { id: existingDose.id }
        });
        console.log(`🗑️ تم حذف الجرعة: ${existingDose.id}`);
        
      } catch (deleteError) {
        console.error('❌ خطأ في حذف الجرعة الموجودة:', deleteError);
        return NextResponse.json(
          { error: 'فشل في حذف الجرعة الموجودة' },
          { status: 500 }
        );
      }
    }

    const doseId = require('crypto').randomUUID();
    const newDose = await prisma.daily_doses.create({
      data: {
        id: doseId,
        period,
        title,
        subtitle,
        date: new Date(date),
        status: 'draft',
        updatedAt: new Date()
      }
    });

    // إنشاء المحتويات منفصلة
    const createdContents = await Promise.all(
      contents.map((content: any, index: number) => 
        prisma.dose_contents.create({
          data: {
            id: require('crypto').randomUUID(),
            doseId: doseId,
            contentType: content.contentType,
            title: content.title,
            summary: content.summary,
            imageUrl: content.imageUrl || null,
            audioUrl: content.audioUrl || null,
            articleId: content.articleId || null,
            displayOrder: content.displayOrder || index
          }
        })
      )
    );

    return corsResponse({
      ...newDose,
      contents: createdContents
    });
  } catch (error) {
    console.error('Error creating dose:', error);
    return NextResponse.json(
      { error: 'Failed to create dose' },
      { status: 500 }
    );
  }
} 