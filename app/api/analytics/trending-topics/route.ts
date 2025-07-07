import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // مواضيع رائجة وهمية - يمكن استبدالها بتحليل حقيقي للمقالات
    const trendingTopics = [
      'الذكاء الاصطناعي',
      'رؤية 2030',
      'التجارة الإلكترونية',
      'الاستدامة البيئية',
      'الطاقة المتجددة',
      'التقنية المالية',
      'الرياضة السعودية',
      'السياحة في السعودية',
      'التعليم الرقمي',
      'الأمن السيبراني'
    ];

    // ترتيب عشوائي للمواضيع لمحاكاة التغيير
    const shuffledTopics = trendingTopics.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      topics: shuffledTopics.slice(0, 8),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('خطأ في جلب المواضيع الرائجة:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'فشل في جلب المواضيع الرائجة' 
      },
      { status: 500 }
    );
  }
} 