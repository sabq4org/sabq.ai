import OpenAI from 'openai';
import { 
  GenerateAnalysisRequest, 
  GenerateAnalysisResponse,
  AnalysisContent,
  ContentSection,
  DataPoint
} from '@/types/deep-analysis';

// إعداد OpenAI client
let openaiClient: OpenAI | null = null;

export function initializeOpenAI(apiKey: string) {
  openaiClient = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: false // سيتم استخدامه من الخادم فقط
  });
}

// البرومبتات الأساسية للتحليل
const ANALYSIS_PROMPTS = {
  fromArticle: `أنت محرر تحليلي محترف في صحيفة سبق. اقرأ الخبر التالي بعناية، ثم قم بإنشاء تحليل عميق واستراتيجي.

المطلوب: نص تحليلي صحفي مكتوب بلغة عربية فصحى احترافية، منسق بعناوين وفقرات، بدون أي أكواد أو رموز برمجية.

يجب أن يتضمن التحليل:

1. **مقدمة تحليلية**: تمهيد يوضح أهمية الموضوع وسياقه
2. **خلفية الحدث**: السياق التاريخي والظروف المحيطة
3. **الأثر المحلي والعالمي**: التأثيرات المباشرة وغير المباشرة
4. **البيانات والأرقام**: إحصائيات ومؤشرات ذات صلة
5. **التداعيات المستقبلية**: السيناريوهات المحتملة
6. **التحديات والفرص**: العقبات المتوقعة والإمكانيات المتاحة
7. **خلاصة وتوصيات**: نقاط ختامية وتوصيات استراتيجية عملية

معايير الجودة:
- لغة صحفية احترافية وسلسة
- تنظيم منطقي بعناوين فرعية واضحة
- تحليل مدعوم بالحقائق والمنطق
- يتراوح بين 1500-2500 كلمة

الخبر:
{articleContent}`,

  fromTopic: `أنت محرر تحليلي محترف في صحيفة سبق. قم بإنشاء تحليل عميق حول الموضوع المحدد.

المطلوب: نص تحليلي صحفي مكتوب بلغة عربية فصحى احترافية، منسق بعناوين وفقرات، بدون أي أكواد أو رموز برمجية.

الموضوع: {topic}
التصنيف: {category}

🎯 هدف الجودة: تحليل شامل يحقق تقييم 90% أو أكثر

يجب أن يتضمن التحليل الأقسام التالية بالترتيب (كل قسم بعنوان واضح):

## 1. مقدمة شاملة (300-400 كلمة)
- تعريف بالموضوع وأهميته الاستراتيجية
- السياق التاريخي والتطورات الأخيرة
- أسباب أهمية الموضوع في الوقت الحالي
- نظرة عامة على ما سيتم تناوله في التحليل

## 2. الوضع الحالي والواقع الراهن (400-500 كلمة)
- تحليل مفصل للوضع الحالي في السعودية
- الإحصائيات والأرقام الحديثة (مع ذكر المصادر)
- مقارنات محلية (بين المدن السعودية) وإقليمية (دول الخليج)
- أمثلة واقعية من السوق السعودي

## 3. التحديات الرئيسية والعقبات (300-400 كلمة)
- العقبات التقنية والتشغيلية
- التحديات التنظيمية والقانونية
- المخاطر الاقتصادية والاجتماعية
- العوائق الثقافية أو السلوكية إن وجدت

## 4. الفرص والإمكانيات المتاحة (300-400 كلمة)
- الآفاق الإيجابية والفرص الواعدة
- الفوائد المتوقعة قصيرة ومتوسطة وطويلة المدى
- الميزات التنافسية للسعودية في هذا المجال
- الاستثمارات والمبادرات الحكومية الداعمة

## 5. دراسة حالة ومقارنات عملية (400-500 كلمة)
- مثال تفصيلي لشركة/مشروع سعودي ناجح في المجال
- مقارنة مع تجربة دولة أخرى (مثل الإمارات أو سنغافورة)
- الدروس المستفادة من التجارب المحلية والعالمية
- أفضل الممارسات القابلة للتطبيق

## 6. التأثير على رؤية السعودية 2030 (300-400 كلمة)
- الارتباط المباشر بأهداف ومحاور الرؤية
- المساهمة في التنويع الاقتصادي وتقليل الاعتماد على النفط
- التأثير على جودة الحياة وتمكين المواطنين
- دور القطاع الخاص والشراكات الاستراتيجية

## 7. التأثير على سلوك المستهلك والمجتمع (300-400 كلمة)
- كيف سيغير هذا الموضوع من سلوك المواطنين والمقيمين
- التأثير على أنماط الاستهلاك والحياة اليومية
- التحديات الاجتماعية والثقافية المتوقعة
- الفرص لخلق وظائف جديدة وتطوير المهارات

## 8. رؤية مستقبلية وسيناريوهات محتملة (300-400 كلمة)
- السيناريو المتفائل: ماذا لو نجحت كل الخطط؟
- السيناريو الواقعي: التوقعات الأكثر احتمالاً
- السيناريو التحذيري: المخاطر التي يجب تجنبها
- المؤشرات الرئيسية لقياس النجاح

## 9. توصيات عملية وخطة تنفيذية (نقاط محددة)
### للحكومة:
- 3-4 توصيات تنظيمية وتشريعية محددة
- مبادرات دعم وتحفيز مقترحة

### للقطاع الخاص:
- 3-4 فرص استثمارية واضحة
- نماذج أعمال مبتكرة مقترحة

### للأفراد والمجتمع:
- 2-3 نصائح عملية للاستفادة من التطورات
- المهارات المطلوب تطويرها

## 10. خاتمة وخلاصة (200-300 كلمة)
- تلخيص أهم النقاط المطروحة
- التأكيد على الفرص الرئيسية
- دعوة للعمل والمشاركة الفعالة
- نظرة تفاؤلية مدروسة للمستقبل

📊 متطلبات إضافية لضمان الجودة:
- استخدم أرقام وإحصائيات حقيقية من مصادر موثوقة (الهيئة العامة للإحصاء، وزارات، تقارير دولية)
- اذكر أسماء شركات سعودية حقيقية كأمثلة (مرسول، جاهز، نون، stc، أرامكو، سابك)
- اربط بمبادرات حقيقية (نيوم، البحر الأحمر، القدية، روشن)
- استخدم اقتباسات منطقية من مسؤولين أو خبراء
- نوّع بين الفقرات السردية والقوائم النقطية والأرقام
- اجعل كل قسم مترابطاً مع الذي يليه بانسيابية

الطول المستهدف: 3000-3500 كلمة`,

  fromExternal: `أنت محرر تحليلي محترف في صحيفة سبق. بناءً على المحتوى من المصدر الخارجي، قم بإنشاء تحليل عميق.

المطلوب: نص تحليلي صحفي مكتوب بلغة عربية فصحى احترافية، منسق بعناوين وفقرات، بدون أي أكواد أو رموز برمجية.

المصدر: {externalUrl}
المحتوى:
{externalContent}

قم بإنشاء تحليل يتضمن:
1. **تلخيص تحليلي**: عرض النقاط الرئيسية بشكل نقدي
2. **الأهمية والتأثير**: تحليل الأبعاد والتداعيات
3. **السياق المحلي**: ربط الموضوع بالواقع السعودي/العربي
4. **وجهات نظر متعددة**: عرض زوايا مختلفة للموضوع
5. **دروس مستفادة**: استخلاص العبر والفوائد
6. **خطوات مستقبلية**: توصيات وإجراءات مقترحة

تأكد من:
- عدم نسخ المحتوى حرفياً
- إضافة قيمة تحليلية حقيقية
- الحفاظ على الموضوعية والمهنية
- كتابة نص صحفي أصيل ومتميز`
};

