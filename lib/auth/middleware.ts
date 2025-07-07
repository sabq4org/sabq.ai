import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function requirePermission(
  request: NextRequest,
  resource: string,
  action: string
): Promise<NextResponse | any> {
  try {
    // التحقق من وجود token في الكوكيز
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      )
    }

    // التحقق من صحة الجلسة
    const session = await prisma.sabq_sessions.findFirst({
      where: { token },
      include: {
        user: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    })

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'جلسة غير صالحة' },
        { status: 401 }
      )
    }

    // التحقق من انتهاء صلاحية الجلسة
    if (session.expiresAt && new Date() > session.expiresAt) {
      await prisma.sabq_sessions.delete({ where: { id: session.id } })
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية الجلسة' },
        { status: 401 }
      )
    }

    // التحقق من الصلاحيات
    const hasPermission = session.user.role?.permissions?.some(
      (permission: any) => 
        permission.resource === resource && 
        permission.action === action
    )

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية لهذا الإجراء' },
        { status: 403 }
      )
    }

    // إرجاع بيانات المستخدم للمتابعة
    return session.user
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحيات:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في التحقق من الصلاحيات' },
      { status: 500 }
    )
  }
} 