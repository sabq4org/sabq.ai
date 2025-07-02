import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// محاكاة Vision API (يمكن استبدالها بـ Google Vision API الحقيقي)
async function mockVisionAnalysis(imageUrl: string) {
  // محاكاة تحليل الصورة
  const mockAnalysis = {
    labels: [
      { description: 'مؤتمر صحفي', score: 0.95 },
      { description: 'قاعة اجتماعات', score: 0.89 },
      { description: 'مسؤولون', score: 0.87 },
      { description: 'العلم السعودي', score: 0.92 },
    ],
    faces: [
      {
        confidence: 0.98,
        emotions: {
          joy: 'LIKELY',
          sorrow: 'VERY_UNLIKELY',
          anger: 'VERY_UNLIKELY',
          surprise: 'UNLIKELY',
        },
      },
    ],
    text: {
      fullText: 'وزارة الإعلام - المملكة العربية السعودية',
      language: 'ar',
    },
    landmarks: [],
    objects: [
      { name: 'ميكروفون', score: 0.91 },
      { name: 'طاولة', score: 0.88 },
      { name: 'كرسي', score: 0.85 },
    ],
    safeSearch: {
      adult: 'VERY_UNLIKELY',
      spoof: 'VERY_UNLIKELY',
      medical: 'VERY_UNLIKELY',
      violence: 'VERY_UNLIKELY',
      racy: 'VERY_UNLIKELY',
    },
    dominantColors: [
      { color: 'rgb(0, 105, 62)', score: 0.35, pixelFraction: 0.25 },
      { color: 'rgb(255, 255, 255)', score: 0.30, pixelFraction: 0.20 },
    ],
  };

  // محاكاة التأخير
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return mockAnalysis;
}

// استخراج الكيانات السعودية
function extractSaudiEntities(analysis: any) {
  const entities = {
    people: [] as string[],
    places: [] as string[],
    organizations: [] as string[],
    events: [] as string[],
  };

  // قوائم الكيانات السعودية المعروفة
  const saudiPatterns = {
    people: [
      /الملك\s+\w+/g,
      /الأمير\s+\w+/g,
      /ولي العهد/g,
      /وزير\s+\w+/g,
      /سمو\s+\w+/g,
    ],
    places: [
      'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 
      'الدمام', 'الخبر', 'الطائف', 'تبوك', 'أبها',
    ],
    organizations: [
      'وزارة الإعلام', 'وزارة الداخلية', 'وزارة الخارجية',
      'أرامكو', 'سابك', 'الاتصالات السعودية', 'هيئة الترفيه',
    ],
    events: [
      'موسم الرياض', 'موسم جدة', 'اليوم الوطني', 'موسم الحج',
      'رمضان', 'عيد الفطر', 'عيد الأضحى',
    ],
  };

  // تحليل النص
  const fullText = analysis.text?.fullText || '';
  
  // البحث عن الأشخاص
  for (const pattern of saudiPatterns.people) {
    const matches = fullText.match(pattern);
    if (matches) {
      entities.people.push(...matches);
    }
  }

  // البحث عن الأماكن والمنظمات والأحداث
  for (const place of saudiPatterns.places) {
    if (fullText.includes(place)) {
      entities.places.push(place);
    }
  }

  for (const org of saudiPatterns.organizations) {
    if (fullText.includes(org)) {
      entities.organizations.push(org);
    }
  }

  for (const event of saudiPatterns.events) {
    if (fullText.includes(event)) {
      entities.events.push(event);
    }
  }

  // تحليل التسميات
  for (const label of analysis.labels || []) {
    const desc = label.description.toLowerCase();
    
    if (desc.includes('مسجد') || desc.includes('mosque')) {
      entities.places.push('مسجد');
    }
    
    if (desc.includes('احتفال') || desc.includes('celebration')) {
      entities.events.push('احتفال');
    }
    
    if (desc.includes('مؤتمر') || desc.includes('conference')) {
      entities.events.push('مؤتمر');
    }
  }

  // إزالة التكرارات
  for (const key in entities) {
    entities[key as keyof typeof entities] = [...new Set(entities[key as keyof typeof entities])];
  }

  return entities;
}

export async function POST(req: NextRequest) {
  try {
    const { mediaId } = await req.json();

    if (!mediaId) {
      return NextResponse.json(
        { error: 'معرف الوسائط مطلوب' },
        { status: 400 }
      );
    }

    // جلب معلومات الملف
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: mediaId },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'الملف غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من نوع الملف
    if (mediaFile.type !== 'IMAGE') {
      return NextResponse.json(
        { error: 'التحليل متاح للصور فقط' },
        { status: 400 }
      );
    }

    // تحليل الصورة
    const analysis = await mockVisionAnalysis(mediaFile.url);
    
    // استخراج الكيانات السعودية
    const saudiEntities = extractSaudiEntities(analysis);
    
    // إنشاء قائمة العلامات
    const tags = [
      ...analysis.labels.filter((l: any) => l.score > 0.7).map((l: any) => l.description),
      ...saudiEntities.people.map(p => `شخص: ${p}`),
      ...saudiEntities.places.map(p => `مكان: ${p}`),
      ...saudiEntities.organizations.map(o => `منظمة: ${o}`),
      ...saudiEntities.events.map(e => `حدث: ${e}`),
    ];
    
    // تحديد التصنيف
    let classification = 'عام';
    if (saudiEntities.people.length > 0) classification = 'شخصيات';
    else if (saudiEntities.places.length > 0) classification = 'أماكن';
    else if (saudiEntities.organizations.length > 0) classification = 'مؤسسات';
    else if (saudiEntities.events.length > 0) classification = 'أحداث';
    
    // تحديث سجل الوسائط
    const updatedMedia = await prisma.mediaFile.update({
      where: { id: mediaId },
      data: {
        tags,
        classification,
        aiEntities: saudiEntities,
        aiAnalysis: analysis,
      },
    });

    return NextResponse.json({
      success: true,
      media: updatedMedia,
      analysis: {
        ...analysis,
        saudiEntities,
      },
    });
  } catch (error) {
    console.error('خطأ في تحليل الصورة:', error);
    return NextResponse.json(
      { error: 'فشل تحليل الصورة' },
      { status: 500 }
    );
  }
} 