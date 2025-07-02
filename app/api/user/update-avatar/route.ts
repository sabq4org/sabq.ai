import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, avatarUrl } = await request.json();

    if (!userId || !avatarUrl) {
      return NextResponse.json({
        success: false,
        error: 'معرف المستخدم ورابط الصورة مطلوبان'
      }, { status: 400 });
    }

    // التحقق من أن المستخدم موجود
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'المستخدم غير موجود'
      }, { status: 404 });
    }

    // تحديث صورة الملف الشخصي
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl }
    });

    console.log('✅ تم تحديث صورة الملف الشخصي للمستخدم:', userId);

    return NextResponse.json({
      success: true,
      message: 'تم تحديث صورة الملف الشخصي بنجاح',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث صورة الملف الشخصي:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في تحديث صورة الملف الشخصي',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// دعم OPTIONS للـ CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 