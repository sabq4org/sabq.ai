import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// قواعد النقاط الافتراضية
const DEFAULT_POINT_RULES = {
  // التفاعل الأساسي
  comment: 5,
  comment_reply: 7,
  like_article: 2,
  like_comment: 1,
  share_article: 3,
  bookmark_article: 1,
  
  // إنشاء المحتوى
  article_published: 20,
  article_featured: 50,
  article_trending: 30,
  
  // التفاعل الاجتماعي
  profile_complete: 10,
  first_comment: 15,
  first_article: 25,
  
  // الأنشطة اليومية
  daily_login: 2,
  daily_read: 1,
  weekly_streak: 10,
  monthly_streak: 50,
  
  // الإنجازات الخاصة
  badge_earned: 20,
  achievement_unlocked: 30,
  level_up: 100,
  
  // العقوبات
  spam_penalty: -10,
  report_penalty: -5,
  content_removed: -20
};

// مستويات الولاء
const LOYALTY_LEVELS = [
  { name: 'مبتدئ', name_ar: 'مبتدئ', min_points: 0, max_points: 99, color: '#8B4513', icon: '🌱' },
  { name: 'نشط', name_ar: 'نشط', min_points: 100, max_points: 299, color: '#32CD32', icon: '🌿' },
  { name: 'متفاعل', name_ar: 'متفاعل', min_points: 300, max_points: 699, color: '#4169E1', icon: '⭐' },
  { name: 'خبير', name_ar: 'خبير', min_points: 700, max_points: 1499, color: '#FF6347', icon: '🔥' },
  { name: 'محترف', name_ar: 'محترف', min_points: 1500, max_points: 2999, color: '#9932CC', icon: '💎' },
  { name: 'أسطورة', name_ar: 'أسطورة', min_points: 3000, max_points: null, color: '#FFD700', icon: '👑' }
];

// الشارات الافتراضية
const DEFAULT_BADGES = [
  {
    name: 'مرحباً بك',
    name_ar: 'مرحباً بك',
    description: 'أول تسجيل دخول',
    description_ar: 'أول تسجيل دخول',
    icon: '👋',
    category: 'engagement',
    tier: 'bronze',
    conditions: { action: 'first_login' }
  },
  {
    name: 'معلق نشط',
    name_ar: 'معلق نشط',
    description: '50 تعليق',
    description_ar: '50 تعليق',
    icon: '💬',
    category: 'engagement',
    tier: 'silver',
    conditions: { action: 'comment', count: 50 }
  },
  {
    name: 'محبوب',
    name_ar: 'محبوب',
    description: '100 إعجاب مستلم',
    description_ar: '100 إعجاب مستلم',
    icon: '❤️',
    category: 'social',
    tier: 'gold',
    conditions: { action: 'likes_received', count: 100 }
  },
  {
    name: 'كاتب موهوب',
    name_ar: 'كاتب موهوب',
    description: '10 مقالات منشورة',
    description_ar: '10 مقالات منشورة',
    icon: '✍️',
    category: 'content',
    tier: 'gold',
    conditions: { action: 'articles_published', count: 10 }
  },
  {
    name: 'مشارك اجتماعي',
    name_ar: 'مشارك اجتماعي',
    description: '100 مشاركة',
    description_ar: '100 مشاركة',
    icon: '🔗',
    category: 'social',
    tier: 'silver',
    conditions: { action: 'shares', count: 100 }
  },
  {
    name: 'متواصل يومي',
    name_ar: 'متواصل يومي',
    description: '30 يوم متتالي',
    description_ar: '30 يوم متتالي',
    icon: '📅',
    category: 'engagement',
    tier: 'platinum',
    conditions: { action: 'daily_streak', count: 30 }
  }
];

/**
 * إضافة نقاط للمستخدم
 */
