/**
 * نواة نظام التحليلات - Analytics Core
 * @version 3.0.0
 */

import { getCookie, setCookie } from 'js-cookie';

// أنواع الأحداث الأساسية
export enum EventType {
  PAGE_VIEW = 'page_view',
  ARTICLE_VIEW = 'article_view',
  ARTICLE_LIKE = 'article_like',
  ARTICLE_SHARE = 'article_share',
  SEARCH_QUERY = 'search_query',
  SCROLL_DEPTH = 'scroll_depth',
  READING_TIME = 'reading_time',
  CLICK_ELEMENT = 'click_element',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  ERROR_OCCURRED = 'error_occurred',
}

// بنية بيانات الحدث
export interface AnalyticsEvent {
  eventType: EventType;
  eventData: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId?: string;
  articleId?: string;
  pageUrl?: string;
  deviceInfo?: DeviceInfo;
}

// معلومات الجهاز
export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  language: string;
}

// الفئة الرئيسية للتحليلات
export class AdvancedAnalytics {
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private isInitialized = false;
  private config = {
    enabled: true,
    batchSize: 10,
    flushInterval: 5000,
    endpoint: '/api/analytics/events',
    debug: process.env.NODE_ENV === 'development',
  };

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    this.track(EventType.SESSION_START, {
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    });

    this.setupAutoTracking();
    this.setupFlushTimer();
    this.isInitialized = true;
  }

  public track(eventType: EventType, eventData: Record<string, any> = {}): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      eventType,
      eventData: {
        ...eventData,
        url: window.location.href,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      deviceInfo: this.getDeviceInfo()
    };

    this.eventQueue.push(event);

    if (this.config.debug) {
      console.log('Analytics Event:', event);
    }

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public trackPageView(pageData: Record<string, any> = {}): void {
    this.track(EventType.PAGE_VIEW, {
      path: window.location.pathname,
      title: document.title,
      ...pageData
    });
  }

  public trackArticleView(articleId: string, articleData: Record<string, any> = {}): void {
    this.track(EventType.ARTICLE_VIEW, {
      articleId,
      ...articleData
    });
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public clearUserId(): void {
    this.userId = undefined;
  }

  private setupAutoTracking(): void {
    // تتبع التمرير البسيط
    let lastScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollDepth >= lastScrollDepth + 25) {
        this.track(EventType.SCROLL_DEPTH, { depth: scrollDepth });
        lastScrollDepth = scrollDepth;
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        this.eventQueue.unshift(...events);
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Analytics flush error:', error);
      this.eventQueue.unshift(...events);
    }
  }

  private setupFlushTimer(): void {
    setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private getOrCreateSessionId(): string {
    let sessionId = getCookie('analytics_session');
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCookie('analytics_session', sessionId, { expires: 1 });
    }
    
    return sessionId;
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      deviceType: this.getDeviceType(),
      language: navigator.language
    };
  }

  private getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
}

// إنشاء مثيل عام
export const analytics = new AdvancedAnalytics();

// دوال مساعدة
export const trackEvent = (eventType: EventType, eventData?: Record<string, any>) => {
  analytics.track(eventType, eventData);
};

export const trackPageView = (pageData?: Record<string, any>) => {
  analytics.trackPageView(pageData);
};

export const trackArticleView = (articleId: string, articleData?: Record<string, any>) => {
  analytics.trackArticleView(articleId, articleData);
};

export const setUserId = (userId: string) => {
  analytics.setUserId(userId);
};

export const clearUserId = () => {
  analytics.clearUserId();
}; 