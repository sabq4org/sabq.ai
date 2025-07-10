import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { validateRequest } from '@/lib/validation';

// Schema للتحقق من صحة البيانات
const OneSignalNotificationSchema = z.object({
  contents: z.record(z.string()).min(1, 'محتوى الإشعار مطلوب'),
  headings: z.record(z.string()).optional(),
  subtitle: z.record(z.string()).optional(),
  data: z.record(z.any()).optional(),
  url: z.string().url().optional(),
  web_url: z.string().url().optional(),
  app_url: z.string().optional(),
  included_segments: z.array(z.string()).optional(),
  excluded_segments: z.array(z.string()).optional(),
  include_player_ids: z.array(z.string()).optional(),
  include_external_user_ids: z.array(z.string()).optional(),
  filters: z.array(z.any()).optional(),
  send_after: z.string().optional(),
  delayed_option: z.enum(['timezone', 'last-active']).optional(),
  delivery_time_of_day: z.string().optional(),
  ttl: z.number().optional(),
  priority: z.number().min(1).max(10).optional(),
  android_accent_color: z.string().optional(),
  android_visibility: z.number().optional(),
  ios_badgeType: z.enum(['None', 'SetTo', 'Increase']).optional(),
  ios_badgeCount: z.number().optional(),
  collapse_id: z.string().optional(),
  web_push_topic: z.string().optional(),
  apns_alert: z.record(z.any()).optional(),
  chrome_web_image: z.string().url().optional(),
  chrome_web_icon: z.string().url().optional(),
  chrome_web_badge: z.string().url().optional(),
  firefox_icon: z.string().url().optional(),
  chrome_icon: z.string().url().optional(),
  ios_sound: z.string().optional(),
  android_sound: z.string().optional(),
  adm_sound: z.string().optional(),
  wp_sound: z.string().optional(),
  wp_wns_sound: z.string().optional(),
  android_led_color: z.string().optional(),
  android_accent_color: z.string().optional(),
  android_small_icon: z.string().optional(),
  android_large_icon: z.string().url().optional(),
  android_big_picture: z.string().url().optional(),
  amazon_background_data: z.boolean().optional(),
  android_background_data: z.boolean().optional(),
  ios_background_data: z.boolean().optional(),
  web_buttons: z.array(z.object({
    id: z.string(),
    text: z.string(),
    icon: z.string().url().optional(),
    url: z.string().url().optional()
  })).optional(),
  ios_category: z.string().optional(),
  android_group: z.string().optional(),
  android_group_message: z.record(z.string()).optional(),
  ios_thread_id: z.string().optional()
});

const OneSignalPlayerSchema = z.object({
  device_type: z.number().min(0).max(14),
  identifier: z.string().optional(),
  language: z.string().optional(),
  timezone: z.number().optional(),
  game_version: z.string().optional(),
  device_model: z.string().optional(),
  device_os: z.string().optional(),
  ad_id: z.string().optional(),
  sdk: z.string().optional(),
  session_count: z.number().optional(),
  tags: z.record(z.string()).optional(),
  amount_spent: z.number().optional(),
  created_at: z.number().optional(),
  playtime: z.number().optional(),
  badge_count: z.number().optional(),
  last_active: z.number().optional(),
  notification_types: z.number().optional(),
  test_type: z.number().optional(),
  long: z.number().optional(),
  lat: z.number().optional(),
  country: z.string().optional(),
  external_user_id: z.string().optional()
});

/**
 * POST /api/notifications/onesignal/send
 * إرسال إشعار عبر OneSignal
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const validation = validateRequest(OneSignalNotificationSchema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 }
        );
      }

      // الحصول على إعدادات OneSignal
      const oneSignalProvider = await prisma.notificationProvider.findFirst({
        where: { 
          name: 'OneSignal',
          type: 'ONESIGNAL',
          status: 'ACTIVE'
        }
      });

      if (!oneSignalProvider) {
        return NextResponse.json(
          { success: false, error: 'تكامل OneSignal غير متوفر' },
          { status: 503 }
        );
      }

      // إعداد البيانات للإرسال
      const notificationData = {
        ...validation.data,
        app_id: oneSignalProvider.config.appId,
        // إضافة بيانات إضافية للتتبع
        data: {
          ...validation.data.data,
          sent_by: user.id,
          sent_at: new Date().toISOString(),
          source: 'sabq-ai-cms'
        }
      };

      // إرسال الإشعار عبر OneSignal API
      const oneSignalResponse = await sendOneSignalNotification(notificationData, oneSignalProvider.config);

      // حفظ الإشعار في قاعدة البيانات
      const notification = await prisma.notificationMessage.create({
        data: {
          providerId: oneSignalProvider.id,
          title: getFirstLanguageValue(validation.data.headings) || 'إشعار جديد',
          content: getFirstLanguageValue(validation.data.contents),
          type: 'PUSH',
          status: 'SENT',
          sentAt: new Date(),
          metadata: {
            onesignal_id: oneSignalResponse.id,
            recipients: oneSignalResponse.recipients,
            external_id: oneSignalResponse.external_id,
            errors: oneSignalResponse.errors,
            original_request: validation.data,
            sent_by: user.id
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          notification_id: notification.id,
          onesignal_id: oneSignalResponse.id,
          recipients: oneSignalResponse.recipients,
          errors: oneSignalResponse.errors || [],
          external_id: oneSignalResponse.external_id
        }
      });

    } catch (error) {
      console.error('خطأ في إرسال الإشعار:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في إرسال الإشعار' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/notifications/onesignal/[id]
 * جلب تفاصيل الإشعار
 */
