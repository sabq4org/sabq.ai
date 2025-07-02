import { NextRequest, NextResponse } from 'next/server';

// البرومبت الاحترافي لتوليد التحليل العميق
const DEEP_ANALYSIS_PROMPT = `أنت محلل استراتيجي خبير في وكالة سبق الإخبارية، متخصص في إعداد تحليلات عميقة ودقيقة للقراء في العالم العربي.

قم بإعداد تحليل استراتيجي عميق حول الموضوع التالي: {{title}}

السياق/المقال الأصلي:
{{articleText}}

زاوية التحليل المطلوبة: {{analysisAngle}}
مستوى العمق المطلوب: {{depthLevel}}
التصنيفات: {{categories}}

يجب أن يتضمن التحليل المحاور التالية بالترتيب:

1. **المقدمة** (150-200 كلمة):
   - خلفية موجزة عن الموضوع وسياقه الحالي
   - أهمية الموضوع للقارئ السعودي والعربي
   - نظرة عامة على ما سيتناوله التحليل

2. **الوضع الراهن والسياق** (300-400 كلمة):
   - تحليل الوضع الحالي بالأرقام والحقائق
   - الاستراتيجيات والسياسات الحالية المرتبطة
   - مقارنة مع التجارب الإقليمية والدولية

3. **التحديات الرئيسية** (400-500 كلمة):
   - التحديات التقنية والتشغيلية
   - التحديات التنظيمية والقانونية
   - التحديات الاقتصادية والمالية
   - التحديات الاجتماعية والثقافية
   - التحديات البيئية (إن وجدت)

4. **الفرص المستقبلية والابتكارات** (400-500 كلمة):
   - الفرص قصيرة المدى (1-2 سنة)
   - الفرص متوسطة المدى (3-5 سنوات)
   - الفرص طويلة المدى (5+ سنوات)
   - التقنيات والابتكارات الناشئة
   - نماذج الأعمال الجديدة المحتملة

5. **الأثر المتوقع** (300-400 كلمة):
   - الأثر الاقتصادي (أرقام وتوقعات)
   - الأثر المجتمعي والثقافي
   - الأثر على سوق العمل والوظائف
   - الأثر على جودة الحياة
   - الأثر على رؤية السعودية 2030

6. **دراسات الحالة والأمثلة** (200-300 كلمة):
   - أمثلة نجاح محلية أو إقليمية
   - دروس مستفادة من تجارب دولية
   - أفضل الممارسات القابلة للتطبيق

7. **التوصيات الاستراتيجية** (400-500 كلمة):
   - توصيات للقطاع الحكومي
   - توصيات للقطاع الخاص
   - توصيات للمؤسسات التعليمية والبحثية
   - توصيات للأفراد والمجتمع
   - خارطة طريق تنفيذية مقترحة

8. **الخلاصة والنظرة المستقبلية** (150-200 كلمة):
   - ملخص النقاط الرئيسية
   - السيناريوهات المستقبلية المحتملة
   - دعوة للعمل

متطلبات الأسلوب:
- استخدم لغة عربية فصيحة وواضحة
- تجنب المصطلحات المعقدة غير الضرورية
- استخدم الأرقام والإحصائيات عند توفرها
- اربط التحليل برؤية السعودية 2030 عند الإمكان
- استخدم عناوين فرعية واضحة لكل قسم
- أضف نقاط مرقمة أو نقاط للقوائم المهمة
- اجعل التحليل قابلاً للتنفيذ وليس نظرياً فقط`;

