import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

// POST: بحث ذكي في الوسائط بناءً على محتوى المقال
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, limit = 10 } = await request.json();

    if (!title && !content) {
      return NextResponse.json(
        { error: "Title or content is required" },
        { status: 400 }
      );
    }

    // استخراج الكلمات المفتاحية من العنوان والمحتوى
    const keywords = extractKeywords(title, content);
    
    // البحث عن شخصيات مهمة في النص
    const importantPersons = detectImportantPersons(title + " " + (content || ""));
    
    // البحث عن مواضيع رئيسية
    const topics = detectTopics(title + " " + (content || ""));

    // بناء استعلام البحث
    const searchConditions = [];

    // البحث في العناوين والوصف
    if (keywords.length > 0) {
      searchConditions.push({
        OR: keywords.map(keyword => ({
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        })),
      });
    }

    // البحث في التصنيفات
    if (importantPersons.length > 0 || topics.length > 0) {
      const classifications = [...importantPersons, ...topics];
      searchConditions.push({
        classification: { in: classifications },
      });
    }

    // البحث في AI entities
    if (importantPersons.length > 0) {
      searchConditions.push({
        aiEntities: {
          array_contains: importantPersons,
        },
      });
    }

    // البحث في التاجات
    if (keywords.length > 0) {
      searchConditions.push({
        tags: {
          array_contains: keywords,
        },
      });
    }

    // تنفيذ البحث
    const media = await prisma.mediaFile.findMany({
      where: {
        AND: [
          { isArchived: false },
          {
            OR: searchConditions,
          },
        ],
      },
      take: limit,
      orderBy: [
        { usageCount: "desc" },
        { lastUsedAt: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // حساب درجة التطابق لكل ملف
    const scoredMedia = media.map((item) => {
      let score = 0;

      // نقاط للتطابق في العنوان
      keywords.forEach(keyword => {
        if (item.title?.toLowerCase().includes(keyword.toLowerCase())) {
          score += 10;
        }
        if (item.description?.toLowerCase().includes(keyword.toLowerCase())) {
          score += 5;
        }
      });

      // نقاط للشخصيات المهمة
      importantPersons.forEach(person => {
        if (item.classification === person) score += 15;
        if (Array.isArray(item.aiEntities) && item.aiEntities.includes(person)) {
          score += 12;
        }
      });

      // نقاط للمواضيع
      topics.forEach(topic => {
        if (item.classification === topic) score += 8;
        if (Array.isArray(item.tags) && item.tags.includes(topic)) {
          score += 6;
        }
      });

      // نقاط إضافية للاستخدام المتكرر
      score += Math.min(item.usageCount * 2, 20);

      return {
        ...item,
        relevanceScore: score,
        categories: item.categories.map((c) => c.category),
      };
    });

    // ترتيب حسب درجة التطابق
    scoredMedia.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      suggestions: scoredMedia,
      searchCriteria: {
        keywords,
        persons: importantPersons,
        topics,
      },
    });
  } catch (error) {
    console.error("Error searching media:", error);
    return NextResponse.json(
      { error: "Failed to search media" },
      { status: 500 }
    );
  }
}

// استخراج الكلمات المفتاحية
function extractKeywords(title: string, content?: string): string[] {
  const text = (title + " " + (content || "")).toLowerCase();
  
  // كلمات يجب تجاهلها
  const stopWords = new Set([
    "في", "من", "إلى", "على", "عن", "مع", "بعد", "قبل", "عند", "لدى",
    "التي", "الذي", "التي", "اللذان", "اللتان", "الذين", "اللاتي",
    "هذا", "هذه", "ذلك", "تلك", "هنا", "هناك", "هنالك",
    "كان", "كانت", "يكون", "تكون", "أصبح", "أصبحت", "صار", "صارت",
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"
  ]);

  // استخراج الكلمات
  const words = text.match(/[\u0600-\u06FF\w]+/g) || [];
  
  // تصفية وإزالة التكرار
  const keywords = [...new Set(
    words
      .filter(word => word.length > 2)
      .filter(word => !stopWords.has(word))
  )];

  return keywords.slice(0, 10); // أول 10 كلمات مفتاحية
}

// كشف الشخصيات المهمة
function detectImportantPersons(text: string): string[] {
  const persons: string[] = [];
  
  const personPatterns = [
    { pattern: /الملك سلمان|خادم الحرمين/gi, value: "king-salman" },
    { pattern: /ولي العهد|الأمير محمد بن سلمان|محمد بن سلمان/gi, value: "crown-prince-mbs" },
    { pattern: /وزير|الوزير/gi, value: "ministers" },
    { pattern: /أمير|الأمير/gi, value: "princes" },
  ];

  personPatterns.forEach(({ pattern, value }) => {
    if (pattern.test(text)) {
      persons.push(value);
    }
  });

  return persons;
}

// كشف المواضيع الرئيسية
function detectTopics(text: string): string[] {
  const topics: string[] = [];
  
  const topicPatterns = [
    { pattern: /مؤتمر|المؤتمر|قمة|القمة/gi, value: "conferences" },
    { pattern: /احتفال|الاحتفال|عيد|العيد/gi, value: "national-celebrations" },
    { pattern: /رمضان|الصيام|الإفطار/gi, value: "ramadan" },
    { pattern: /الحج|العمرة|الحرم|مكة|المدينة/gi, value: "hajj-umrah" },
    { pattern: /اليوم الوطني|الوطني السعودي/gi, value: "national-day" },
    { pattern: /رياضة|كرة القدم|البطولة|الدوري/gi, value: "sports-events" },
    { pattern: /وزارة|الوزارة/gi, value: "ministries" },
    { pattern: /جامعة|الجامعة|التعليم العالي/gi, value: "universities" },
  ];

  topicPatterns.forEach(({ pattern, value }) => {
    if (pattern.test(text)) {
      topics.push(value);
    }
  });

  return topics;
} 