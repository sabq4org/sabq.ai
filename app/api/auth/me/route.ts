import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // في بيئة الإنتاج، يجب التحقق من الجلسة أو الرمز المميز
  // هنا سنرجع مستخدم وهمي للاختبار
  
  // التحقق من وجود رمز مميز في الرأس (للاختبار فقط)
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  // استخراج معرف المستخدم من الرمز الوهمي
  const token = authHeader.substring(7);
  const match = token.match(/fake-jwt-token-(\d+)/);
  
  if (!match) {
    return NextResponse.json(
      { error: 'رمز غير صالح' },
      { status: 401 }
    );
  }

  const userId = match[1];
  
  // إرجاع بيانات المستخدم بناءً على المعرف
  const users = {
    '1': {
      id: '1',
      email: 'admin@sabq.org',
      name: 'المدير العام',
      role: 'admin'
    },
    '2': {
      id: '2',
      email: 'editor@sabq.org',
      name: 'محرر المحتوى',
      role: 'editor'
    },
    '3': {
      id: '3',
      email: 'writer@sabq.org',
      name: 'كاتب المحتوى',
      role: 'writer'
    }
  };

  const user = users[userId as keyof typeof users];
  
  if (!user) {
    return NextResponse.json(
      { error: 'المستخدم غير موجود' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    user,
    success: true
  });
}

// تحديث البيانات الشخصية
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

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

    const body = await request.json();
    const allowedFields = [
      'name', 'phone', 'bio', 'website', 'location', 
      'birthDate', 'gender', 'socialMedia', 'preferences'
    ];

    // تصفية الحقول المسموحة فقط
    const updateData: any = {};
    const profileData: any = {};

    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        if (['name', 'phone'].includes(key)) {
          updateData[key] = body[key];
        } else {
          profileData[key] = body[key];
        }
      }
    });

    // تحديث البيانات في transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // تحديث بيانات المستخدم الأساسية
      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: updateData
        });
      }

      // تحديث الملف الشخصي
      if (Object.keys(profileData).length > 0) {
        await tx.userProfile.upsert({
          where: { userId: user.id },
          update: profileData,
          create: {
            userId: user.id,
            ...profileData
          }
        });
      }

      // إرجاع البيانات المحدثة
      return await tx.user.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
          role: {
            select: {
              name: true,
              permissions: true
            }
          }
        }
      });
    });

    // تسجيل التحديث
    await logAuthEvent({
      type: 'profile_updated',
      ip,
      userId: user.id,
      email: user.email,
      success: true,
      reason: 'تحديث الملف الشخصي',
      details: {
        updatedFields: Object.keys({ ...updateData, ...profileData })
      }
    });

    return NextResponse.json({
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        phone: updatedUser?.phone,
        profile: updatedUser?.profile
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    await logAuthEvent({
      type: 'profile_update_error',
      ip,
      success: false,
      reason: 'خطأ داخلي في الخادم',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الملف الشخصي' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 