import { NextRequest, NextResponse } from 'next/server';

// ===============================
// تحذير: بيانات مؤقتة
// ===============================
// TODO: استبدال جميع أجزاء التخزين المؤقت بقاعدة البيانات الحقيقية
// يجب ربط هذا API بجداول قاعدة البيانات التالية:
// - loyalty_points (سجل النقاط)
// - users (معلومات المستخدمين)
// - loyalty_rules (قواعد النقاط)
// - user_sessions (جلسات القراءة)

interface LoyaltyRequest {
  userId: number;
  action: string;
  sourceType: 'article' | 'comment' | 'share' | 'referral' | 'bonus' | 'campaign';
  sourceId?: number;
  metadata?: any;
  duration?: number; // مدة القراءة بالثواني
  sessionId?: string;
}

interface LoyaltyRule {
  rule_name: string;
  action: string;
  points: number;
  conditions: any;
  max_per_day: number | null;
  max_per_article: number | null;
  is_active: boolean;
}

// TODO: نقل هذه القواعد إلى جدول loyalty_rules في قاعدة البيانات
// قواعد النقاط حسب الجدول المطلوب
const LOYALTY_RULES: LoyaltyRule[] = [
  {
    rule_name: 'read_article',
    action: 'READ',
    points: 2,
    conditions: { min_duration: 30 },
    max_per_day: null,
    max_per_article: 1,
    is_active: true
  },
  {
    rule_name: 'long_reading',
    action: 'READ_LONG',
    points: 3,
    conditions: { min_duration: 60 },
    max_per_day: 50,
    max_per_article: null,
    is_active: true
  },
  {
    rule_name: 'share_article',
    action: 'SHARE',
    points: 5,
    conditions: {},
    max_per_day: 10,
    max_per_article: 1,
    is_active: true
  },
  {
    rule_name: 'like_article',
    action: 'LIKE',
    points: 1,
    conditions: {},
    max_per_day: 20,
    max_per_article: 1,
    is_active: true
  },
  {
    rule_name: 'comment_article',
    action: 'COMMENT',
    points: 4,
    conditions: {},
    max_per_day: 10,
    max_per_article: 1,
    is_active: true
  },
  {
    rule_name: 'reading_streak',
    action: 'BONUS_STREAK',
    points: 10,
    conditions: { consecutive_articles: 5 },
    max_per_day: 1,
    max_per_article: null,
    is_active: true
  },
  {
    rule_name: 'push_notification_open',
    action: 'NOTIFICATION_OPEN',
    points: 2,
    conditions: {},
    max_per_day: 5,
    max_per_article: 1,
    is_active: true
  },
  {
    rule_name: 'referral_signup',
    action: 'REFERRAL',
    points: 20,
    conditions: { verified_email: true },
    max_per_day: null,
    max_per_article: null,
    is_active: true
  }
];

// TODO: حذف هذا التخزين المؤقت بالكامل واستبداله بقاعدة البيانات الحقيقية
// محاكاة قاعدة البيانات (مؤقت - يجب إزالته)
const LOYALTY_STORAGE: { [key: string]: any } = {};

const getUserLoyaltyData = (userId: number) => {
  const key = `loyalty_${userId}`;
  if (!LOYALTY_STORAGE[key]) {
    LOYALTY_STORAGE[key] = {
      points: [],
      summary: {
        total_points: 0,
        level: 'Bronze',
        points_this_month: 0,
        points_this_week: 0
      }
    };
  }
  return LOYALTY_STORAGE[key];
};

const checkDailyLimit = (userId: number, action: string, maxPerDay: number | null): boolean => {
  if (!maxPerDay) return true;
  
  const userData = getUserLoyaltyData(userId);
  const today = new Date().toISOString().split('T')[0];
  const todayActions = userData.points.filter((p: any) => 
    p.action === action && p.created_at.startsWith(today)
  );
  
  return todayActions.length < maxPerDay;
};

const checkArticleLimit = (userId: number, action: string, sourceId: number, maxPerArticle: number | null): boolean => {
  if (!maxPerArticle) return true;
  
  const userData = getUserLoyaltyData(userId);
  const articleActions = userData.points.filter((p: any) => 
    p.action === action && p.source_id === sourceId
  );
  
  return articleActions.length < maxPerArticle;
};

const checkConditions = (rule: LoyaltyRule, metadata: any): boolean => {
  const conditions = rule.conditions;
  
  // التحقق من مدة القراءة
  if (conditions.min_duration && metadata.duration) {
    return metadata.duration >= conditions.min_duration;
  }
  
  // التحقق من المقالات المتتالية
  if (conditions.consecutive_articles && metadata.consecutive_articles) {
    return metadata.consecutive_articles >= conditions.consecutive_articles;
  }
  
  // التحقق من تأكيد الإيميل
  if (conditions.verified_email && metadata.verified_email !== undefined) {
    return metadata.verified_email === true;
  }
  
  return true;
};

const updateUserLevel = (totalPoints: number): string => {
  if (totalPoints >= 1000) return 'Platinum';
  if (totalPoints >= 500) return 'Gold';
  if (totalPoints >= 100) return 'Silver';
  return 'Bronze';
};

const checkReadingStreak = (userId: number, sessionId: string): number => {
  const sessionKey = `session_${userId}_${sessionId}`;
  if (!LOYALTY_STORAGE[sessionKey]) {
    LOYALTY_STORAGE[sessionKey] = { articles_read: 0 };
  }
  return LOYALTY_STORAGE[sessionKey].articles_read || 0;
};

const updateReadingSession = (userId: number, sessionId: string, articlesRead: number) => {
  const sessionKey = `session_${userId}_${sessionId}`;
  LOYALTY_STORAGE[sessionKey] = { 
    articles_read: articlesRead, 
    updated_at: new Date().toISOString() 
  };
};

