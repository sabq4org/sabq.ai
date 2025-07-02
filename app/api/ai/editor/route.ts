import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// تهيئة OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// أنواع المهام المتاحة
type AITaskType = 'generate_paragraph' | 'rewrite' | 'summarize' | 'keywords' | 'title' | 'full_article';

// الحصول على النظام المناسب لكل مهمة
function getSystemPrompt(type: AITaskType): string {
  const prompts = {
    generate_paragraph: 'أنت مساعد صحفي محترف تكتب باللغة العربية الفصحى. اكتب فقرات واضحة ومترابطة.',
    rewrite: 'أنت محرر لغوي محترف. أعد صياغة النص بأسلوب أفضل مع الحفاظ على المعنى.',
    summarize: 'أنت خبير في التلخيص. لخص النص في نقاط واضحة ومختصرة.',
    keywords: 'أنت خبير في تحليل المحتوى. استخرج الكلمات المفتاحية الأكثر أهمية.',
    title: 'أنت خبير في كتابة العناوين الصحفية. اكتب عناوين جذابة ومعبرة.',
    full_article: 'أنت صحفي محترف. اكتب مقالاً كاملاً متوازناً وشاملاً.'
  };
  
  return prompts[type] || prompts.generate_paragraph;
}

// بناء البرومبت حسب نوع المهمة
function buildPrompt(type: AITaskType, content: string, context?: any): string {
  switch (type) {
    case 'generate_paragraph':
      return `اكتب فقرة تمهيدية احترافية حول: ${content}
      - يجب أن تكون الفقرة بين 100-150 كلمة
      - استخدم أسلوب صحفي واضح
      - ابدأ بجملة قوية تجذب القارئ`;
      
    case 'rewrite':
      return `أعد صياغة هذا النص بأسلوب أفضل:\n${content}
      - حسّن الصياغة والأسلوب
      - احتفظ بنفس المعنى والمعلومات
      - اجعل النص أكثر وضوحاً وسلاسة`;
      
    case 'summarize':
      return `لخص هذا النص في نقاط واضحة:\n${content}
      - استخرج النقاط الرئيسية
      - اكتب كل نقطة في سطر منفصل
      - لا تتجاوز 5 نقاط`;
      
    case 'keywords':
      return `استخرج الكلمات المفتاحية من هذا النص:\n${content}
      - اختر 5-8 كلمات مفتاحية
      - رتبها حسب الأهمية
      - اكتب كل كلمة في سطر منفصل`;
      
    case 'title':
      const excerpt = context?.excerpt || content;
      return `اقترح 3 عناوين جذابة لمقال بناءً على هذا الموجز:\n${excerpt}
      - العناوين يجب أن تكون قصيرة ومعبرة
      - استخدم أساليب متنوعة (خبري، تساؤلي، تشويقي)
      - اكتب كل عنوان في سطر منفصل`;
      
    case 'full_article':
      return `اكتب مقالاً صحفياً كاملاً حول: ${content}
      البنية المطلوبة:
      1. مقدمة قوية (100 كلمة)
      2. الجسم الرئيسي (300-400 كلمة) مقسم لفقرات
      3. خاتمة (50-100 كلمة)
      
      ملاحظات:
      - استخدم أسلوب صحفي احترافي
      - أضف معلومات ذات صلة
      - اجعل المقال متوازناً وشاملاً`;
      
    default:
      return content;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, context } = body;
    
    if (!content || !type) {
      return NextResponse.json(
        { error: 'المحتوى ونوع المهمة مطلوبان' },
        { status: 400 }
      );
    }
    
    // التحقق من وجود مفتاح API
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      // إرجاع نص تجريبي في حالة عدم وجود المفتاح
      return NextResponse.json({
        result: getMockResponse(type, content),
        mock: true
      });
    }
    
    // بناء الرسائل للذكاء الاصطناعي
    const systemPrompt = getSystemPrompt(type as AITaskType);
    const userPrompt = buildPrompt(type as AITaskType, content, context);
    
    console.log('AI Request:', { type, contentLength: content.length });
    
    // استدعاء OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: type === 'full_article' ? 1500 : 500,
    });
    
    const result = completion.choices[0].message.content;
    
    // تنسيق النتيجة حسب نوع المهمة
    let formattedResult = result;
    
    if (type === 'keywords') {
      // تحويل الكلمات المفتاحية إلى مصفوفة
      const keywords = result?.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*•]\s*/, '').trim());
      
      formattedResult = keywords?.join(', ');
    } else if (type === 'title') {
      // تنسيق العناوين كقائمة
      const titles = result?.split('\n')
        .filter(line => line.trim())
        .map((line, index) => `${index + 1}. ${line.replace(/^[-*•\d.]\s*/, '').trim()}`);
      
      formattedResult = titles?.join('\n');
    }
    
    return NextResponse.json({
      result: formattedResult,
      type,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI Editor Error:', error);
    
    // في حالة الخطأ، إرجاع نص تجريبي
    return NextResponse.json({
      result: getMockResponse(
        request.body?.type || 'generate_paragraph',
        request.body?.content || ''
      ),
      mock: true,
      error: error instanceof Error ? error.message : 'حدث خطأ في معالجة الطلب'
    });
  }
}

