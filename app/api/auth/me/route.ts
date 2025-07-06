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
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
        isAdmin: true,
        loyaltyPoints: {
          select: {
            points: true
          }
        },
        preferences: {
          select: {
            id: true,
            key: true,
            value: true
          },
          where: {
            key: { startsWith: 'category_' }
          }
        }
      }
    });

    if (!user) {
      return corsResponse(
        { success: false, error: 'المستخدم غير موجود' },
        404
      );
    }

    // حساب مجموع نقاط الولاء
    const totalLoyaltyPoints = user.loyaltyPoints.reduce((total, lp) => total + lp.points, 0);

    // إضافة معلومات إضافية
    const responseUser = {
      ...user,
      is_admin: user.is_admin || user.role === 'admin' || user.role === 'super_admin',
      loyaltyPoints: totalLoyaltyPoints,
      status: 'active', // قيمة افتراضية
      role: user.role || 'user',
      isVerified: user.isVerified || false,
      interests: user.preferences.map(pref => {
        const value = pref.value as any;
        return value?.categorySlug || '';
      }).filter(interest => interest) // تحويل التفضيلات إلى array من الأسماء
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