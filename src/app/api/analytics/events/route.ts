/**
 * API لاستقبال الأحداث التحليلية
 * Analytics Events API
 * @version 3.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// نموذج التحقق من البيانات
const eventSchema = z.object({
  eventType: z.string(),
  eventData: z.record(z.any()),
  timestamp: z.string(),
  sessionId: z.string(),
  userId: z.string().optional(),
  articleId: z.string().optional(),
  pageUrl: z.string().optional(),
  deviceInfo: z.object({
    userAgent: z.string(),
    screenResolution: z.string(),
    deviceType: z.enum(['desktop', 'tablet', 'mobile']),
    language: z.string(),
  }).optional(),
});

const eventsRequestSchema = z.object({
  events: z.array(eventSchema),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = eventsRequestSchema.parse(body);

    // معالجة كل حدث
    const processedEvents = await Promise.all(
      validatedData.events.map(async (event) => {
        try {
          // إنشاء الحدث في قاعدة البيانات
          const savedEvent = await prisma.analyticsEvent.create({
            data: {
              event_type: event.eventType,
              event_data: event.eventData,
              article_id: event.articleId || null,
              user_id: event.userId || null,
              session_id: event.sessionId,
              ip_address: getClientIP(request),
              user_agent: event.deviceInfo?.userAgent || request.headers.get('user-agent'),
              referrer: request.headers.get('referer'),
              page_url: event.pageUrl,
              timestamp: new Date(event.timestamp),
            },
          });

          // تحديث إحصائيات المقال إذا كان مرتبطًا
          if (event.articleId && event.eventType === 'article_view') {
            await prisma.article.update({
              where: { id: event.articleId },
              data: { 
                view_count: { increment: 1 }
              },
            });
          }

          // تحديث اهتمامات المستخدم
          if (event.userId && event.articleId) {
            await updateUserInterests(event.userId, event.articleId, event.eventType);
          }

          return { success: true, eventId: savedEvent.id };
        } catch (error) {
          console.error('Error processing event:', error);
          return { success: false, error: error.message };
        }
      })
    );

    // إحصائيات الاستجابة
    const successCount = processedEvents.filter(e => e.success).length;
    const failureCount = processedEvents.length - successCount;

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      successful: successCount,
      failed: failureCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'فشل في معالجة الأحداث التحليلية',
      details: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// دالة لتحديث اهتمامات المستخدم
async function updateUserInterests(userId: string, articleId: string, eventType: string) {
  try {
    // الحصول على تفاصيل المقال
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { category: true },
    });

    if (!article) return;

    // حساب درجة الاهتمام حسب نوع الحدث
    let interestScore = 0;
    switch (eventType) {
      case 'article_view':
        interestScore = 1.0;
        break;
      case 'article_like':
        interestScore = 3.0;
        break;
      case 'article_share':
        interestScore = 2.5;
        break;
      case 'reading_time':
        const duration = 1; // يجب حساب المدة الفعلية
        interestScore = Math.min(duration / 60, 2.0);
        break;
      case 'scroll_depth':
        interestScore = 0.5;
        break;
      default:
        interestScore = 0.1;
    }

    // تحديث أو إنشاء اهتمام المستخدم بالتصنيف
    await prisma.userInterest.upsert({
      where: {
        user_id_category_id: {
          user_id: userId,
          category_id: article.category_id,
        }
      },
      update: {
        interest_score: {
          increment: interestScore
        },
        last_updated: new Date(),
      },
      create: {
        user_id: userId,
        category_id: article.category_id,
        interest_score: interestScore,
        last_updated: new Date(),
      },
    });

    // تحديث اهتمام المستخدم بالكلمات المفتاحية
    if (article.tags && article.tags.length > 0) {
      for (const tag of article.tags) {
        await prisma.userInterest.upsert({
          where: {
            user_id_topic: {
              user_id: userId,
              topic: tag,
            }
          },
          update: {
            interest_score: {
              increment: interestScore * 0.5
            },
            last_updated: new Date(),
          },
          create: {
            user_id: userId,
            topic: tag,
            interest_score: interestScore * 0.5,
            last_updated: new Date(),
          },
        });
      }
    }

  } catch (error) {
    console.error('Error updating user interests:', error);
  }
}

// دالة للحصول على IP العميل
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.headers.get('remote-addr') || 'unknown';
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