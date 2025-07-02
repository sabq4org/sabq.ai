import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const loyaltyFilePath = path.join(process.cwd(), 'data', 'user_loyalty_points.json');

async function ensureLoyaltyFile() {
  try {
    await fs.access(loyaltyFilePath);
  } catch {
    await fs.mkdir(path.dirname(loyaltyFilePath), { recursive: true });
    await fs.writeFile(loyaltyFilePath, JSON.stringify({ users: [], updated_at: new Date().toISOString() }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, points, action, description } = body;

    if (!userId || !points || !action) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير كاملة' },
        { status: 400 }
      );
    }

    // قراءة ملف نقاط الولاء
    await ensureLoyaltyFile();
    const fileContent = await fs.readFile(loyaltyFilePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // التأكد من وجود مصفوفة users
    if (!data.users) {
      data.users = [];
    }

    // البحث عن المستخدم
    let userIndex = data.users.findIndex((user: any) => user.user_id === userId);
    
    if (userIndex === -1) {
      // إنشاء مستخدم جديد
      data.users.push({
        user_id: userId,
        total_points: points,
        earned_points: points,
        redeemed_points: 0,
        tier: getTier(points),
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });
    } else {
      // تحديث نقاط المستخدم الموجود
      data.users[userIndex].total_points += points;
      data.users[userIndex].earned_points += points;
      data.users[userIndex].tier = getTier(data.users[userIndex].total_points);
      data.users[userIndex].last_updated = new Date().toISOString();
    }

    // تحديث وقت آخر تحديث للملف
    data.updated_at = new Date().toISOString();

    // حفظ الملف
    await fs.writeFile(loyaltyFilePath, JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      message: 'تم إضافة النقاط بنجاح',
      data: {
        points_added: points,
        total_points: userIndex === -1 ? points : data.users[userIndex].total_points
      }
    });

  } catch (error) {
    console.error('خطأ في إضافة نقاط الولاء:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في إضافة النقاط' },
      { status: 500 }
    );
  }
}

function getTier(points: number): string {
  if (points >= 1000) return 'vip';
  if (points >= 500) return 'gold';
  if (points >= 200) return 'silver';
  return 'bronze';
} 