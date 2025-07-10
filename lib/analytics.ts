/**
 * نظام التحليلات الشامل - Advanced Analytics System
 * تتبع السلوك والتحليلات المتقدمة للمستخدمين
 * @version 3.0.0
 * @author Sabq AI Team
 */

import { getCookie, setCookie } from 'js-cookie';

// أنواع الأحداث المدعومة
export enum EventType {
  // Page Events
  PAGE_VIEW = 'page_view',
  PAGE_ENTER = 'page_enter',
  PAGE_EXIT = 'page_exit',
  
  // Article Events
  ARTICLE_VIEW = 'article_view',
  ARTICLE_LIKE = 'article_like',
  ARTICLE_UNLIKE = 'article_unlike',
  ARTICLE_BOOKMARK = 'article_bookmark',
  ARTICLE_UNBOOKMARK = 'article_unbookmark',
  ARTICLE_SHARE = 'article_share',
  ARTICLE_COMMENT = 'article_comment',
  
  // Reading Behavior
  READING_START = 'reading_start',
  READING_END = 'reading_end',
  READING_TIME = 'reading_time',
  SCROLL_DEPTH = 'scroll_depth',
  SECTION_VIEW = 'section_view',
  
  // Search Events
  SEARCH_QUERY = 'search_query',
  SEARCH_CLICK = 'search_click',
  SEARCH_NO_RESULTS = 'search_no_results',
  
  // Navigation Events
  NAVIGATE_MENU = 'navigate_menu',
  NAVIGATE_CATEGORY = 'navigate_category',
  NAVIGATE_LINK = 'navigate_link',
  NAVIGATE_BACK = 'navigate_back',
  
  // User Interaction
  CLICK_ELEMENT = 'click_element',
  FORM_SUBMIT = 'form_submit',
  FORM_ABANDON = 'form_abandon',
  MODAL_OPEN = 'modal_open',
  MODAL_CLOSE = 'modal_close',
  
  // Session Events
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  SESSION_TIMEOUT = 'session_timeout',
  
  // Engagement Events
  NEWSLETTER_SIGNUP = 'newsletter_signup',
  NOTIFICATION_CLICK = 'notification_click',
  FEATURE_USE = 'feature_use',
  
  // Performance Events
  PERFORMANCE_TIMING = 'performance_timing',
  ERROR_OCCURRED = 'error_occurred',
  LOAD_TIME = 'load_time',
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
  referrer?: string;
  deviceInfo?: DeviceInfo;
  context?: string;
}

// معلومات الجهاز
export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  viewportSize: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  os: string;
  browser: string;
  language: string;
  timezone: string;
}

// إعدادات التتبع
export interface TrackingConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number;
  endpoint: string;
  debug: boolean;
  respectDNT: boolean; // Do Not Track
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableScrollTracking: boolean;
  enableReadingTimeTracking: boolean;
}

// الفئة الرئيسية للتحليلات
export class AdvancedAnalytics {
  private config: TrackingConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private isInitialized = false;
  private flushTimer?: NodeJS.Timeout;
  private readingStartTime?: number;
  private lastScrollDepth = 0;
  private performanceObserver?: PerformanceObserver;

  constructor(config: Partial<TrackingConfig> = {}) {
    this.config = {
      enabled: true,
      batchSize: 10,
      flushInterval: 5000,
      endpoint: '/api/analytics/events',
      debug: false,
      respectDNT: true,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableScrollTracking: true,
      enableReadingTimeTracking: true,
      ...config
    };

    this.sessionId = this.getOrCreateSessionId();
    this.init();
  }

