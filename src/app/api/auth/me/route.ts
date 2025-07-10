import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { logAuthEvent } from '@/lib/audit-log';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // الحصول على الجلسة الحالية
    const session = await getServerSession(authOptions);
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'المستخدم غير مسجل دخول' },
        { status: 401 }
      );
    }

    // البحث عن المستخدم مع جميع البيانات المطلوبة
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
            description: true
          }
        },
        profile: true,
        analytics: {
          select: {
            totalReadingTime: true,
            articlesRead: true,
            commentsCount: true,
            sharesCount: true,
            likesCount: true,
            averageReadingTime: true,
            favoriteCategories: true
          }
        },
        loyaltyPoints: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), 0, 1) // نقاط هذا العام
            }
          },
          select: {
            points: true,
            type: true,
            reason: true,
            createdAt: true
          }
        },
        subscriptions: {
          where: {
            active: true
          },
          select: {
            id: true,
            plan: true,
            status: true,
            currentPeriodEnd: true,
            features: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تحديث آخر نشاط
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActivityAt: new Date()
      }
    });

    // حساب إجمالي النقاط
    const totalLoyaltyPoints = await prisma.loyaltyPoints.aggregate({
      where: {
        userId: user.id,
        type: 'earned'
      },
      _sum: {
        points: true
      }
    });

    const usedLoyaltyPoints = await prisma.loyaltyPoints.aggregate({
      where: {
        userId: user.id,
        type: 'spent'
      },
      _sum: {
        points: true
      }
    });

    const currentLoyaltyPoints = (totalLoyaltyPoints._sum.points || 0) - (usedLoyaltyPoints._sum.points || 0);

    // حساب إحصائيات القراءة الحديثة (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: {
        userId: user.id,
        createdAt: {
          gte: thirtyDaysAgo
        },
        type: {
          in: ['article_view', 'comment_created', 'article_shared', 'article_liked']
        }
      },
      _count: {
        type: true
      }
    });

    // تحويل النشاط الحديث إلى كائن سهل الاستخدام
    const recentStats = recentActivity.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);

    // حساب مستوى المستخدم بناءً على النقاط
    const getUserLevel = (points: number) => {
      if (points >= 10000) return { level: 'expert', name: 'خبير', color: '#8B5CF6' };
      if (points >= 5000) return { level: 'advanced', name: 'متقدم', color: '#3B82F6' };
      if (points >= 1000) return { level: 'intermediate', name: 'متوسط', color: '#10B981' };
      if (points >= 100) return { level: 'beginner', name: 'مبتدئ', color: '#F59E0B' };
      return { level: 'newcomer', name: 'جديد', color: '#6B7280' };
    };

    const userLevel = getUserLevel(currentLoyaltyPoints);

    // إعداد البيانات للإرجاع
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      avatar: user.profile?.avatar || '',
      bio: user.profile?.bio || '',
      website: user.profile?.website || '',
      location: user.profile?.location || '',
      birthDate: user.profile?.birthDate,
      gender: user.profile?.gender,
      socialMedia: user.profile?.socialMedia || {},
      preferences: user.profile?.preferences || {
        language: 'ar',
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          sms: false
        }
      },
      role: {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.permissions,
        description: user.role.description
      },
      stats: {
        totalReadingTime: user.analytics?.totalReadingTime || 0,
        articlesRead: user.analytics?.articlesRead || 0,
        commentsCount: user.analytics?.commentsCount || 0,
        sharesCount: user.analytics?.sharesCount || 0,
        likesCount: user.analytics?.likesCount || 0,
        averageReadingTime: user.analytics?.averageReadingTime || 0,
        favoriteCategories: user.analytics?.favoriteCategories || [],
        recentActivity: {
          articleViews: recentStats.article_view || 0,
          commentsCreated: recentStats.comment_created || 0,
          articlesShared: recentStats.article_shared || 0,
          articlesLiked: recentStats.article_liked || 0
        }
      },
      loyalty: {
        currentPoints: currentLoyaltyPoints,
        totalEarned: totalLoyaltyPoints._sum.points || 0,
        totalSpent: usedLoyaltyPoints._sum.points || 0,
        level: userLevel,
        recentPoints: user.loyaltyPoints.slice(0, 10) // آخر 10 عمليات
      },
      subscription: user.subscriptions[0] || null,
      account: {
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        lastActivityAt: user.lastActivityAt,
        loginCount: user.loginCount,
        isActive: user.active,
        newsletterSubscribed: user.newsletterSubscribed,
        totalReferrals: user.totalReferrals,
        referralCode: user.referralCode
      },
      security: {
        twoFactorEnabled: user.twoFactorEnabled,
        lastPasswordChangeAt: user.lastPasswordChangeAt,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil
      }
    };

    // تسجيل الوصول للملف الشخصي
    await logAuthEvent({
      type: 'profile_accessed',
      ip,
      userId: user.id,
      email: user.email,
      success: true,
      reason: 'وصول للملف الشخصي'
    });

    return NextResponse.json({
      user: userData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    await logAuthEvent({
      type: 'profile_access_error',
      ip,
      success: false,
      reason: 'خطأ داخلي في الخادم',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });

    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات المستخدم' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// تحديث البيانات الشخصية
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'المستخدم غير مسجل دخول' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      'name', 'phone', 'bio', 'website', 'location', 
      'birthDate', 'gender', 'socialMedia', 'preferences'
    ];

    // تصفية الحقول المسموحة فقط
    const updateData: any = {};
    const profileData: any = {};

    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        if (['name', 'phone'].includes(key)) {
          updateData[key] = body[key];
        } else {
          profileData[key] = body[key];
        }
      }
    });

    // تحديث البيانات في transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // تحديث بيانات المستخدم الأساسية
      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: updateData
        });
      }

      // تحديث الملف الشخصي
      if (Object.keys(profileData).length > 0) {
        await tx.userProfile.upsert({
          where: { userId: user.id },
          update: profileData,
          create: {
            userId: user.id,
            ...profileData
          }
        });
      }

      // إرجاع البيانات المحدثة
      return await tx.user.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
          role: {
            select: {
              name: true,
              permissions: true
            }
          }
        }
      });
    });

    // تسجيل التحديث
    await logAuthEvent({
      type: 'profile_updated',
      ip,
      userId: user.id,
      email: user.email,
      success: true,
      reason: 'تحديث الملف الشخصي',
      details: {
        updatedFields: Object.keys({ ...updateData, ...profileData })
      }
    });

    return NextResponse.json({
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        phone: updatedUser?.phone,
        profile: updatedUser?.profile
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    await logAuthEvent({
      type: 'profile_update_error',
      ip,
      success: false,
      reason: 'خطأ داخلي في الخادم',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الملف الشخصي' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 