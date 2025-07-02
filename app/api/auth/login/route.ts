import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(request: NextRequest) {
  try {
    // التحقق من content-type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('خطأ في parsing JSON:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    console.log('محاولة تسجيل دخول:', { email });
    console.log('BODY:', body);

    // التحقق من البيانات المطلوبة
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم في قاعدة البيانات
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('USER:', user);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
    
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // التحقق من حالة الحساب
    if (!user.isVerified) {
      return NextResponse.json(
        { success: false, error: 'يرجى تأكيد بريدك الإلكتروني أولاً' },
        { status: 403 }
      );
    }

    console.log('تسجيل دخول ناجح للمستخدم:', user.email);

    // إضافة معلومات إضافية للمستخدم
    const responseUser = {
      ...user,
      is_admin: user.isAdmin,
      // التأكد من وجود جميع الحقول المطلوبة
      loyaltyPoints: 0, // قيمة افتراضية
      status: 'active', // قيمة افتراضية
      role: user.role || 'regular',
      isVerified: user.isVerified || false
    };

    // إنشاء JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        is_admin: responseUser.is_admin
      },
      JWT_SECRET,
      { expiresIn: '7d' } // صلاحية لمدة 7 أيام
    );

    // إنشاء response مع الكوكيز
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: responseUser
    });

    // إضافة الكوكيز الآمنة
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isHttps = forwardedProto === 'https';
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? isHttps : false;
    
    // كوكيز للمستخدم (بدون httpOnly ليمكن قراءته من JavaScript)
    response.cookies.set('user', JSON.stringify(responseUser), {
      httpOnly: false, // السماح بقراءته من JavaScript لدعم Safari
      secure: secureFlag,
      sameSite: secureFlag ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
      path: '/',
      domain: undefined // السماح للمتصفح بتحديد النطاق
    });

    // كوكيز للتوكن
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: secureFlag ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
      path: '/',
      domain: undefined // السماح للمتصفح بتحديد النطاق
    });

    return response;
    
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'حدث خطأ في عملية تسجيل الدخول',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 