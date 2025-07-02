import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { memberId, avatarUrl } = await request.json();

    if (!memberId || !avatarUrl) {
      return NextResponse.json({
        success: false,
        error: 'معرف العضو ورابط الصورة مطلوبان'
      }, { status: 400 });
    }

    // التحقق من أن العضو موجود
    const member = await prisma.user.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      return NextResponse.json({
        success: false,
        error: 'العضو غير موجود'
      }, { status: 404 });
    }

    // تحديث صورة العضو
    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: { avatar: avatarUrl }
    });

    console.log('✅ تم تحديث صورة العضو:', memberId);

    return NextResponse.json({
      success: true,
      message: 'تم تحديث صورة العضو بنجاح',
      data: {
        id: updatedMember.id,
        name: updatedMember.name,
        email: updatedMember.email,
        avatar: updatedMember.avatar
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث صورة العضو:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في تحديث صورة العضو',
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