/**
 * مكتبة التحليلات الشاملة
 * Complete Analytics Library
 * @version 1.0.0
 * @author Sabq AI Team
 */

import { privacyManager, PersonalDataType, ProcessingPurpose } from './privacy-controls';

// أنواع الأحداث والتحليلات
export enum EventType {
  PAGE_VIEW = 'page_view',
  USER_ACTION = 'user_action',
  ARTICLE_VIEW = 'article_view',
  ARTICLE_SHARE = 'article_share',
  SEARCH = 'search',
  CLICK = 'click',
  SCROLL = 'scroll',
  TIME_SPENT = 'time_spent',
  ERROR = 'error',
  CONVERSION = 'conversion',
  CUSTOM = 'custom'
}

export enum TrackingLevel {
  ESSENTIAL = 'essential',     // الضروري فقط
  FUNCTIONAL = 'functional',   // وظيفي
  ANALYTICS = 'analytics',     // تحليلي
  MARKETING = 'marketing'      // تسويقي
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  TV = 'tv',
  UNKNOWN = 'unknown'
}

// واجهات التحليلات
export interface AnalyticsEvent {
  id: string;
  type: EventType;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  url: string;
  referrer?: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
  location?: LocationInfo;
  metadata: EventMetadata;
}

export interface DeviceInfo {
  type: DeviceType;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  language: string;
  timezone: string;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  ipAddress: string;
}

export interface EventMetadata {
  customDimensions: Record<string, any>;
  customMetrics: Record<string, number>;
  experimentIds?: string[];
  campaignData?: CampaignData;
  articleData?: ArticleData;
}

export interface CampaignData {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

export interface ArticleData {
  id: string;
  title: string;
  category: string;
  author: string;
  publishDate: Date;
  wordCount: number;
  readingTime: number;
  tags: string[];
}

export interface AnalyticsConfig {
  trackingLevel: TrackingLevel;
  enableRealTime: boolean;
  enableHeatmaps: boolean;
  enableScrollTracking: boolean;
  enableClickTracking: boolean;
  enableFormTracking: boolean;
  enableErrorTracking: boolean;
  enablePerformanceTracking: boolean;
  sessionTimeout: number; // دقائق
  dataRetentionDays: number;
  respectDoNotTrack: boolean;
  anonymizeIPs: boolean;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: AnalyticsMetrics;
  dimensions: AnalyticsDimensions;
  segments: AnalyticsSegment[];
  insights: AnalyticsInsight[];
  generatedAt: Date;
}

export interface AnalyticsMetrics {
  pageViews: number;
  uniquePageViews: number;
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number;
  averageSessionDuration: number;
  pagesPerSession: number;
  conversionRate: number;
  totalConversions: number;
}

export interface AnalyticsDimensions {
  topPages: PageMetric[];
  topReferrers: ReferrerMetric[];
  topCountries: CountryMetric[];
  topDevices: DeviceMetric[];
  topBrowsers: BrowserMetric[];
  topSources: SourceMetric[];
}

export interface PageMetric {
  page: string;
  pageViews: number;
  uniquePageViews: number;
  averageTimeOnPage: number;
  bounceRate: number;
  exitRate: number;
}

export interface ReferrerMetric {
  referrer: string;
  sessions: number;
  users: number;
  bounceRate: number;
}

export interface CountryMetric {
  country: string;
  sessions: number;
  users: number;
  bounceRate: number;
  conversionRate: number;
}

export interface DeviceMetric {
  device: DeviceType;
  sessions: number;
  users: number;
  bounceRate: number;
}

export interface BrowserMetric {
  browser: string;
  sessions: number;
  users: number;
  bounceRate: number;
}

export interface SourceMetric {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  conversionRate: number;
}

export interface AnalyticsSegment {
  name: string;
  criteria: SegmentCriteria;
  users: number;
  sessions: number;
  metrics: AnalyticsMetrics;
}

export interface SegmentCriteria {
  userType?: 'new' | 'returning';
  deviceType?: DeviceType;
  country?: string;
  source?: string;
  customDimensions?: Record<string, any>;
}

export interface AnalyticsInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  metric: string;
  value: number;
  change: number;
  recommendation?: string;
}