export async function addLoyaltyPoints(
  userId: string,
  actionType: string,
  points?: number,
  referenceId?: string,
  referenceType?: string,
  metadata?: any
): Promise<{
  success: boolean;
  points: number;
  newTotal: number;
  levelUp?: boolean;
  newLevel?: string;
}> {
  try {
    // الحصول على النقاط من القواعد أو استخدام القيمة المرسلة
    const pointsToAdd = points || DEFAULT_POINT_RULES[actionType] || 0;
    
    if (pointsToAdd === 0) {
      return { success: false, points: 0, newTotal: 0 };
    }

    // التحقق من الحدود اليومية/الأسبوعية/الشهرية
    const canAddPoints = await checkPointLimits(userId, actionType, pointsToAdd);
    if (!canAddPoints) {
      return { success: false, points: 0, newTotal: 0 };
    }

    // الحصول على إحصائيات المستخدم الحالية
    let userStats = await prisma.userLoyaltyStats.findUnique({
      where: { user_id: userId }
    });

    if (!userStats) {
      userStats = await prisma.userLoyaltyStats.create({
        data: {
          user_id: userId,
          total_points_earned: 0,
          current_points: 0,
          lifetime_points: 0
        }
      });
    }

    const oldLevel = userStats.current_level;
    const newTotal = userStats.current_points + pointsToAdd;

    // تحديث النقاط والإحصائيات
    const result = await prisma.$transaction(async (tx) => {
      // إضافة نقطة الولاء
      await tx.loyaltyPoint.create({
        data: {
          user_id: userId,
          points: pointsToAdd,
          action_type: actionType,
          reference_id: referenceId,
          reference_type: referenceType,
          metadata: metadata || {}
        }
      });

      // تسجيل المعاملة
      await tx.loyaltyTransaction.create({
        data: {
          user_id: userId,
          transaction_type: 'earn',
          points_amount: pointsToAdd,
          balance_before: userStats.current_points,
          balance_after: newTotal,
          source_type: 'system',
          description: `نقاط ${actionType}`,
          reference_id: referenceId,
          reference_type: referenceType
        }
      });

      // تحديث الإحصائيات
      const updatedStats = await tx.userLoyaltyStats.update({
        where: { user_id: userId },
        data: {
          total_points_earned: { increment: pointsToAdd },
          current_points: newTotal,
          lifetime_points: { increment: pointsToAdd },
          daily_points: { increment: pointsToAdd },
          weekly_points: { increment: pointsToAdd },
          monthly_points: { increment: pointsToAdd },
          last_activity_date: new Date()
        }
      });

      return updatedStats;
    });

    // التحقق من ترقية المستوى
    const newLevel = calculateUserLevel(newTotal);
    let levelUp = false;

    if (newLevel.name !== oldLevel) {
      levelUp = true;
      await prisma.userLoyaltyStats.update({
        where: { user_id: userId },
        data: { current_level: newLevel.name }
      });

      // إضافة نقاط مكافأة الترقية
      await addLoyaltyPoints(userId, 'level_up', 100, null, 'level', { 
        old_level: oldLevel, 
        new_level: newLevel.name 
      });

      // إرسال إشعار الترقية
      await sendRealTimeNotification(userId, {
        type: 'level_up',
        title: 'ترقية مستوى!',
        message: `تهانينا! وصلت إلى مستوى ${newLevel.name_ar}`,
        icon: newLevel.icon,
        priority: 'high',
        data: { level: newLevel }
      });
    }

    // التحقق من الشارات والإنجازات
    await checkAndAwardBadges(userId);
    await checkAndUpdateAchievements(userId);

    return {
      success: true,
      points: pointsToAdd,
      newTotal,
      levelUp,
      newLevel: levelUp ? newLevel.name : undefined
    };

  } catch (error) {
    console.error('Error adding loyalty points:', error);
    return { success: false, points: 0, newTotal: 0 };
  }
}

/**
 * التحقق من حدود النقاط
 */
