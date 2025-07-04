import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getCurrentUser } from '@/app/lib/auth';

const prisma = new PrismaClient();

// دالة مساعدة للتحقق من صلاحيات الإدارة
async function checkAdminPermission(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isAdmin: true }
  });
  
  return !!(user && (user.isAdmin || ['admin', 'moderator'].includes(user.role)));
}

export async function GET(request: NextRequest) {
  try {
    // التحقق من المستخدم
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من الصلاحيات
    const isAdmin = await checkAdminPermission(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية الوصول' },
        { status: 403 }
      );
    }

    // جلب معاملات البحث
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'latest';
    const hasReports = searchParams.get('hasReports') === 'true';
    const skip = (page - 1) * limit;

    // بناء شروط البحث
    const where: any = {};
    
    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { content: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } }
      ];
    }

    if (hasReports) {
      where.reports = { some: {} };
    }

    // بناء ترتيب النتائج
    let orderBy: any = {};
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'mostReported':
        orderBy = { reports: { _count: 'desc' } };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // جلب التعليقات
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          article: {
            select: {
              id: true,
              title: true
            }
          },
          _count: {
            select: {
              // reports: true,
              replies: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.comment.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      comments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching comments for admin:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التعليقات' },
      { status: 500 }
    );
  }
} 