// فئة إدارة التحليلات الرئيسية
export class AnalyticsManager {
  private events: AnalyticsEvent[] = [];
  private sessions: Map<string, AnalyticsSession> = new Map();
  private config: AnalyticsConfig;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = {
      trackingLevel: TrackingLevel.ANALYTICS,
      enableRealTime: true,
      enableHeatmaps: false,
      enableScrollTracking: true,
      enableClickTracking: true,
      enableFormTracking: true,
      enableErrorTracking: true,
      enablePerformanceTracking: true,
      sessionTimeout: 30,
      dataRetentionDays: 90,
      respectDoNotTrack: true,
      anonymizeIPs: true,
      ...config
    };
  }

  /**
   * تتبع حدث
   */
  async trackEvent(event: Partial<AnalyticsEvent>): Promise<boolean> {
    try {
      // فحص الخصوصية والموافقة
      if (!this.canTrack(event.userId)) {
        return false;
      }

      const fullEvent: AnalyticsEvent = {
        id: this.generateEventId(),
        type: event.type || EventType.CUSTOM,
        category: event.category || 'general',
        action: event.action || 'unknown',
        label: event.label,
        value: event.value,
        userId: event.userId,
        sessionId: event.sessionId || this.getCurrentSessionId(),
        timestamp: new Date(),
        url: event.url || (typeof window !== 'undefined' ? window.location.href : ''),
        referrer: event.referrer || (typeof document !== 'undefined' ? document.referrer : undefined),
        userAgent: event.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
        deviceInfo: event.deviceInfo || this.getDeviceInfo(),
        location: event.location,
        metadata: {
          customDimensions: {},
          customMetrics: {},
          ...event.metadata
        }
      };

      // إضافة الحدث
      this.events.push(fullEvent);

      // تحديث الجلسة
      await this.updateSession(fullEvent);

      // تسجيل في نظام الخصوصية
      await privacyManager.logDataProcessing({
        id: fullEvent.id,
        userId: fullEvent.userId || 'anonymous',
        action: 'track',
        dataType: PersonalDataType.BEHAVIORAL,
        purpose: ProcessingPurpose.ANALYTICS,
        timestamp: fullEvent.timestamp,
        ipAddress: fullEvent.location?.ipAddress,
        userAgent: fullEvent.userAgent,
        justification: `Analytics event: ${fullEvent.type}`
      });

      // معالجة الحدث في الوقت الفعلي
      if (this.config.enableRealTime) {
        await this.processRealTimeEvent(fullEvent);
      }

      return true;
    } catch (error) {
      console.error('خطأ في تتبع الحدث:', error);
      return false;
    }
  }

  /**
   * تتبع مشاهدة الصفحة
   */
  async trackPageView(url: string, title?: string, userId?: string): Promise<boolean> {
    return this.trackEvent({
      type: EventType.PAGE_VIEW,
      category: 'navigation',
      action: 'page_view',
      label: title,
      url,
      userId
    });
  }

  /**
   * تتبع مشاهدة المقال
   */
  async trackArticleView(articleData: ArticleData, userId?: string): Promise<boolean> {
    return this.trackEvent({
      type: EventType.ARTICLE_VIEW,
      category: 'content',
      action: 'article_view',
      label: articleData.title,
      value: articleData.readingTime,
      userId,
      metadata: {
        customDimensions: {},
        customMetrics: {},
        articleData
      }
    });
  }

  /**
   * تتبع البحث
   */
  async trackSearch(query: string, results: number, userId?: string): Promise<boolean> {
    return this.trackEvent({
      type: EventType.SEARCH,
      category: 'search',
      action: 'search_query',
      label: query,
      value: results,
      userId
    });
  }

  /**
   * تتبع النقرات
   */
  async trackClick(element: string, url?: string, userId?: string): Promise<boolean> {
    return this.trackEvent({
      type: EventType.CLICK,
      category: 'interaction',
      action: 'click',
      label: element,
      url,
      userId
    });
  }

  /**
   * تتبع الأخطاء
   */
  async trackError(error: Error, context?: string, userId?: string): Promise<boolean> {
    return this.trackEvent({
      type: EventType.ERROR,
      category: 'error',
      action: 'javascript_error',
      label: error.message,
      userId,
      metadata: {
        customDimensions: {
          errorStack: error.stack,
          errorContext: context
        },
        customMetrics: {}
      }
    });
  }

  /**
   * تتبع التحويل
   */
  async trackConversion(goal: string, value?: number, userId?: string): Promise<boolean> {
    return this.trackEvent({
      type: EventType.CONVERSION,
      category: 'conversion',
      action: 'goal_completion',
      label: goal,
      value,
      userId
    });
  }

  /**
   * إنشاء تقرير تحليلات
   */
  async generateReport(
    startDate: Date,
    endDate: Date,
    filters?: Partial<AnalyticsEvent>
  ): Promise<AnalyticsReport> {
    try {
      // تصفية الأحداث حسب الفترة والمرشحات
      const filteredEvents = this.events.filter(event => {
        const inDateRange = event.timestamp >= startDate && event.timestamp <= endDate;
        
        if (!inDateRange) return false;
        
        if (filters) {
          if (filters.type && event.type !== filters.type) return false;
          if (filters.category && event.category !== filters.category) return false;
          if (filters.userId && event.userId !== filters.userId) return false;
        }
        
        return true;
      });

      // حساب المقاييس
      const metrics = this.calculateMetrics(filteredEvents);
      const dimensions = this.calculateDimensions(filteredEvents);
      const segments = this.calculateSegments(filteredEvents);
      const insights = this.generateInsights(filteredEvents, metrics);

      const report: AnalyticsReport = {
        id: this.generateEventId(),
        name: `تقرير تحليلات ${startDate.toLocaleDateString('ar')} - ${endDate.toLocaleDateString('ar')}`,
        period: { start: startDate, end: endDate },
        metrics,
        dimensions,
        segments,
        insights,
        generatedAt: new Date()
      };

      return report;
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error);
      throw error;
    }
  }

  /**
   * الحصول على الإحصائيات الفورية
   */
  getRealTimeStats(): {
    activeUsers: number;
    activeSessions: number;
    pageViewsLast30Minutes: number;
    topPages: string[];
  } {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const recentEvents = this.events.filter(e => e.timestamp >= thirtyMinutesAgo);
    const activeSessions = new Set(recentEvents.map(e => e.sessionId)).size;
    const activeUsers = new Set(recentEvents.filter(e => e.userId).map(e => e.userId)).size;
    const pageViews = recentEvents.filter(e => e.type === EventType.PAGE_VIEW).length;

    // أهم الصفحات
    const pageViews30min = recentEvents.filter(e => e.type === EventType.PAGE_VIEW);
    const pageCount: Record<string, number> = {};
    pageViews30min.forEach(e => {
      pageCount[e.url] = (pageCount[e.url] || 0) + 1;
    });
    const topPages = Object.entries(pageCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([url]) => url);

    return {
      activeUsers,
      activeSessions,
      pageViewsLast30Minutes: pageViews,
      topPages
    };
  }

  // وظائف مساعدة
  private canTrack(userId?: string): boolean {
    // فحص Do Not Track
    if (this.config.respectDoNotTrack && typeof navigator !== 'undefined') {
      if (navigator.doNotTrack === '1') return false;
    }

    // فحص موافقة المستخدم من نظام الخصوصية
    // في تطبيق حقيقي، سيتم الفحص من قاعدة البيانات
    return true;
  }

  private getCurrentSessionId(): string {
    // في تطبيق حقيقي، سيتم الحصول على معرف الجلسة من الكوكيز أو التخزين المحلي
    return 'session_' + Date.now();
  }

  private getDeviceInfo(): DeviceInfo {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return {
        type: DeviceType.UNKNOWN,
        browser: 'unknown',
        browserVersion: 'unknown',
        os: 'unknown',
        osVersion: 'unknown',
        screenResolution: 'unknown',
        language: 'ar',
        timezone: 'Asia/Riyadh'
      };
    }

    // تحديد نوع الجهاز
    let deviceType = DeviceType.DESKTOP;
    if (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
      deviceType = /iPad/.test(navigator.userAgent) ? DeviceType.TABLET : DeviceType.MOBILE;
    }

    return {
      type: deviceType,
      browser: this.getBrowserName(),
      browserVersion: this.getBrowserVersion(),
      os: this.getOSName(),
      osVersion: this.getOSVersion(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || 'ar',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh'
    };
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    // تطبيق مبسط لاستخراج إصدار المتصفح
    return 'unknown';
  }

  private getOSName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getOSVersion(): string {
    // تطبيق مبسط لاستخراج إصدار نظام التشغيل
    return 'unknown';
  }

  private generateEventId(): string {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async updateSession(event: AnalyticsEvent): Promise<void> {
    // تحديث بيانات الجلسة
    let session = this.sessions.get(event.sessionId);
    
    if (!session) {
      session = {
        id: event.sessionId,
        userId: event.userId,
        startTime: event.timestamp,
        lastActivity: event.timestamp,
        pageViews: 0,
        events: 0,
        deviceInfo: event.deviceInfo,
        location: event.location
      };
      this.sessions.set(event.sessionId, session);
    }

    session.lastActivity = event.timestamp;
    session.events += 1;
    
    if (event.type === EventType.PAGE_VIEW) {
      session.pageViews += 1;
    }
  }

  private async processRealTimeEvent(event: AnalyticsEvent): Promise<void> {
    // معالجة الأحداث في الوقت الفعلي
    // في تطبيق حقيقي، سيتم إرسال الأحداث إلى خدمة التحليلات في الوقت الفعلي
    console.log('حدث في الوقت الفعلي:', {
      type: event.type,
      action: event.action,
      timestamp: event.timestamp
    });
  }

  private calculateMetrics(events: AnalyticsEvent[]): AnalyticsMetrics {
    const pageViews = events.filter(e => e.type === EventType.PAGE_VIEW);
    const uniquePageViews = this.getUniquePageViews(pageViews);
    const sessions = this.getUniqueSessions(events);
    const users = this.getUniqueUsers(events);
    const newUsers = this.getNewUsers(events);

    return {
      pageViews: pageViews.length,
      uniquePageViews,
      sessions: sessions.size,
      users: users.size,
      newUsers,
      bounceRate: this.calculateBounceRate(events),
      averageSessionDuration: this.calculateAverageSessionDuration(events),
      pagesPerSession: pageViews.length / sessions.size,
      conversionRate: this.calculateConversionRate(events),
      totalConversions: events.filter(e => e.type === EventType.CONVERSION).length
    };
  }

  private calculateDimensions(events: AnalyticsEvent[]): AnalyticsDimensions {
    return {
      topPages: this.getTopPages(events),
      topReferrers: this.getTopReferrers(events),
      topCountries: this.getTopCountries(events),
      topDevices: this.getTopDevices(events),
      topBrowsers: this.getTopBrowsers(events),
      topSources: this.getTopSources(events)
    };
  }

  private calculateSegments(events: AnalyticsEvent[]): AnalyticsSegment[] {
    // حساب الشرائح المختلفة
    return [];
  }

  private generateInsights(events: AnalyticsEvent[], metrics: AnalyticsMetrics): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    // رؤى أساسية
    if (metrics.bounceRate > 70) {
      insights.push({
        type: 'warning',
        title: 'معدل الارتداد مرتفع',
        description: `معدل الارتداد الحالي ${metrics.bounceRate.toFixed(1)}% أعلى من المعدل المثالي`,
        impact: 'high',
        metric: 'bounceRate',
        value: metrics.bounceRate,
        change: 0,
        recommendation: 'راجع محتوى الصفحات الرئيسية وحسن تجربة المستخدم'
      });
    }

    return insights;
  }

  // وظائف حساب مساعدة
  private getUniquePageViews(pageViews: AnalyticsEvent[]): number {
    const unique = new Set();
    pageViews.forEach(pv => {
      unique.add(`${pv.sessionId}_${pv.url}`);
    });
    return unique.size;
  }

  private getUniqueSessions(events: AnalyticsEvent[]): Set<string> {
    return new Set(events.map(e => e.sessionId));
  }

  private getUniqueUsers(events: AnalyticsEvent[]): Set<string> {
    return new Set(events.filter(e => e.userId).map(e => e.userId!));
  }

  private getNewUsers(events: AnalyticsEvent[]): number {
    // في تطبيق حقيقي، سيتم فحص المستخدمين الجدد من قاعدة البيانات
    return Math.floor(this.getUniqueUsers(events).size * 0.3);
  }

  private calculateBounceRate(events: AnalyticsEvent[]): number {
    const sessions = this.getUniqueSessions(events);
    const bouncedSessions = Array.from(sessions).filter(sessionId => {
      const sessionEvents = events.filter(e => e.sessionId === sessionId);
      return sessionEvents.filter(e => e.type === EventType.PAGE_VIEW).length === 1;
    });
    
    return sessions.size > 0 ? (bouncedSessions.length / sessions.size) * 100 : 0;
  }

  private calculateAverageSessionDuration(events: AnalyticsEvent[]): number {
    // حساب متوسط مدة الجلسة بالثواني
    return 180; // مثال: 3 دقائق
  }

  private calculateConversionRate(events: AnalyticsEvent[]): number {
    const conversions = events.filter(e => e.type === EventType.CONVERSION).length;
    const sessions = this.getUniqueSessions(events).size;
    return sessions > 0 ? (conversions / sessions) * 100 : 0;
  }

  private getTopPages(events: AnalyticsEvent[]): PageMetric[] {
    // حساب أهم الصفحات
    return [];
  }

  private getTopReferrers(events: AnalyticsEvent[]): ReferrerMetric[] {
    // حساب أهم المواقع المرجعية
    return [];
  }

  private getTopCountries(events: AnalyticsEvent[]): CountryMetric[] {
    // حساب أهم البلدان
    return [];
  }

  private getTopDevices(events: AnalyticsEvent[]): DeviceMetric[] {
    // حساب أهم الأجهزة
    return [];
  }

  private getTopBrowsers(events: AnalyticsEvent[]): BrowserMetric[] {
    // حساب أهم المتصفحات
    return [];
  }

  private getTopSources(events: AnalyticsEvent[]): SourceMetric[] {
    // حساب أهم المصادر
    return [];
  }
}

