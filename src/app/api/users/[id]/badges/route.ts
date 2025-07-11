import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

/**
 * GET /api/users/[id]/badges
 * جلب شارات المستخدم
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    const url = new URL(request.url);
    const featured = url.searchParams.get('featured') === 'true';
    
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;
    
    // يمكن للمستخدم رؤية شاراته فقط أو للإدارة رؤية الجميع
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // جلب الشارات
    const userBadges = await prisma.userBadge.findMany({
      where: { 
        user_id: userId,
        ...(featured && { is_featured: true })
      },
      include: {
        badge: true
      },
      orderBy: { awarded_at: 'desc' }
    });

    // تجميع الشارات حسب الفئة
    const badgesByCategory = userBadges.reduce((acc, userBadge) => {
      const category = userBadge.badge.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        ...userBadge.badge,
        awarded_at: userBadge.awarded_at,
        is_featured: userBadge.is_featured,
        reason: userBadge.reason
      });
      return acc;
    }, {} as Record<string, any[]>);

    // إحصائيات الشارات
    const badgeStats = {
      total: userBadges.length,
      featured: userBadges.filter(ub => ub.is_featured).length,
      byTier: userBadges.reduce((acc, ub) => {
        const tier = ub.badge.tier;
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: Object.keys(badgesByCategory).reduce((acc, category) => {
        acc[category] = badgesByCategory[category].length;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      data: {
        badges: userBadges.map(ub => ({
          ...ub.badge,
          awarded_at: ub.awarded_at,
          is_featured: ub.is_featured,
          reason: ub.reason
        })),
        badgesByCategory,
        stats: badgeStats
      }
    });

  } catch (error) {
    console.error('Error fetching user badges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id]/badges
 * منح شارة للمستخدم (للإدارة فقط)
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
    
    // فقط الإدارة يمكنها منح الشارات يدوياً
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { badge_id, reason, is_featured = false } = body;

    if (!badge_id) {
      return NextResponse.json(
        { error: 'Badge ID is required' },
        { status: 400 }
      );
    }

    // التحقق من وجود الشارة
    const badge = await prisma.badge.findUnique({
      where: { id: badge_id }
    });

    if (!badge) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود الشارة مسبقاً
    const existingBadge = await prisma.userBadge.findUnique({
      where: {
        user_id_badge_id: {
          user_id: userId,
          badge_id: badge_id
        }
      }
    });

    if (existingBadge) {
      return NextResponse.json(
        { error: 'User already has this badge' },
        { status: 400 }
      );
    }

    // منح الشارة
    const result = await prisma.$transaction(async (tx) => {
      // إنشاء الشارة للمستخدم
      const userBadge = await tx.userBadge.create({
        data: {
          user_id: userId,
          badge_id: badge_id,
          awarded_by: currentUser.id,
          reason: reason || 'منحت بواسطة الإدارة',
          is_featured: is_featured
        },
        include: {
          badge: true
        }
      });

      // إضافة نقاط الشارة
      await tx.loyaltyPoint.create({
        data: {
          user_id: userId,
          points: 20,
          action_type: 'badge_earned',
          reference_id: badge_id,
          reference_type: 'badge',
          description: `شارة ${badge.name_ar}`
        }
      });

      // تحديث الإحصائيات
      await tx.userLoyaltyStats.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          total_points_earned: 20,
          current_points: 20,
          lifetime_points: 20,
          badges_count: 1
        },
        update: {
          badges_count: { increment: 1 },
          current_points: { increment: 20 },
          total_points_earned: { increment: 20 }
        }
      });

      return userBadge;
    });

    // إرسال إشعار
    const { sendRealTimeNotification } = await import('@/lib/loyalty-engine');
    await sendRealTimeNotification(userId, {
      type: 'badge_earned',
      title: 'شارة جديدة!',
      message: `تهانينا! حصلت على شارة ${badge.name_ar}`,
      icon: badge.icon,
      priority: 'high',
      data: { badge }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result.badge,
        awarded_at: result.awarded_at,
        is_featured: result.is_featured,
        reason: result.reason
      }
    });

  } catch (error) {
    console.error('Error awarding badge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]/badges
 * تحديث إعدادات الشارات (تمييز الشارات)
 */
export async function PUT(
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
    
    // يمكن للمستخدم تحديث شاراته فقط
    if (currentUser.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { featured_badges = [] } = body;

    if (!Array.isArray(featured_badges)) {
      return NextResponse.json(
        { error: 'Featured badges must be an array' },
        { status: 400 }
      );
    }

    // تحديث الشارات المميزة
    await prisma.$transaction(async (tx) => {
      // إلغاء تمييز جميع الشارات
      await tx.userBadge.updateMany({
        where: { user_id: userId },
        data: { is_featured: false }
      });

      // تمييز الشارات المحددة
      if (featured_badges.length > 0) {
        await tx.userBadge.updateMany({
          where: {
            user_id: userId,
            badge_id: { in: featured_badges }
          },
          data: { is_featured: true }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الشارات المميزة بنجاح'
    });

  } catch (error) {
    console.error('Error updating featured badges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 