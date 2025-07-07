import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'
import { requirePermission } from '@/lib/auth/permissions'

const prisma = new PrismaClient()

// جلب مستخدم محدد - يتطلب صلاحية users.read
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const authResult = await requirePermission(request, 'users', 'read')
  if (authResult instanceof NextResponse) return authResult
  
  try {
    const { userId } = await context.params
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_admin: true,
        is_verified: true,
        created_at: true,
        updated_at: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('خطأ في جلب المستخدم:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المستخدم' },
      { status: 500 }
    )
  }
}

// تحديث مستخدم - يتطلب صلاحية users.update
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const authResult = await requirePermission(request, 'users', 'update')
  if (authResult instanceof NextResponse) return authResult
  
  try {
    const { userId } = await context.params
    const body = await request.json()
    const {
      name,
      email,
      role,
      is_admin,
      is_verified,
      metadata
    } = body

    // التحقق من وجود المستخدم
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // تحديث المستخدم
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(typeof is_admin === 'boolean' && { is_admin }),
        ...(typeof is_verified === 'boolean' && { is_verified }),
        ...(metadata && { metadata }),
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'تم تحديث المستخدم بنجاح'
    })
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المستخدم' },
      { status: 500 }
    )
  }
}

// حذف مستخدم - يتطلب صلاحية users.delete
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const authResult = await requirePermission(request, 'users', 'delete')
  if (authResult instanceof NextResponse) return authResult
  
  try {
    const { userId } = await context.params

    // التحقق من وجود المستخدم
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // حذف المستخدم
    await prisma.users.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    })
  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المستخدم' },
      { status: 500 }
    )
  }
} 