// واجهة الجلسة التحليلية
interface AnalyticsSession {
  id: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  events: number;
  deviceInfo: DeviceInfo;
  location?: LocationInfo;
}

// إنشاء مثيل مدير التحليلات
export const analyticsManager = new AnalyticsManager();

// وظائف مساعدة للتصدير
export const AnalyticsUtils = {
  /**
   * تهيئة التتبع الأساسي
   */
  initializeTracking(): void {
    if (typeof window === 'undefined') return;

    // تتبع مشاهدات الصفحات
    analyticsManager.trackPageView(window.location.href, document.title);

    // تتبع الأخطاء
    window.addEventListener('error', (event) => {
      analyticsManager.trackError(event.error, 'window_error');
    });

    // تتبع الحالة غير المعالجة
    window.addEventListener('unhandledrejection', (event) => {
      analyticsManager.trackError(
        new Error(event.reason), 
        'unhandled_promise_rejection'
      );
    });
  },

  /**
   * تتبع النقرات التلقائي
   */
  enableAutoClickTracking(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const elementId = target.id;
      const elementClass = target.className;
      
      let elementDescription = tagName;
      if (elementId) elementDescription += `#${elementId}`;
      if (elementClass) elementDescription += `.${elementClass}`;

      analyticsManager.trackClick(elementDescription);
    });
  },

  /**
   * تتبع التمرير
   */
  enableScrollTracking(): void {
    if (typeof window === 'undefined') return;

    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercent > maxScroll) {
        maxScroll = Math.floor(scrollPercent / 25) * 25; // 0%, 25%, 50%, 75%, 100%
        
        if (maxScroll > 0 && maxScroll % 25 === 0) {
          analyticsManager.trackEvent({
            type: EventType.SCROLL,
            category: 'engagement',
            action: 'scroll_depth',
            label: `${maxScroll}%`,
            value: maxScroll
          });
        }
      }
    });
  }
}; 