import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json({
        success: false,
        error: 'معرف المستخدم والبريد الإلكتروني مطلوبان'
      }, { status: 400 });
    }

    // التحقق من وجود المستخدم في قاعدة البيانات
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        isAdmin: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || user.email !== email) {
      return NextResponse.json({
        success: false,
        error: 'بيانات المستخدم غير صحيحة'
      }, { status: 401 });
    }

    // إنشاء JWT token جديد
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.is_admin
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // إنشاء response مع تعيين الكوكيز
    const response = NextResponse.json({
      success: true,
      user: {
        ...user,
        is_admin: user.is_admin || user.role === 'admin',
        status: 'active'
      },
      token
    });

    // تعيين auth-token في الكوكيز
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 أيام
    });

    return response;

  } catch (error) {
    console.error('خطأ في التحقق من المستخدم:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في التحقق من المستخدم'
    }, { status: 500 });
  }
} 