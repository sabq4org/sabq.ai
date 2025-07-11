import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/moderation/appeals
 * جلب التظلمات للمراجعة
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const user_id = searchParams.get('user_id');

    // التحقق من صلاحيات المشرف
    const user = await prisma.user.findUnique({
      where: { id: user_id! },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مسموح لك بالوصول' },
        { status: 403 }
      );
    }

    const skip = (page - 1) * limit;

    // جلب التظلمات
    const appeals = await prisma.commentAppeal.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image: true
          }
        },
        comment: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            },
            article: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    });

    // إجمالي عدد التظلمات
    const total = await prisma.commentAppeal.count({
      where: { status }
    });

    // إحصائيات سريعة
    const statusCounts = await prisma.commentAppeal.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const statusStats = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        appeals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          status_counts: statusStats
        }
      }
    });

  } catch (error) {
    console.error('Error fetching appeals:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التظلمات' },
      { status: 500 }
    );
  }
} 