  // تهيئة النظام
  private init() {
    if (this.isInitialized) return;

    // فحص Do Not Track
    if (this.config.respectDNT && this.isDNTEnabled()) {
      this.config.enabled = false;
      console.log('Analytics disabled due to Do Not Track');
      return;
    }

    // تسجيل بداية الجلسة
    this.track(EventType.SESSION_START, {
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // إعداد المراقبة التلقائية
    this.setupAutoTracking();
    
    // إعداد مؤقت الإرسال
    this.setupFlushTimer();
    
    this.isInitialized = true;
    
    if (this.config.debug) {
      console.log('Advanced Analytics initialized', this.config);
    }
  }

  // تسجيل حدث
  public track(eventType: EventType, eventData: Record<string, any> = {}, context?: string): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      eventType,
      eventData: {
        ...eventData,
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      referrer: document.referrer,
      deviceInfo: this.getDeviceInfo(),
      context
    };

    this.eventQueue.push(event);

    if (this.config.debug) {
      console.log('Analytics Event:', event);
    }

    // إرسال فوري للأحداث الحرجة
    if (this.isCriticalEvent(eventType)) {
      this.flush();
    } else if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // تسجيل عرض الصفحة
  public trackPageView(pageData: Record<string, any> = {}): void {
    this.track(EventType.PAGE_VIEW, {
      path: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search,
      loadTime: performance.now(),
      ...pageData
    });
  }

  // تسجيل عرض المقال
  public trackArticleView(articleId: string, articleData: Record<string, any> = {}): void {
    this.track(EventType.ARTICLE_VIEW, {
      articleId,
      category: articleData.category,
      author: articleData.author,
      tags: articleData.tags,
      readingTime: articleData.readingTime,
      ...articleData
    });

    // بدء تتبع وقت القراءة
    if (this.config.enableReadingTimeTracking) {
      this.startReadingTime(articleId);
    }
  }

  // تسجيل تفاعل المستخدم
  public trackUserInteraction(action: string, target: string, data: Record<string, any> = {}): void {
    this.track(EventType.CLICK_ELEMENT, {
      action,
      target,
      elementType: data.elementType,
      elementText: data.elementText,
      position: data.position,
      ...data
    });
  }

  // تسجيل البحث
  public trackSearch(query: string, resultsCount: number, filters: Record<string, any> = {}): void {
    this.track(EventType.SEARCH_QUERY, {
      query: query.toLowerCase(),
      resultsCount,
      filters,
      queryLength: query.length,
      hasFilters: Object.keys(filters).length > 0
    });
  }

  // تسجيل الأخطاء
  public trackError(error: Error, context?: string): void {
    if (!this.config.enableErrorTracking) return;

    this.track(EventType.ERROR_OCCURRED, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  // تسجيل الأداء
  public trackPerformance(timing: PerformanceTiming): void {
    if (!this.config.enablePerformanceTracking) return;

    this.track(EventType.PERFORMANCE_TIMING, {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: timing.responseStart - timing.navigationStart,
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      serverResponse: timing.responseEnd - timing.requestStart
    });
  }

  // تعيين معرف المستخدم
  public setUserId(userId: string): void {
    this.userId = userId;
    
    // إرسال الأحداث المؤجلة مع معرف المستخدم
    if (this.eventQueue.length > 0) {
      this.flush();
    }
  }

  // تسجيل الخروج
  public clearUserId(): void {
    this.userId = undefined;
  }

  // إعداد التتبع التلقائي
  private setupAutoTracking(): void {
    // تتبع التمرير
    if (this.config.enableScrollTracking) {
      this.setupScrollTracking();
    }

    // تتبع الأخطاء
    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }

    // تتبع الأداء
    if (this.config.enablePerformanceTracking) {
      this.setupPerformanceTracking();
    }

    // تتبع إغلاق الصفحة
    this.setupUnloadTracking();
  }

  // إعداد تتبع التمرير
  private setupScrollTracking(): void {
    let isScrolling = false;
    
    const handleScroll = () => {
      if (isScrolling) return;
      isScrolling = true;

      requestAnimationFrame(() => {
        const scrollDepth = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );

        // تسجيل عند الوصول لعمق جديد (كل 25%)
        if (scrollDepth >= this.lastScrollDepth + 25) {
          this.track(EventType.SCROLL_DEPTH, {
            depth: scrollDepth,
            scrollY: window.scrollY,
            viewportHeight: window.innerHeight,
            documentHeight: document.documentElement.scrollHeight
          });
          this.lastScrollDepth = scrollDepth;
        }

        isScrolling = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // إعداد تتبع الأخطاء
  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), 'global_error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), 'unhandled_promise');
    });
  }

  // إعداد تتبع الأداء
  private setupPerformanceTracking(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            this.track(EventType.PERFORMANCE_TIMING, {
              metric: 'LCP',
              value: entry.startTime,
              entryType: entry.entryType
            });
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // تسجيل Load Event
    window.addEventListener('load', () => {
      this.trackPerformance(performance.timing);
    });
  }

  // إعداد تتبع إغلاق الصفحة
  private setupUnloadTracking(): void {
    const handleUnload = () => {
      this.track(EventType.PAGE_EXIT, {
        sessionDuration: Date.now() - this.getSessionStartTime(),
        scrollDepth: this.lastScrollDepth
      });
      this.flush(true); // إرسال فوري
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
  }

  // بدء تتبع وقت القراءة
  private startReadingTime(articleId: string): void {
    this.readingStartTime = Date.now();
    
    // تسجيل وقت القراءة كل 30 ثانية
    const readingInterval = setInterval(() => {
      if (this.readingStartTime) {
        const readingTime = Date.now() - this.readingStartTime;
        this.track(EventType.READING_TIME, {
          articleId,
          duration: readingTime,
          isActive: !document.hidden
        });
      }
    }, 30000);

    // تنظيف المؤقت عند مغادرة الصفحة
    const cleanup = () => {
      clearInterval(readingInterval);
      if (this.readingStartTime) {
        const totalReadingTime = Date.now() - this.readingStartTime;
        this.track(EventType.READING_END, {
          articleId,
          totalDuration: totalReadingTime
        });
      }
    };

    window.addEventListener('beforeunload', cleanup);
  }

  // إرسال الأحداث
  private async flush(immediate = false): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        keepalive: immediate, // للإرسال عند إغلاق الصفحة
      });

      if (!response.ok) {
        // إعادة الأحداث للطابور في حالة الفشل
        this.eventQueue.unshift(...events);
        throw new Error(`Analytics API error: ${response.status}`);
      }

      if (this.config.debug) {
        console.log(`Analytics: Sent ${events.length} events`);
      }
    } catch (error) {
      console.error('Analytics flush error:', error);
      // إعادة الأحداث للطابور
      this.eventQueue.unshift(...events);
    }
  }

  // إعداد مؤقت الإرسال
  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  // الحصول على معرف الجلسة
  private getOrCreateSessionId(): string {
    let sessionId = getCookie('analytics_session');
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      setCookie('analytics_session', sessionId, { expires: 1 }); // يوم واحد
    }
    
    return sessionId;
  }

  // توليد معرف الجلسة
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // الحصول على معلومات الجهاز
  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    return {
      userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceType: this.getDeviceType(),
      os: this.getOS(),
      browser: this.getBrowser(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // تحديد نوع الجهاز
  private getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // تحديد نظام التشغيل
  private getOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  // تحديد المتصفح
  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // فحص Do Not Track
  private isDNTEnabled(): boolean {
    return navigator.doNotTrack === '1' || 
           (window as any).doNotTrack === '1' || 
           (navigator as any).msDoNotTrack === '1';
  }

  // فحص الأحداث الحرجة
  private isCriticalEvent(eventType: EventType): boolean {
    return [
      EventType.SESSION_START,
      EventType.SESSION_END,
      EventType.ERROR_OCCURRED,
      EventType.ARTICLE_LIKE,
      EventType.FORM_SUBMIT
    ].includes(eventType);
  }

  // الحصول على وقت بداية الجلسة
  private getSessionStartTime(): number {
    const stored = getCookie('session_start_time');
    if (stored) {
      return parseInt(stored);
    }
    const now = Date.now();
    setCookie('session_start_time', now.toString(), { expires: 1 });
    return now;
  }

  // تنظيف الموارد
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.flush(true);
    this.isInitialized = false;
  }
}

