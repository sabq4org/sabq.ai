import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] - الحصول على بيانات مستخدم محدد
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // جلب المستخدم مع جميع البيانات المرتبطة
    const user = await prisma.user.findUnique({
      where: { id },
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
        // العلاقات
        _count: {
          select: {
            articles: true,
            activityLogs: true
          }
        },
        userRoles: {
          include: {
            role: true
          }
        },
        articles: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            views: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'المستخدم غير موجود'
      }, { status: 404 });
    }
    
    // حساب نقاط الولاء
    const totalPoints = await prisma.loyaltyPoint.aggregate({
      where: { userId: id },
      _sum: { points: true }
    });
    
    // جلب آخر الأنشطة
    const recentActivities = await prisma.activityLog.findMany({
      where: { userId: id },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    // جلب آخر التفاعلات
    const recentInteractions = await prisma.interaction.findMany({
      where: { userId: id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });
    
    const userData = {
      ...user,
      loyaltyPoints: totalPoints._sum.points || 0,
      loyaltyLevel: calculateLoyaltyLevel(totalPoints._sum.points || 0),
      articlesCount: user._count.articles,
      activityCount: user._count.activityLogs,
      status: mapRoleToStatus(user.role),
      recentActivities,
      recentInteractions,
      roles: user.userRoles.map(ur => ur.role),
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: userData
    });
    
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في جلب بيانات المستخدم',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// PUT /api/users/[id] - تحديث بيانات مستخدم
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, status, role, isVerified, newPassword, avatar } = body;
    
    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'المستخدم غير موجود'
      }, { status: 404 });
    }
    
    // إعداد البيانات للتحديث
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (role !== undefined) updateData.role = role;
    if (role === 'admin') updateData.isAdmin = true;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    
    // تحديث كلمة المرور إذا تم توفيرها
    if (newPassword && newPassword.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    
    // تحديث المستخدم
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
    
    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId: id,
        action: 'user_profile_updated',
        entityType: 'user',
        entityId: id,
        oldValue: {
          name: existingUser.name,
          role: existingUser.role,
          isVerified: existingUser.isVerified
        },
        newValue: updateData
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات المستخدم بنجاح',
      data: {
        ...updatedUser,
        created_at: updatedUser.createdAt.toISOString(),
        updated_at: updatedUser.updatedAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في تحديث بيانات المستخدم',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// DELETE /api/users/[id] - حذف مستخدم
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'المستخدم غير موجود'
      }, { status: 404 });
    }
    
    // التحقق من عدم وجود مقالات مرتبطة
    if (user._count.articles > 0) {
      return NextResponse.json({
        success: false,
        error: 'لا يمكن حذف المستخدم لوجود مقالات مرتبطة به',
        articlesCount: user._count.articles
      }, { status: 400 });
    }
    
    // حذف المستخدم (سيتم حذف السجلات المرتبطة تلقائياً)
    await prisma.user.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم نهائياً',
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في حذف المستخدم',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// PATCH /api/users/[id] - تحديث حالة المستخدم (تعليق/تفعيل)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body;
    
    // التحقق من الحالة المطلوبة
    const validStatuses = ['active', 'suspended'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'الحالة غير صحيحة. يجب أن تكون active أو suspended'
      }, { status: 400 });
    }
    
    // تحديث حالة المستخدم
    const role = status === 'suspended' ? 'suspended' : 'user';
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId: id,
        action: status === 'suspended' ? 'user_suspended' : 'user_activated',
        entityType: 'user',
        entityId: id,
        metadata: { reason }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: status === 'suspended' ? 'تم تعليق المستخدم' : 'تم تفعيل المستخدم',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('خطأ في تحديث حالة المستخدم:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في تحديث حالة المستخدم',
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