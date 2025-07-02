import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const profileData = await request.json();
    const userId = decoded.id;

    // تحديث بيانات المستخدم الأساسية
    await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: profileData.avatar || undefined,
        name: profileData.name || undefined,
      }
    });

    // حفظ الاهتمامات
    if (profileData.interests && profileData.interests.length > 0) {
      // حذف الاهتمامات القديمة
      await prisma.userInterest.deleteMany({
        where: { userId }
      });

      // إضافة الاهتمامات الجديدة
      await prisma.userInterest.createMany({
        data: profileData.interests.map((interest: string) => ({
          userId,
          interest,
          score: 1.0,
          source: 'onboarding'
        }))
      });
    }

    // حفظ التفضيلات الأخرى
    const preferencesToSave = [
      { key: 'bio', value: profileData.bio },
      { key: 'birthDate', value: profileData.birthDate },
      { key: 'occupation', value: profileData.occupation },
      { key: 'education', value: profileData.education },
      { key: 'readingPreferences', value: profileData.readingPreferences },
      { key: 'notificationSettings', value: profileData.notificationSettings },
      { key: 'privacySettings', value: profileData.privacySettings }
    ];

    for (const pref of preferencesToSave) {
      if (pref.value) {
        await prisma.userPreference.upsert({
          where: {
            userId_key: {
              userId,
              key: pref.key
            }
          },
          update: {
            value: pref.value,
            updatedAt: new Date()
          },
          create: {
            userId,
            key: pref.key,
            value: pref.value
          }
        });
      }
    }

    // منح نقاط الولاء
    let totalPoints = 25; // نقاط أساسية
    if (profileData.avatar) totalPoints += 5;
    if (profileData.bio) totalPoints += 5;
    if (profileData.interests?.length >= 3) totalPoints += 10;

    await prisma.loyaltyPoint.create({
      data: {
        userId,
        points: totalPoints,
        action: 'profile_completion',
        metadata: {
          description: 'إكمال الملف الشخصي',
          details: {
            hasAvatar: !!profileData.avatar,
            hasBio: !!profileData.bio,
            interestsCount: profileData.interests?.length || 0
          }
        }
      }
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'profile_completed',
        metadata: {
          loyaltyPointsEarned: totalPoints,
          interestsCount: profileData.interests?.length || 0
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم حفظ ملفك الشخصي بنجاح!',
      data: {
        loyaltyPointsEarned: totalPoints
      }
    });

  } catch (error) {
    console.error('خطأ في حفظ الملف الشخصي:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في الخادم'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // جلب بيانات المستخدم مع الاهتمامات والتفضيلات
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: {
          select: {
            interest: true,
            score: true
          },
          orderBy: {
            score: 'desc'
          }
        },
        preferences: {
          select: {
            key: true,
            value: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تنظيم البيانات
    const preferences = user.preferences.reduce((acc: any, pref) => {
      acc[pref.key] = pref.value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        avatar: user.avatar,
        name: user.name,
        interests: user.interests.map(i => i.interest),
        ...preferences
      }
    });

  } catch (error) {
    console.error('خطأ في جلب بيانات الملف الشخصي:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في الخادم'
    }, { status: 500 });
  }
} 