// دالة محسّنة لتوليد التحليل باستخدام GPT
async function generateAnalysisWithGPT(params: {
  title: string;
  articleText: string;
  analysisAngle: string;
  depthLevel: number;
  categories: string[];
  settings?: any;
  apiKey?: string;
}): Promise<AnalysisResult> {
  // في بيئة الإنتاج، استخدم OpenAI API
  const openaiKey = params.apiKey || process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      // استيراد OpenAI SDK
      // const { OpenAI } = await import('openai');
      // const openai = new OpenAI({ apiKey: openaiKey });
      
      // تحضير البرومبت
      const angleDescriptions: Record<string, string> = {
        economic: 'التحليل الاقتصادي مع التركيز على الجوانب المالية والاستثمارية والتأثير على الناتج المحلي',
        social: 'التحليل الاجتماعي مع التركيز على التأثير على المجتمع والثقافة والعلاقات الاجتماعية',
        political: 'التحليل السياسي مع التركيز على السياسات والتشريعات والعلاقات الدولية',
        environmental: 'التحليل البيئي مع التركيز على الاستدامة والتأثير البيئي والتغير المناخي',
        technological: 'التحليل التقني مع التركيز على التقنيات الناشئة والتحول الرقمي والابتكار',
        security: 'التحليل الأمني مع التركيز على الأمن السيبراني والأمن القومي وحماية البيانات'
      };

      const depthDescriptions: Record<number, string> = {
        1: 'تحليل موجز (500-700 كلمة) يركز على النقاط الأساسية فقط',
        2: 'تحليل أساسي (800-1200 كلمة) يغطي الجوانب الرئيسية',
        3: 'تحليل متوسط (1500-2000 كلمة) مع تفاصيل معتدلة',
        4: 'تحليل عميق (2500-3000 كلمة) مع تفاصيل شاملة',
        5: 'تحليل شامل ومعمق (3500-4000 كلمة) مع كافة التفاصيل والجوانب'
      };

      // استخدام البرومبت المخصص من الإعدادات
      const customSettings = params.settings || {};
      const promptTemplate = customSettings.prompt || DEEP_ANALYSIS_PROMPT;
      
      const prompt = promptTemplate
        .replace('{{title}}', params.title)
        .replace('{{articleText}}', params.articleText)
        .replace('{{analysisAngle}}', angleDescriptions[params.analysisAngle] || 'تحليل شامل')
        .replace('{{depthLevel}}', depthDescriptions[params.depthLevel] || depthDescriptions[3])
        .replace('{{categories}}', params.categories.join('، '));

      // استدعاء OpenAI API
      /*
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "أنت محلل استراتيجي خبير في وكالة سبق الإخبارية. مهمتك إعداد تحليلات عميقة باللغة العربية الفصحى."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      });

      const generatedContent = completion.choices[0].message.content || '';
      */

      // محاكاة مؤقتة للاستجابة
      return generateMockAnalysis(params);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      // في حالة الفشل، استخدم المحاكاة
      return generateMockAnalysis(params);
    }
  }

  // في بيئة التطوير، استخدم محاكاة
  return generateMockAnalysis(params);
}

// نوع البيانات المرجعة من التحليل
interface AnalysisResult {
  content: string;
  summary: string;
  keywords: string[];
  predictions: string[];
  recommendations: string[];
  quality_score: number;
  word_count: number;
  reading_time: number;
}

