import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { corsResponse } from '@/lib/cors';

const prisma = new PrismaClient();

// كلمات محظورة محلياً للفحص السريع
const BANNED_WORDS = [
  'غبي', 'أحمق', 'حقير', 'كلب', 'خنزير', 'قذر', 'عاهر',
  'لعين', 'ملعون', 'كافر', 'زنديق', 'منافق', 'خائن'
];

// تحليل محلي سريع
function quickLocalAnalysis(text: string) {
  const lowerText = text.toLowerCase();
  let score = 100;
  let flaggedWords: string[] = [];
  
  // فحص الكلمات المحظورة
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word)) {
      score -= 30;
      flaggedWords.push(word);
    }
  }
  
  // فحص الأنماط المشبوهة
  if (lowerText.includes('http://') || lowerText.includes('https://')) {
    score -= 10; // روابط
  }
  
  if ((text.match(/!/g) || []).length > 3) {
    score -= 10; // علامات تعجب كثيرة
  }
  
  if ((text.match(/\?/g) || []).length > 3) {
    score -= 10; // علامات استفهام كثيرة
  }
  
  if (text.length < 10) {
    score -= 20; // تعليق قصير جداً
  }
  
  if (/(.)\1{4,}/.test(text)) {
    score -= 20; // تكرار حروف
  }
  
  // تحديد التصنيف
  let classification = 'safe';
  let suggestedAction = 'approve';
  
  if (score < 20) {
    classification = 'toxic';
    suggestedAction = 'reject';
  } else if (score < 50) {
    classification = 'suspicious';
    suggestedAction = 'review';
  } else if (score < 80) {
    classification = 'questionable';
    suggestedAction = 'review';
  }
  
  return {
    score: Math.max(0, score),
    classification,
    suggestedAction,
    flaggedWords,
    confidence: 0.7 // ثقة متوسطة للتحليل المحلي
  };
}

// تحليل باستخدام OpenAI
async function analyzeWithOpenAI(text: string, apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `أنت محلل محتوى لموقع إخباري. قيّم التعليق التالي من ناحية:
1. المحتوى المسيء أو العدواني
2. خطاب الكراهية أو التمييز
3. المحتوى غير اللائق
4. البريد العشوائي أو الإعلانات
5. التهديدات أو التحرش

أعد الرد بصيغة JSON فقط بالشكل التالي:
{
  "score": رقم من 0-100 (100 = آمن تماماً),
  "classification": "safe" أو "suspicious" أو "toxic" أو "spam",
  "suggestedAction": "approve" أو "review" أو "reject",
  "categories": {
    "toxicity": نسبة من 0-1,
    "threat": نسبة من 0-1,
    "harassment": نسبة من 0-1,
    "spam": نسبة من 0-1,
    "hate": نسبة من 0-1
  },
  "flaggedWords": [قائمة الكلمات المشكوك فيها],
  "reason": "سبب التصنيف باللغة العربية"
}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      ...result,
      confidence: 0.95,
      aiProvider: 'openai'
    };
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { comment, commentId } = await request.json();
    
    if (!comment || typeof comment !== 'string') {
      return NextResponse.json(
        { error: 'نص التعليق مطلوب' },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    
    // جلب إعدادات التحليل
    const settings = await prisma.aIModerationSettings.findFirst();
    
    let analysisResult;
    let aiProvider = 'local';
    
    // استخدم التحليل المحلي السريع افتراضياً
    analysisResult = quickLocalAnalysis(comment);
    
    // محاولة التحليل بـ OpenAI فقط إذا كان التعليق مشبوهاً
    if (settings?.enabled && settings.apiKeyEncrypted && analysisResult.score < 70) {
      // في الإنتاج: فك تشفير المفتاح
      const apiKey = process.env.OPENAI_API_KEY || settings.apiKeyEncrypted;
      const openAIResult = await analyzeWithOpenAI(comment, apiKey);
      if (openAIResult) {
        analysisResult = openAIResult;
        aiProvider = 'openai';
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    // لا نحفظ في قاعدة البيانات هنا - سيتم الحفظ من API التعليقات
    
    return NextResponse.json({
      score: analysisResult.score,
      classification: analysisResult.classification,
      suggested_action: analysisResult.suggestedAction,
      ai_provider: aiProvider,
      confidence: analysisResult.confidence,
      flagged_words: analysisResult.flaggedWords,
      categories: analysisResult.categories,
      processing_time: processingTime,
      reason: analysisResult.reason
    });
    
  } catch (error) {
    console.error('AI moderation error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحليل التعليق' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsResponse({}, 200);
} 