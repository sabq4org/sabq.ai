import { NextRequest, NextResponse } from 'next/server'
// import { verifyPassword } from '@/lib/security' // Will be enabled after lib structure is complete

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // TODO: Implement actual user authentication with database
    // For now, return mock response
    const isValidUser = email === 'admin@sabq.ai' && password === 'password123'

    if (!isValidUser) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      )
    }

    // TODO: Generate actual JWT token
    const token = 'mock-jwt-token'

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        id: '1',
        email,
        name: 'مدير النظام',
        role: 'admin'
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'استخدم POST لتسجيل الدخول' },
    { status: 405 }
  )
} 