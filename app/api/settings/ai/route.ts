import { NextRequest, NextResponse } from 'next/server';

// في التطبيق الحقيقي، سيتم حفظ هذه الإعدادات في قاعدة البيانات
let aiSettings = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7
  },
  features: {
    aiEditor: true,
    analytics: true,
    notifications: true
  }
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: aiSettings
    });
  } catch (error) {
    console.error('خطأ في جلب إعدادات الذكاء الاصطناعي:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب الإعدادات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // تحديث الإعدادات
    aiSettings = {
      ...aiSettings,
      ...body
    };

    // في التطبيق الحقيقي، سيتم حفظ في قاعدة البيانات
    console.log('تم تحديث إعدادات الذكاء الاصطناعي:', aiSettings);

    // تحديث متغيرات البيئة (في التطبيق الحقيقي)
    if (body.openai?.apiKey) {
      process.env.OPENAI_API_KEY = body.openai.apiKey;
      console.log('تم تحديث مفتاح OpenAI');
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ إعدادات الذكاء الاصطناعي بنجاح',
      data: aiSettings
    });
  } catch (error) {
    console.error('خطأ في حفظ إعدادات الذكاء الاصطناعي:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في حفظ الإعدادات' },
      { status: 500 }
    );
  }
} 