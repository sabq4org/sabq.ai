import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// قاموس الكلمات المحظورة باللغة العربية والإنجليزية
const BANNED_WORDS = [
  // كلمات مسيئة عربية (مثال - يجب إضافة المزيد حسب الحاجة)
  'غبي', 'احمق', 'حمار', 'كلب', 'قذر',
  // كلمات مسيئة إنجليزية
  'stupid', 'idiot', 'fool', 'hate', 'kill',
  // كلمات دعائية
  'اشتري الآن', 'عرض خاص', 'مجاني', 'ربح سريع',
  'buy now', 'free money', 'click here', 'special offer'
];

// أنماط السبام الشائعة
const SPAM_PATTERNS = [
  /(.)\1{4,}/g, // تكرار الحرف أكثر من 4 مرات
  /[A-Z]{5,}/g, // أحرف كبيرة متتالية
  /https?:\/\/[^\s]+/g, // روابط مشبوهة
  /\b\d{10,}\b/g, // أرقام طويلة (هواتف)
  /[!@#$%^&*]{3,}/g, // رموز خاصة متكررة
];

// حد التشابه المسموح
const SIMILARITY_THRESHOLD = 0.8;

/**
 * فحص شامل للسبام والمحتوى المسيء
 */
export async function checkForSpam(
  content: string,
  userId: string,
  context: 'comment' | 'article' = 'comment'
): Promise<{
  isSpam: boolean;
  reason?: string;
  severity: number; // 1-10
  suggestions?: string[];
}> {
  try {
    const checks = await Promise.all([
      checkBannedWords(content),
      checkSpamPatterns(content),
      checkRateLimit(userId, context),
      checkDuplicateContent(content, userId, context),
      checkUserHistory(userId),
      checkContentQuality(content)
    ]);

    // تجميع النتائج
    const results = checks.filter(check => check.isSpam);
    
    if (results.length === 0) {
      return { isSpam: false, severity: 0 };
    }

    // حساب مستوى الخطورة
    const maxSeverity = Math.max(...results.map(r => r.severity));
    const totalSeverity = results.reduce((sum, r) => sum + r.severity, 0);
    
    // إذا كان المجموع أكبر من 15 أو أقصى خطورة أكبر من 8
    const isSpam = totalSeverity > 15 || maxSeverity > 8;

    return {
      isSpam,
      reason: results[0].reason,
      severity: maxSeverity,
      suggestions: results.flatMap(r => r.suggestions || [])
    };

  } catch (error) {
    console.error('Error in spam check:', error);
    return { isSpam: false, severity: 0 };
  }
}

/**
 * فحص الكلمات المحظورة
 */
async function checkBannedWords(content: string): Promise<SpamCheckResult> {
  const normalizedContent = content.toLowerCase();
  
  // فحص الكلمات المحظورة المحفوظة في قاعدة البيانات
  const spamFilters = await prisma.spamFilter.findMany({
    where: {
      is_active: true,
      type: { in: ['keyword', 'regex'] }
    }
  });

  // فحص الكلمات المحظورة المدمجة
  const foundBannedWords = BANNED_WORDS.filter(word => 
    normalizedContent.includes(word.toLowerCase())
  );

  if (foundBannedWords.length > 0) {
    return {
      isSpam: true,
      reason: `محتوى يحتوي على كلمات محظورة: ${foundBannedWords.join(', ')}`,
      severity: 9,
      suggestions: ['قم بإزالة الكلمات المسيئة', 'استخدم لغة مهذبة']
    };
  }

  // فحص الفلاتر المخصصة
  for (const filter of spamFilters) {
    if (filter.type === 'keyword') {
      if (normalizedContent.includes(filter.pattern.toLowerCase())) {
        return {
          isSpam: true,
          reason: `محتوى يحتوي على كلمة محظورة: ${filter.pattern}`,
          severity: filter.severity,
          suggestions: ['قم بتعديل المحتوى ليكون أكثر مناسبة']
        };
      }
    } else if (filter.type === 'regex') {
      const regex = new RegExp(filter.pattern, 'i');
      if (regex.test(content)) {
        return {
          isSpam: true,
          reason: `محتوى يطابق نمط محظور`,
          severity: filter.severity,
          suggestions: ['قم بمراجعة المحتوى وتعديله']
        };
      }
    }
  }

  return { isSpam: false, severity: 0 };
}

/**
 * فحص أنماط السبام
 */
async function checkSpamPatterns(content: string): Promise<SpamCheckResult> {
  let severity = 0;
  const issues: string[] = [];

  // فحص الأنماط المشبوهة
  for (const pattern of SPAM_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      severity += matches.length * 2;
      issues.push(`نمط مشبوه: ${pattern.source}`);
    }
  }

  // فحص نسبة الأحرف الكبيرة
  const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (upperCaseRatio > 0.5) {
    severity += 5;
    issues.push('نسبة عالية من الأحرف الكبيرة');
  }

  // فحص الروابط المفرطة
  const links = content.match(/https?:\/\/[^\s]+/g) || [];
  if (links.length > 2) {
    severity += links.length * 3;
    issues.push('عدد مفرط من الروابط');
  }

  // فحص التكرار المفرط
  const repeatedChars = content.match(/(.)\1{3,}/g) || [];
  if (repeatedChars.length > 0) {
    severity += repeatedChars.length * 2;
    issues.push('تكرار مفرط للأحرف');
  }

  if (severity > 8) {
    return {
      isSpam: true,
      reason: `محتوى يحتوي على أنماط سبام: ${issues.join(', ')}`,
      severity: Math.min(severity, 10),
      suggestions: [
        'قلل من استخدام الأحرف الكبيرة',
        'تجنب تكرار الأحرف',
        'قلل عدد الروابط'
      ]
    };
  }

  return { isSpam: false, severity };
}

