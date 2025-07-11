/**
 * API لاستقبال الأحداث التحليلية
 * Analytics Events API
 * @version 3.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

// Rate limiting storage (في الإنتاج، استخدم Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface EventData {
  userId?: string;
  articleId?: string;
  sessionId?: string;
  eventType: string;
  eventData?: any;
  pageUrl?: string;
  referrer?: string;
  timestamp?: string;
}

interface SessionData {
  sessionId: string;
  startTime: string;
  userId?: string;
  deviceInfo: any;
  userAgent: string;
}

interface RequestBody {
  events?: EventData[];
  session?: SessionData;
  // للتوافق مع الإصدارات السابقة
  userId?: string;
  articleId?: string;
  sessionId?: string;
  eventType?: string;
  eventData?: any;
}

/**
 * POST /api/analytics/events
 * استقبال الأحداث (مفردة أو دفعية)
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const dnt = headersList.get('dnt');
    const userAgent = headersList.get('user-agent') || '';
    const xForwardedFor = headersList.get('x-forwarded-for');
    const xRealIp = headersList.get('x-real-ip');
    
    // احترام Do Not Track
    if (dnt === '1') {
      return NextResponse.json({ success: true, message: 'DNT respected' });
    }

    // الحصول على IP العميل
    const clientIp = xForwardedFor?.split(',')[0] || xRealIp || 'unknown';

    // فحص Rate Limiting
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body: RequestBody = await request.json();

    // تحديد إذا كان الطلب يحتوي على أحداث متعددة أم حدث واحد
    let events: EventData[] = [];
    
    if (body.events && Array.isArray(body.events)) {
      // طلب دفعي
      events = body.events;
    } else if (body.eventType) {
      // طلب مفرد (للتوافق مع الإصدارات السابقة)
      events = [{
        userId: body.userId,
        articleId: body.articleId,
        sessionId: body.sessionId,
        eventType: body.eventType,
        eventData: body.eventData,
        pageUrl: body.eventData?.pageUrl,
        referrer: body.eventData?.referrer,
        timestamp: new Date().toISOString()
      }];
    } else {
      return NextResponse.json(
        { error: 'No events provided' },
        { status: 400 }
      );
    }

    // التحقق من صحة الأحداث
    const validatedEvents = events.filter(event => validateEvent(event));
    
    if (validatedEvents.length === 0) {
      return NextResponse.json(
        { error: 'No valid events provided' },
        { status: 400 }
      );
    }

    // معالجة الجلسة
    let sessionRecord = null;
    if (body.session) {
      sessionRecord = await processSession(body.session, clientIp, userAgent);
    }

    // حفظ الأحداث
    const savedEvents = await Promise.all(
      validatedEvents.map(event => saveEvent(event, clientIp, userAgent))
    );

    // تحديث إحصائيات الجلسة
    if (sessionRecord) {
      await updateSessionStats(sessionRecord.session_id, validatedEvents.length);
    }

    // تحديث تحليلات المحتوى
    await updateContentAnalytics(validatedEvents);

    // تحديث سلوك المستخدم
    await updateUserBehavior(validatedEvents);

    // معالجة الأحداث المباشرة
    await processRealtimeMetrics(validatedEvents);

    return NextResponse.json({
      success: true,
      eventsProcessed: savedEvents.length,
      sessionId: sessionRecord?.session_id
    });

  } catch (error) {
    console.error('Error processing analytics events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/events
 * جلب الأحداث (للإدارة أو المستخدم)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const eventType = searchParams.get('eventType');
    const articleId = searchParams.get('articleId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {};
    
    if (userId) whereClause.user_id = userId;
    if (sessionId) whereClause.session_id = sessionId;
    if (eventType) whereClause.event_type = eventType;
    if (articleId) whereClause.article_id = articleId;

    const events = await prisma.analyticsEvent.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 100), // حد أقصى 100
      skip: offset,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        article: {
          select: { id: true, title: true, slug: true }
        }
      }
    });

    const total = await prisma.analyticsEvent.count({ where: whereClause });

    return NextResponse.json({
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching analytics events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/events
 * حذف الأحداث (امتثال GDPR)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId or sessionId required' },
        { status: 400 }
      );
    }

    const whereClause: any = {};
    if (userId) whereClause.user_id = userId;
    if (sessionId) whereClause.session_id = sessionId;

    const deletedCount = await prisma.analyticsEvent.deleteMany({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      deletedCount: deletedCount.count
    });

  } catch (error) {
    console.error('Error deleting analytics events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * فحص Rate Limiting
 */
