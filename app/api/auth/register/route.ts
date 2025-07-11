import { NextRequest, NextResponse } from 'next/server';

// مخزن مؤقت للمستخدمين الجدد (في الإنتاج يجب استخدام قاعدة بيانات)
const newUsers: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // التحقق من البيانات المطلوبة
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }

    // التحقق من طول كلمة المرور
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود المستخدم مسبقاً
    const existingUser = newUsers.find(u => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // إنشاء مستخدم جديد
    const newUser = {
      id: `new-${Date.now()}`,
      name,
      email,
      password, // في الإنتاج يجب تشفير كلمة المرور
      role: 'writer',
      createdAt: new Date().toISOString()
    };

    newUsers.push(newUser);

    // إرجاع بيانات المستخدم (بدون كلمة المرور)
    const { password: _, ...userData } = newUser;

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'تم إنشاء الحساب بنجاح'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحساب' },
      { status: 500 }
    );
  }
} 