export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const notificationId = pathname.split('/').pop();
    
    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'معرف الإشعار مطلوب' },
        { status: 400 }
      );
    }

    // الحصول على إعدادات OneSignal
    const oneSignalProvider = await prisma.notificationProvider.findFirst({
      where: { 
        name: 'OneSignal',
        type: 'ONESIGNAL',
        status: 'ACTIVE'
      }
    });

    if (!oneSignalProvider) {
      return NextResponse.json(
        { success: false, error: 'تكامل OneSignal غير متوفر' },
        { status: 503 }
      );
    }

    // جلب تفاصيل الإشعار من OneSignal
    const oneSignalNotification = await getOneSignalNotification(notificationId, oneSignalProvider.config);

    return NextResponse.json({
      success: true,
      data: oneSignalNotification
    });

  } catch (error) {
    console.error('خطأ في جلب تفاصيل الإشعار:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب تفاصيل الإشعار' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/onesignal/players
 * إضافة مشترك جديد
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const validation = validateRequest(OneSignalPlayerSchema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 }
        );
      }

      // الحصول على إعدادات OneSignal
      const oneSignalProvider = await prisma.notificationProvider.findFirst({
        where: { 
          name: 'OneSignal',
          type: 'ONESIGNAL',
          status: 'ACTIVE'
        }
      });

      if (!oneSignalProvider) {
        return NextResponse.json(
          { success: false, error: 'تكامل OneSignal غير متوفر' },
          { status: 503 }
        );
      }

      // إعداد البيانات للإرسال
      const playerData = {
        ...validation.data,
        app_id: oneSignalProvider.config.appId,
        // إضافة بيانات المستخدم
        tags: {
          ...validation.data.tags,
          user_id: user.id,
          registered_at: new Date().toISOString()
        }
      };

      // إضافة المشترك عبر OneSignal API
      const oneSignalPlayer = await createOneSignalPlayer(playerData, oneSignalProvider.config);

      return NextResponse.json({
        success: true,
        data: {
          player_id: oneSignalPlayer.id,
          success: oneSignalPlayer.success
        }
      });

    } catch (error) {
      console.error('خطأ في إضافة المشترك:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في إضافة المشترك' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * إرسال إشعار عبر OneSignal API
 */
async function sendOneSignalNotification(data: any, config: any) {
  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${config.restApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OneSignal API Error: ${error.errors?.[0] || 'فشل في إرسال الإشعار'}`);
  }

  return await response.json();
}

/**
 * جلب تفاصيل الإشعار من OneSignal API
 */
async function getOneSignalNotification(notificationId: string, config: any) {
  const response = await fetch(`https://onesignal.com/api/v1/notifications/${notificationId}?app_id=${config.appId}`, {
    headers: {
      'Authorization': `Basic ${config.restApiKey}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OneSignal API Error: ${error.errors?.[0] || 'فشل في جلب تفاصيل الإشعار'}`);
  }

  return await response.json();
}

/**
 * إضافة مشترك جديد عبر OneSignal API
 */
async function createOneSignalPlayer(data: any, config: any) {
  const response = await fetch('https://onesignal.com/api/v1/players', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${config.restApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OneSignal API Error: ${error.errors?.[0] || 'فشل في إضافة المشترك'}`);
  }

  return await response.json();
}

/**
 * استخراج أول قيمة من كائن اللغات
 */
function getFirstLanguageValue(obj: Record<string, string> | undefined): string {
  if (!obj) return '';
  const keys = Object.keys(obj);
  return keys.length > 0 ? obj[keys[0]] : '';
} 