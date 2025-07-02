import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'مفتاح API مطلوب' },
        { status: 400 }
      );
    }

    // إنشاء عميل OpenAI مؤقت للاختبار
    const openai = new OpenAI({
      apiKey: apiKey.trim(),
    });

    // محاولة استدعاء بسيط للتحقق من صحة المفتاح
    try {
      const response = await openai.models.list();
      
      // إذا نجح الاستدعاء، المفتاح صحيح
      return NextResponse.json({
        success: true,
        message: 'تم الاتصال بنجاح!',
        modelsCount: response.data.length
      });
    } catch (openaiError: any) {
      // التعامل مع أخطاء OpenAI المحددة
      if (openaiError.status === 401) {
        return NextResponse.json(
          { 
            error: 'مفتاح API غير صحيح',
            details: 'تأكد من نسخ المفتاح كاملاً من لوحة تحكم OpenAI'
          },
          { status: 401 }
        );
      } else if (openaiError.status === 429) {
        return NextResponse.json(
          { 
            error: 'تم تجاوز حد الاستخدام',
            details: 'تحقق من رصيدك في OpenAI أو حدود الاستخدام'
          },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { 
            error: 'خطأ في الاتصال بـ OpenAI',
            details: openaiError.message || 'حدث خطأ غير متوقع'
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error testing OpenAI connection:', error);
    return NextResponse.json(
      { 
        error: 'حدث خطأ في الخادم',
        details: error.message || 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
} 