function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // دقيقة واحدة
  const maxRequests = 100; // حد أقصى 100 طلب في الدقيقة

  const current = rateLimitStore.get(clientIp);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(clientIp, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * التحقق من صحة الحدث
 */
function validateEvent(event: EventData): boolean {
  // التحقق من وجود النوع
  if (!event.eventType || typeof event.eventType !== 'string') {
    return false;
  }

  // التحقق من أنواع الأحداث المسموحة
  const allowedTypes = [
    'page_view', 'scroll', 'click', 'reading_time', 'reading_progress',
    'like', 'share', 'comment', 'bookmark', 'search', 'article_interaction',
    'page_exit', 'navigation', 'error', 'performance'
  ];

  if (!allowedTypes.includes(event.eventType)) {
    return false;
  }

  // التحقق من طول البيانات
  if (event.eventData) {
    const jsonString = JSON.stringify(event.eventData);
    if (jsonString.length > 5000) { // حد أقصى 5KB
      return false;
    }
  }

  return true;
}

/**
 * حفظ الحدث
 */
async function saveEvent(event: EventData, clientIp: string, userAgent: string) {
  try {
    return await prisma.analyticsEvent.create({
      data: {
        event_type: event.eventType,
        event_data: event.eventData || {},
        article_id: event.articleId || null,
        user_id: event.userId || null,
        session_id: event.sessionId || null,
        ip_address: clientIp,
        user_agent: userAgent,
        referrer: event.referrer || null,
        page_url: event.pageUrl || null,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        processed: false
      }
    });
  } catch (error) {
    console.error('Error saving event:', error);
    throw error;
  }
}

/**
 * معالجة الجلسة
 */
async function processSession(session: SessionData, clientIp: string, userAgent: string) {
  try {
    // البحث عن الجلسة الموجودة
    const existingSession = await prisma.userSession.findUnique({
      where: { session_id: session.sessionId }
    });

    if (existingSession) {
      // تحديث الجلسة الموجودة
      return await prisma.userSession.update({
        where: { session_id: session.sessionId },
        data: {
          end_time: new Date(),
          updated_at: new Date()
        }
      });
    } else {
      // إنشاء جلسة جديدة
      return await prisma.userSession.create({
        data: {
          session_id: session.sessionId,
          user_id: session.userId || null,
          start_time: new Date(session.startTime),
          ip_address: clientIp,
          user_agent: userAgent,
          device_type: extractDeviceType(session.deviceInfo),
          browser: extractBrowser(session.deviceInfo),
          os: extractOS(session.deviceInfo)
        }
      });
    }
  } catch (error) {
    console.error('Error processing session:', error);
    return null;
  }
}

/**
 * تحديث إحصائيات الجلسة
 */
async function updateSessionStats(sessionId: string, eventsCount: number) {
  try {
    await prisma.userSession.update({
      where: { session_id: sessionId },
      data: {
        events_count: { increment: eventsCount },
        updated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating session stats:', error);
  }
}

/**
 * تحديث تحليلات المحتوى
 */
async function updateContentAnalytics(events: EventData[]) {
  try {
    const contentEvents = events.filter(e => e.articleId);
    
    for (const event of contentEvents) {
      if (!event.articleId) continue;

      const updateData: any = {};
      
      switch (event.eventType) {
        case 'page_view':
          updateData.views = { increment: 1 };
          break;
        case 'like':
          updateData.likes = { increment: 1 };
          break;
        case 'share':
          updateData.shares = { increment: 1 };
          break;
        case 'comment':
          updateData.comments = { increment: 1 };
          break;
        case 'reading_time':
          if (event.eventData?.seconds) {
            updateData.avg_time_on_page = event.eventData.seconds;
          }
          break;
        case 'scroll':
          if (event.eventData?.scrollDepth) {
            updateData.scroll_depth = Math.max(
              event.eventData.scrollDepth,
              0
            );
          }
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.contentAnalytics.upsert({
          where: {
            content_id_content_type: {
              content_id: event.articleId,
              content_type: 'article'
            }
          },
          update: updateData,
          create: {
            content_id: event.articleId,
            content_type: 'article',
            ...updateData
          }
        });
      }
    }
  } catch (error) {
    console.error('Error updating content analytics:', error);
  }
}

/**
 * تحديث سلوك المستخدم
 */
async function updateUserBehavior(events: EventData[]) {
  try {
    const userEvents = events.filter(e => e.userId);
    const userGroups = new Map<string, EventData[]>();

    // تجميع الأحداث حسب المستخدم
    for (const event of userEvents) {
      if (!event.userId) continue;
      
      if (!userGroups.has(event.userId)) {
        userGroups.set(event.userId, []);
      }
      userGroups.get(event.userId)!.push(event);
    }

    // تحديث سلوك كل مستخدم
    for (const [userId, userEventsList] of userGroups) {
      const updateData: any = {};
      
      const pageViews = userEventsList.filter(e => e.eventType === 'page_view').length;
      const totalTime = userEventsList
        .filter(e => e.eventType === 'reading_time')
        .reduce((sum, e) => sum + (e.eventData?.seconds || 0), 0);

      if (pageViews > 0) {
        updateData.total_page_views = { increment: pageViews };
        updateData.pages_per_session = { increment: pageViews };
      }

      if (totalTime > 0) {
        updateData.total_time_spent = { increment: totalTime };
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.userBehavior.upsert({
          where: { user_id: userId },
          update: updateData,
          create: {
            user_id: userId,
            ...updateData
          }
        });
      }
    }
  } catch (error) {
    console.error('Error updating user behavior:', error);
  }
}

/**
 * معالجة المقاييس المباشرة
 */
async function processRealtimeMetrics(events: EventData[]) {
  try {
    const now = new Date();
    const metrics = new Map<string, number>();

    // حساب المقاييس
    for (const event of events) {
      const key = `${event.eventType}_count`;
      metrics.set(key, (metrics.get(key) || 0) + 1);
    }

    // حفظ المقاييس
    for (const [metricName, value] of metrics) {
      await prisma.realtimeMetrics.create({
        data: {
          metric_type: 'event',
          metric_name: metricName,
          value,
          timestamp: now
        }
      });
    }
  } catch (error) {
    console.error('Error processing realtime metrics:', error);
  }
}

/**
 * استخراج نوع الجهاز
 */
function extractDeviceType(deviceInfo: any): string {
  if (!deviceInfo?.userAgent) return 'unknown';
  
  const ua = deviceInfo.userAgent.toLowerCase();
  if (ua.includes('mobile')) return 'mobile';
  if (ua.includes('tablet')) return 'tablet';
  return 'desktop';
}

/**
 * استخراج المتصفح
 */
function extractBrowser(deviceInfo: any): string {
  if (!deviceInfo?.userAgent) return 'unknown';
  
  const ua = deviceInfo.userAgent.toLowerCase();
  if (ua.includes('chrome')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari')) return 'safari';
  if (ua.includes('edge')) return 'edge';
  return 'other';
}

/**
 * استخراج نظام التشغيل
 */
function extractOS(deviceInfo: any): string {
  if (!deviceInfo?.platform) return 'unknown';
  
  const platform = deviceInfo.platform.toLowerCase();
  if (platform.includes('win')) return 'windows';
  if (platform.includes('mac')) return 'macos';
  if (platform.includes('linux')) return 'linux';
  if (platform.includes('android')) return 'android';
  if (platform.includes('ios')) return 'ios';
  return 'other';
} 