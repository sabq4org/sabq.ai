import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { logAuthEvent } from '@/lib/audit-log';
import { invalidateUserSessions } from '@/lib/session-manager';
import { revokeUserTokens } from '@/lib/auth-tokens';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // الحصول على الجلسة الحالية
    const session = await getServerSession(authOptions);
    const ip = request.ip ?? '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'المستخدم غير مسجل دخول' },
        { status: 401 }
      );
    }

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        email: true, 
        name: true,
        lastLoginAt: true,
        loginCount: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // إلغاء جميع الجلسات النشطة للمستخدم
    await invalidateUserSessions(user.id);

    // إلغاء جميع الرموز المميزة للمستخدم
    await revokeUserTokens(user.id);

    // تحديث آخر وقت تسجيل خروج
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogoutAt: new Date(),
        currentSessionId: null
      }
    });

    // حذف جلسات المتصفح منتهية الصلاحية
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        expires: {
          lt: new Date()
        }
      }
    });

    // تسجيل عملية تسجيل الخروج
    await logAuthEvent({
      type: 'logout_success',
      ip,
      userId: user.id,
      email: user.email,
      success: true,
      reason: 'تسجيل خروج عادي',
      userAgent,
      sessionDuration: user.lastLoginAt 
        ? Date.now() - user.lastLoginAt.getTime() 
        : 0
    });

    // إنشاء الاستجابة مع حذف الكوكيز
    const response = NextResponse.json(
      { 
        message: 'تم تسجيل الخروج بنجاح',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

    // حذف كوكيز المصادقة
    const cookiesToDelete = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token'
    ];

    cookiesToDelete.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });
    });

    return response;

  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);

    // تسجيل الخطأ
    await logAuthEvent({
      type: 'logout_error',
      ip: request.ip ?? '127.0.0.1',
      success: false,
      reason: 'خطأ داخلي في الخادم',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// تسجيل خروج من جميع الأجهزة
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const ip = request.ip ?? '127.0.0.1';

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

    // حذف جميع الجلسات النشطة
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    // إلغاء جميع الرموز المميزة
    await revokeUserTokens(user.id);

    // تحديث بيانات المستخدم
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogoutAt: new Date(),
        currentSessionId: null,
        sessionVersion: {
          increment: 1 // زيادة إصدار الجلسة لإبطال جميع الجلسات القديمة
        }
      }
    });

    // تسجيل العملية
    await logAuthEvent({
      type: 'logout_all_devices',
      ip,
      userId: user.id,
      email: user.email,
      success: true,
      reason: 'تسجيل خروج من جميع الأجهزة',
      details: {
        sessionsDeleted: deletedSessions.count
      }
    });

    return NextResponse.json({
      message: 'تم تسجيل الخروج من جميع الأجهزة بنجاح',
      sessionsDeleted: deletedSessions.count
    });

  } catch (error) {
    console.error('خطأ في تسجيل الخروج من جميع الأجهزة:', error);

    await logAuthEvent({
      type: 'logout_all_devices_error',
      ip: request.ip ?? '127.0.0.1',
      success: false,
      reason: 'خطأ داخلي في الخادم',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 