// دالة توليد التحليل
export async function generateDeepAnalysis(
  request: GenerateAnalysisRequest
): Promise<GenerateAnalysisResponse> {
  if (!openaiClient) {
    return {
      success: false,
      error: 'OpenAI client not initialized'
    };
  }

  try {
    // بناء البرومبت حسب نوع المصدر
    let prompt = '';
    
    switch (request.sourceType) {
      case 'article':
        prompt = ANALYSIS_PROMPTS.fromArticle.replace('{articleContent}', request.sourceId || '');
        break;
      case 'topic':
        prompt = ANALYSIS_PROMPTS.fromTopic
          .replace('{topic}', request.topic || '')
          .replace('{category}', request.category || '');
        break;
      case 'external':
        prompt = ANALYSIS_PROMPTS.fromExternal
          .replace('{externalUrl}', request.externalUrl || '')
          .replace('{externalContent}', ''); // سيتم جلب المحتوى
        break;
    }

    // إضافة تعليمات خاصة إن وجدت
    if (request.customPrompt) {
      prompt += `\n\nتعليمات إضافية:\n${request.customPrompt}`;
    }

    // إضافة تعليمات الطول
    if (request.length) {
      const lengthInstructions = {
        short: 'اجعل التحليل مختصراً (800-1200 كلمة)',
        medium: 'اجعل التحليل متوسط الطول (1500-2000 كلمة)',
        long: 'اجعل التحليل مفصلاً (2500-3500 كلمة)'
      };
      prompt += `\n\n${lengthInstructions[request.length]}`;
    }

    // استدعاء OpenAI
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `أنت محرر تحليلي محترف في صحيفة سبق الإخبارية. 
          مهمتك: كتابة تحليل عميق بلغة عربية صحفية احترافية.
          
          التنسيق المطلوب:
          - نص تحريري منسق بعناوين وفقرات
          - بدون أي أكواد برمجية أو رموز JSON
          - مقسم إلى: مقدمة، محاور تحليلية، نقاط ختامية، وتوصيات
          - استخدم العناوين الفرعية لتنظيم المحتوى
          
          معايير الجودة المطلوبة:
          - على الأقل 7 أقسام رئيسية بعناوين واضحة
          - كل قسم يحتوي على 200-400 كلمة
          - تضمين أرقام وإحصائيات حقيقية (5 نقاط بيانات على الأقل)
          - تقديم 5-7 توصيات عملية قابلة للتطبيق
          - استخلاص 5-7 رؤى رئيسية من التحليل
          - استخدام قوائم نقطية وترقيم عند الحاجة
          - تنويع الأسلوب بين السرد والتحليل والمقارنة
          
          يجب أن يكون الإخراج بصيغة JSON تحتوي على:
          {
            "title": "عنوان التحليل",
            "summary": "ملخص تنفيذي (100-150 كلمة)",
            "sections": [
              {
                "title": "عنوان القسم",
                "content": "محتوى القسم كنص صحفي منسق (200-400 كلمة)"
              }
            ],
            "recommendations": ["توصية عملية 1", "توصية عملية 2", "..."],
            "keyInsights": ["رؤية رئيسية 1", "رؤية رئيسية 2", "..."],
            "dataPoints": [
              {
                "label": "اسم المؤشر",
                "value": "القيمة",
                "unit": "الوحدة",
                "description": "وصف مختصر"
              }
            ]
          }`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8, // رفع درجة الإبداع
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // تحليل الاستجابة
    const parsedResponse = JSON.parse(response);
    
    // التحقق من أن الاستجابة ليست فارغة
    if (typeof parsedResponse === 'object' && Object.keys(parsedResponse).length === 0) {
      throw new Error('رد فارغ من GPT - الرجاء المحاولة مرة أخرى');
    }
    
    // التحقق من وجود المحتوى الأساسي
    if (!parsedResponse.title || !parsedResponse.sections || parsedResponse.sections.length === 0) {
      throw new Error('الرد من GPT لا يحتوي على محتوى كافٍ للتحليل');
    }
    
    // بناء محتوى التحليل
    const content = parseAnalysisResponse(parsedResponse);
    
    // حساب جودة المحتوى
    const qualityScore = calculateQualityScore(content);
    
    // حساب وقت القراءة (250 كلمة في الدقيقة)
    // حساب مجموع الكلمات من جميع الأقسام
    const totalWords = content.sections.reduce((total, section) => {
      return total + countWords(section.content);
    }, 0);
    const estimatedReadingTime = Math.ceil(totalWords / 250);

    return {
      success: true,
      analysis: {
        title: parsedResponse.title,
        summary: parsedResponse.summary,
        content: content,
        qualityScore: qualityScore,
        estimatedReadingTime: estimatedReadingTime
      },
      tokensUsed: completion.usage?.total_tokens,
      cost: calculateCost(completion.usage?.total_tokens || 0)
    };

  } catch (error) {
    console.error('Error generating analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// دالة تحليل استجابة GPT وتحويلها لمحتوى منظم
function parseAnalysisResponse(response: any): AnalysisContent {
  const sections: ContentSection[] = [];
  const dataPoints: DataPoint[] = [];
  
  // استخراج الأقسام
  if (response.sections && Array.isArray(response.sections)) {
    response.sections.forEach((section: any, index: number) => {
      sections.push({
        id: `section-${index + 1}`,
        title: section.title,
        content: section.content,
        order: index + 1,
        type: section.type || 'text',
        metadata: section.metadata || {}
      });
    });
  }

  // استخراج نقاط البيانات
  if (response.dataPoints && Array.isArray(response.dataPoints)) {
    response.dataPoints.forEach((point: any) => {
      dataPoints.push({
        label: point.label,
        value: point.value,
        unit: point.unit,
        trend: point.trend,
        description: point.description
      });
    });
  }

  // بناء جدول المحتويات
  const tableOfContents = sections.map(section => ({
    id: `toc-${section.id}`,
    title: section.title,
    level: 1,
    sectionId: section.id
  }));

  return {
    sections,
    tableOfContents,
    recommendations: response.recommendations || [],
    keyInsights: response.keyInsights || [],
    dataPoints
  };
}

// دالة حساب جودة المحتوى
function calculateQualityScore(content: AnalysisContent): number {
  let score = 0;
  
  // 1. وجود أقسام وتنوعها (15%)
  if (content.sections.length >= 10) {
    score += 15;
  } else if (content.sections.length >= 8) {
    score += 12;
  } else if (content.sections.length >= 6) {
    score += 9;
  } else if (content.sections.length >= 4) {
    score += 6;
  } else if (content.sections.length > 0) {
    score += 3;
  }
  
  // 2. طول المحتوى الإجمالي (25%)
  const totalWords = content.sections.reduce((total, section) => {
    return total + countWords(section.content);
  }, 0);
  
  if (totalWords >= 3000) {
    score += 25;
  } else if (totalWords >= 2500) {
    score += 20;
  } else if (totalWords >= 2000) {
    score += 15;
  } else if (totalWords >= 1500) {
    score += 10;
  } else if (totalWords >= 1000) {
    score += 5;
  }
  
  // 3. وجود عناوين منظمة (15%)
  const hasWellStructuredTitles = content.sections.every(s => 
    s.title && s.title.length > 5 && !s.title.includes('undefined')
  );
  const hasNumberedSections = content.sections.some(s => 
    /^\d+\./.test(s.title) || /^##/.test(s.title)
  );
  
  if (hasWellStructuredTitles && hasNumberedSections) {
    score += 15;
  } else if (hasWellStructuredTitles) {
    score += 10;
  } else {
    score += 5;
  }
  
  // 4. وجود بيانات وإحصائيات (10%)
  if (content.dataPoints && content.dataPoints.length >= 7) {
    score += 10;
  } else if (content.dataPoints && content.dataPoints.length >= 5) {
    score += 8;
  } else if (content.dataPoints && content.dataPoints.length >= 3) {
    score += 5;
  } else if (content.dataPoints && content.dataPoints.length > 0) {
    score += 3;
  }
  
  // 5. وجود توصيات عملية (10%)
  if (content.recommendations && content.recommendations.length >= 8) {
    score += 10;
  } else if (content.recommendations && content.recommendations.length >= 6) {
    score += 8;
  } else if (content.recommendations && content.recommendations.length >= 4) {
    score += 5;
  } else if (content.recommendations && content.recommendations.length > 0) {
    score += 3;
  }
  
  // 6. وجود رؤى رئيسية (10%)
  if (content.keyInsights && content.keyInsights.length >= 7) {
    score += 10;
  } else if (content.keyInsights && content.keyInsights.length >= 5) {
    score += 8;
  } else if (content.keyInsights && content.keyInsights.length >= 3) {
    score += 5;
  } else if (content.keyInsights && content.keyInsights.length > 0) {
    score += 3;
  }
  
  // 7. تنوع وثراء المحتوى (15%)
  let contentRichness = 0;
  
  // تحقق من وجود أقسام طويلة ومفصلة
  const hasDetailedSections = content.sections.filter(s => countWords(s.content) >= 300).length >= 5;
  if (hasDetailedSections) contentRichness += 5;
  
  // تحقق من وجود قوائم وتنسيق
  const hasLists = content.sections.some(s => 
    s.content.includes('•') || s.content.includes('-') || s.content.includes('1.')
  );
  if (hasLists) contentRichness += 3;
  
  // تحقق من وجود أرقام وإحصائيات في النص
  const hasNumbers = content.sections.filter(s => 
    /\d+%|\d+\s*(مليون|مليار|ألف)|\d{4}/.test(s.content)
  ).length >= 3;
  if (hasNumbers) contentRichness += 4;
  
  // تحقق من ذكر شركات أو مبادرات سعودية
  const hasSaudiContext = content.sections.some(s => 
    /(مرسول|جاهز|نون|stc|أرامكو|سابك|نيوم|البحر الأحمر|القدية|روشن|رؤية 2030)/i.test(s.content)
  );
  if (hasSaudiContext) contentRichness += 3;
  
  score += contentRichness;
  
  return Math.min(score, 100); // التأكد من عدم تجاوز 100
}

// دالة حساب عدد الكلمات
function countWords(text: string): number {
  // إزالة HTML tags إن وجدت
  const cleanText = text.replace(/<[^>]*>/g, '');
  // حساب الكلمات العربية والإنجليزية
  const words = cleanText.match(/[\u0600-\u06FF]+|\w+/g);
  return words ? words.length : 0;
}

// دالة حساب التكلفة (تقديرية)
function calculateCost(tokens: number): number {
  // GPT-4 pricing: $0.03 per 1K input tokens, $0.06 per 1K output tokens
  // نفترض متوسط 50/50 للإدخال والإخراج
  const avgPricePerToken = 0.045 / 1000;
  return Math.round(tokens * avgPricePerToken * 100) / 100;
}

// دالة تحسين تحليل موجود
export async function improveAnalysis(
  currentAnalysis: string,
  improvementType: 'expand' | 'summarize' | 'update',
  additionalContext?: string
): Promise<GenerateAnalysisResponse> {
  if (!openaiClient) {
    return {
      success: false,
      error: 'OpenAI client not initialized'
    };
  }

  try {
    let prompt = '';
    
    switch (improvementType) {
      case 'expand':
        prompt = `قم بتوسيع التحليل التالي بإضافة المزيد من التفاصيل والأمثلة:\n\n${currentAnalysis}`;
        break;
      case 'summarize':
        prompt = `قم بتلخيص التحليل التالي مع الحفاظ على النقاط الرئيسية:\n\n${currentAnalysis}`;
        break;
      case 'update':
        prompt = `قم بتحديث التحليل التالي بناءً على المعلومات الجديدة:\n\nالتحليل الحالي:\n${currentAnalysis}\n\nالمعلومات الجديدة:\n${additionalContext}`;
        break;
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'أنت محرر تحليلي محترف. قم بتحسين التحليل المقدم حسب التعليمات.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const improvedContent = completion.choices[0].message.content || '';
    
    return {
      success: true,
      analysis: {
        title: 'تحليل محسّن',
        summary: 'تم تحسين هذا التحليل باستخدام الذكاء الاصطناعي',
        content: parseAnalysisResponse({ content: improvedContent, sections: [] }),
        qualityScore: 0.8,
        estimatedReadingTime: Math.ceil(countWords(improvedContent) / 250)
      },
      tokensUsed: completion.usage?.total_tokens,
      cost: calculateCost(completion.usage?.total_tokens || 0)
    };

  } catch (error) {
    console.error('Error improving analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// دالة تقييم جودة تحليل موجود
export async function evaluateAnalysisQuality(
  analysis: string
): Promise<{ score: number; feedback: string[] }> {
  if (!openaiClient) {
    return { score: 0, feedback: ['OpenAI client not initialized'] };
  }

  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'أنت خبير في تقييم جودة التحليلات الصحفية. قم بتقييم التحليل المقدم وإعطاء نقاط القوة والضعف. يجب أن يكون الإخراج بصيغة JSON صحيحة.'
        },
        {
          role: 'user',
          content: `قم بتقييم جودة التحليل التالي على مقياس من 0 إلى 100، وقدم ملاحظات تفصيلية:

${analysis}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const evaluation = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      score: evaluation.score / 100 || 0,
      feedback: evaluation.feedback || []
    };

  } catch (error) {
    console.error('Error evaluating analysis:', error);
    return { score: 0, feedback: ['Error during evaluation'] };
  }
}
