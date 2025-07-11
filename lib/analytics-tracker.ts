/**
 * مكتبة تتبع الأحداث الشاملة - Sabq AI Analytics Tracker
 * 
 * ميزات:
 * - تتبع جميع أنواع الأحداث (page_view, scroll, click, reading_time, etc.)
 * - حماية الخصوصية مع دعم DNT
 * - حماية من السبام والتكرار
 * - دعم المستخدمين المسجلين والزوار
 * - تخزين محلي للجلسات
 * - إرسال دفعي للأحداث
 */

interface EventData {
  userId?: string;
  articleId?: string;
  sessionId?: string;
  eventType: string;
  eventData?: any;
  pageUrl?: string;
  referrer?: string;
  timestamp?: Date;
}

interface SessionData {
  sessionId: string;
  startTime: Date;
  userId?: string;
  deviceInfo: any;
  ipAddress?: string;
  userAgent: string;
}

interface TrackerConfig {
  apiEndpoint: string;
  batchSize: number;
  batchTimeout: number;
  respectDNT: boolean;
  enableLocalStorage: boolean;
  debugMode: boolean;
  rateLimitPerMinute: number;
}

class AnalyticsTracker {
  private config: TrackerConfig;
  private eventQueue: EventData[] = [];
  private sessionData: SessionData | null = null;
  private batchTimer: NodeJS.Timeout | null = null;
  private eventCounts: Map<string, number> = new Map();
  private lastReset: number = Date.now();

  constructor(config: Partial<TrackerConfig> = {}) {
    this.config = {
      apiEndpoint: '/api/analytics/events',
      batchSize: 10,
      batchTimeout: 5000,
      respectDNT: true,
      enableLocalStorage: true,
      debugMode: false,
      rateLimitPerMinute: 60,
      ...config
    };

    this.initializeSession();
    this.setupEventListeners();
  }

  /**
   * تهيئة الجلسة
   */
  private initializeSession(): void {
    if (this.shouldRespectDNT()) {
      this.log('DNT detected, analytics disabled');
      return;
    }

    const existingSession = this.getStoredSession();
    if (existingSession && this.isSessionValid(existingSession)) {
      this.sessionData = existingSession;
      this.log('Existing session restored:', existingSession.sessionId);
    } else {
      this.createNewSession();
    }
  }

  /**
   * إنشاء جلسة جديدة
   */
  private createNewSession(): void {
    const sessionId = this.generateSessionId();
    this.sessionData = {
      sessionId,
      startTime: new Date(),
      deviceInfo: this.getDeviceInfo(),
      userAgent: navigator.userAgent,
    };

    if (this.config.enableLocalStorage) {
      localStorage.setItem('sabq_analytics_session', JSON.stringify({
        ...this.sessionData,
        startTime: this.sessionData.startTime.toISOString()
      }));
    }

    this.log('New session created:', sessionId);
  }