/**
 * فحص معدل النشر
 */
async function checkRateLimit(userId: string, context: string): Promise<SpamCheckResult> {
  const timeWindow = 5 * 60 * 1000; // 5 دقائق
  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindow);

  let recentCount = 0;
  let maxAllowed = 5;

  if (context === 'comment') {
    recentCount = await prisma.articleComment.count({
      where: {
        user_id: userId,
        created_at: { gte: windowStart }
      }
    });
    maxAllowed = 10; // 10 تعليقات في 5 دقائق
  }

  if (recentCount >= maxAllowed) {
    return {
      isSpam: true,
      reason: `تجاوز معدل النشر المسموح: ${recentCount} في آخر 5 دقائق`,
      severity: 7,
      suggestions: ['انتظر قليلاً قبل النشر مرة أخرى']
    };
  }

  return { isSpam: false, severity: 0 };
}

/**
 * فحص المحتوى المكرر
 */
async function checkDuplicateContent(
  content: string,
  userId: string,
  context: string
): Promise<SpamCheckResult> {
  const timeWindow = 24 * 60 * 60 * 1000; // 24 ساعة
  const windowStart = new Date(Date.now() - timeWindow);

  let recentContent: string[] = [];

  if (context === 'comment') {
    const recentComments = await prisma.articleComment.findMany({
      where: {
        user_id: userId,
        created_at: { gte: windowStart }
      },
      select: { content: true }
    });
    recentContent = recentComments.map(c => c.content);
  }

  // فحص التطابق التام
  if (recentContent.includes(content)) {
    return {
      isSpam: true,
      reason: 'محتوى مكرر تماماً',
      severity: 10,
      suggestions: ['قم بكتابة محتوى جديد ومختلف']
    };
  }

  // فحص التشابه العالي
  for (const existingContent of recentContent) {
    const similarity = calculateSimilarity(content, existingContent);
    if (similarity > SIMILARITY_THRESHOLD) {
      return {
        isSpam: true,
        reason: `محتوى مشابه بنسبة ${Math.round(similarity * 100)}%`,
        severity: 8,
        suggestions: ['قم بتنويع المحتوى أكثر']
      };
    }
  }

  return { isSpam: false, severity: 0 };
}

/**
 * فحص تاريخ المستخدم
 */
