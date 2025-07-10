/**
 * API Routes for Analytics Events
 * 
 * @description Handles analytics event tracking and data collection
 * @author Sabq AI CMS Team
 * @version 1.0.0
 * @created 2024-01-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit-logger';
import { validateUserPermissions } from '@/lib/permissions';
import { getClientIP, detectDevice } from '@/lib/device-detection';
import { rateLimiter } from '@/lib/rate-limiter';
import { redisClient } from '@/lib/redis';

// Validation schemas
const analyticsEventSchema = z.object({
  eventType: z.enum([
    'PAGE_VIEW',
    'ARTICLE_VIEW',
    'ARTICLE_LIKE',
    'ARTICLE_SHARE',
    'ARTICLE_COMMENT',
    'SEARCH_QUERY',
    'USER_REGISTRATION',
    'USER_LOGIN',
    'USER_LOGOUT',
    'SUBSCRIPTION_CREATED',
    'SUBSCRIPTION_CANCELLED',
    'DOWNLOAD',
    'FORM_SUBMISSION',
    'VIDEO_PLAY',
    'VIDEO_PAUSE',
    'VIDEO_COMPLETE',
    'CLICK_EVENT',
    'SCROLL_EVENT',
    'CUSTOM_EVENT',
  ]),
  eventData: z.object({
    pageUrl: z.string().url().optional(),
    pageTitle: z.string().optional(),
    articleId: z.string().uuid().optional(),
    articleTitle: z.string().optional(),
    sectionId: z.string().uuid().optional(),
    sectionName: z.string().optional(),
    searchQuery: z.string().optional(),
    searchResults: z.number().optional(),
    socialPlatform: z.enum(['facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram']).optional(),
    referrer: z.string().url().optional(),
    utm: z.object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    }).optional(),
    customProperties: z.record(z.any()).optional(),
  }),
  timestamp: z.string().datetime().optional(),
  sessionId: z.string().optional(),
  userId: z.string().uuid().optional(),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    screenResolution: z.string().optional(),
    viewport: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
});

const batchEventsSchema = z.object({
  events: z.array(analyticsEventSchema).min(1).max(100),
});

const analyticsQuerySchema = z.object({
  eventType: z.enum([
    'PAGE_VIEW',
    'ARTICLE_VIEW',
    'ARTICLE_LIKE',
    'ARTICLE_SHARE',
    'ARTICLE_COMMENT',
    'SEARCH_QUERY',
    'USER_REGISTRATION',
    'USER_LOGIN',
    'USER_LOGOUT',
    'SUBSCRIPTION_CREATED',
    'SUBSCRIPTION_CANCELLED',
    'DOWNLOAD',
    'FORM_SUBMISSION',
    'VIDEO_PLAY',
    'VIDEO_PAUSE',
    'VIDEO_COMPLETE',
    'CLICK_EVENT',
    'SCROLL_EVENT',
    'CUSTOM_EVENT',
  ]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  articleId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 1000),
});

/**
 * Helper function to process and enrich event data
 */
