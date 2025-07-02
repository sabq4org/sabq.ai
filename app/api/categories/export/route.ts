import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/lib/auth'

export const runtime = 'nodejs'

// GET /api/categories/export
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'غير مصرح لك' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // في المستقبل، يمكننا التحقق من صلاحيات المستخدم هنا
    // if (user.role !== 'admin' && user.role !== 'superadmin') { ... }

    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })

    const fileName = `categories-backup-${new Date().toISOString()}.json`

    return new NextResponse(JSON.stringify(categories, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('فشل في تصدير التصنيفات:', error)
    return new NextResponse(JSON.stringify({ error: 'فشل في تصدير التصنيفات' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 