import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { handleOptions, corsResponse, addCorsHeaders } from '@/lib/cors';

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return handleOptions();
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(request: NextRequest) {
  try {
    // Debugging: طباعة متغيرات البيئة للتأكد من وجودها
    console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);
    console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);

    // محاولة الحصول على التوكن من الكوكيز أو من Authorization header
    let token = request.cookies.get('auth-token')?.value;
    
    // إذا لم يوجد في الكوكيز، جرب من Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return corsResponse(
        { success: false, error: 'لم يتم العثور على معلومات المصادقة' },
        401
      );
    }

    // التحقق من صحة التوكن
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return corsResponse(
        { success: false, error: 'جلسة غير صالحة' },
        401
      );
    }

    // البحث عن المستخدم في قاعدة البيانات
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
        avatar: true,
        is_admin: true
      }
    });

    if (!user) {
      return corsResponse(
        { success: false, error: 'المستخدم غير موجود' },
        404
      );
    }

    // جلب نقاط الولاء
    const loyaltyPoints = await prisma.loyalty_points.findMany({
      where: { user_id: user.id },
      select: {
        points: true
      }
    });

    // حساب مجموع نقاط الولاء
    const totalLoyaltyPoints = loyaltyPoints.reduce((total: number, lp: { points: number }) => total + lp.points, 0);

    // جلب تفضيلات المستخدم
    const preferences = await prisma.user_preferences.findMany({
      where: {
        user_id: user.id,
        key: { startsWith: 'category_' }
      },
      select: {
        id: true,
        key: true,
        value: true
      }
    });

    // استخراج اهتمامات المستخدم
    const interests = {
      categories: preferences
        .filter((pref: { key: string; }) => pref.key.startsWith('category_'))
        .map((pref: { value: any; }) => {
          const value = pref.value as any;
          return value?.name || '';
        })
        .filter(Boolean),
      keywords: [] // لا توجد جدول keywords في المستخدمين
    };

    // إضافة معلومات إضافية
    const responseUser = {
      ...user,
      is_admin: user.is_admin || user.role === 'admin' || user.role === 'super_admin',
      loyaltyPoints: totalLoyaltyPoints,
      status: 'active', // قيمة افتراضية
      role: user.role || 'user',
      isVerified: user.is_verified || false,
      interests: interests.categories
    };

    return corsResponse({
      success: true,
      user: responseUser
    });

  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    return corsResponse(
      { 
        success: false, 
        error: 'حدث خطأ في جلب بيانات المستخدم'
      },
      500
    );
  }
} 