// نصوص تجريبية في حالة عدم توفر API
function getMockResponse(type: string, content: string): string {
  const mockResponses = {
    generate_paragraph: `هذه فقرة تجريبية حول الموضوع المطلوب. في عصر التكنولوجيا الحديثة، أصبح استخدام الذكاء الاصطناعي جزءاً لا يتجزأ من حياتنا اليومية. يساعد الذكاء الاصطناعي في تحسين جودة المحتوى وتسريع عملية الكتابة، مما يتيح للصحفيين والكتاب التركيز على الجوانب الإبداعية في عملهم.`,
    
    rewrite: `[نص معاد صياغته] ${content.substring(0, 50)}... تمت إعادة الصياغة بأسلوب أكثر وضوحاً وسلاسة.`,
    
    summarize: `• النقطة الأولى: ملخص مهم من النص
• النقطة الثانية: معلومة رئيسية أخرى
• النقطة الثالثة: خلاصة الموضوع`,
    
    keywords: `ذكاء اصطناعي، تكنولوجيا، محتوى رقمي، صحافة، ابتكار`,
    
    title: `1. عنوان إخباري: التكنولوجيا تغير وجه الصحافة الحديثة
2. عنوان تشويقي: كيف يحول الذكاء الاصطناعي عالم الإعلام؟
3. عنوان وصفي: دور الذكاء الاصطناعي في تطوير المحتوى الرقمي`,
    
    full_article: `عنوان: الذكاء الاصطناعي يعيد تشكيل مستقبل الصحافة

في ظل التطور التكنولوجي المتسارع، يبرز الذكاء الاصطناعي كأحد أهم الأدوات التي تعيد تشكيل مشهد الصحافة والإعلام. هذه التقنية الثورية لا تقتصر على كونها مجرد أداة مساعدة، بل أصبحت شريكاً فعالاً في عملية إنتاج المحتوى.

يساهم الذكاء الاصطناعي في تحسين جودة المحتوى الصحفي من خلال عدة جوانب. أولاً، يساعد في تحليل البيانات الضخمة واستخراج المعلومات المهمة بسرعة فائقة. ثانياً، يمكنه اقتراح عناوين جذابة وكلمات مفتاحية مناسبة. ثالثاً، يساعد في التدقيق اللغوي وتحسين الأسلوب.

مع ذلك، يبقى العنصر البشري هو الأساس في العملية الصحفية. فالإبداع والتفكير النقدي والقدرة على التواصل العاطفي مع القراء هي مهارات لا يمكن للآلة أن تحل محلها. الذكاء الاصطناعي هو أداة تمكينية تساعد الصحفيين على أداء عملهم بشكل أفضل وأكثر كفاءة.

في الختام، يمثل التكامل بين الذكاء الاصطناعي والعقل البشري مستقبل الصحافة. هذا التعاون يفتح آفاقاً جديدة للإبداع والابتكار في عالم الإعلام.`
  };
  
  return mockResponses[type] || mockResponses.generate_paragraph;
}

// للحصول على معلومات حول API
export async function GET() {
  return NextResponse.json({
    status: 'active',
    actions: [
      'generate_paragraph',
      'rewrite',
      'summarize',
      'keywords', 
      'title',
      'full_article'
    ],
    message: 'AI Editor API is running'
  });
} 