async function checkPointLimits(userId: string, actionType: string, points: number): Promise<boolean> {
  try {
    // الحصول على قواعد النقاط
    const rule = await prisma.loyaltyRule.findFirst({
      where: {
        action_type: actionType,
        is_active: true
      }
    });

    if (!rule) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // فحص الحد اليومي
    if (rule.daily_limit) {
      const dailyPoints = await prisma.loyaltyPoint.aggregate({
        _sum: { points: true },
        where: {
          user_id: userId,
          action_type: actionType,
          created_at: { gte: today }
        }
      });

      if ((dailyPoints._sum.points || 0) + points > rule.daily_limit) {
        return false;
      }
    }

    // فحص الحد الأسبوعي
    if (rule.weekly_limit) {
      const weeklyPoints = await prisma.loyaltyPoint.aggregate({
        _sum: { points: true },
        where: {
          user_id: userId,
          action_type: actionType,
          created_at: { gte: thisWeek }
        }
      });

      if ((weeklyPoints._sum.points || 0) + points > rule.weekly_limit) {
        return false;
      }
    }

    // فحص الحد الشهري
    if (rule.monthly_limit) {
      const monthlyPoints = await prisma.loyaltyPoint.aggregate({
        _sum: { points: true },
        where: {
          user_id: userId,
          action_type: actionType,
          created_at: { gte: thisMonth }
        }
      });

      if ((monthlyPoints._sum.points || 0) + points > rule.monthly_limit) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking point limits:', error);
    return true; // في حالة الخطأ، اسمح بالنقاط
  }
}

/**
 * حساب مستوى المستخدم
 */
function calculateUserLevel(points: number) {
  for (const level of LOYALTY_LEVELS) {
    if (level.max_points === null || points <= level.max_points) {
      return level;
    }
  }
  return LOYALTY_LEVELS[LOYALTY_LEVELS.length - 1];
}

/**
 * التحقق من الشارات ومنحها
 */
export async function checkAndAwardBadges(userId: string): Promise<void> {
  try {
    // الحصول على جميع الشارات النشطة
    const badges = await prisma.badge.findMany({
      where: { is_active: true }
    });

    // الحصول على الشارات الحالية للمستخدم
    const userBadges = await prisma.userBadge.findMany({
      where: { user_id: userId },
      select: { badge_id: true }
    });

    const userBadgeIds = userBadges.map(ub => ub.badge_id);

    for (const badge of badges) {
      // تخطي الشارات الموجودة
      if (userBadgeIds.includes(badge.id)) continue;

      // التحقق من شروط الشارة
      const meetsConditions = await checkBadgeConditions(userId, badge.conditions);
      
      if (meetsConditions) {
        await awardBadge(userId, badge.id, 'system');
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

/**
 * التحقق من شروط الشارة
 */
async function checkBadgeConditions(userId: string, conditions: any): Promise<boolean> {
  try {
    const { action, count = 1, timeframe } = conditions;

    switch (action) {
      case 'first_login':
        return true; // يتم منحها عند أول تسجيل دخول

      case 'comment':
        const commentCount = await prisma.articleComment.count({
          where: { user_id: userId }
        });
        return commentCount >= count;

      case 'likes_received':
        const likesReceived = await prisma.articleComment.aggregate({
          _sum: { like_count: true },
          where: { user_id: userId }
        });
        return (likesReceived._sum.like_count || 0) >= count;

      case 'articles_published':
        const articlesCount = await prisma.article.count({
          where: { 
            author_id: userId,
            status: 'published'
          }
        });
        return articlesCount >= count;

      case 'shares':
        const sharesCount = await prisma.articleShare.count({
          where: { user_id: userId }
        });
        return sharesCount >= count;

      case 'daily_streak':
        const userStats = await prisma.userLoyaltyStats.findUnique({
          where: { user_id: userId }
        });
        return (userStats?.current_streak || 0) >= count;

      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking badge conditions:', error);
    return false;
  }
}

/**
 * منح شارة للمستخدم
 */
async function awardBadge(userId: string, badgeId: string, awardedBy: string): Promise<void> {
  try {
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId }
    });

    if (!badge) return;

    await prisma.$transaction(async (tx) => {
      // منح الشارة
      await tx.userBadge.create({
        data: {
          user_id: userId,
          badge_id: badgeId,
          awarded_by: awardedBy,
          reason: 'شروط الشارة مستوفاة'
        }
      });

      // إضافة نقاط الشارة
      await tx.loyaltyPoint.create({
        data: {
          user_id: userId,
          points: 20,
          action_type: 'badge_earned',
          reference_id: badgeId,
          reference_type: 'badge',
          description: `شارة ${badge.name_ar}`
        }
      });

      // تحديث الإحصائيات
      await tx.userLoyaltyStats.update({
        where: { user_id: userId },
        data: {
          badges_count: { increment: 1 },
          current_points: { increment: 20 },
          total_points_earned: { increment: 20 }
        }
      });
    });

    // إرسال إشعار الشارة
    await sendRealTimeNotification(userId, {
      type: 'badge_earned',
      title: 'شارة جديدة!',
      message: `تهانينا! حصلت على شارة ${badge.name_ar}`,
      icon: badge.icon,
      priority: 'high',
      data: { badge }
    });

  } catch (error) {
    console.error('Error awarding badge:', error);
  }
}

/**
 * التحقق من الإنجازات وتحديثها
 */
async function checkAndUpdateAchievements(userId: string): Promise<void> {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { is_active: true }
    });

    for (const achievement of achievements) {
      let userAchievement = await prisma.userAchievement.findUnique({
        where: {
          user_id_achievement_id: {
            user_id: userId,
            achievement_id: achievement.id
          }
        }
      });

      if (!userAchievement) {
        userAchievement = await prisma.userAchievement.create({
          data: {
            user_id: userId,
            achievement_id: achievement.id,
            progress: {},
            total_steps: achievement.progress_steps ? 
              Object.keys(achievement.progress_steps).length : 1
          }
        });
      }

      if (userAchievement.is_completed) continue;

      // تحديث تقدم الإنجاز
      const newProgress = await calculateAchievementProgress(userId, achievement);
      const isCompleted = newProgress.current_step >= newProgress.total_steps;

      await prisma.userAchievement.update({
        where: { id: userAchievement.id },
        data: {
          progress: newProgress.progress,
          current_step: newProgress.current_step,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date() : null,
          last_progress_at: new Date()
        }
      });

      // إذا تم إكمال الإنجاز
      if (isCompleted && !userAchievement.is_completed) {
        await completeAchievement(userId, achievement.id);
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

/**
 * حساب تقدم الإنجاز
 */
async function calculateAchievementProgress(userId: string, achievement: any) {
  // هذا مثال بسيط - يمكن توسيعه حسب نوع الإنجاز
  const conditions = achievement.conditions;
  
  switch (achievement.category) {
    case 'milestone':
      // إنجازات المعالم (مثل عدد التعليقات)
      return await calculateMilestoneProgress(userId, conditions);
    
    case 'streak':
      // إنجازات السلاسل (مثل الأيام المتتالية)
      return await calculateStreakProgress(userId, conditions);
    
    case 'social':
      // إنجازات اجتماعية
      return await calculateSocialProgress(userId, conditions);
    
    default:
      return { progress: {}, current_step: 0, total_steps: 1 };
  }
}

/**
 * إكمال الإنجاز
 */
async function completeAchievement(userId: string, achievementId: string): Promise<void> {
  try {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId }
    });

    if (!achievement) return;

    await prisma.$transaction(async (tx) => {
      // إضافة نقاط الإنجاز
      if (achievement.points_reward > 0) {
        await tx.loyaltyPoint.create({
          data: {
            user_id: userId,
            points: achievement.points_reward,
            action_type: 'achievement_unlocked',
            reference_id: achievementId,
            reference_type: 'achievement',
            description: `إنجاز ${achievement.name_ar}`
          }
        });
      }

      // تحديث الإحصائيات
      await tx.userLoyaltyStats.update({
        where: { user_id: userId },
        data: {
          achievements_count: { increment: 1 },
          current_points: { increment: achievement.points_reward },
          total_points_earned: { increment: achievement.points_reward }
        }
      });
    });

    // إرسال إشعار الإنجاز
    await sendRealTimeNotification(userId, {
      type: 'achievement_unlocked',
      title: 'إنجاز جديد!',
      message: `تهانينا! أنجزت ${achievement.name_ar}`,
      icon: achievement.icon,
      priority: 'high',
      data: { achievement }
    });

  } catch (error) {
    console.error('Error completing achievement:', error);
  }
}

/**
 * إرسال إشعار فوري
 */
export async function sendRealTimeNotification(
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    icon?: string;
    priority?: string;
    data?: any;
    actionUrl?: string;
  }
): Promise<void> {
  try {
    await prisma.realTimeNotification.create({
      data: {
        user_id: userId,
        type: notification.type,
        category: 'loyalty',
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        priority: notification.priority || 'normal',
        action_url: notification.actionUrl,
        data: notification.data || {}
      }
    });

    // هنا يمكن إضافة منطق إرسال الإشعارات الفورية
    // مثل WebSocket أو Push Notifications
    
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * تحديث السلسلة اليومية
 */
export async function updateDailyStreak(userId: string): Promise<void> {
  try {
    const userStats = await prisma.userLoyaltyStats.findUnique({
      where: { user_id: userId }
    });

    if (!userStats) return;

    const now = new Date();
    const lastActivity = userStats.last_activity_date;
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let newStreak = 1;

    if (lastActivity) {
      const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDiff === 1) {
        // يوم متتالي
        newStreak = userStats.current_streak + 1;
      } else if (daysDiff > 1) {
        // انقطعت السلسلة
        newStreak = 1;
      } else {
        // نفس اليوم
        return;
      }
    }

    await prisma.userLoyaltyStats.update({
      where: { user_id: userId },
      data: {
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, userStats.longest_streak),
        last_activity_date: now
      }
    });

    // إضافة نقاط السلسلة
    if (newStreak > 1) {
      await addLoyaltyPoints(userId, 'daily_streak', 2, null, 'streak', {
        streak_count: newStreak
      });
    }

    // التحقق من شارات السلسلة
    if (newStreak === 7) {
      await checkAndAwardBadges(userId); // شارة أسبوع متتالي
    } else if (newStreak === 30) {
      await checkAndAwardBadges(userId); // شارة شهر متتالي
    }

  } catch (error) {
    console.error('Error updating daily streak:', error);
  }
}

