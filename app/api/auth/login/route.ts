import { NextRequest, NextResponse } from 'next/server';

// بيانات المستخدمين التجريبية
const users = [
  {
    id: '1',
    email: 'admin@sabq.org',
    password: 'admin123',
    name: 'المدير العام',
    role: 'admin'
  },
  {
    id: '2',
    email: 'editor@sabq.org',
    password: 'editor123',
    name: 'محرر المحتوى',
    role: 'editor'
  },
  {
    id: '3',
    email: 'writer@sabq.org',
    password: 'writer123',
    name: 'كاتب المحتوى',
    role: 'writer'
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // التحقق من البيانات المطلوبة
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // إرجاع بيانات المستخدم (بدون كلمة المرور)
    const { password: _, ...userData } = user;

    return NextResponse.json({
      success: true,
      user: userData,
      token: `fake-jwt-token-${user.id}` // رمز وهمي للاختبار
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    );
  }
}

// OPTIONS - للتحقق من توفر الخدمة
export async function OPTIONS() {
  return NextResponse.json({
    success: true,
    message: 'Authentication service is available',
    methods: ['POST', 'OPTIONS']
  });
} 