export async function POST(request: NextRequest) {
  try {
    const body: LoyaltyRequest = await request.json();
    
    const { userId, action, sourceType, sourceId, metadata = {}, duration, sessionId } = body;
    
    if (!userId || !action || !sourceType) {
      return NextResponse.json(
        { error: 'بيانات مطلوبة مفقودة' },
        { status: 400 }
      );
    }

    // البحث عن القاعدة المناسبة
    let rule = LOYALTY_RULES.find(r => r.action === action && r.is_active);
    
    // تحديد القاعدة بناءً على مدة القراءة
    if (action === 'READ' && duration) {
      if (duration >= 60) {
        rule = LOYALTY_RULES.find(r => r.action === 'READ_long' && r.is_active);
      } else if (duration >= 30) {
        rule = LOYALTY_RULES.find(r => r.action === 'read' && r.is_active);
      }
    }
    
    if (!rule) {
      return NextResponse.json(
        { error: 'قاعدة غير موجودة لهذا النشاط' },
        { status: 404 }
      );
    }

    // التحقق من الشروط
    const metadataWithDuration = { ...metadata, duration };
    if (!checkConditions(rule, metadataWithDuration)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'لم تستوف الشروط المطلوبة',
          required_conditions: rule.conditions
        },
        { status: 400 }
      );
    }

    // التحقق من الحدود اليومية
    if (!checkDailyLimit(userId, action, rule.max_per_day)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'تم تجاوز الحد الأقصى اليومي',
          max_per_day: rule.max_per_day
        },
        { status: 429 }
      );
    }

    // التحقق من حدود المقال
    if (sourceId && !checkArticleLimit(userId, action, sourceId, rule.max_per_article)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'تم الحصول على نقاط لهذا المقال من قبل',
          max_per_article: rule.max_per_article
        },
        { status: 429 }
      );
    }

    // الحصول على بيانات المستخدم الحالية
    const userData = getUserLoyaltyData(userId);
    
    // إضافة النقاط الجديدة
    const newPoints = {
      id: Date.now(),
      action,
      points: rule.points,
      source_type: sourceType,
      source_id: sourceId,
      description: `حصل على ${rule.points} نقطة لـ ${action}`,
      metadata: metadataWithDuration,
      created_at: new Date().toISOString()
    };
    
    userData.points.push(newPoints);
    
    // تحديث الإجمالي
    userData.summary.total_points += rule.points;
    userData.summary.level = updateUserLevel(userData.summary.total_points);
    userData.summary.last_activity_at = new Date().toISOString();
    
    // فحص مكافأة المقالات المتتالية
    let bonusAwarded = false;
    if (action === 'read' && sessionId) {
      const currentStreak = checkReadingStreak(userId, sessionId) + 1;
      updateReadingSession(userId, sessionId, currentStreak);
      
      // منح مكافأة المقالات المتتالية (5 مقالات)
      if (currentStreak === 5) {
        const bonusRule = LOYALTY_RULES.find(r => r.action === 'bonus_streak');
        if (bonusRule && checkDailyLimit(userId, 'bonus_streak', bonusRule.max_per_day)) {
          const bonusPoints = {
            id: Date.now() + 1,
            action: 'bonus_streak',
            points: bonusRule.points,
            source_type: 'bonus',
            source_id: null,
            description: `مكافأة قراءة ${currentStreak} مقالات متتالية`,
            metadata: { consecutive_articles: currentStreak, session_id: sessionId },
            created_at: new Date().toISOString()
          };
          
          userData.points.push(bonusPoints);
          userData.summary.total_points += bonusRule.points;
          userData.summary.level = updateUserLevel(userData.summary.total_points);
          bonusAwarded = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      points_awarded: rule.points,
      total_points: userData.summary.total_points,
      current_level: userData.summary.level,
      bonus_awarded: bonusAwarded,
      bonus_points: bonusAwarded ? 10 : 0,
      message: `تم منح ${rule.points} نقطة بنجاح! ${bonusAwarded ? '+ 10 نقاط مكافأة!' : ''}`,
      point_details: {
        action,
        description: newPoints.description,
        conditions_met: rule.conditions,
        reading_streak: sessionId ? checkReadingStreak(userId, sessionId) : 0
      }
    });

  } catch (error) {
    console.error('خطأ في تسجيل النقاط:', error);
    return NextResponse.json(
      { error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const userData = getUserLoyaltyData(userId);
    
    const pointsToNext = userData.summary.level === 'Bronze' ? 100 - userData.summary.total_points :
                        userData.summary.level === 'Silver' ? 500 - userData.summary.total_points :
                        userData.summary.level === 'Gold' ? 1000 - userData.summary.total_points : 0;
    
    return NextResponse.json({
      success: true,
      user_id: userId,
      total_points: userData.summary.total_points,
      current_level: userData.summary.level,
      points_history: userData.points.slice(-10), // آخر 10 عمليات
      level_progress: {
        current_level: userData.summary.level,
        points_to_next: Math.max(0, pointsToNext),
        progress_percentage: userData.summary.level === 'Platinum' ? 100 : 
          Math.min(100, (userData.summary.total_points / 
            (userData.summary.level === 'Bronze' ? 100 :
             userData.summary.level === 'Silver' ? 500 : 1000)) * 100)
      },
      rules: LOYALTY_RULES.map(r => ({
        action: r.action,
        points: r.points,
        conditions: r.conditions,
        max_per_day: r.max_per_day,
        max_per_article: r.max_per_article
      }))
    });

  } catch (error) {
    console.error('خطأ في جلب بيانات النقاط:', error);
    return NextResponse.json(
      { error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
} 