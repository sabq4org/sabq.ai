import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const loyaltyFilePath = path.join(process.cwd(), 'data', 'user_loyalty_points.json');
const activitiesFilePath = path.join(process.cwd(), 'data', 'user_activities.json');

interface LoyaltyPoints {
  user_id: string;
  total_points: number;
  earned_points: number;
  redeemed_points: number;
  tier: string;
  history: Array<{
    action: string;
    points: number;
    timestamp: string;
    article_id?: string;
    description?: string;
  }>;
  created_at: string;
  last_updated: string;
}

interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  description: string;
  points_earned: number;
  article_id?: string;
  metadata?: any;
  timestamp: string;
}

// دالة للتأكد من وجود الملفات
async function ensureDataFiles() {
  const files = [
    { path: loyaltyFilePath, defaultData: { users: [] } },
    { path: activitiesFilePath, defaultData: { activities: [] } }
  ];

  for (const file of files) {
    try {
      await fs.access(file.path);
    } catch {
      await fs.mkdir(path.dirname(file.path), { recursive: true });
      await fs.writeFile(file.path, JSON.stringify(file.defaultData, null, 2));
    }
  }
}

// دالة حساب المستوى التالي
function getNextTierInfo(currentPoints: number) {
  const tiers = [
    { name: 'bronze', minPoints: 0, maxPoints: 99, next: 'silver' },
    { name: 'silver', minPoints: 100, maxPoints: 499, next: 'gold' },
    { name: 'gold', minPoints: 500, maxPoints: 1999, next: 'platinum' },
    { name: 'platinum', minPoints: 2000, maxPoints: Infinity, next: null }
  ];

  const currentTier = tiers.find(tier => 
    currentPoints >= tier.minPoints && currentPoints <= tier.maxPoints
  );

  if (!currentTier) return null;

  const nextTier = tiers.find(tier => tier.name === currentTier.next);
  const pointsToNext = nextTier ? nextTier.minPoints - currentPoints : 0;
  const progressPercentage = nextTier ? 
    ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100 : 100;

  return {
    current: currentTier.name,
    next: currentTier.next,
    pointsToNext: Math.max(0, pointsToNext),
    progressPercentage: Math.min(100, Math.max(0, progressPercentage))
  };
}

export async function GET(request: NextRequest) {
  try {
    await ensureDataFiles();
    
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const includeHistory = url.searchParams.get('includeHistory') === 'true';
    const includeActivities = url.searchParams.get('includeActivities') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // جلب نقاط الولاء
    const loyaltyContent = await fs.readFile(loyaltyFilePath, 'utf-8');
    const loyaltyData = JSON.parse(loyaltyContent);
    
    let userLoyalty = loyaltyData.users?.find((user: LoyaltyPoints) => user.user_id === userId);
    
    if (!userLoyalty) {
      // إنشاء مستخدم جديد بنقاط صفر
      userLoyalty = {
        user_id: userId,
        total_points: 0,
        earned_points: 0,
        redeemed_points: 0,
        tier: 'bronze',
        history: [],
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      if (!loyaltyData.users) loyaltyData.users = [];
      loyaltyData.users.push(userLoyalty);
      await fs.writeFile(loyaltyFilePath, JSON.stringify(loyaltyData, null, 2));
    }

    // حساب معلومات المستوى
    const tierInfo = getNextTierInfo(userLoyalty.total_points);

    const response: any = {
      success: true,
      loyalty: {
        user_id: userLoyalty.user_id,
        total_points: userLoyalty.total_points,
        earned_points: userLoyalty.earned_points,
        redeemed_points: userLoyalty.redeemed_points,
        tier: userLoyalty.tier,
        tier_info: tierInfo,
        created_at: userLoyalty.created_at,
        last_updated: userLoyalty.last_updated
      }
    };

    // إضافة التاريخ إذا طُلب
    if (includeHistory) {
      response.loyalty.history = userLoyalty.history
        .slice(-limit)
        .reverse(); // الأحدث أولاً
    }

    // إضافة الأنشطة إذا طُلبت
    if (includeActivities) {
      const activitiesContent = await fs.readFile(activitiesFilePath, 'utf-8');
      const activitiesData = JSON.parse(activitiesContent);
      
      const userActivities = activitiesData.activities
        ?.filter((activity: UserActivity) => activity.user_id === userId)
        ?.slice(-limit)
        ?.reverse() || []; // الأحدث أولاً

      response.activities = userActivities;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('خطأ في جلب نقاط الولاء:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب نقاط الولاء' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataFiles();
    
    const body = await request.json();
    const { userId, action, points, description, articleId } = body;

    if (!userId || !action || points === undefined) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير كاملة' },
        { status: 400 }
      );
    }

    // جلب بيانات الولاء الحالية
    const loyaltyContent = await fs.readFile(loyaltyFilePath, 'utf-8');
    const loyaltyData = JSON.parse(loyaltyContent);
    
    if (!loyaltyData.users) loyaltyData.users = [];

    let userIndex = loyaltyData.users.findIndex((user: LoyaltyPoints) => user.user_id === userId);
    
    if (userIndex === -1) {
      // إنشاء مستخدم جديد
      const newUser: LoyaltyPoints = {
        user_id: userId,
        total_points: Math.max(0, points),
        earned_points: points > 0 ? points : 0,
        redeemed_points: points < 0 ? Math.abs(points) : 0,
        tier: 'bronze',
        history: [],
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      newUser.history.push({
        action,
        points,
        timestamp: new Date().toISOString(),
        article_id: articleId,
        description: description || ''
      });
      
      loyaltyData.users.push(newUser);
      userIndex = loyaltyData.users.length - 1;
    } else {
      // تحديث المستخدم الموجود
      const user = loyaltyData.users[userIndex];
      user.total_points = Math.max(0, user.total_points + points);
      
      if (points > 0) {
        user.earned_points += points;
      } else if (points < 0) {
        user.redeemed_points += Math.abs(points);
      }
      
      user.last_updated = new Date().toISOString();
      
      // تحديث المستوى
      if (user.total_points >= 2000) {
        user.tier = 'platinum';
      } else if (user.total_points >= 500) {
        user.tier = 'gold';
      } else if (user.total_points >= 100) {
        user.tier = 'silver';
      } else {
        user.tier = 'bronze';
      }
      
      // إضافة للتاريخ
      user.history.push({
        action,
        points,
        timestamp: new Date().toISOString(),
        article_id: articleId,
        description: description || ''
      });
    }

    await fs.writeFile(loyaltyFilePath, JSON.stringify(loyaltyData, null, 2));

    const updatedUser = loyaltyData.users[userIndex];
    const tierInfo = getNextTierInfo(updatedUser.total_points);

    return NextResponse.json({
      success: true,
      loyalty: {
        user_id: updatedUser.user_id,
        total_points: updatedUser.total_points,
        earned_points: updatedUser.earned_points,
        redeemed_points: updatedUser.redeemed_points,
        tier: updatedUser.tier,
        tier_info: tierInfo,
        points_added: points,
        message: points > 0 
          ? `تم إضافة ${points} نقطة إلى رصيدك!` 
          : `تم خصم ${Math.abs(points)} نقطة من رصيدك`
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث نقاط الولاء:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تحديث نقاط الولاء' },
      { status: 500 }
    );
  }
} 