  /**
   * تسجيل حدث
   */
  public trackEvent(eventType: string, data: any = {}): void {
    if (!this.sessionData || this.shouldRespectDNT()) {
      return;
    }

    if (!this.checkRateLimit(eventType)) {
      this.log('Rate limit exceeded for event type:', eventType);
      return;
    }

    const event: EventData = {
      userId: this.getUserId(),
      articleId: data.articleId,
      sessionId: this.sessionData.sessionId,
      eventType,
      eventData: this.sanitizeEventData(data),
      pageUrl: window.location.href,
      referrer: document.referrer,
      timestamp: new Date()
    };

    this.eventQueue.push(event);
    this.log('Event tracked:', eventType, data);

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    } else {
      this.scheduleBatchSend();
    }
  }

  /**
   * تتبع مشاهدة الصفحة
   */
  public trackPageView(data: any = {}): void {
    this.trackEvent('page_view', {
      ...data,
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * تتبع تقدم القراءة
   */
  public trackReadingProgress(articleId: string, progress: number): void {
    this.trackEvent('reading_progress', {
      articleId,
      progress: Math.round(progress),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * تتبع التمرير
   */
  public trackScroll(data: any = {}): void {
    const scrollDepth = Math.round(
      ((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100
    );

    this.trackEvent('scroll', {
      ...data,
      scrollDepth,
      scrollY: window.scrollY,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * تتبع النقرات
   */
  public trackClick(element: HTMLElement, data: any = {}): void {
    this.trackEvent('click', {
      ...data,
      elementType: element.tagName.toLowerCase(),
      elementId: element.id,
      elementClass: element.className,
      elementText: element.textContent?.substring(0, 100),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * تتبع وقت القراءة
   */
  public trackReadingTime(articleId: string, seconds: number): void {
    this.trackEvent('reading_time', {
      articleId,
      seconds: Math.round(seconds),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * تتبع البحث
   */
  public trackSearch(query: string, results: number = 0): void {
    this.trackEvent('search', {
      query: query.substring(0, 100), // حد أقصى 100 حرف
      resultsCount: results,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * تتبع التفاعل مع المقال
   */
  public trackArticleInteraction(articleId: string, interaction: string, data: any = {}): void {
    this.trackEvent('article_interaction', {
      articleId,
      interaction, // like, share, comment, bookmark
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * تتبع مغادرة الصفحة
   */
  public trackPageExit(data: any = {}): void {
    this.trackEvent('page_exit', {
      ...data,
      url: window.location.href,
      timeOnPage: this.getTimeOnPage(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * إرسال الأحداث المتراكمة
   */
  public flushEvents(): void {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    this.sendEvents(events);
  }

  /**
   * إرسال الأحداث إلى الخادم
   */
  private async sendEvents(events: EventData[]): Promise<void> {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DNT': this.shouldRespectDNT() ? '1' : '0'
        },
        body: JSON.stringify({
          events,
          session: this.sessionData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.log('Events sent successfully:', events.length);
    } catch (error) {
      this.log('Error sending events:', error);
      // إعادة الأحداث للقائمة للمحاولة مرة أخرى
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * جدولة إرسال دفعي
   */
  private scheduleBatchSend(): void {
    if (this.batchTimer) {
      return;
    }

    this.batchTimer = setTimeout(() => {
      this.flushEvents();
      this.batchTimer = null;
    }, this.config.batchTimeout);
  }

  /**
   * فحص حد المعدل
   */
  private checkRateLimit(eventType: string): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // إعادة تعيين العدادات كل دقيقة
    if (now - this.lastReset > oneMinute) {
      this.eventCounts.clear();
      this.lastReset = now;
    }

    const currentCount = this.eventCounts.get(eventType) || 0;
    if (currentCount >= this.config.rateLimitPerMinute) {
      return false;
    }

    this.eventCounts.set(eventType, currentCount + 1);
    return true;
  }

  /**
   * تنظيف بيانات الحدث
   */
  private sanitizeEventData(data: any): any {
    const sanitized = { ...data };
    
    // إزالة البيانات الحساسة
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.email;
    delete sanitized.phone;

    // تحديد حجم البيانات
    const jsonString = JSON.stringify(sanitized);
    if (jsonString.length > 1000) {
      return { ...sanitized, _truncated: true };
    }

    return sanitized;
  }

  /**
   * إعداد مستمعي الأحداث التلقائية
   */
  private setupEventListeners(): void {
    // تتبع مغادرة الصفحة
    window.addEventListener('beforeunload', () => {
      this.trackPageExit();
      this.flushEvents();
    });

    // تتبع التمرير (مع تقييد المعدل)
    let scrollTimer: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        this.trackScroll();
      }, 1000);
    });

    // تتبع النقرات العامة
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON') {
        this.trackClick(target);
      }
    });

    // تتبع تغيير الصفحة (SPA)
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.trackPageView();
      }
    }, 1000);
  }

  /**
   * فحص DNT
   */
  private shouldRespectDNT(): boolean {
    return this.config.respectDNT && navigator.doNotTrack === '1';
  }

  /**
   * الحصول على معرف المستخدم
   */
  private getUserId(): string | undefined {
    // يمكن الحصول عليه من localStorage أو cookies أو context
    return localStorage.getItem('sabq_user_id') || undefined;
  }

  /**
   * الحصول على الجلسة المحفوظة
   */
  private getStoredSession(): SessionData | null {
    if (!this.config.enableLocalStorage) {
      return null;
    }

    try {
      const stored = localStorage.getItem('sabq_analytics_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          startTime: new Date(parsed.startTime)
        };
      }
    } catch (error) {
      this.log('Error parsing stored session:', error);
    }

    return null;
  }

  /**
   * فحص صحة الجلسة
   */
  private isSessionValid(session: SessionData): boolean {
    const maxAge = 30 * 60 * 1000; // 30 دقيقة
    return Date.now() - session.startTime.getTime() < maxAge;
  }

  /**
   * توليد معرف جلسة
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * الحصول على معلومات الجهاز
   */
  private getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  /**
   * حساب الوقت المقضي في الصفحة
   */
  private getTimeOnPage(): number {
    if (!this.sessionData) return 0;
    return Math.round((Date.now() - this.sessionData.startTime.getTime()) / 1000);
  }

  /**
   * تسجيل الأحداث (للتطوير)
   */
  private log(...args: any[]): void {
    if (this.config.debugMode) {
      console.log('[Analytics]', ...args);
    }
  }

  /**
   * تحديث معرف المستخدم
   */
  public setUserId(userId: string): void {
    if (this.sessionData) {
      this.sessionData.userId = userId;
      
      if (this.config.enableLocalStorage) {
        localStorage.setItem('sabq_user_id', userId);
        localStorage.setItem('sabq_analytics_session', JSON.stringify({
          ...this.sessionData,
          startTime: this.sessionData.startTime.toISOString()
        }));
      }
    }
  }

  /**
   * مسح بيانات التتبع
   */
  public clearTracking(): void {
    this.eventQueue = [];
    this.sessionData = null;
    
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('sabq_analytics_session');
      localStorage.removeItem('sabq_user_id');
    }
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

// إنشاء مثيل عام
export const analytics = new AnalyticsTracker({
  debugMode: process.env.NODE_ENV === 'development'
});

// دوال مساعدة للاستخدام المباشر
export const trackEvent = (eventType: string, data?: any) => analytics.trackEvent(eventType, data);
export const trackPageView = (data?: any) => analytics.trackPageView(data);
export const trackReadingProgress = (articleId: string, progress: number) => analytics.trackReadingProgress(articleId, progress);
export const trackScroll = (data?: any) => analytics.trackScroll(data);
export const trackClick = (element: HTMLElement, data?: any) => analytics.trackClick(element, data);
export const trackReadingTime = (articleId: string, seconds: number) => analytics.trackReadingTime(articleId, seconds);
export const trackSearch = (query: string, results?: number) => analytics.trackSearch(query, results);
export const trackArticleInteraction = (articleId: string, interaction: string, data?: any) => analytics.trackArticleInteraction(articleId, interaction, data);

export default analytics; 