async function processEvent(
  event: z.infer<typeof analyticsEventSchema>,
  request: NextRequest,
  session?: any
) {
  const ipAddress = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const deviceInfo = detectDevice(userAgent);

  // Generate session ID if not provided
  let sessionId = event.sessionId;
  if (!sessionId) {
    sessionId = request.headers.get('x-session-id') || crypto.randomUUID();
  }

  // Enrich event data
  const enrichedEvent = {
    ...event,
    eventData: {
      ...event.eventData,
      ipAddress,
      userAgent,
      deviceInfo: {
        ...deviceInfo,
        ...event.deviceInfo,
      },
    },
    sessionId,
    userId: session?.user?.id || event.userId,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  // Extract location from IP (if available)
  try {
    const locationData = await getLocationFromIP(ipAddress);
    enrichedEvent.eventData.location = locationData;
  } catch (error) {
    // Ignore location errors
  }

  return enrichedEvent;
}

/**
 * Helper function to get location from IP address
 */
async function getLocationFromIP(ipAddress: string) {
  try {
    // Check cache first
    const cachedLocation = await redisClient.get(`location:${ipAddress}`);
    if (cachedLocation) {
      return JSON.parse(cachedLocation);
    }

    // Use IP geolocation service
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const locationData = await response.json();

    if (locationData.country) {
      const location = {
        country: locationData.country,
        countryName: locationData.country_name,
        region: locationData.region,
        city: locationData.city,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timezone: locationData.timezone,
      };

      // Cache for 24 hours
      await redisClient.setex(`location:${ipAddress}`, 86400, JSON.stringify(location));
      return location;
    }

    return null;
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return null;
  }
}

/**
 * Helper function to save event to database
 */
async function saveEvent(event: any) {
  try {
    return await prisma.analyticsEvent.create({
      data: {
        eventType: event.eventType,
        eventData: event.eventData,
        timestamp: new Date(event.timestamp),
        sessionId: event.sessionId,
        userId: event.userId,
        articleId: event.eventData.articleId,
        sectionId: event.eventData.sectionId,
      },
    });
  } catch (error) {
    console.error('Error saving event:', error);
    throw error;
  }
}

/**
 * Helper function to update real-time metrics
 */
async function updateRealTimeMetrics(event: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Update Redis counters
    await Promise.all([
      // Global counters
      redisClient.incr(`analytics:${today}:events`),
      redisClient.incr(`analytics:${today}:${event.eventType}`),
      
      // Article-specific counters
      event.eventData.articleId && redisClient.incr(`analytics:${today}:articles:${event.eventData.articleId}`),
      
      // Section-specific counters
      event.eventData.sectionId && redisClient.incr(`analytics:${today}:sections:${event.eventData.sectionId}`),
      
      // User-specific counters
      event.userId && redisClient.incr(`analytics:${today}:users:${event.userId}`),
      
      // Session-specific counters
      redisClient.incr(`analytics:${today}:sessions:${event.sessionId}`),
    ]);

    // Set expiration for counters (7 days)
    const expiration = 7 * 24 * 60 * 60;
    await Promise.all([
      redisClient.expire(`analytics:${today}:events`, expiration),
      redisClient.expire(`analytics:${today}:${event.eventType}`, expiration),
      event.eventData.articleId && redisClient.expire(`analytics:${today}:articles:${event.eventData.articleId}`, expiration),
      event.eventData.sectionId && redisClient.expire(`analytics:${today}:sections:${event.eventData.sectionId}`, expiration),
      event.userId && redisClient.expire(`analytics:${today}:users:${event.userId}`, expiration),
      redisClient.expire(`analytics:${today}:sessions:${event.sessionId}`, expiration),
    ]);

  } catch (error) {
    console.error('Error updating real-time metrics:', error);
  }
}

