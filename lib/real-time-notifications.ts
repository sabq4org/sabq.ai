import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

const prisma = new PrismaClient();

// إعداد Socket.IO
let io: SocketIOServer | null = null;

/**
 * تهيئة خادم الإشعارات الفورية
 */
export function initializeRealTimeNotifications(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    path: '/socket.io/'
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // الانضمام إلى غرفة المستخدم
    socket.on('join_user_room', (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room`);
    });

    // مغادرة غرفة المستخدم
    socket.on('leave_user_room', (userId: string) => {
      socket.leave(`user_${userId}`);
      console.log(`User ${userId} left room`);
    });

    // تحديث حالة الإشعار
    socket.on('mark_notification_read', async (data: { notificationId: string, userId: string }) => {
      try {
        await prisma.realTimeNotification.update({
          where: { id: data.notificationId },
          data: { read: true, read_at: new Date() }
        });

        // إرسال تأكيد التحديث
        socket.emit('notification_updated', {
          notificationId: data.notificationId,
          read: true
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    });

    // طلب الإشعارات غير المقروءة
    socket.on('get_unread_notifications', async (userId: string) => {
      try {
        const notifications = await prisma.realTimeNotification.findMany({
          where: { user_id: userId, read: false },
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            sender: {
              select: { id: true, name: true, avatar_url: true }
            }
          }
        });

        socket.emit('unread_notifications', notifications);
      } catch (error) {
        console.error('Error fetching unread notifications:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

/**
 * إرسال إشعار فوري للمستخدم
 */
export async function sendRealTimeNotification(
  userId: string,
  notification: {
    type: string;
    category?: string;
    title: string;
    message: string;
    icon?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    actionUrl?: string;
    data?: any;
    senderId?: string;
    scheduledFor?: Date;
    expiresAt?: Date;
  }
) {
  try {
    // إنشاء الإشعار في قاعدة البيانات
    const dbNotification = await prisma.realTimeNotification.create({
      data: {
        user_id: userId,
        sender_id: notification.senderId,
        type: notification.type,
        category: notification.category || 'system',
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        priority: notification.priority || 'normal',
        action_url: notification.actionUrl,
        data: notification.data || {},
        scheduled_for: notification.scheduledFor,
        expires_at: notification.expiresAt
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar_url: true }
        }
      }
    });

    // إرسال الإشعار عبر WebSocket
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', {
        ...dbNotification,
        time_ago: 'الآن'
      });
    }

    // إرسال إشعار Push إذا كان مفعلاً
    await sendPushNotification(userId, notification);

    // إرسال إشعار بريد إلكتروني للإشعارات المهمة
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      await sendEmailNotification(userId, notification);
    }

    return dbNotification;
  } catch (error) {
    console.error('Error sending real-time notification:', error);
    throw error;
  }
}

/**
 * إرسال إشعار Push
 */
async function sendPushNotification(
  userId: string,
  notification: {
    title: string;
    message: string;
    icon?: string;
    actionUrl?: string;
    data?: any;
  }
) {
  try {
    // التحقق من إعدادات المستخدم
    const userSettings = await prisma.userNotificationSettings.findUnique({
      where: { user_id: userId }
    });

    if (!userSettings?.push_notifications) {
      return;
    }

    // هنا يمكن إضافة منطق إرسال Push notifications
    // باستخدام خدمات مثل Firebase Cloud Messaging أو OneSignal
    
    console.log(`Push notification sent to user ${userId}:`, notification.title);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * إرسال إشعار بريد إلكتروني
 */
async function sendEmailNotification(
  userId: string,
  notification: {
    title: string;
    message: string;
    actionUrl?: string;
  }
) {
  try {
    // التحقق من إعدادات المستخدم
    const userSettings = await prisma.userNotificationSettings.findUnique({
      where: { user_id: userId }
    });

    if (!userSettings?.email_notifications) {
      return;
    }

    // الحصول على بيانات المستخدم
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) return;

    // هنا يمكن إضافة منطق إرسال البريد الإلكتروني
    // باستخدام خدمات مثل SendGrid أو Nodemailer
    
    console.log(`Email notification sent to ${user.email}:`, notification.title);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

/**
 * إرسال إشعار جماعي
 */
export async function sendBulkNotification(
  userIds: string[],
  notification: {
    type: string;
    category?: string;
    title: string;
    message: string;
    icon?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    actionUrl?: string;
    data?: any;
    senderId?: string;
  }
) {
  try {
    // إنشاء الإشعارات في قاعدة البيانات
    const notifications = await prisma.realTimeNotification.createMany({
      data: userIds.map(userId => ({
        user_id: userId,
        sender_id: notification.senderId,
        type: notification.type,
        category: notification.category || 'system',
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        priority: notification.priority || 'normal',
        action_url: notification.actionUrl,
        data: notification.data || {}
      }))
    });

    // إرسال الإشعارات عبر WebSocket
    if (io) {
      userIds.forEach(userId => {
        io?.to(`user_${userId}`).emit('new_notification', {
          ...notification,
          time_ago: 'الآن'
        });
      });
    }

    return notifications;
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    throw error;
  }
}

/**
 * إرسال إشعار لجميع المستخدمين
 */
export async function sendBroadcastNotification(
  notification: {
    type: string;
    category?: string;
    title: string;
    message: string;
    icon?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    actionUrl?: string;
    data?: any;
    senderId?: string;
  }
) {
  try {
    // الحصول على جميع المستخدمين النشطين
    const users = await prisma.user.findMany({
      where: { is_active: true },
      select: { id: true }
    });

    const userIds = users.map(user => user.id);
    
    return await sendBulkNotification(userIds, notification);
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    throw error;
  }
}

/**
 * جدولة إشعار للإرسال لاحقاً
 */
export async function scheduleNotification(
  userId: string,
  notification: {
    type: string;
    category?: string;
    title: string;
    message: string;
    icon?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    actionUrl?: string;
    data?: any;
    senderId?: string;
  },
  scheduledFor: Date
) {
  try {
    const dbNotification = await prisma.realTimeNotification.create({
      data: {
        user_id: userId,
        sender_id: notification.senderId,
        type: notification.type,
        category: notification.category || 'system',
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        priority: notification.priority || 'normal',
        action_url: notification.actionUrl,
        data: notification.data || {},
        scheduled_for: scheduledFor,
        delivered: false
      }
    });

    return dbNotification;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * معالجة الإشعارات المجدولة
 */
export async function processScheduledNotifications() {
  try {
    const now = new Date();
    
    // الحصول على الإشعارات المجدولة والمستحقة
    const scheduledNotifications = await prisma.realTimeNotification.findMany({
      where: {
        scheduled_for: { lte: now },
        delivered: false
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar_url: true }
        }
      }
    });

    for (const notification of scheduledNotifications) {
      // إرسال الإشعار
      if (io) {
        io.to(`user_${notification.user_id}`).emit('new_notification', {
          ...notification,
          time_ago: 'الآن'
        });
      }

      // تحديث حالة التسليم
      await prisma.realTimeNotification.update({
        where: { id: notification.id },
        data: { 
          delivered: true,
          delivered_at: new Date()
        }
      });
    }

    console.log(`Processed ${scheduledNotifications.length} scheduled notifications`);
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
  }
}

/**
 * تنظيف الإشعارات المنتهية الصلاحية
 */
export async function cleanupExpiredNotifications() {
  try {
    const now = new Date();
    
    const deletedCount = await prisma.realTimeNotification.deleteMany({
      where: {
        expires_at: { lt: now }
      }
    });

    console.log(`Cleaned up ${deletedCount.count} expired notifications`);
    return deletedCount.count;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    return 0;
  }
}

/**
 * تنظيف الإشعارات القديمة
 */
export async function cleanupOldNotifications(daysOld: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const deletedCount = await prisma.realTimeNotification.deleteMany({
      where: {
        created_at: { lt: cutoffDate },
        read: true
      }
    });

    console.log(`Cleaned up ${deletedCount.count} old notifications`);
    return deletedCount.count;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    return 0;
  }
}

/**
 * الحصول على إحصائيات الإشعارات
 */
export async function getNotificationStats(userId?: string) {
  try {
    const where = userId ? { user_id: userId } : {};
    
    const stats = await prisma.realTimeNotification.groupBy({
      by: ['type', 'category', 'priority'],
      where,
      _count: {
        id: true
      }
    });

    const unreadCount = await prisma.realTimeNotification.count({
      where: { ...where, read: false }
    });

    const totalCount = await prisma.realTimeNotification.count({
      where
    });

    return {
      total: totalCount,
      unread: unreadCount,
      read: totalCount - unreadCount,
      byType: stats.reduce((acc, stat) => {
        acc[stat.type] = (acc[stat.type] || 0) + stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      byCategory: stats.reduce((acc, stat) => {
        acc[stat.category] = (acc[stat.category] || 0) + stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      byPriority: stats.reduce((acc, stat) => {
        acc[stat.priority] = (acc[stat.priority] || 0) + stat._count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return null;
  }
}

/**
 * تحديث إعدادات الإشعارات للمستخدم
 */
export async function updateUserNotificationSettings(
  userId: string,
  settings: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    in_app_notifications?: boolean;
    sms_notifications?: boolean;
    loyalty_notifications?: boolean;
    interaction_notifications?: boolean;
    system_notifications?: boolean;
    marketing_notifications?: boolean;
    notification_frequency?: 'instant' | 'hourly' | 'daily' | 'weekly';
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    timezone?: string;
  }
) {
  try {
    const updatedSettings = await prisma.userNotificationSettings.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...settings
      },
      update: settings
    });

    return updatedSettings;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
}

/**
 * التحقق من الساعات الهادئة
 */
export async function isQuietHours(userId: string): Promise<boolean> {
  try {
    const settings = await prisma.userNotificationSettings.findUnique({
      where: { user_id: userId }
    });

    if (!settings || !settings.quiet_hours_start || !settings.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const userTimezone = settings.timezone || 'Asia/Riyadh';
    
    // تحويل الوقت إلى منطقة المستخدم الزمنية
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    const currentHour = userTime.getHours();
    
    const startHour = parseInt(settings.quiet_hours_start.split(':')[0]);
    const endHour = parseInt(settings.quiet_hours_end.split(':')[0]);

    // التحقق من الساعات الهادئة
    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // الساعات الهادئة تمتد عبر منتصف الليل
      return currentHour >= startHour || currentHour < endHour;
    }
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false;
  }
}

/**
 * تشغيل المهام الدورية
 */
export function startNotificationScheduler() {
  // معالجة الإشعارات المجدولة كل دقيقة
  setInterval(processScheduledNotifications, 60 * 1000);
  
  // تنظيف الإشعارات المنتهية الصلاحية كل ساعة
  setInterval(cleanupExpiredNotifications, 60 * 60 * 1000);
  
  // تنظيف الإشعارات القديمة كل يوم
  setInterval(() => cleanupOldNotifications(30), 24 * 60 * 60 * 1000);
  
  console.log('Notification scheduler started');
}

/**
 * إيقاف الإشعارات الفورية
 */
export function shutdownRealTimeNotifications() {
  if (io) {
    io.close();
    io = null;
  }
} 