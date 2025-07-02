import { NextRequest, NextResponse } from "next/server";

// POST - حفظ تفاعل ذكاء اصطناعي جديد
export async function POST(request: NextRequest) {
  try {
    const interaction = await request.json();
    
    // التحقق من صحة البيانات المطلوبة
    if (!interaction.userId || !interaction.action) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId وaction مطلوبان' 
      }, { status: 400 });
    }

    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userId: interaction.userId,
      articleId: interaction.articleId || null,
      action: interaction.action,
      model: interaction.model || 'gpt-3.5-turbo',
      inputTokens: interaction.inputTokens || 0,
      outputTokens: interaction.outputTokens || 0,
      cost: interaction.cost || 0,
      success: interaction.success !== undefined ? interaction.success : true,
      metadata: interaction.metadata || {}
    };

    // TODO: حفظ في قاعدة البيانات الحقيقية
    // يجب ربط هذا بقاعدة البيانات الفعلية
    console.log("AI Interaction logged:", logEntry);

    return NextResponse.json({ 
      success: true, 
      data: logEntry 
    });
  } catch (error) {
    console.error('خطأ في حفظ تفاعل الذكاء الاصطناعي:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'فشل في حفظ التفاعل' 
    }, { status: 500 });
  }
}

// GET - استرجاع تفاعلات الذكاء الاصطناعي
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // TODO: استرجاع من قاعدة البيانات الحقيقية
    // يجب ربط هذا بقاعدة البيانات الفعلية بدلاً من إرجاع قائمة فارغة
    const logs: any[] = [];
    
    return NextResponse.json({ 
      success: true, 
      data: logs,
      total: 0,
      message: 'لا توجد تفاعلات محفوظة حالياً - يجب ربط النظام بقاعدة البيانات'
    });
  } catch (error) {
    console.error('خطأ في استرجاع تفاعلات الذكاء الاصطناعي:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'فشل في استرجاع التفاعلات' 
    }, { status: 500 });
  }
}
