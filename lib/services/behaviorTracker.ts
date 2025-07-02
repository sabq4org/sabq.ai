interface TrackingConfig {
  userId?: string;
  sessionId?: string;
  apiEndpoint?: string;
  debug?: boolean;
}

interface ImpressionData {
  articleId: string;
  impressionId?: string;
  startTime: number;
  lastActiveTime: number;
  scrollDepth: number;
  activeTime: number;
  isActive: boolean;
}

interface SessionData {
  sessionId: string;
  deviceFingerprint: string;
  startTime: number;
}

class BehaviorTracker {
  private config: TrackingConfig;
  private currentSession: SessionData | null = null;
  private impressions: Map<string, ImpressionData> = new Map();
  private activityTimer: NodeJS.Timeout | null = null;
  private inactivityTimeout = 30000; // 30 ثانية
  private scrollCheckInterval = 1000; // كل ثانية
  private scrollTimer: NodeJS.Timeout | null = null;

  constructor(config: TrackingConfig) {
    this.config = {
      apiEndpoint: '/api',
      debug: false,
      ...config
    };
    
    // بدء جلسة جديدة عند التهيئة
    this.startSession();
    
    // تسجيل مستمعي الأحداث
    this.setupEventListeners();
  }

  // بدء جلسة جديدة
  private async startSession() {
    try {
      const sessionData = {
        userId: this.config.userId,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screenResolution: {
          width: window.screen.width,
          height: window.screen.height
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      };

      const response = await fetch(`${this.config.apiEndpoint}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        const data = await response.json();
        this.currentSession = {
          sessionId: data.sessionId,
          deviceFingerprint: data.deviceFingerprint,
          startTime: Date.now()
        };
        
        if (this.config.sessionId !== data.sessionId) {
          this.config.sessionId = data.sessionId;
        }
        
        this.log('Session started:', this.currentSession);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  // إنهاء الجلسة
  async endSession() {
    if (!this.currentSession) return;

    try {
      // إنهاء جميع الانطباعات المفتوحة
      for (const [articleId, impression] of this.impressions) {
        await this.endImpression(articleId);
      }

      // إنهاء الجلسة
      await fetch(`${this.config.apiEndpoint}/sessions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.currentSession.sessionId
        })
      });

