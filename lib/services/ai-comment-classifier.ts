import OpenAI from 'openai';

// Initialize OpenAI client with safety check
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn('OpenAI client initialization failed:', error);
  openai = null;
}

export interface AIClassificationResult {
  score: number; // 0-100
  classification: 'safe' | 'questionable' | 'suspicious' | 'toxic';
  suggestedAction: 'approve' | 'review' | 'reject';
  confidence: number;
  reason?: string;
  aiProvider: 'openai' | 'local';
  processingTime: number;
}

/**
 * تصنيف التعليق باستخدام OpenAI GPT-4
 */
export async function classifyCommentWithAI(comment: string): Promise<AIClassificationResult> {
  const startTime = Date.now();
  
  // إذا لم يكن OpenAI متاحاً، استخدم التحليل المحلي مباشرة
  if (!openai) {
    const { quickLocalAnalysis } = await import('../comment-moderation');
    const localResult = quickLocalAnalysis(comment);
    
    return {
      score: localResult.score,
      classification: localResult.classification,
      suggestedAction: localResult.suggestedAction,
      confidence: localResult.confidence,
      reason: localResult.reason || 'تم التحليل محلياً - OpenAI غير متاح',
      aiProvider: 'local',
      processingTime: Date.now() - startTime
    };
  }
  
  try {
    const prompt = `
أنت مساعد مراجعة تعليقات محترف. مهمتك هي تقييم التعليق التالي من حيث كونه:
- مسيئًا أو يحتوي على إهانات شخصية
- سلبيًا أو عدوانيًا بشكل مفرط
- يحتوي على كلمات نابية أو غير لائقة
- يحتوي على تهديدات أو تحريض
- يحتوي على محتوى عنصري أو طائفي
- يحتوي على محتوى غير مناسب للنشر العام

قيّم التعليق بنسبة من 0 إلى 100، حيث:
- 0-30 = تعليق آمن تمامًا (يُنشر تلقائيًا)
- 31-60 = تعليق مشكوك فيه (يحتاج مراجعة)
- 61-100 = تعليق مرفوض (يُحجب تلقائيًا)

أمثلة توضيحية:
- "شكراً على المقال المفيد" = 5
- "لا أتفق مع هذا الرأي" = 15
- "موضوع غير مهم وممل" = 40
- "أنت مخطئ تماماً ولا تفهم شيئاً" = 55
- "أنت غبي وكاذب" = 90
- "سأقتلك يا حقير" = 100

أعطني الرقم فقط بدون أي شرح أو تبرير.

التعليق: "${comment.replace(/"/g, '\\"')}"
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'أنت مساعد محترف لتقييم التعليقات للنشر في منصة إخبارية عربية. قيّم بدقة وحيادية.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2, // نريد نتائج متسقة
      max_tokens: 10, // نحتاج رقم فقط
    });

    const scoreStr = response.choices[0].message.content?.trim() || '0';
    const score = Math.max(0, Math.min(100, parseInt(scoreStr.replace(/\D/g, '')) || 0));
    
    // تحديد التصنيف والإجراء المقترح
    let classification: AIClassificationResult['classification'];
    let suggestedAction: AIClassificationResult['suggestedAction'];
    let reason = '';
    
    if (score <= 30) {
      classification = 'safe';
      suggestedAction = 'approve';
      reason = 'تعليق آمن ومناسب للنشر';
    } else if (score <= 50) {
      classification = 'questionable';
      suggestedAction = 'review';
      reason = 'تعليق يحتاج مراجعة - قد يحتوي على محتوى سلبي';
    } else if (score <= 70) {
      classification = 'suspicious';
      suggestedAction = 'review';
      reason = 'تعليق مشبوه - يحتوي على محتوى قد يكون مسيئاً';
    } else {
      classification = 'toxic';
      suggestedAction = 'reject';
      reason = 'تعليق مرفوض - يحتوي على محتوى مسيء أو غير لائق';
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      score,
      classification,
      suggestedAction,
      confidence: 0.95, // ثقة عالية لـ GPT-4
      reason,
      aiProvider: 'openai',
      processingTime
    };
    
  } catch (error) {
    console.error('Error classifying comment with OpenAI:', error);
    
    // في حالة الفشل، نعود للتحليل المحلي
    const { quickLocalAnalysis } = await import('../comment-moderation');
    const localResult = quickLocalAnalysis(comment);
    
    return {
      score: localResult.score,
      classification: localResult.classification,
      suggestedAction: localResult.suggestedAction,
      confidence: localResult.confidence,
      reason: localResult.reason,
      aiProvider: 'local',
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * تصنيف دفعة من التعليقات
 */
export async function classifyCommentsBatch(comments: string[]): Promise<AIClassificationResult[]> {
  // معالجة متوازية مع حد أقصى 5 طلبات في نفس الوقت
  const batchSize = 5;
  const results: AIClassificationResult[] = [];
  
  for (let i = 0; i < comments.length; i += batchSize) {
    const batch = comments.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(comment => classifyCommentWithAI(comment))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * الحصول على توصية مفصلة للإجراء
 */
export function getActionRecommendation(score: number): {
  action: 'approve' | 'review' | 'reject';
  message: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
} {
  if (score <= 30) {
    return {
      action: 'approve',
      message: 'تعليق آمن - يمكن نشره مباشرة',
      color: 'green'
    };
  } else if (score <= 50) {
    return {
      action: 'review',
      message: 'يُنصح بمراجعة التعليق قبل النشر',
      color: 'yellow'
    };
  } else if (score <= 70) {
    return {
      action: 'review',
      message: 'تعليق مشبوه - يجب مراجعته بعناية',
      color: 'orange'
    };
  } else {
    return {
      action: 'reject',
      message: 'تعليق مرفوض - يحتوي على محتوى غير لائق',
      color: 'red'
    };
  }
} 