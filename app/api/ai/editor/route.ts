import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// لا ننشئ OpenAI client مباشرة، بل نؤجله حتى وقت الاستخدام
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openai) {
    const apiKey = process.env.OPENAI_AI_EDITOR_KEY || process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'sk-...' && apiKey.length > 20) {
      try {
        openai = new OpenAI({ apiKey });
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
        return null;
      }
    }
  }
  return openai;
}

// أنواع الخدمات المتاحة
type EditorService = 
  | 'generate_title'
  | 'summarize'
  | 'expand'
  | 'rewrite'
  | 'translate'
  | 'analyze'
  | 'extract_keywords'
  | 'generate_report';

// أسلوب صحيفة سبق - System Prompt محسن
const SABQ_SYSTEM_PROMPT = `أنت صحفي سعودي محترف في صحيفة سبق الإلكترونية. تكتب بأسلوب صحفي سعودي أصيل يجمع بين العمق والوضوح والجاذبية.

أسلوب صحيفة سبق:
- لغة عربية فصحى واضحة ومفهومة
- أسلوب صحفي سعودي أصيل
- جمل متوازنة بين العمق والوضوح
- استخدام تعابير قوية وجذابة
- التركيز على الحقائق مع إضافة التحليل
- تجنب التكرار والمبالغة
- أسلوب مهني محترف يناسب القارئ السعودي
- استخدام عناصر زمنية ورقمية ومفاجئة عند الحاجة`;

// Prompts لكل خدمة
const servicePrompts = {
  generate_title: (content: string, context?: any) => ({
    system: SABQ_SYSTEM_PROMPT,
    user: `أنت صحفي سعودي محترف في صحيفة سبق. اكتب عنواناً صحفياً مميزاً ومكثفاً للمادة التالية، بأسلوب يجمع بين العمق والوضوح ويشد القارئ من أول وهلة.

لا تستخدم عنواناً عاماً أو تقليدياً. اجعل العنوان ثرياً ويحتوي على عنصر زمني أو رقمي أو مفاجئ.

المادة:
${content}

${context?.category ? `التصنيف: ${context.category}` : ''}
${context?.type ? `نوع الخبر: ${context.type}` : ''}

أرجع العنوان فقط، بدون علامات اقتباس أو تنسيق إضافي.`
  }),

  summarize: (content: string) => ({
    system: SABQ_SYSTEM_PROMPT,
    user: `قدّم تلخيصاً صحفياً دقيقاً وواضحاً للمحتوى التالي في ٣ إلى ٥ أسطر، بصيغة موجز خبري غني ومباشر، يناسب النشر كمقدمة أو محتوى مشارك على وسائل التواصل.

النص:
${content}

أرجع الملخص فقط بأسلوب صحفي سعودي واضح ومفيد.`
  }),

  expand: (content: string) => ({
    system: SABQ_SYSTEM_PROMPT,
    user: `وسع هذا المحتوى بمزيد من التفاصيل والعمق بأسلوب صحيفة سبق:
    
${content}

أضف تفاصيل إضافية وتحليل أعمق مع الحفاظ على الأسلوب المهني.`
  }),

  rewrite: (content: string) => ({
    system: SABQ_SYSTEM_PROMPT,
    user: `أعد صياغة النص التالي بلغة صحفية سعودية، بأسلوب صحيفة "سبق"، واجعل المادة موسعة، واضحة، جذابة، وثرية بالتفاصيل، مع تسلسل منطقي يعزز الفهم ويزيد القيمة التحريرية.

استخدم تعابير قوية، وتوازن بين العمق والوضوح. إذا كانت هناك أرقام أو مؤشرات، فقدمها بطريقة بارزة ومفهومة للقارئ العام.

النص الأصلي:
${content}

أرجع النص المحسن بأسلوب صحفي سعودي أصيل.`
  }),

  translate: (content: string, targetLang: string = 'ar') => ({
    system: SABQ_SYSTEM_PROMPT,
    user: `ترجم هذا المحتوى إلى ${targetLang === 'ar' ? 'العربية' : 'الإنجليزية'} بأسلوب صحيفة سبق:
    
${content}

أرجع الترجمة فقط.`
  }),

  analyze: (content: string) => ({
    system: SABQ_SYSTEM_PROMPT,
    user: `حلل هذا المحتوى تحليلاً صحفياً دقيقاً بأسلوب صحفي سعودي، وركز على النقاط الرئيسية والجوانب المهمة التي تهم القارئ السعودي.

قدم تحليلاً متوازناً يركز على:
- الأهمية والآثار
- السياق المحلي والإقليمي
- النقاط المميزة والجديدة
- التوصيات أو التوقعات

المحتوى:
${content}

أرجع تحليلاً صحفياً دقيقاً ومفيداً.`
  }),

  extract_keywords: (content: string) => ({
    system: SABQ_SYSTEM_PROMPT,
    user: `استخرج الكلمات المفتاحية من هذا المحتوى:
    
${content}

أرجع الكلمات المفتاحية مفصولة بفواصل، بدون ترقيم.`
  }),

  generate_report: (content: string, context?: any) => ({
    system: SABQ_SYSTEM_PROMPT,
    user: `اكتب تقريراً تحليلياً متكاملاً بناءً على المحتوى التالي، بأسلوب صحفي تحليلي سعودي، وفق نموذج صحيفة سبق.

يجب أن يحتوي على مقدمة، نقاط تحليلية واضحة، وخاتمة توصيفية أو استنتاجية. لا تكرر نص المادة، بل حللها وتوسع في مضمونها.

المادة:
${content}

${context?.title ? `العنوان: ${context.title}` : ''}
${context?.category ? `التصنيف: ${context.category}` : ''}
${context?.type ? `نوع الخبر: ${context.type}` : ''}

أرجع التقرير التحليلي كاملاً بأسلوب صحفي سعودي محترف.`
  })
};

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const { service, content, context, targetLang } = body;

    // التحقق من وجود المحتوى
    if (!content || !service) {
      return NextResponse.json(
        { success: false, error: 'المحتوى ونوع الخدمة مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من صحة نوع الخدمة
    if (!servicePrompts[service as EditorService]) {
      return NextResponse.json(
        { success: false, error: 'نوع خدمة غير صحيح' },
        { status: 400 }
      );
    }

    // الحصول على الـ prompt المناسب
    const prompt = servicePrompts[service as EditorService](content, context);
    
    // إضافة معلومات إضافية للـ context
    const enhancedContext = {
      ...context,
      timestamp: new Date().toISOString(),
      service,
      contentLength: content.length,
    };

    console.log('🔄 طلب المحرر الذكي:', {
      service,
      contentLength: content.length,
      hasContext: !!context
    });

    // استدعاء OpenAI
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { success: false, error: 'فشل في الاتصال بـ OpenAI' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_AI_EDITOR_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user }
      ],
      max_tokens: parseInt(process.env.OPENAI_AI_EDITOR_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.OPENAI_AI_EDITOR_TEMPERATURE || '0.7'),
    });

    const result = completion.choices[0]?.message?.content || '';

    console.log('✅ تم تنفيذ الطلب بنجاح:', {
      service,
      resultLength: result.length,
      tokens: completion.usage?.total_tokens
    });

    // إرجاع النتيجة
    return NextResponse.json({
      success: true,
      result,
      service,
      context: enhancedContext,
      metadata: {
        model: completion.model,
        tokens: completion.usage?.total_tokens,
        isSabqStyle: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ خطأ في المحرر الذكي:', error);
    
    // إرجاع رسالة خطأ مناسبة
    let errorMessage = 'خطأ في معالجة الطلب';
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'مفتاح OpenAI غير صحيح أو مفقود';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'تم تجاوز حد الاستخدام، حاول لاحقاً';
      } else {
        errorMessage = error.message;
      }
    }

         return NextResponse.json(
       { 
         success: false, 
         error: errorMessage,
         mock: true,
         result: getMockResponse(body?.service || 'summarize', body?.content || '')
       },
       { status: 500 }
     );
  }
}

