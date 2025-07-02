import { NextRequest, NextResponse } from 'next/server';

// دالة لاستخراج الكلمات المفتاحية من النص
function extractKeywords(text: string): string[] {
  // إزالة علامات الترقيم والأرقام
  const cleanText = text
    .replace(/[^\u0600-\u06FF\u0750-\u077F\s]/g, ' ') // الاحتفاظ بالحروف العربية فقط
    .replace(/\s+/g, ' ')
    .trim();

  // قائمة الكلمات الشائعة التي يجب تجاهلها
  const stopWords = [
    'في', 'من', 'إلى', 'على', 'عن', 'مع', 'بعد', 'قبل', 'عند', 'لدى',
    'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'اللذان', 'اللتان',
    'كان', 'كانت', 'يكون', 'تكون', 'أن', 'إن', 'لكن', 'أو', 'أم',
    'هو', 'هي', 'هم', 'هن', 'أنا', 'أنت', 'نحن', 'أنتم',
    'كل', 'بعض', 'جميع', 'كثير', 'قليل', 'أكثر', 'أقل',
    'يوم', 'أمس', 'اليوم', 'غدا', 'الآن', 'هنا', 'هناك', 'هنالك'
  ];

  // تقسيم النص إلى كلمات
  const words = cleanText.split(' ').filter(word => 
    word.length > 2 && !stopWords.includes(word)
  );

  // حساب تكرار الكلمات
  const wordFrequency: { [key: string]: number } = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });

  // ترتيب الكلمات حسب التكرار
  const sortedWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15) // أعلى 15 كلمة
    .map(([word]) => word);

  return sortedWords;
}

// دالة لاستخراج الكيانات المسماة (Named Entities)
function extractNamedEntities(text: string): string[] {
  const entities: string[] = [];
  
  // البحث عن أسماء الأشخاص (كلمات تبدأ بحرف كبير)
  const personPatterns = [
    /الملك\s+[\u0600-\u06FF]+/g,
    /الأمير\s+[\u0600-\u06FF]+/g,
    /الشيخ\s+[\u0600-\u06FF]+/g,
    /الدكتور\s+[\u0600-\u06FF]+/g,
    /المهندس\s+[\u0600-\u06FF]+/g,
    /الوزير\s+[\u0600-\u06FF]+/g,
    /الرئيس\s+[\u0600-\u06FF]+/g
  ];

  personPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.push(...matches);
    }
  });

  // البحث عن أسماء المدن والدول
  const locations = [
    'السعودية', 'الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام', 'الخبر',
    'مصر', 'القاهرة', 'الإمارات', 'دبي', 'أبوظبي', 'الكويت', 'قطر',
    'البحرين', 'عمان', 'الأردن', 'لبنان', 'سوريا', 'العراق', 'فلسطين'
  ];

  locations.forEach(location => {
    if (text.includes(location)) {
      entities.push(location);
    }
  });

  // البحث عن المنظمات
  const orgPatterns = [
    /شركة\s+[\u0600-\u06FF]+/g,
    /مؤسسة\s+[\u0600-\u06FF]+/g,
    /جامعة\s+[\u0600-\u06FF]+/g,
    /وزارة\s+[\u0600-\u06FF]+/g,
    /هيئة\s+[\u0600-\u06FF]+/g
  ];

  orgPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.push(...matches);
    }
  });

  return [...new Set(entities)]; // إزالة التكرارات
}

// دالة لاستخراج المواضيع الرئيسية
function extractTopics(text: string): string[] {
  const topics: string[] = [];
  
  // قائمة المواضيع والكلمات المرتبطة بها
  const topicKeywords = {
    'رياضة': ['كرة القدم', 'مباراة', 'بطولة', 'لاعب', 'فريق', 'هدف', 'دوري'],
    'اقتصاد': ['اقتصاد', 'مال', 'بورصة', 'استثمار', 'شركة', 'أرباح', 'نمو'],
    'سياسة': ['حكومة', 'وزير', 'قرار', 'مجلس', 'انتخابات', 'برلمان', 'رئيس'],
    'تقنية': ['تقنية', 'تطبيق', 'ذكاء اصطناعي', 'برمجة', 'إنترنت', 'هاتف', 'حاسوب'],
    'صحة': ['صحة', 'مستشفى', 'طبيب', 'علاج', 'دواء', 'مرض', 'لقاح'],
    'تعليم': ['تعليم', 'جامعة', 'مدرسة', 'طالب', 'معلم', 'دراسة', 'امتحان'],
    'ثقافة': ['ثقافة', 'فن', 'معرض', 'كتاب', 'مؤلف', 'مسرح', 'سينما']
  };

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    const found = keywords.some(keyword => text.includes(keyword));
    if (found) {
      topics.push(topic);
    }
  });

  return topics;
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, excerpt } = await request.json();

    if (!title && !content && !excerpt) {
      return NextResponse.json(
        { error: 'يجب توفير عنوان أو محتوى على الأقل' },
        { status: 400 }
      );
    }

    // دمج النصوص
    const fullText = `${title || ''} ${excerpt || ''} ${content || ''}`;

    // استخراج الكلمات المفتاحية
    const keywords = extractKeywords(fullText);
    
    // استخراج الكيانات المسماة
    const entities = extractNamedEntities(fullText);
    
    // استخراج المواضيع
    const topics = extractTopics(fullText);

    // دمج جميع الاقتراحات
    const allSuggestions = [
      ...topics,
      ...entities.slice(0, 5), // أول 5 كيانات
      ...keywords.slice(0, 10) // أول 10 كلمات مفتاحية
    ];

    // إزالة التكرارات والحد الأقصى 15 اقتراح
    const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, 15);

    return NextResponse.json({
      keywords: uniqueSuggestions,
      analysis: {
        topics,
        entities: entities.slice(0, 5),
        frequentWords: keywords.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('خطأ في استخراج الكلمات المفتاحية:', error);
    return NextResponse.json(
      { error: 'فشل استخراج الكلمات المفتاحية' },
      { status: 500 }
    );
  }
} 