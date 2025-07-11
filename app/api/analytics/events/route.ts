/**
 * API لاستقبال الأحداث التحليلية
 * Analytics Events API
 * @version 3.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

// بيانات أحداث التحليل التجريبية
const analyticsEvents = [
  {
    id: '1',
    type: 'page_view',
    page: '/',
    userId: 'user-1',
    timestamp: new Date().toISOString(),
    data: { referrer: 'direct' }
  },
  {
    id: '2',
    type: 'article_view',
    articleId: '1',
    userId: 'user-2',
    timestamp: new Date().toISOString(),
    data: { readingTime: 120 }
  },
  {
    id: '3',
    type: 'login',
    userId: 'user-1',
    timestamp: new Date().toISOString(),
    data: { method: 'email' }
  }
];

// GET /api/analytics/events - جلب أحداث التحليل
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    let filteredEvents = [...analyticsEvents];

    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }

    if (userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === userId);
    }

    const limitedEvents = filteredEvents.slice(0, limit);

    return NextResponse.json({
      success: true,
      events: limitedEvents,
      total: filteredEvents.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching analytics events:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب أحداث التحليل' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/events - إضافة حدث تحليل جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, userId, articleId, page } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'نوع الحدث مطلوب' },
        { status: 400 }
      );
    }

    const newEvent = {
      id: `${analyticsEvents.length + 1}`,
      type,
      userId: userId || 'anonymous',
      articleId: articleId || null,
      page: page || null,
      timestamp: new Date().toISOString(),
      data: data || {}
    };

    analyticsEvents.push(newEvent);

    return NextResponse.json({
      success: true,
      event: newEvent,
      message: 'تم تسجيل الحدث بنجاح'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating analytics event:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الحدث' },
      { status: 500 }
    );
  }
}

// OPTIONS - للتحقق من توفر الخدمة
export async function OPTIONS() {
  return NextResponse.json({
    success: true,
    message: 'Analytics service is available',
    methods: ['GET', 'POST', 'OPTIONS']
  });
} 