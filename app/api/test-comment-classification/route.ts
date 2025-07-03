import { NextRequest, NextResponse } from 'next/server';
import { quickLocalAnalysis } from '@/lib/comment-moderation';
import { classifyCommentWithAI } from '@/lib/services/ai-comment-classifier';

export async function POST(request: NextRequest) {
  try {
    const { comment, useOpenAI = false } = await request.json();
    
    if (!comment) {
      return NextResponse.json(
        { error: 'يرجى إرسال نص التعليق' },
        { status: 400 }
      );
    }
    
    let result;
    
    if (useOpenAI && process.env.OPENAI_API_KEY) {
      // استخدام OpenAI
      result = await classifyCommentWithAI(comment);
    } else {
      // التحليل المحلي
      const localResult = quickLocalAnalysis(comment);
      result = {
        score: localResult.score,
        classification: localResult.classification,
        suggestedAction: localResult.suggestedAction,
        confidence: localResult.confidence,
        reason: localResult.reason,
        aiProvider: 'local' as const,
        processingTime: 0
      };
    }
    
    // إضافة توصية مفصلة
    const { getActionRecommendation } = await import('@/lib/services/ai-comment-classifier');
    const recommendation = getActionRecommendation(result.score);
    
    return NextResponse.json({
      success: true,
      analysis: {
        ...result,
        recommendation
      },
      testExamples: {
        safe: [
          "شكراً على المقال المفيد",
          "معلومات قيمة جداً",
          "لا أتفق مع هذا الرأي"
        ],
        questionable: [
          "موضوع غير مهم وممل",
          "كلام فارغ",
          "مضيعة وقت"
        ],
        suspicious: [
          "أنت مخطئ تماماً ولا تفهم شيئاً",
          "كلام سخيف وتافه",
          "هذا هراء"
        ],
        toxic: [
          "أنت غبي وكاذب",
          "سأقتلك يا حقير",
          "يلعنك الله"
        ]
      }
    });
  } catch (error) {
    console.error('Error in comment classification test:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تصنيف التعليق' },
      { status: 500 }
    );
  }
} 