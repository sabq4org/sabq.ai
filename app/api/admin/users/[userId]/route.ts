import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/middleware'
import bcrypt from 'bcrypt'

// جلب مستخدم محدد - يتطلب صلاحية users.read
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requirePermission(request, 'users', 'read')
  if (authResult instanceof NextResponse) return authResult
  
  try {
    const { userId } = await params
    const user = await prisma.sabq_users.findUnique({
      where: { id: userId },
      include: {
        role: true,
        _count: {
          select: { sessions: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: {
          id: user.role?.id,
          name: user.role?.name,
          nameAr: user.role?.nameAr
        },
        sessionsCount: user._count.sessions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    console.error('خطأ في جلب المستخدم:', error)
    return NextResponse.json(
      { success: false, error: 'فشل جلب المستخدم' },
      { status: 500 }
    )
  }
}

// تحديث مستخدم - يتطلب صلاحية users.update
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requirePermission(request, 'users', 'update')
  if (authResult instanceof NextResponse) return authResult
  
  try {
    const { userId } = await params
    const body = await request.json()
    const { email, password, name, roleId } = body

    // التحقق من وجود المستخدم
    const existingUser = await prisma.sabq_users.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // بناء بيانات التحديث
    const updateData: any = {}
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (roleId) updateData.roleId = roleId
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // تحديث المستخدم
    const updatedUser = await prisma.sabq_users.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: {
          id: updatedUser.role?.id,
          name: updatedUser.role?.name,
          nameAr: updatedUser.role?.nameAr
        },
        updatedAt: updatedUser.updatedAt
      }
    })
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error)
    return NextResponse.json(
      { success: false, error: 'فشل تحديث المستخدم' },
      { status: 500 }
    )
  }
}

// حذف مستخدم - يتطلب صلاحية users.delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requirePermission(request, 'users', 'delete')
  if (authResult instanceof NextResponse) return authResult
  
  try {
    const { userId } = await params
    const user = authResult

    // التحقق من وجود المستخدم
    const userToDelete = await prisma.sabq_users.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // منع حذف المستخدم نفسه
    if (userToDelete.id === user.id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      )
    }

    // منع حذف آخر مدير
    if (userToDelete.role?.name === 'admin') {
      const adminCount = await prisma.sabq_users.count({
        where: {
          role: { name: 'admin' }
        }
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'لا يمكن حذف آخر مدير في النظام' },
          { status: 400 }
        )
      }
    }

    // حذف جلسات المستخدم أولاً
    await prisma.sabq_sessions.deleteMany({
      where: { userId: userId }
    })

    // حذف المستخدم
    await prisma.sabq_users.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    })
  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error)
    return NextResponse.json(
      { success: false, error: 'فشل حذف المستخدم' },
      { status: 500 }
    )
  }
} 