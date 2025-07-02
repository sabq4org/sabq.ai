import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@/lib/generated/prisma';

const loyaltyFilePath = path.join(process.cwd(), 'data', 'user_loyalty_points.json');
const interactionsFilePath = path.join(process.cwd(), 'data', 'user_article_interactions.json');
const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // في بيئة الإنتاج، استخدم قاعدة البيانات
    if (process.env.NODE_ENV === 'production' || process.env.USE_DATABASE === 'true') {
      try {
        // حساب مجموع النقاط من قاعدة البيانات
        const loyaltyPoints = await prisma.loyaltyPoint.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50 // آخر 50 نشاط
        });

        const totalPoints = loyaltyPoints.reduce((sum, point) => sum + point.points, 0);
        
        // تحديد المستوى بناءً على النقاط
        let level = 'أساسي';
        if (totalPoints >= 2000) level = 'بلاتيني';
        else if (totalPoints >= 1000) level = 'ذهبي';
        else if (totalPoints >= 500) level = 'فضي';
        else if (totalPoints >= 200) level = 'مميز';
        
        // تحويل النشاطات للعرض
        const recentActivities = loyaltyPoints.slice(0, 10).map(point => ({
          id: point.id,
          action: point.action,
          points: point.points,
          created_at: point.createdAt.toISOString(),
          description: point.action
        }));

        return NextResponse.json({
          success: true,
          data: {
            total_points: totalPoints,
            level: level,
            next_level_points: getNextLevelPoints(totalPoints),
            recent_activities: recentActivities
          }
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        // في حالة فشل قاعدة البيانات، نستخدم نظام الملفات كـ fallback
      }
    }

    // قراءة ملف نقاط الولاء (للتطوير أو كـ fallback)
    try {
      const fileContent = await fs.readFile(loyaltyFilePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // دمج عدة سجلات لنفس المستخدم إن وُجدت
      const userRecords = data.users?.filter((user: any) => user.user_id === userId) || [];

      if (userRecords.length > 1) {
        // حساب مجموع النقاط والحقول الأخرى
        const merged = userRecords.reduce(
          (acc: any, cur: any) => {
            acc.total_points += cur.total_points || 0;
            acc.earned_points += cur.earned_points || 0;
            acc.redeemed_points += cur.redeemed_points || 0;
            acc.history = Array.isArray(acc.history) ? [...acc.history, ...(cur.history || [])] : (cur.history || []);
            return acc;
          },
          {
            user_id: userId,
            total_points: 0,
            earned_points: 0,
            redeemed_points: 0,
            tier: 'bronze',
            history: [] as any[],
            created_at: userRecords[0].created_at || new Date().toISOString(),
            last_updated: new Date().toISOString()
          }
        );

        // تحديث المستوى بناءً على إجمالي النقاط
        if (merged.total_points >= 2000) merged.tier = 'platinum';
        else if (merged.total_points >= 500) merged.tier = 'gold';
        else if (merged.total_points >= 100) merged.tier = 'silver';

        // استبدال السجلات المكررة بسجل واحد
        data.users = data.users.filter((u: any) => u.user_id !== userId);
        data.users.push(merged);
        await fs.writeFile(loyaltyFilePath, JSON.stringify(data, null, 2));

        return NextResponse.json({
          success: true,
          data: merged
        });
      }

      const userData = userRecords[0];

      if (!userData) {
        // إذا لم يكن المستخدم موجوداً، أرجع قيم افتراضية
        return NextResponse.json({
          success: true,
          data: {
            total_points: 0,
            level: 'أساسي',
            next_level_points: 200,
            recent_activities: []
          }
        });
      }

      // جلب آخر النشاطات من ملف التفاعلات
      let recentActivities: any[] = [];
      
      try {
        const interactionsContent = await fs.readFile(interactionsFilePath, 'utf-8');
        const interactionsData = JSON.parse(interactionsContent);
        
        const userInteractions = interactionsData.interactions
          ?.filter((interaction: any) => interaction.user_id === userId)
          .sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 10)
          .map((interaction: any) => ({
            id: interaction.id,
            action: interaction.interaction_type,
            points: interaction.points_earned || 0,
            created_at: interaction.timestamp,
            description: getActionDescription(interaction)
          }));
        
        recentActivities = userInteractions || [];
      } catch (error) {
        console.log('لا توجد تفاعلات سابقة');
      }

      return NextResponse.json({
        success: true,
        data: {
          total_points: userData.total_points || 0,
          level: getLevelName(userData.tier || 'bronze'),
          next_level_points: getNextLevelPoints(userData.total_points || 0),
          recent_activities: recentActivities
        }
      });

    } catch (error) {
      // إذا لم يكن الملف موجوداً، أرجع قيم افتراضية
      return NextResponse.json({
        success: true,
        data: {
          total_points: 0,
          level: 'أساسي',
          next_level_points: 200,
          recent_activities: []
        }
      });
    }

  } catch (error) {
    console.error('خطأ في جلب نقاط الولاء:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب نقاط الولاء' },
      { status: 500 }
    );
  }
}

function getLevelName(tier: string): string {
  const levels: { [key: string]: string } = {
    'bronze': 'أساسي',
    'silver': 'مميز',
    'gold': 'ذهبي',
    'vip': 'VIP'
  };
  return levels[tier.toLowerCase()] || 'أساسي';
}

function getNextLevelPoints(currentPoints: number): number | null {
  if (currentPoints < 200) return 200;
  if (currentPoints < 500) return 500;
  if (currentPoints < 1000) return 1000;
  return null; // VIP level
}

function getActionDescription(interaction: any): string {
  const descriptions: { [key: string]: string } = {
    'view': 'مشاهدة مقال',
    'read': 'قراءة مقال',
    'like': 'إعجاب بمقال',
    'share': 'مشاركة مقال',
    'comment': 'تعليق على مقال',
    'save': 'حفظ مقال',
    'select_preferences': 'اختيار التفضيلات'
  };
  return descriptions[interaction.interaction_type] || interaction.interaction_type;
} 