// إنشاء مثيل عام
export const analytics = new AdvancedAnalytics({
  debug: process.env.NODE_ENV === 'development',
  endpoint: '/api/analytics/events'
});

// دوال مساعدة للاستخدام السهل
export const trackEvent = (eventType: EventType, eventData?: Record<string, any>, context?: string) => {
  analytics.track(eventType, eventData, context);
};

export const trackPageView = (pageData?: Record<string, any>) => {
  analytics.trackPageView(pageData);
};

export const trackArticleView = (articleId: string, articleData?: Record<string, any>) => {
  analytics.trackArticleView(articleId, articleData);
};

export const trackUserInteraction = (action: string, target: string, data?: Record<string, any>) => {
  analytics.trackUserInteraction(action, target, data);
};

export const trackSearch = (query: string, resultsCount: number, filters?: Record<string, any>) => {
  analytics.trackSearch(query, resultsCount, filters);
};

export const trackError = (error: Error, context?: string) => {
  analytics.trackError(error, context);
};

export const setUserId = (userId: string) => {
  analytics.setUserId(userId);
};

export const clearUserId = () => {
  analytics.clearUserId();
};

// أحداث خاصة بالتطبيق
export const trackArticleLike = (articleId: string, liked: boolean) => {
  trackEvent(liked ? EventType.ARTICLE_LIKE : EventType.ARTICLE_UNLIKE, {
    articleId,
    action: liked ? 'like' : 'unlike'
  });
};

export const trackArticleBookmark = (articleId: string, bookmarked: boolean) => {
  trackEvent(bookmarked ? EventType.ARTICLE_BOOKMARK : EventType.ARTICLE_UNBOOKMARK, {
    articleId,
    action: bookmarked ? 'bookmark' : 'unbookmark'
  });
};

export const trackArticleShare = (articleId: string, platform: string, method: string) => {
  trackEvent(EventType.ARTICLE_SHARE, {
    articleId,
    platform,
    method,
    url: window.location.href
  });
};

export const trackNewsletterSignup = (email: string, source: string) => {
  trackEvent(EventType.NEWSLETTER_SIGNUP, {
    email: email.toLowerCase(),
    source,
    timestamp: new Date().toISOString()
  });
};

// تصدير الثوابت
export { EventType };
export type { AnalyticsEvent, DeviceInfo, TrackingConfig }; 