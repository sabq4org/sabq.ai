/**
 * نواة نظام التحليلات - Analytics Core
 * @version 3.0.0
 */

import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

// Types for Analytics
export interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  articleId?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  pageUrl?: string;
  timestamp?: Date;
}

export interface UserBehaviorData {
  userId: string;
  sessionDuration: number;
  pageViews: number;
  scrollDepth: number;
  interactionCount: number;
  readingTime: number;
  categories: string[];
}

export interface ContentPerformance {
  contentId: string;
  contentType: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  engagementScore: number;
}

// Analytics Core Class
export class AnalyticsCore {
  
  /**
   * Track an analytics event
   */
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          event_type: event.eventType,
          event_data: event.eventData,
          article_id: event.articleId,
          user_id: event.userId,
          session_id: event.sessionId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          referrer: event.referrer,
          page_url: event.pageUrl,
          timestamp: event.timestamp || new Date(),
          processed: false,
        },
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Track page view
   */
  static async trackPageView(params: {
    userId?: string;
    sessionId?: string;
    pageUrl: string;
    pageTitle?: string;
    referrer?: string;
    ipAddress?: string;
    userAgent?: string;
    articleId?: string;
  }): Promise<void> {
    await this.trackEvent({
      eventType: 'page_view',
      eventData: {
        pageTitle: params.pageTitle,
        loadTime: Date.now(),
      },
      articleId: params.articleId,
      userId: params.userId,
      sessionId: params.sessionId,
      pageUrl: params.pageUrl,
      referrer: params.referrer,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    // Update content analytics
    if (params.articleId) {
      await this.updateContentAnalytics(params.articleId, 'article', {
        views: 1,
        uniqueViews: params.userId ? 1 : 0,
      });
    }
  }

  /**
   * Track article interaction
   */
  static async trackArticleInteraction(params: {
    userId?: string;
    sessionId?: string;
    articleId: string;
    interactionType: 'like' | 'share' | 'comment' | 'bookmark' | 'read_complete';
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.trackEvent({
      eventType: 'article_interaction',
      eventData: {
        interactionType: params.interactionType,
        ...params.metadata,
      },
      articleId: params.articleId,
      userId: params.userId,
      sessionId: params.sessionId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    // Update content analytics based on interaction type
    const updateData: Record<string, number> = {};
    if (params.interactionType === 'like') updateData.likes = 1;
    if (params.interactionType === 'share') updateData.shares = 1;
    if (params.interactionType === 'comment') updateData.comments = 1;

    if (Object.keys(updateData).length > 0) {
      await this.updateContentAnalytics(params.articleId, 'article', updateData);
    }
  }

  /**
   * Track reading progress
   */
  static async trackReadingProgress(params: {
    userId?: string;
    sessionId?: string;
    articleId: string;
    scrollDepth: number;
    readingTime: number;
    wordsRead: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.trackEvent({
      eventType: 'reading_progress',
      eventData: {
        scrollDepth: params.scrollDepth,
        readingTime: params.readingTime,
        wordsRead: params.wordsRead,
        readingSpeed: params.wordsRead / (params.readingTime / 60), // words per minute
      },
      articleId: params.articleId,
      userId: params.userId,
      sessionId: params.sessionId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    // Update user behavior if user is logged in
    if (params.userId) {
      await this.updateUserBehavior(params.userId, {
        readingTime: params.readingTime,
        scrollDepth: params.scrollDepth,
        interactionCount: 1,
      });
    }
  }

  /**
   * Track search query
   */
  static async trackSearch(params: {
    userId?: string;
    sessionId?: string;
    query: string;
    resultsCount: number;
    clickedResult?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.trackEvent({
      eventType: 'search',
      eventData: {
        query: params.query,
        resultsCount: params.resultsCount,
        clickedResult: params.clickedResult,
        queryLength: params.query.length,
        hasResults: params.resultsCount > 0,
      },
      userId: params.userId,
      sessionId: params.sessionId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Track user session
   */
  static async trackSession(params: {
    userId?: string;
    sessionId: string;
    startTime: Date;
    endTime?: Date;
    pageViews: number;
    eventsCount: number;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
    city?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    referrer?: string;
    landingPage?: string;
    exitPage?: string;
  }): Promise<void> {
    const duration = params.endTime ? 
      Math.floor((params.endTime.getTime() - params.startTime.getTime()) / 1000) : 
      undefined;

    const isBounce = params.pageViews <= 1 && (duration || 0) < 30;

    await prisma.userSession.upsert({
      where: { session_id: params.sessionId },
      update: {
        end_time: params.endTime,
        duration,
        page_views: params.pageViews,
        events_count: params.eventsCount,
        is_bounce: isBounce,
        exit_page: params.exitPage,
        updated_at: new Date(),
      },
      create: {
        user_id: params.userId,
        session_id: params.sessionId,
        start_time: params.startTime,
        end_time: params.endTime,
        duration,
        page_views: params.pageViews,
        events_count: params.eventsCount,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        country: params.country,
        city: params.city,
        device_type: params.deviceType,
        browser: params.browser,
        os: params.os,
        referrer: params.referrer,
        landing_page: params.landingPage,
        exit_page: params.exitPage,
        is_bounce: isBounce,
      },
    });
  }

  /**
   * Update content analytics
   */
  static async updateContentAnalytics(
    contentId: string,
    contentType: string,
    updates: Partial<{
      views: number;
      uniqueViews: number;
      avgTimeOnPage: number;
      bounceRate: number;
      shares: number;
      likes: number;
      comments: number;
      scrollDepth: number;
    }>
  ): Promise<void> {
    try {
      await prisma.contentAnalytics.upsert({
        where: {
          content_id_content_type: {
            content_id: contentId,
            content_type: contentType,
          },
        },
        update: {
          views: updates.views ? { increment: updates.views } : undefined,
          unique_views: updates.uniqueViews ? { increment: updates.uniqueViews } : undefined,
          avg_time_on_page: updates.avgTimeOnPage,
          bounce_rate: updates.bounceRate,
          shares: updates.shares ? { increment: updates.shares } : undefined,
          likes: updates.likes ? { increment: updates.likes } : undefined,
          comments: updates.comments ? { increment: updates.comments } : undefined,
          scroll_depth: updates.scrollDepth,
          updated_at: new Date(),
        },
        create: {
          content_id: contentId,
          content_type: contentType,
          views: updates.views || 0,
          unique_views: updates.uniqueViews || 0,
          avg_time_on_page: updates.avgTimeOnPage || 0,
          bounce_rate: updates.bounceRate || 0,
          shares: updates.shares || 0,
          likes: updates.likes || 0,
          comments: updates.comments || 0,
          scroll_depth: updates.scrollDepth || 0,
        },
      });
    } catch (error) {
      console.error('Failed to update content analytics:', error);
    }
  }

  /**
   * Update user behavior
   */
  static async updateUserBehavior(
    userId: string,
    updates: Partial<{
      sessionDuration: number;
      pageViews: number;
      readingTime: number;
      scrollDepth: number;
      interactionCount: number;
      categories: string[];
    }>
  ): Promise<void> {
    try {
      await prisma.userBehavior.upsert({
        where: { user_id: userId },
        update: {
          total_sessions: updates.sessionDuration ? { increment: 1 } : undefined,
          total_page_views: updates.pageViews ? { increment: updates.pageViews } : undefined,
          total_time_spent: updates.readingTime ? { increment: updates.readingTime } : undefined,
          interaction_score: updates.interactionCount ? { increment: updates.interactionCount * 0.1 } : undefined,
          last_activity_at: new Date(),
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          total_sessions: 1,
          total_page_views: updates.pageViews || 0,
          total_time_spent: updates.readingTime || 0,
          interaction_score: (updates.interactionCount || 0) * 0.1,
          last_activity_at: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to update user behavior:', error);
    }
  }

  /**
   * Get user analytics summary
   */
  static async getUserAnalytics(userId: string): Promise<{
    behavior: any;
    recentActivity: any[];
    topCategories: any[];
    readingStats: any;
  }> {
    const [behavior, recentEvents, userInterests] = await Promise.all([
      prisma.userBehavior.findUnique({
        where: { user_id: userId },
      }),
      prisma.analyticsEvent.findMany({
        where: { user_id: userId },
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.userInterest.findMany({
        where: { user_id: userId },
        orderBy: { interest_score: 'desc' },
        take: 10,
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Calculate reading stats
    const readingEvents = recentEvents.filter(e => e.event_type === 'reading_progress');
    const totalReadingTime = readingEvents.reduce((sum, event) => 
      sum + (event.event_data as any).readingTime || 0, 0
    );
    const avgReadingSpeed = readingEvents.length > 0 ? 
      readingEvents.reduce((sum, event) => sum + (event.event_data as any).readingSpeed || 0, 0) / readingEvents.length : 
      0;

    return {
      behavior,
      recentActivity: recentEvents.slice(0, 10),
      topCategories: userInterests.map(interest => ({
        category: interest.category?.name || interest.topic,
        score: interest.interest_score,
      })),
      readingStats: {
        totalReadingTime,
        avgReadingSpeed,
        articlesRead: recentEvents.filter(e => e.event_type === 'page_view' && e.article_id).length,
        avgScrollDepth: readingEvents.length > 0 ? 
          readingEvents.reduce((sum, event) => sum + (event.event_data as any).scrollDepth || 0, 0) / readingEvents.length : 
          0,
      },
    };
  }

  /**
   * Get content analytics
   */
  static async getContentAnalytics(contentId: string, contentType: string = 'article'): Promise<any> {
    const analytics = await prisma.contentAnalytics.findUnique({
      where: {
        content_id_content_type: {
          content_id: contentId,
          content_type: contentType,
        },
      },
    });

    if (!analytics) {
      return {
        views: 0,
        uniqueViews: 0,
        avgTimeOnPage: 0,
        bounceRate: 0,
        engagementScore: 0,
      };
    }

    // Calculate engagement score
    const engagementScore = (
      (analytics.likes * 3) +
      (analytics.shares * 5) +
      (analytics.comments * 7) +
      (analytics.avg_time_on_page / 60) +
      (analytics.scroll_depth * 2)
    ) / analytics.views;

    return {
      ...analytics,
      engagementScore,
    };
  }

  /**
   * Get real-time metrics
   */
  static async updateRealtimeMetrics(
    metricType: string,
    metricName: string,
    value: number,
    dimensions?: Record<string, any>
  ): Promise<void> {
    await prisma.realtimeMetrics.create({
      data: {
        metric_type: metricType,
        metric_name: metricName,
        value,
        dimensions,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Get dashboard metrics
   */
  static async getDashboardMetrics(): Promise<{
    activeUsers: number;
    totalPageViews: number;
    totalSessions: number;
    avgSessionDuration: number;
    topContent: any[];
    topCategories: any[];
  }> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeUsers,
      totalPageViews,
      totalSessions,
      avgSessionDuration,
      topContent,
      topCategories,
    ] = await Promise.all([
      // Active users in last 24 hours
      prisma.analyticsEvent.groupBy({
        by: ['user_id'],
        where: {
          timestamp: { gte: last24Hours },
          user_id: { not: null },
        },
        _count: true,
      }),
      
      // Total page views in last 7 days
      prisma.analyticsEvent.count({
        where: {
          event_type: 'page_view',
          timestamp: { gte: last7Days },
        },
      }),
      
      // Total sessions in last 7 days
      prisma.userSession.count({
        where: {
          start_time: { gte: last7Days },
        },
      }),
      
      // Average session duration
      prisma.userSession.aggregate({
        _avg: { duration: true },
        where: {
          start_time: { gte: last7Days },
          duration: { not: null },
        },
      }),
      
      // Top content by views
      prisma.contentAnalytics.findMany({
        orderBy: { views: 'desc' },
        take: 10,
        where: {
          updated_at: { gte: last7Days },
        },
      }),
      
      // Top categories by user interest
      prisma.userInterest.groupBy({
        by: ['category_id'],
        _avg: { interest_score: true },
        _count: true,
        orderBy: { _avg: { interest_score: 'desc' } },
        take: 10,
        where: {
          category_id: { not: null },
        },
      }),
    ]);

    return {
      activeUsers: activeUsers.length,
      totalPageViews,
      totalSessions,
      avgSessionDuration: avgSessionDuration._avg.duration || 0,
      topContent,
      topCategories,
    };
  }

  /**
   * Process unprocessed events (for batch processing)
   */
  static async processUnprocessedEvents(batchSize: number = 100): Promise<void> {
    const events = await prisma.analyticsEvent.findMany({
      where: { processed: false },
      take: batchSize,
      orderBy: { timestamp: 'asc' },
    });

    for (const event of events) {
      try {
        // Process different event types
        switch (event.event_type) {
          case 'page_view':
            await this.processPageViewEvent(event);
            break;
          case 'reading_progress':
            await this.processReadingProgressEvent(event);
            break;
          case 'article_interaction':
            await this.processArticleInteractionEvent(event);
            break;
          default:
            // Mark as processed even if we don't have specific processing
            break;
        }

        // Mark as processed
        await prisma.analyticsEvent.update({
          where: { id: event.id },
          data: { processed: true },
        });
      } catch (error) {
        console.error(`Failed to process event ${event.id}:`, error);
      }
    }
  }

  /**
   * Process page view event
   */
  private static async processPageViewEvent(event: any): Promise<void> {
    if (event.user_id) {
      await this.updateUserBehavior(event.user_id, {
        pageViews: 1,
      });
    }
  }

  /**
   * Process reading progress event
   */
  private static async processReadingProgressEvent(event: any): Promise<void> {
    const eventData = event.event_data as any;
    
    if (event.user_id) {
      await this.updateUserBehavior(event.user_id, {
        readingTime: eventData.readingTime,
        scrollDepth: eventData.scrollDepth,
        interactionCount: 1,
      });
    }

    if (event.article_id) {
      await this.updateContentAnalytics(event.article_id, 'article', {
        avgTimeOnPage: eventData.readingTime,
        scrollDepth: eventData.scrollDepth,
      });
    }
  }

  /**
   * Process article interaction event
   */
  private static async processArticleInteractionEvent(event: any): Promise<void> {
    const eventData = event.event_data as any;
    
    if (event.user_id) {
      await this.updateUserBehavior(event.user_id, {
        interactionCount: 1,
      });
    }
  }
}

// Helper function to extract client info from request
export function extractClientInfo(request: NextRequest): {
  ipAddress: string;
  userAgent: string;
  country?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
} {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ipAddress = forwarded?.split(',')[0].trim() || realIp || cfConnectingIp || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Extract additional info from headers (if available from CDN/proxy)
  const country = request.headers.get('cf-ipcountry') || request.headers.get('x-country-code');
  const city = request.headers.get('cf-ipcity') || request.headers.get('x-city');
  
  // Simple device type detection
  const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop';
  
  // Simple browser detection
  let browser = 'unknown';
  if (userAgent.includes('Chrome')) browser = 'chrome';
  else if (userAgent.includes('Firefox')) browser = 'firefox';
  else if (userAgent.includes('Safari')) browser = 'safari';
  else if (userAgent.includes('Edge')) browser = 'edge';
  
  // Simple OS detection
  let os = 'unknown';
  if (userAgent.includes('Windows')) os = 'windows';
  else if (userAgent.includes('Mac')) os = 'macos';
  else if (userAgent.includes('Linux')) os = 'linux';
  else if (userAgent.includes('Android')) os = 'android';
  else if (userAgent.includes('iOS')) os = 'ios';
  
  return {
    ipAddress,
    userAgent,
    country: country || undefined,
    city: city || undefined,
    deviceType,
    browser,
    os,
  };
}

export default AnalyticsCore; 