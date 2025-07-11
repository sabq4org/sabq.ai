import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

/**
 * GET /api/users/[id]/notifications
 * جلب إشعارات المستخدم
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    const url = new URL(request.url);
    const unread = url.searchParams.get('unread') === 'true';
    const type = url.searchParams.get('type');
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;
    
    // يمكن للمستخدم رؤية إشعاراته فقط
    if (currentUser.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // بناء شروط البحث
    const where: any = { user_id: userId };
    
    if (unread) {
      where.read = false;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (category) {
      where.category = category;
    }

    // جلب الإشعارات
    const notifications = await prisma.realTimeNotification.findMany({
      where,
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
      skip: offset,
      take: limit
    });

    // عدد الإشعارات الإجمالي
    const total = await prisma.realTimeNotification.count({ where });

    // عدد الإشعارات غير المقروءة
    const unreadCount = await prisma.realTimeNotification.count({
      where: { user_id: userId, read: false }
    });

    // إحصائيات الإشعارات
    const stats = {
      total,
      unread: unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    };

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.map(notification => ({
          ...notification,
          time_ago: getTimeAgo(notification.created_at),
          sender: notification.sender
        })),
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]/notifications
 * تحديث حالة الإشعارات (قراءة/عدم قراءة)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;
    
    // يمكن للمستخدم تحديث إشعاراته فقط
    if (currentUser.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { notification_id, action, all = false } = body;

    if (!action || !['read', 'unread'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const read = action === 'read';
    const read_at = read ? new Date() : null;

    if (all) {
      // تحديث جميع الإشعارات
      await prisma.realTimeNotification.updateMany({
        where: { user_id: userId },
        data: { read, read_at }
      });

      return NextResponse.json({
        success: true,
        message: `تم تحديد جميع الإشعارات كـ${read ? 'مقروءة' : 'غير مقروءة'}`
      });
    } else {
      // تحديث إشعار محدد
      if (!notification_id) {
        return NextResponse.json(
          { error: 'Notification ID is required' },
          { status: 400 }
        );
      }

      const notification = await prisma.realTimeNotification.findUnique({
        where: { id: notification_id }
      });

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      if (notification.user_id !== userId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      await prisma.realTimeNotification.update({
        where: { id: notification_id },
        data: { read, read_at }
      });

      return NextResponse.json({
        success: true,
        message: `تم تحديد الإشعار كـ${read ? 'مقروء' : 'غير مقروء'}`
      });
    }

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]/notifications
 * حذف الإشعارات
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;
    
    // يمكن للمستخدم حذف إشعاراته فقط
    if (currentUser.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { notification_id, all = false, read_only = false } = body;

    if (all) {
      // حذف جميع الإشعارات أو المقروءة فقط
      const where: any = { user_id: userId };
      if (read_only) {
        where.read = true;
      }

      const deletedCount = await prisma.realTimeNotification.deleteMany({
        where
      });

      return NextResponse.json({
        success: true,
        message: `تم حذف ${deletedCount.count} إشعار`,
        deletedCount: deletedCount.count
      });
    } else {
      // حذف إشعار محدد
      if (!notification_id) {
        return NextResponse.json(
          { error: 'Notification ID is required' },
          { status: 400 }
        );
      }

      const notification = await prisma.realTimeNotification.findUnique({
        where: { id: notification_id }
      });

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      if (notification.user_id !== userId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      await prisma.realTimeNotification.delete({
        where: { id: notification_id }
      });

      return NextResponse.json({
        success: true,
        message: 'تم حذف الإشعار بنجاح'
      });
    }

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id]/notifications
 * إرسال إشعار جديد (للإدارة فقط)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;
    
    // فقط الإدارة يمكنها إرسال إشعارات يدوية
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      type, 
      category = 'system', 
      title, 
      message, 
      icon, 
      priority = 'normal',
      action_url,
      data = {},
      scheduled_for
    } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title and message are required' },
        { status: 400 }
      );
    }

    // إنشاء الإشعار
    const notification = await prisma.realTimeNotification.create({
      data: {
        user_id: userId,
        sender_id: currentUser.id,
        type,
        category,
        title,
        message,
        icon,
        priority,
        action_url,
        data,
        scheduled_for: scheduled_for ? new Date(scheduled_for) : null
      }
    });

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * حساب الوقت المنقضي
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'الآن';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `منذ ${minutes} دقيقة`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `منذ ${hours} ساعة`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `منذ ${days} يوم`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `منذ ${months} شهر`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `منذ ${years} سنة`;
  }
} 