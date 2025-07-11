/**
 * API لاستقبال الأحداث التحليلية
 * Analytics Events API
 * @version 3.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AnalyticsCore, extractClientInfo } from '@/lib/analytics-core';
import { checkRateLimit } from '@/lib/rate-limiter';

const prisma = new PrismaClient();

// Validation schema for analytics events
const analyticsEventSchema = z.object({
  eventType: z.string().min(1, 'نوع الحدث مطلوب'),
  eventData: z.record(z.any()).optional().default({}),
  articleId: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  pageUrl: z.string().optional(),
  referrer: z.string().optional(),
});

const batchEventsSchema = z.object({
  events: z.array(analyticsEventSchema).min(1, 'يجب إرسال حدث واحد على الأقل'),
});

/**
 * POST /api/analytics/events
 * Track analytics events
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'تم تجاوز الحد الأقصى للطلبات',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      );
    }

    // Extract client info
    const clientInfo = extractClientInfo(request);
    
    // Parse request body
    const body = await request.json();
    
    // Validate single event or batch
    let events: any[] = [];
    if (body.events && Array.isArray(body.events)) {
      // Batch events
      const validation = batchEventsSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'بيانات غير صحيحة',
            details: validation.error.errors 
          },
          { status: 400 }
        );
      }
      events = validation.data.events;
    } else {
      // Single event
      const validation = analyticsEventSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'بيانات غير صحيحة',
            details: validation.error.errors 
          },
          { status: 400 }
        );
      }
      events = [validation.data];
    }

    // Process each event
    const results = [];
    for (const event of events) {
      try {
        await AnalyticsCore.trackEvent({
          eventType: event.eventType,
          eventData: event.eventData,
          articleId: event.articleId,
          userId: event.userId,
          sessionId: event.sessionId,
          pageUrl: event.pageUrl,
          referrer: event.referrer,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          timestamp: new Date(),
        });
        
        results.push({ success: true, eventType: event.eventType });
      } catch (error) {
        console.error('Failed to track event:', error);
        results.push({ 
          success: false, 
          eventType: event.eventType, 
          error: 'فشل في تسجيل الحدث' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics events API error:', error);
    return NextResponse.json(
      { 
        error: 'خطأ في الخادم',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/events
 * Get analytics events for a user or session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'معرف المستخدم أو معرف الجلسة مطلوب' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {};
    if (userId) where.user_id = userId;
    if (sessionId) where.session_id = sessionId;
    if (eventType) where.event_type = eventType;

    // Get events
    const events = await prisma.analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 100), // Max 100 events per request
      skip: offset,
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get total count
    const total = await prisma.analyticsEvent.count({ where });

    return NextResponse.json({
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Get analytics events error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/events
 * Delete analytics events (for privacy/GDPR compliance)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const beforeDate = searchParams.get('beforeDate');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'معرف المستخدم أو معرف الجلسة مطلوب' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {};
    if (userId) where.user_id = userId;
    if (sessionId) where.session_id = sessionId;
    if (beforeDate) where.timestamp = { lt: new Date(beforeDate) };

    // Delete events
    const result = await prisma.analyticsEvent.deleteMany({ where });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `تم حذف ${result.count} حدث`,
    });

  } catch (error) {
    console.error('Delete analytics events error:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف البيانات' },
      { status: 500 }
    );
  }
}

// دعم طرق HTTP أخرى
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 