/**
 * POST /api/analytics/events
 * Records analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIP(request);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(
      `analytics:${ipAddress}`,
      100, // 100 events
      60 * 1000 // per minute
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'تم تجاوز الحد الأقصى لأحداث التحليلات',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Get session (optional for analytics)
    const session = await getServerSession(authOptions);

    // Parse request body
    const body = await request.json();
    
    // Handle both single event and batch events
    let events: z.infer<typeof analyticsEventSchema>[];
    
    if (Array.isArray(body.events)) {
      // Batch events
      const validatedBatch = batchEventsSchema.parse(body);
      events = validatedBatch.events;
    } else {
      // Single event
      const validatedEvent = analyticsEventSchema.parse(body);
      events = [validatedEvent];
    }

    // Process and save events
    const savedEvents = [];
    for (const event of events) {
      try {
        // Process event
        const enrichedEvent = await processEvent(event, request, session);
        
        // Save to database
        const savedEvent = await saveEvent(enrichedEvent);
        savedEvents.push(savedEvent);
        
        // Update real-time metrics
        await updateRealTimeMetrics(enrichedEvent);
        
      } catch (error) {
        console.error('Error processing event:', error);
        // Continue with other events
      }
    }

    // Log audit event for batch tracking
    if (savedEvents.length > 0) {
      await logAuditEvent({
        userId: session?.user?.id || 'anonymous',
        action: 'RECORD_ANALYTICS_EVENTS',
        resource: 'analytics',
        metadata: {
          eventCount: savedEvents.length,
          eventTypes: [...new Set(savedEvents.map(e => e.eventType))],
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        eventsProcessed: savedEvents.length,
        eventsSkipped: events.length - savedEvents.length,
      },
      message: `تم تسجيل ${savedEvents.length} حدث بنجاح`,
    });

  } catch (error) {
    console.error('Error recording analytics events:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'بيانات الأحداث غير صحيحة',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'خطأ في تسجيل أحداث التحليلات',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/events
 * Retrieves analytics events data
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    // Permission check
    const hasPermission = await validateUserPermissions(
      session.user.id,
      'analytics',
      'read'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية لعرض بيانات التحليلات' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = analyticsQuerySchema.parse(queryParams);

    // Build date range
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const fromDate = validatedQuery.from ? new Date(validatedQuery.from) : defaultFrom;
    const toDate = validatedQuery.to ? new Date(validatedQuery.to) : now;

    // Build where clause
    const whereClause: any = {
      timestamp: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (validatedQuery.eventType) {
      whereClause.eventType = validatedQuery.eventType;
    }

    if (validatedQuery.articleId) {
      whereClause.articleId = validatedQuery.articleId;
    }

    if (validatedQuery.sectionId) {
      whereClause.sectionId = validatedQuery.sectionId;
    }

    if (validatedQuery.userId) {
      whereClause.userId = validatedQuery.userId;
    }

    // Get events
    const events = await prisma.analyticsEvent.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
      take: validatedQuery.limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Get aggregated data
    const aggregatedData = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: whereClause,
      _count: {
        eventType: true,
      },
      orderBy: {
        _count: {
          eventType: 'desc',
        },
      },
    });

    // Get real-time metrics from Redis
    const today = new Date().toISOString().split('T')[0];
    const realTimeMetrics = await redisClient.mget([
      `analytics:${today}:events`,
      `analytics:${today}:PAGE_VIEW`,
      `analytics:${today}:ARTICLE_VIEW`,
      `analytics:${today}:ARTICLE_LIKE`,
      `analytics:${today}:ARTICLE_SHARE`,
    ]);

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'VIEW_ANALYTICS_EVENTS',
      resource: 'analytics',
      metadata: {
        filters: validatedQuery,
        totalEvents: events.length,
        dateRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        events,
        aggregated: aggregatedData,
        realTimeMetrics: {
          totalEvents: parseInt(realTimeMetrics[0] || '0'),
          pageViews: parseInt(realTimeMetrics[1] || '0'),
          articleViews: parseInt(realTimeMetrics[2] || '0'),
          articleLikes: parseInt(realTimeMetrics[3] || '0'),
          articleShares: parseInt(realTimeMetrics[4] || '0'),
        },
        totalCount: events.length,
        dateRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
      },
      message: 'تم جلب بيانات التحليلات بنجاح',
    });

  } catch (error) {
    console.error('Error fetching analytics events:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'معايير البحث غير صحيحة',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Log error
    await logAuditEvent({
      userId: session?.user?.id || 'unknown',
      action: 'VIEW_ANALYTICS_EVENTS_ERROR',
      resource: 'analytics',
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في جلب بيانات التحليلات',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/events
 * Deletes analytics events (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    // Permission check (admin only)
    const hasPermission = await validateUserPermissions(
      session.user.id,
      'analytics',
      'admin'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية لحذف بيانات التحليلات' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const beforeDate = searchParams.get('before');
    const eventType = searchParams.get('eventType');

    if (!beforeDate) {
      return NextResponse.json(
        { error: 'يجب تحديد تاريخ الحذف' },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: any = {
      timestamp: {
        lt: new Date(beforeDate),
      },
    };

    if (eventType) {
      whereClause.eventType = eventType;
    }

    // Delete events
    const deletedEvents = await prisma.analyticsEvent.deleteMany({
      where: whereClause,
    });

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'DELETE_ANALYTICS_EVENTS',
      resource: 'analytics',
      metadata: {
        deletedCount: deletedEvents.count,
        beforeDate,
        eventType,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deletedEvents.count,
      },
      message: `تم حذف ${deletedEvents.count} حدث بنجاح`,
    });

  } catch (error) {
    console.error('Error deleting analytics events:', error);
    
    // Log error
    await logAuditEvent({
      userId: session?.user?.id || 'unknown',
      action: 'DELETE_ANALYTICS_EVENTS_ERROR',
      resource: 'analytics',
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في حذف بيانات التحليلات',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
} 