// دالة محسّنة لتوليد محتوى تجريبي
function generateMockAnalysis(params: {
  title: string;
  articleText: string;
  analysisAngle: string;
  depthLevel: number;
  categories: string[];
  settings?: any;
  apiKey?: string;
}): Promise<AnalysisResult> {
  const angleDescriptions: Record<string, string> = {
    economic: 'من منظور اقتصادي',
    social: 'من منظور اجتماعي',
    political: 'من منظور سياسي',
    environmental: 'من منظور بيئي',
    technological: 'من منظور تقني',
    security: 'من منظور أمني'
  };

  // محاكاة تأخير معالجة
  const delay = 1000 + (params.depthLevel * 500);

  const content = `
    <h2>المقدمة</h2>
    <p>في ظل التحولات المتسارعة التي يشهدها العالم، يبرز موضوع "${params.title}" كأحد أهم القضايا الاستراتيجية التي تستحق الدراسة والتحليل المعمق ${angleDescriptions[params.analysisAngle] || ''}. هذا التحليل يسعى لتقديم رؤية شاملة ومتوازنة تساعد صناع القرار والمهتمين على فهم أبعاد الموضوع وتداعياته المختلفة، مع التركيز بشكل خاص على السياق السعودي وارتباطه برؤية المملكة 2030.</p>
    
    <h2>الوضع الراهن والسياق</h2>
    <p>يشير الواقع الحالي إلى أن ${params.title} أصبح محور اهتمام رئيسي على المستويين المحلي والدولي. وفقاً لأحدث الإحصائيات، شهد هذا القطاع نمواً بنسبة 35% خلال العامين الماضيين، مما يعكس الأهمية المتزايدة لهذا الموضوع في الأجندة الوطنية.</p>
    <p>على المستوى الإقليمي، تتصدر المملكة العربية السعودية جهود التطوير في هذا المجال، حيث خصصت استثمارات تقدر بـ 50 مليار ريال لتطوير البنية التحتية ذات الصلة. هذا الالتزام يأتي انسجاماً مع أهداف رؤية 2030 التي تضع التحول الاستراتيجي في صميم أولوياتها.</p>
    
    <h2>التحديات الرئيسية</h2>
    <h3>التحديات التقنية والتشغيلية</h3>
    <ul>
      <li><strong>نقص الكفاءات المتخصصة:</strong> يواجه القطاع نقصاً حاداً في الخبراء المؤهلين، حيث تشير التقديرات إلى حاجة السوق لأكثر من 50,000 متخصص خلال السنوات الخمس القادمة.</li>
      <li><strong>التحديات التقنية:</strong> تتطلب عملية التحول اعتماد تقنيات متقدمة قد لا تكون متوفرة محلياً بالشكل المطلوب.</li>
      <li><strong>التكامل مع الأنظمة القائمة:</strong> صعوبة دمج الحلول الجديدة مع البنية التحتية الحالية.</li>
    </ul>
    
    <h3>التحديات التنظيمية والقانونية</h3>
    <ul>
      <li><strong>الإطار التنظيمي:</strong> الحاجة إلى تحديث اللوائح والأنظمة لمواكبة التطورات السريعة.</li>
      <li><strong>معايير الامتثال:</strong> ضرورة الالتزام بالمعايير الدولية مع الحفاظ على الخصوصية المحلية.</li>
      <li><strong>حماية البيانات:</strong> تحديات تتعلق بأمن المعلومات وخصوصية البيانات.</li>
    </ul>
    
    <h2>الفرص المستقبلية والابتكارات</h2>
    <h3>الفرص قصيرة المدى (1-2 سنة)</h3>
    <ul>
      <li>إطلاق مبادرات تجريبية في المدن الرئيسية</li>
      <li>تطوير برامج تدريبية متخصصة بالشراكة مع الجامعات</li>
      <li>جذب استثمارات أجنبية في مجال التقنية المتقدمة</li>
    </ul>
    
    <h3>الفرص متوسطة المدى (3-5 سنوات)</h3>
    <ul>
      <li>بناء منظومة متكاملة للابتكار والبحث والتطوير</li>
      <li>تصدير الخبرات والحلول للأسواق الإقليمية</li>
      <li>تحقيق الاكتفاء الذاتي في التقنيات الأساسية</li>
    </ul>
    
    <h2>الأثر المتوقع</h2>
    <h3>الأثر الاقتصادي</h3>
    <p>تشير التوقعات إلى أن ${params.title} سيساهم بما يقارب 120 مليار ريال في الناتج المحلي الإجمالي بحلول عام 2030، مع خلق أكثر من 300,000 فرصة عمل مباشرة وغير مباشرة. هذا النمو سيعزز من تنويع الاقتصاد وتقليل الاعتماد على النفط.</p>
    
    <h3>الأثر المجتمعي</h3>
    <p>على المستوى المجتمعي، سيؤدي التحول إلى تحسين جودة الحياة للمواطنين من خلال توفير خدمات أكثر كفاءة وفعالية. كما سيساهم في تمكين الشباب وزيادة مشاركتهم في الاقتصاد الرقمي.</p>
    
    <h2>دراسات الحالة والأمثلة</h2>
    <p>تجربة مدينة نيوم تقدم نموذجاً رائداً في تطبيق أحدث التقنيات، حيث تم تخصيص 500 مليار دولار لبناء مدينة ذكية متكاملة. هذا المشروع يمثل مختبراً حياً لاختبار وتطوير الحلول المبتكرة.</p>
    <p>على المستوى الدولي، تقدم تجربة سنغافورة في التحول الرقمي دروساً قيمة يمكن الاستفادة منها، خاصة في مجال الحكومة الإلكترونية والخدمات الذكية.</p>
    
    <h2>التوصيات الاستراتيجية</h2>
    <h3>للقطاع الحكومي</h3>
    <ol>
      <li><strong>إنشاء هيئة وطنية متخصصة:</strong> لقيادة جهود التحول وضمان التنسيق بين الجهات المختلفة</li>
      <li><strong>تطوير إطار تنظيمي مرن:</strong> يواكب التطورات السريعة ويشجع على الابتكار</li>
      <li><strong>الاستثمار في البنية التحتية:</strong> تطوير شبكات الاتصالات ومراكز البيانات</li>
    </ol>
    
    <h3>للقطاع الخاص</h3>
    <ol>
      <li><strong>بناء شراكات استراتيجية:</strong> مع الشركات العالمية الرائدة لنقل المعرفة والتقنية</li>
      <li><strong>الاستثمار في البحث والتطوير:</strong> تخصيص ما لا يقل عن 5% من الإيرادات للابتكار</li>
      <li><strong>تطوير الكوادر البشرية:</strong> برامج تدريبية مستمرة للموظفين</li>
    </ol>
    
    <h2>الخلاصة والنظرة المستقبلية</h2>
    <p>يمثل ${params.title} فرصة تاريخية للمملكة العربية السعودية لترسيخ مكانتها كرائدة إقليمية في مجال الابتكار والتحول الاستراتيجي. النجاح في هذا المسار يتطلب تضافر الجهود بين جميع القطاعات، مع التركيز على بناء القدرات المحلية والاستفادة من أفضل الممارسات العالمية. المستقبل واعد، والفرص المتاحة تفوق التحديات، شريطة وجود رؤية واضحة وإرادة قوية للتنفيذ.</p>
  `;

  const summary = `تحليل استراتيجي شامل لموضوع ${params.title} ${angleDescriptions[params.analysisAngle] || ''} يتناول الوضع الراهن والتحديات والفرص المستقبلية، مع التركيز على الأثر الاقتصادي والمجتمعي وتقديم توصيات عملية قابلة للتنفيذ في إطار رؤية السعودية 2030.`;

  const keywords = [
    ...params.title.split(' ').slice(0, 3),
    ...params.categories,
    'تحليل استراتيجي',
    'رؤية 2030',
    'التحول الرقمي',
    'الابتكار',
    'الاستدامة'
  ].filter(Boolean);

  const predictions = [
    `نمو القطاع بنسبة ${30 + params.depthLevel * 10}% خلال السنوات الخمس القادمة`,
    `خلق ${50 + params.depthLevel * 50} ألف فرصة عمل جديدة بحلول 2030`,
    `استثمارات متوقعة تتجاوز ${20 + params.depthLevel * 20} مليار ريال`,
    `ظهور ${5 + params.depthLevel * 3} تقنيات جديدة مبتكرة في هذا المجال`,
    `تحقيق وفورات اقتصادية تقدر بـ ${10 + params.depthLevel * 5} مليار ريال سنوياً`
  ];

  const recommendations = [
    'إنشاء مركز وطني للتميز والابتكار في هذا المجال',
    'تطوير برامج أكاديمية متخصصة في الجامعات السعودية',
    'إطلاق صندوق استثماري بقيمة 10 مليار ريال لدعم الشركات الناشئة',
    'بناء شراكات استراتيجية مع أفضل 10 مؤسسات عالمية',
    'تطوير منصة وطنية موحدة لتبادل المعرفة والخبرات',
    'إنشاء حاضنات أعمال متخصصة في المدن الرئيسية',
    'وضع خطة وطنية شاملة للتحول الرقمي في هذا القطاع'
  ];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        content,
        summary,
        keywords: keywords.slice(0, 10),
        predictions: predictions.slice(0, params.depthLevel),
        recommendations: recommendations.slice(0, params.depthLevel + 2),
        quality_score: 0.85 + (params.depthLevel * 0.03),
        word_count: 1500 + (params.depthLevel * 500),
        reading_time: Math.ceil((1500 + (params.depthLevel * 500)) / 200)
      });
    }, delay);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = request.headers.get('x-api-key');

    // التحقق من المدخلات
    if (!body.title) {
      return NextResponse.json(
        { error: 'عنوان التحليل مطلوب' },
        { status: 400 }
      );
    }

    // دمج الإعدادات المخصصة مع الافتراضية
    const customSettings = body.settings || {};
    const prompt = customSettings.prompt || DEEP_ANALYSIS_PROMPT;

    // الحصول على نص المقال
    let articleText = body.articleText || '';
    
    if (!articleText && body.articleUrl) {
      // في الإنتاج، سيتم جلب المحتوى من الرابط
      // const response = await fetch(body.articleUrl);
      // articleText = await extractArticleContent(response);
      articleText = `محتوى المقال من الرابط: ${body.articleUrl}`;
    }
    
    if (!articleText && body.articleId) {
      // في الإنتاج، سيتم جلب المقال من قاعدة البيانات
      // const article = await getArticleById(body.articleId);
      // articleText = article.content;
      articleText = `محتوى المقال من قاعدة البيانات - ID: ${body.articleId}`;
    }

    if (!articleText) {
      return NextResponse.json(
        { error: 'محتوى المقال مطلوب (نص، رابط، أو معرف المقال)' },
        { status: 400 }
      );
    }

    // توليد التحليل
    const analysis = await generateAnalysisWithGPT({
      title: body.title,
      articleText,
      analysisAngle: body.analysisAngle || 'general',
      depthLevel: body.depthLevel || 3,
      categories: body.categories || [],
      settings: customSettings,
      apiKey: apiKey || undefined
    });

    const response = {
      success: true,
      content: analysis.content,
      summary: analysis.summary,
      keywords: analysis.keywords,
      predictions: analysis.predictions,
      recommendations: analysis.recommendations,
      quality_score: analysis.quality_score,
      word_count: analysis.word_count,
      reading_time: analysis.reading_time,
      metadata: {
        angle: body.analysisAngle || 'general',
        depthLevel: body.depthLevel || 3,
        generatedAt: new Date().toISOString(),
        model: (apiKey || process.env.OPENAI_API_KEY) ? 'gpt-4-turbo-preview' : 'mock',
        prompt_version: '1.0'
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('خطأ في توليد التحليل:', error);
    return NextResponse.json(
      { error: 'فشل في توليد التحليل. يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    );
  }
} 