// Mock responses للاختبار
function getMockResponse(service: string, content: string): string {
  const mockResponses = {
    generate_title: 'عنوان تجريبي للمحتوى المقدم',
    summarize: 'ملخص تجريبي للمحتوى في سطرين أو ثلاثة.',
    expand: 'محتوى موسع تجريبياً مع تفاصيل إضافية وتحليل أعمق.',
    rewrite: 'محتوى معاد صياغته بأسلوب محسن ومهني.',
    translate: 'ترجمة تجريبية للمحتوى المقدم.',
    analyze: 'تحليل تجريبي مختصر يركز على النقاط الرئيسية.',
    extract_keywords: 'كلمة مفتاحية 1, كلمة مفتاحية 2, كلمة مفتاحية 3',
    generate_report: 'تقرير تجريبي كامل يتضمن مقدمة وتفاصيل وتحليل وخاتمة.'
  };

  return mockResponses[service as keyof typeof mockResponses] || 'نتيجة تجريبية';
}

// GET endpoint للمعلومات
export async function GET() {
  return NextResponse.json({
    success: true,
    info: {
      name: 'محرر سبق الذكي',
      version: '1.0.0',
      services: Object.keys(servicePrompts),
      features: [
        'أسلوب صحيفة سبق',
        'مفتاح OpenAI منفصل',
        'دعم GPS والخصائص المتقدمة',
        'تخزين كمسودة للمراجعة'
      ],
      systemPrompt: SABQ_SYSTEM_PROMPT.substring(0, 100) + '...'
    }
  });
} 