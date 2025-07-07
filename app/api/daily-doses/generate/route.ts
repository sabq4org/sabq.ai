import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleOptions, corsResponse } from '@/lib/cors';
import OpenAI from 'openai';

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return handleOptions();
}

export const runtime = 'nodejs';

// الحصول على العبارات حسب الفترة
function getPeriodPhrases(period: string) {
  // تحويل noon إلى afternoon لمطابقة enum
  const normalizedPeriod = period === 'noon' ? 'afternoon' : period;
  
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

  const periodPhrases = phrases[normalizedPeriod as keyof typeof phrases] || phrases.morning;
  return periodPhrases[Math.floor(Math.random() * periodPhrases.length)];
}

// POST - توليد جرعة بالذكاء الاصطناعي
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { date, period } = body;

    if (!date || !period) {
      return NextResponse.json(
        { error: 'التاريخ والفترة مطلوبان' },
        { status: 400 }
      );
    }

    // تحويل noon إلى afternoon لمطابقة enum
    if (period === 'noon') {
      period = 'afternoon';
    }

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
      // حذف الجرعة الموجودة والمحتويات المرتبطة بها
      await prisma.dose_contents.deleteMany({
        where: { doseId: existingDose.id }
      });
      
      await prisma.daily_doses.delete({
        where: { id: existingDose.id }
      });
      
      console.log(`تم حذف الجرعة الموجودة للفترة ${period} وإنشاء واحدة جديدة`);
    }

    // جلب المقالات المناسبة
    const hoursAgo = period === 'morning' ? 24 : period === 'afternoon' ? 6 : period === 'evening' ? 4 : 8;
    const since = new Date();
    since.setHours(since.getHours() - hoursAgo);

    // محاولة جلب المقالات الحديثة أولاً
    let articles = await prisma.articles.findMany({
      where: {
        status: 'published',
        published_at: {
          gte: since
        }
      },
      // include: { category: true }, // معطل مؤقتاً
      orderBy: [
        { views: 'desc' },
        { published_at: 'desc' }
      ],
      take: 20
    });

    // إذا لم توجد مقالات حديثة، جلب أي مقالات منشورة
    if (articles.length === 0) {
      articles = await prisma.articles.findMany({
        where: {
          status: 'published'
        },
        // include: { category: true }, // معطل مؤقتاً
        orderBy: [
          { views: 'desc' },
          { published_at: 'desc' }
        ],
        take: 20
      });
    }

    if (articles.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد مقالات كافية لتوليد جرعة' },
        { status: 400 }
      );
    }

    // تحليل المحتوى بالذكاء الاصطناعي
    let aiAnalysis = null;
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const periodName = period === 'morning' ? 'الصباح' : period === 'afternoon' ? 'الظهيرة' : period === 'evening' ? 'المساء' : 'الليل';
        
        const prompt = `أنت محرر ذكي في صحيفة سبق. لديك قائمة بالأخبار المنشورة في فترة ${periodName}.

المقالات:
${articles.map((a: any, i: number) => `${i + 1}. ${a.title} - ${a.category?.name || 'عام'} - ${a.views} مشاهدة`).join('\n')}

المطلوب:
1. اختر أهم 3-4 مقالات مناسبة لفترة ${periodName}
2. لكل مقال، اكتب ملخص جذاب ومختصر (2-3 جمل)
3. حدد نوع المحتوى المناسب (article, analysis)
4. أضف محتوى إضافي مناسب للفترة (نصيحة، اقتباس، معلومة طقس)

معايير الاختيار حسب الفترة:
- الصباح: أخبار مهمة وتحليلية، نصيحة لبداية اليوم
- الظهيرة: أخبار سريعة ومتنوعة، معلومة مفيدة
- المساء: أخبار خفيفة وترفيهية، تحليل سريع
- الليل: ملخصات وتحليلات، اقتباس ملهم

قدم الإجابة بصيغة JSON:
{
  "selections": [
    {
      "articleIndex": 0,
      "summary": "ملخص جذاب للمقال",
      "contentType": "article"
    }
  ],
  "additionalContent": {
    "type": "tip",
    "title": "نصيحة اليوم",
    "content": "محتوى النصيحة"
  }
}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'أنت محرر صحفي محترف في صحيفة سبق، خبير في اختيار وتلخيص المحتوى' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        });

        const result = completion.choices[0].message.content;
        aiAnalysis = JSON.parse(result || '{}');
      } catch (error) {
        console.error('AI analysis error:', error);
      }
    }

    // إنشاء محتوى الجرعة
    const contents = [];
    
    if (aiAnalysis && aiAnalysis.selections) {
      // استخدام اختيارات الذكاء الاصطناعي
      for (const selection of aiAnalysis.selections) {
        const article = articles[selection.articleIndex];
        if (article) {
          contents.push({
            articleId: article.id,
            contentType: selection.contentType || 'article',
            title: article.title,
            summary: selection.summary || article.excerpt || '',
            imageUrl: article.featured_image,
            displayOrder: contents.length
          });
        }
      }

      // إضافة المحتوى الإضافي
      if (aiAnalysis.additionalContent) {
        contents.push({
          contentType: aiAnalysis.additionalContent.type,
          title: aiAnalysis.additionalContent.title,
          summary: aiAnalysis.additionalContent.content,
          displayOrder: contents.length
        });
      }
    } else {
      // الطريقة الافتراضية
      const selectedArticles = articles.slice(0, 3);
      for (const [index, article] of selectedArticles.entries()) {
        contents.push({
          articleId: article.id,
          contentType: 'article',
          title: article.title,
          summary: article.excerpt || '',
          imageUrl: article.featured_image,
          displayOrder: index
        });
      }

      // إضافة محتوى إضافي افتراضي
      if (period === 'morning') {
        contents.push({
          contentType: 'tip',
          title: 'نصيحة الصباح',
          summary: 'ابدأ يومك بكوب من الماء الدافئ مع الليمون لتنشيط الجسم وتحسين الهضم',
          displayOrder: contents.length
        });
      } else if (period === 'evening') {
        contents.push({
          contentType: 'quote',
          title: 'حكمة المساء',
          summary: 'النجاح هو القدرة على الانتقال من فشل إلى فشل دون فقدان الحماس - ونستون تشرشل',
          displayOrder: contents.length
        });
      }
    }

    // الحصول على العبارات المناسبة
    const phrases = getPeriodPhrases(period);

    // إنشاء الجرعة الجديدة
    const doseId = require('crypto').randomUUID();
    const newDose = await prisma.daily_doses.create({
      data: {
        id: doseId,
        period: period as any,
        title: phrases.title,
        subtitle: phrases.subtitle,
        date: dateObj,
        status: 'draft',
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

    return corsResponse({
      success: true,
      dose: {
        ...newDose,
        contents: createdContents
      },
      message: 'تم توليد الجرعة بنجاح'
    });

  } catch (error: any) {
    console.error('Error generating dose:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'حدث خطأ في توليد الجرعة',
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
} 