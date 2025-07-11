import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

const getNotificationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  type: z.string().optional(),
  read: z.coerce.boolean().optional()
});

/**
 * GET /api/notifications
 * جلب إشعارات المستخدم
 */
export async function GET(request: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);

    // التحقق من صحة المعاملات
    const queryParams = getNotificationsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
      read: searchParams.get('read')
    });

    // بناء شروط البحث
    const whereClause: any = {
      user_id: user.id,
      expires_at: {
        OR: [
          { gt: new Date() },
          { equals: null }
        ]
      }
    };

    if (queryParams.type) {
      whereClause.type = queryParams.type;
    }

    if (queryParams.read !== undefined) {
      whereClause.read = queryParams.read;
    }

    // حساب الإزاحة
    const skip = (queryParams.page - 1) * queryParams.limit;

    // جلب الإشعارات
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar_url: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: queryParams.limit
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({
        where: {
          user_id: user.id,
          read: false,
          expires_at: {
            OR: [
              { gt: new Date() },
              { equals: null }
            ]
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / queryParams.limit)
        },
        unread_count: unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications
 * تحديث حالة الإشعارات (قراءة جميع الإشعارات)
 */
export async function PUT(request: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const body = await request.json();

    if (body.action === 'mark_all_read') {
      // تحديد جميع الإشعارات كمقروءة
      await prisma.notification.updateMany({
        where: {
          user_id: user.id,
          read: false
        },
        data: {
          read: true,
          read_at: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'تم تحديد جميع الإشعارات كمقروءة'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 