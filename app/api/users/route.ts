import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

// GET: جلب جميع المستخدمين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // بناء شروط البحث
    const where: any = {};
    
    // فلترة حسب الحالة
    const status = searchParams.get('status');
    if (status) {
      where.role = status; // نستخدم role بدلاً من status في Schema
    }
    
    // فلترة حسب التحقق
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      where.isVerified = true;
    } else if (verified === 'false') {
      where.isVerified = false;
    }
    
    // البحث بالاسم أو البريد
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }
    
    // جلب المستخدمين مع الإحصائيات
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isAdmin: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        // إحصائيات
        _count: {
          select: {
            loyaltyPoints: true,
            preferences: true,
            interests: true,
            sessions: true,
            impressions: true,
            recommendations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // حساب نقاط الولاء لكل مستخدم
    const usersWithPoints = await Promise.all(users.map(async (user) => {
      const totalPoints = await prisma.loyaltyPoint.aggregate({
        where: { userId: user.id },
        _sum: { points: true }
      });
      
      return {
        ...user,
        loyaltyPoints: totalPoints._sum.points || 0,
        loyaltyLevel: calculateLoyaltyLevel(totalPoints._sum.points || 0),
        articlesCount: 0,
        activityCount: user._count.sessions || 0,
        status: mapRoleToStatus(user.role),
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString()
      };
    }));
    
    return NextResponse.json({
      success: true,
      data: usersWithPoints,
      total: usersWithPoints.length
    });
    
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في جلب المستخدمين',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// POST: إضافة مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني وكلمة المرور والاسم مطلوبة'
      }, { status: 400 });
    }
    
    // التحقق من عدم تكرار البريد الإلكتروني
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    });
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني مستخدم بالفعل'
      }, { status: 400 });
    }
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    // إنشاء المستخدم الجديد
    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: hashedPassword,
        name: body.name,
        avatar: body.avatar,
        role: body.role || 'user',
        isAdmin: body.role === 'admin',
        isVerified: body.isVerified || false,
        verificationToken: body.isVerified ? null : generateVerificationToken()
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isAdmin: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // إضافة نقاط ترحيبية
    await prisma.loyaltyPoint.create({
      data: {
        userId: newUser.id,
        points: 100,
        action: 'welcome_bonus',
        metadata: {
          message: 'مكافأة التسجيل'
        }
      }
    });
    
    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId: newUser.id,
        action: 'user_registered',
        entityType: 'user',
        entityId: newUser.id,
        metadata: {
          email: newUser.email,
          name: newUser.name
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...newUser,
        loyaltyPoints: 100,
        loyaltyLevel: 'bronze',
        created_at: newUser.createdAt.toISOString(),
        updated_at: newUser.updatedAt.toISOString()
      },
      message: 'تم إنشاء المستخدم بنجاح'
    }, { status: 201 });
    
  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في إنشاء المستخدم',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// PUT: تحديث المستخدمين
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = body.ids || [];
    const updates = body.updates || {};
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'معرفات المستخدمين مطلوبة'
      }, { status: 400 });
    }
    
    // تحديث المستخدمين
    const result = await prisma.user.updateMany({
      where: {
        id: { in: ids }
      },
      data: updates
    });
    
    // تسجيل النشاط
    await Promise.all(ids.map(userId => 
      prisma.activityLog.create({
        data: {
          userId,
          action: 'user_updated',
          entityType: 'user',
          entityId: userId,
          newValue: updates
        }
      })
    ));
    
    return NextResponse.json({
      success: true,
      affected: result.count,
      message: `تم تحديث ${result.count} مستخدم(ين) بنجاح`
    });
    
  } catch (error) {
    console.error('خطأ في تحديث المستخدمين:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في تحديث المستخدمين',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// DELETE: حذف المستخدمين
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = body.ids || [];
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'معرفات المستخدمين مطلوبة'
      }, { status: 400 });
    }
    
    // حذف المستخدمين (سيتم حذف السجلات المرتبطة تلقائياً بسبب cascade)
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    
    return NextResponse.json({
      success: true,
      affected: result.count,
      message: `تم حذف ${result.count} مستخدم(ين) بنجاح`
    });
    
  } catch (error) {
    console.error('خطأ في حذف المستخدمين:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في حذف المستخدمين',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// دوال مساعدة
function calculateLoyaltyLevel(points: number): string {
  if (points >= 5000) return 'platinum';
  if (points >= 2000) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
}

function mapRoleToStatus(role: string): string {
  const statusMap: { [key: string]: string } = {
    admin: 'active',
    editor: 'active',
    user: 'active',
    suspended: 'suspended'
  };
  return statusMap[role] || 'active';
}

function generateVerificationToken(): string {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}