async function checkUserHistory(userId: string): Promise<SpamCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      created_at: true,
      _count: {
        select: {
          article_comments: {
            where: { status: 'reported' }
          }
        }
      }
    }
  });

  if (!user) {
    return { isSpam: false, severity: 0 };
  }

  let severity = 0;
  const issues: string[] = [];

  // حساب عمر الحساب
  const accountAge = Date.now() - user.created_at.getTime();
  const daysSinceCreation = accountAge / (24 * 60 * 60 * 1000);

  // حساب جديد (أقل من 7 أيام)
  if (daysSinceCreation < 7) {
    severity += 3;
    issues.push('حساب جديد');
  }

  // تاريخ من التعليقات المبلغ عنها
  const reportedCommentsCount = user._count.article_comments;
  if (reportedCommentsCount > 5) {
    severity += reportedCommentsCount * 2;
    issues.push(`${reportedCommentsCount} تعليقات مبلغ عنها`);
  }

  if (severity > 6) {
    return {
      isSpam: true,
      reason: `تاريخ مشبوه: ${issues.join(', ')}`,
      severity: Math.min(severity, 10),
      suggestions: ['قم بتحسين سلوكك في المنصة']
    };
  }

  return { isSpam: false, severity };
}

/**
 * فحص جودة المحتوى
 */
async function checkContentQuality(content: string): Promise<SpamCheckResult> {
  let severity = 0;
  const issues: string[] = [];

  // محتوى قصير جداً
  if (content.length < 10) {
    severity += 4;
    issues.push('محتوى قصير جداً');
  }

  // محتوى طويل جداً بشكل مفرط
  if (content.length > 5000) {
    severity += 3;
    issues.push('محتوى طويل جداً');
  }

  // نسبة الأرقام العالية
  const numbersRatio = (content.match(/\d/g) || []).length / content.length;
  if (numbersRatio > 0.3) {
    severity += 4;
    issues.push('نسبة عالية من الأرقام');
  }

  // نسبة الرموز الخاصة العالية
  const specialCharsRatio = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length / content.length;
  if (specialCharsRatio > 0.2) {
    severity += 3;
    issues.push('نسبة عالية من الرموز الخاصة');
  }

  if (severity > 5) {
    return {
      isSpam: true,
      reason: `جودة محتوى منخفضة: ${issues.join(', ')}`,
      severity: Math.min(severity, 10),
      suggestions: [
        'اكتب محتوى أطول وأكثر تفصيلاً',
        'قلل من استخدام الأرقام والرموز الخاصة',
        'ركز على جودة المحتوى'
      ]
    };
  }

  return { isSpam: false, severity };
}

/**
 * حساب التشابه بين نصين
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * تحديث فلاتر السبام
 */
export async function updateSpamFilters(filters: {
  pattern: string;
  type: 'keyword' | 'regex';
  severity: number;
  description?: string;
}[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const filter of filters) {
      await tx.spamFilter.upsert({
        where: { pattern: filter.pattern },
        create: {
          pattern: filter.pattern,
          type: filter.type,
          severity: filter.severity,
          description: filter.description,
          action: filter.severity > 7 ? 'block' : 'flag',
          is_active: true
        },
        update: {
          severity: filter.severity,
          description: filter.description,
          action: filter.severity > 7 ? 'block' : 'flag'
        }
      });
    }
  });
}

/**
 * إنشاء تقرير عن نشاط السبام
 */
export async function generateSpamReport(days: number = 7): Promise<{
  totalReports: number;
  blockedComments: number;
  topSpamReasons: Array<{ reason: string; count: number }>;
  spamTrends: Array<{ date: string; count: number }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [reports, blockedComments, spamByReason] = await Promise.all([
    prisma.commentReport.count({
      where: { created_at: { gte: startDate } }
    }),
    prisma.articleComment.count({
      where: {
        status: 'reported',
        created_at: { gte: startDate }
      }
    }),
    prisma.commentReport.groupBy({
      by: ['reason'],
      where: { created_at: { gte: startDate } },
      _count: { reason: true },
      orderBy: { _count: { reason: 'desc' } }
    })
  ]);

  return {
    totalReports: reports,
    blockedComments,
    topSpamReasons: spamByReason.map(item => ({
      reason: item.reason,
      count: item._count.reason
    })),
    spamTrends: [] // يمكن إضافة تحليل الاتجاهات لاحقاً
  };
}

// أنواع البيانات
interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
  severity: number;
  suggestions?: string[];
} 