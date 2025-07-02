import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // إنشاء response
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });

    // حذف جميع الكوكيز المتعلقة بالمصادقة
    response.cookies.delete('user');
    response.cookies.delete('auth-token');
    
    // حذف أي كوكيز أخرى متعلقة بالجلسة
    response.cookies.set('user', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // حذف فوري
      path: '/'
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // حذف فوري
      path: '/'
    });

    return response;
    
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في عملية تسجيل الخروج' },
      { status: 500 }
    );
  }
} 