      this.log('Session ended:', this.currentSession);
      this.currentSession = null;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // بدء تتبع انطباع مقال
  async startImpression(articleId: string) {
    if (!this.currentSession) {
      await this.startSession();
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/impressions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.config.userId,
          articleId,
          sessionId: this.currentSession?.sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        this.impressions.set(articleId, {
          articleId,
          impressionId: data.impressionId,
          startTime: Date.now(),
          lastActiveTime: Date.now(),
          scrollDepth: 0,
          activeTime: 0,
          isActive: true
        });

        this.startActivityTracking(articleId);
        this.startScrollTracking(articleId);
        
        this.log('Impression started:', articleId);
      }
    } catch (error) {
      console.error('Failed to start impression:', error);
    }
  }

  // إنهاء تتبع انطباع مقال
  async endImpression(articleId: string) {
    const impression = this.impressions.get(articleId);
    if (!impression) return;

    try {
      // حساب الوقت النشط النهائي
      if (impression.isActive) {
        impression.activeTime += Date.now() - impression.lastActiveTime;
      }

      await fetch(`${this.config.apiEndpoint}/impressions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impressionId: impression.impressionId,
          scrollDepth: impression.scrollDepth,
          activeTime: Math.round(impression.activeTime / 1000), // بالثواني
          readingComplete: impression.scrollDepth > 90,
          end: true
        })
      });

      this.impressions.delete(articleId);
      this.stopActivityTracking();
      this.stopScrollTracking();
      
      this.log('Impression ended:', articleId, impression);
    } catch (error) {
      console.error('Failed to end impression:', error);
    }
  }

  // تحديث انطباع
  private async updateImpression(articleId: string) {
    const impression = this.impressions.get(articleId);
    if (!impression || !impression.impressionId) return;

    try {
      await fetch(`${this.config.apiEndpoint}/impressions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impressionId: impression.impressionId,
          scrollDepth: impression.scrollDepth,
          activeTime: Math.round(impression.activeTime / 1000)
        })
      });
    } catch (error) {
      console.error('Failed to update impression:', error);
    }
  }

  // تتبع النشاط
  private startActivityTracking(articleId: string) {
    // مسح أي مؤقت سابق
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    // بدء مؤقت عدم النشاط
    this.activityTimer = setTimeout(() => {
      this.markInactive(articleId);
    }, this.inactivityTimeout);
  }

  private stopActivityTracking() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  private markActive(articleId: string) {
    const impression = this.impressions.get(articleId);
    if (!impression) return;

    if (!impression.isActive) {
      impression.lastActiveTime = Date.now();
      impression.isActive = true;
    }

    this.startActivityTracking(articleId);
  }

  private markInactive(articleId: string) {
    const impression = this.impressions.get(articleId);
    if (!impression) return;

    if (impression.isActive) {
      impression.activeTime += Date.now() - impression.lastActiveTime;
      impression.isActive = false;
      
      // تحديث الانطباع عند عدم النشاط
      this.updateImpression(articleId);
    }
  }

  // تتبع التمرير
  private startScrollTracking(articleId: string) {
    this.scrollTimer = setInterval(() => {
      this.updateScrollDepth(articleId);
    }, this.scrollCheckInterval);
  }

  private stopScrollTracking() {
    if (this.scrollTimer) {
      clearInterval(this.scrollTimer);
      this.scrollTimer = null;
    }
  }

  private updateScrollDepth(articleId: string) {
    const impression = this.impressions.get(articleId);
    if (!impression) return;

    // حساب نسبة التمرير
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    const scrollPercentage = Math.round(
      ((scrollTop + windowHeight) / documentHeight) * 100
    );

    if (scrollPercentage > impression.scrollDepth) {
      impression.scrollDepth = Math.min(100, scrollPercentage);
    }
  }

  // تسجيل تفاعل
  async trackInteraction(articleId: string, type: 'like' | 'save' | 'share' | 'comment', metadata?: any) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/interactions/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.config.userId,
          articleId,
          interactionType: type,
          metadata: {
            ...metadata,
            sessionId: this.currentSession?.sessionId,
            source: 'web'
          }
        })
      });

      if (response.ok) {
        this.log('Interaction tracked:', type, articleId);
      }
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }

  // تسجيل نقرة على توصية
  async trackRecommendationClick(recommendationId: string, articleId: string) {
    try {
      await fetch(`${this.config.apiEndpoint}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId,
          userId: this.config.userId,
          articleId
        })
      });
    } catch (error) {
      console.error('Failed to track recommendation click:', error);
    }
  }

  // إعداد مستمعي الأحداث
  private setupEventListeners() {
    // تتبع النشاط
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        // العثور على المقال النشط (يمكن تحسين هذا)
        const activeArticle = this.impressions.keys().next().value;
        if (activeArticle) {
          this.markActive(activeArticle);
        }
      });
    });

    // تتبع مغادرة الصفحة
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // تتبع تغيير التبويب
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // وضع علامة على جميع الانطباعات كغير نشطة
        for (const [articleId] of this.impressions) {
          this.markInactive(articleId);
        }
      } else {
        // استئناف التتبع عند العودة
        for (const [articleId] of this.impressions) {
          this.markActive(articleId);
        }
      }
    });
  }

  // دالة مساعدة للتسجيل
  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[BehaviorTracker]', ...args);
    }
  }

  // تحديث معرف المستخدم
  setUserId(userId: string) {
    this.config.userId = userId;
  }

  // الحصول على الجلسة الحالية
  getSession() {
    return this.currentSession;
  }

  // الحصول على الانطباعات النشطة
  getActiveImpressions() {
    return Array.from(this.impressions.values());
  }
}

// تصدير مثيل واحد
let trackerInstance: BehaviorTracker | null = null;

export function initBehaviorTracker(config: TrackingConfig): BehaviorTracker {
  if (!trackerInstance) {
    trackerInstance = new BehaviorTracker(config);
  }
  return trackerInstance;
}

export function getBehaviorTracker(): BehaviorTracker | null {
  return trackerInstance;
}

export { BehaviorTracker }; 