/**
 * إنشاء البيانات الافتراضية
 */
export async function initializeLoyaltySystem(): Promise<void> {
  try {
    // إنشاء الشارات الافتراضية
    for (const badgeData of DEFAULT_BADGES) {
      await prisma.badge.upsert({
        where: { name: badgeData.name },
        create: badgeData,
        update: {}
      });
    }

    // إنشاء مستويات الولاء
    for (const levelData of LOYALTY_LEVELS) {
      await prisma.loyaltyLevel.upsert({
        where: { name: levelData.name },
        create: levelData,
        update: {}
      });
    }

    // إنشاء قواعد النقاط
    for (const [actionType, points] of Object.entries(DEFAULT_POINT_RULES)) {
      await prisma.loyaltyRule.upsert({
        where: { name: actionType },
        create: {
          name: actionType,
          name_ar: actionType,
          description: `نقاط ${actionType}`,
          description_ar: `نقاط ${actionType}`,
          action_type: actionType,
          points: points,
          is_active: true
        },
        update: {}
      });
    }

    console.log('Loyalty system initialized successfully');
  } catch (error) {
    console.error('Error initializing loyalty system:', error);
  }
}

// Helper functions for achievement progress calculation
async function calculateMilestoneProgress(userId: string, conditions: any) {
  // Implementation for milestone achievements
  return { progress: {}, current_step: 0, total_steps: 1 };
}

async function calculateStreakProgress(userId: string, conditions: any) {
  // Implementation for streak achievements
  return { progress: {}, current_step: 0, total_steps: 1 };
}

async function calculateSocialProgress(userId: string, conditions: any) {
  // Implementation for social achievements
  return { progress: {}, current_step: 0, total_steps: 1 };
} 