import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

/**
 * GET /api/users/[id]/loyalty
 * جلب نقاط وشارات المستخدم
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;
    
    // يمكن للمستخدم رؤية نقاطه فقط أو للإدارة رؤية الجميع
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // جلب إحصائيات الولاء
    const loyaltyStats = await prisma.userLoyaltyStats.findUnique({
      where: { user_id: userId }
    });

    if (!loyaltyStats) {
      // إنشاء إحصائيات جديدة إذا لم تكن موجودة
      await prisma.userLoyaltyStats.create({
        data: {
          user_id: userId,
          total_points_earned: 0,
          current_points: 0,
          lifetime_points: 0
        }
      });
    }

    // جلب الشارات
    const userBadges = await prisma.userBadge.findMany({
      where: { user_id: userId },
      include: {
        badge: true
      },
      orderBy: { awarded_at: 'desc' }
    });

    // جلب الإنجازات
    const userAchievements = await prisma.userAchievement.findMany({
      where: { user_id: userId },
      include: {
        achievement: true
      },
      orderBy: { last_progress_at: 'desc' }
    });

    // جلب آخر النقاط المكتسبة
    const recentPoints = await prisma.loyaltyPoint.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // حساب المستوى الحالي
    const currentLevel = await calculateUserLevel(loyaltyStats?.current_points || 0);
    
    // حساب التقدم نحو المستوى التالي
    const nextLevel = await getNextLevel(currentLevel);
    const levelProgress = nextLevel ? {
      current: loyaltyStats?.current_points || 0,
      required: nextLevel.min_points,
      percentage: Math.round(((loyaltyStats?.current_points || 0) / nextLevel.min_points) * 100)
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        stats: loyaltyStats,
        currentLevel,
        nextLevel,
        levelProgress,
        badges: userBadges.map(ub => ({
          ...ub.badge,
          awarded_at: ub.awarded_at,
          is_featured: ub.is_featured
        })),
        achievements: userAchievements.map(ua => ({
          ...ua.achievement,
          progress: ua.progress,
          current_step: ua.current_step,
          total_steps: ua.total_steps,
          is_completed: ua.is_completed,
          completed_at: ua.completed_at,
          progress_percentage: Math.round((ua.current_step / ua.total_steps) * 100)
        })),
        recentPoints: recentPoints.map(rp => ({
          ...rp,
          created_at: rp.created_at,
          action_display: getActionDisplayName(rp.action_type)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching loyalty data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id]/loyalty
 * إضافة نقاط يدوياً (للإدارة فقط)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;
    
    // فقط الإدارة يمكنها إضافة نقاط يدوياً
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { points, reason, action_type = 'manual_award' } = body;

    if (!points || typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Invalid points value' },
        { status: 400 }
      );
    }

    // إضافة النقاط
    const { addLoyaltyPoints } = await import('@/lib/loyalty-engine');
    const result = await addLoyaltyPoints(
      userId,
      action_type,
      points,
      currentUser.id,
      'admin',
      { reason, awarded_by: currentUser.name }
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error adding loyalty points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * حساب المستوى الحالي
 */
async function calculateUserLevel(points: number) {
  const levels = await prisma.loyaltyLevel.findMany({
    orderBy: { min_points: 'asc' }
  });

  for (const level of levels) {
    if (level.max_points === null || points <= level.max_points) {
      return level;
    }
  }

  return levels[levels.length - 1];
}

/**
 * الحصول على المستوى التالي
 */
async function getNextLevel(currentLevel: any) {
  if (currentLevel.max_points === null) {
    return null; // أعلى مستوى
  }

  const nextLevel = await prisma.loyaltyLevel.findFirst({
    where: {
      min_points: { gt: currentLevel.max_points }
    },
    orderBy: { min_points: 'asc' }
  });

  return nextLevel;
}

/**
 * تحويل نوع العمل إلى نص عربي
 */
function getActionDisplayName(actionType: string): string {
  const actionNames: Record<string, string> = {
    comment: 'تعليق',
    comment_reply: 'رد على تعليق',
    like_article: 'إعجاب بمقال',
    like_comment: 'إعجاب بتعليق',
    share_article: 'مشاركة مقال',
    bookmark_article: 'حفظ مقال',
    article_published: 'نشر مقال',
    article_featured: 'مقال مميز',
    daily_login: 'تسجيل دخول يومي',
    badge_earned: 'شارة جديدة',
    achievement_unlocked: 'إنجاز جديد',
    level_up: 'ترقية مستوى',
    manual_award: 'مكافأة يدوية',
    daily_streak: 'سلسلة يومية'
  };

  return actionNames[actionType] || actionType;
} 