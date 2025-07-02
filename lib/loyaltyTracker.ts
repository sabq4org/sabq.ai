// ===========================================
// مكتبة تتبع نقاط الولاء التلقائية
// Loyalty Points Automatic Tracker
// ===========================================

interface LoyaltyTrackerConfig {
  userId: number;
  apiUrl?: string;
  debug?: boolean;
  sessionId?: string;
}

interface ArticleInteraction {
  articleId: number;
  startTime: number;
  scrollDepth: number;
  readingProgress: number;
  hasEngaged: boolean;
  shareCount: number;
  lastSharePlatform?: string;
  lastShareTime?: number;
}

class LoyaltyTracker {
  private config: LoyaltyTrackerConfig;
  private articles: Map<number, ArticleInteraction> = new Map();
  private sessionId: string;
  private apiUrl: string;
  private readingTimer: NodeJS.Timeout | null = null;
  private scrollTimer: NodeJS.Timeout | null = null;

  constructor(config: LoyaltyTrackerConfig) {
    this.config = config;
    this.sessionId = config.sessionId || this.generateSessionId();
    this.apiUrl = config.apiUrl || '/api/interactions';
    
    if (config.debug) {
      console.log('🎯 مُتتبع الولاء مُفعل:', config);
    }
    
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private log(message: string, data?: any) {
    if (this.config.debug) {
      console.log(`🎯 ${message}`, data);
    }
  }

  private async sendInteraction(
    articleId: number, 
    interactionType: string, 
    metadata: any = {}
  ): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.config.userId,
          articleId,
          interactionType,
          metadata: {
            ...metadata,
            sessionId: this.sessionId,
            timestamp: Date.now(),
            url: typeof window !== 'undefined' ? window.location.href : '',
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            device: this.getDeviceInfo()
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.log(`تفاعل ${interactionType} تم تسجيله:`, result);
        
        // عرض إشعار للمستخدم إذا حصل على نقاط
        if (result.loyalty_points?.success) {
          this.showPointsNotification(result.loyalty_points);
        }
      }
    } catch (error) {
      console.error('خطأ في إرسال التفاعل:', error);
    }
  }

  private getDeviceInfo(): string {
    if (typeof window === 'undefined') return 'server';
    const width = window.screen.width;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  private showPointsNotification(loyaltyData: any) {
    if (typeof document === 'undefined') return;
    
    // إنشاء إشعار بسيط للنقاط
    const notification = document.createElement('div');
    notification.className = 'loyalty-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        animation: slideDown 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 8px;
        direction: rtl;
      ">
        <span style="font-size: 18px;">🎉</span>
        <span>+${loyaltyData.points_awarded} نقطة!</span>
        <span style="font-size: 12px; opacity: 0.8;">المجموع: ${loyaltyData.total_points}</span>
      </div>
    `;
    
    // إضافة CSS animation
    if (!document.getElementById('loyalty-styles')) {
      const style = document.createElement('style');
      style.id = 'loyalty-styles';
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(0); opacity: 1; }
          to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 4 ثوان
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  private initializeTracking() {
    if (typeof window === 'undefined') return;
    
    // تتبع التمرير
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.updateScrollDepth();
      }, 100);
    });

    // تتبع الوقت على الصفحة
    this.startPageTimer();

    // تتبع مغادرة الصفحة
    window.addEventListener('beforeunload', () => {
      this.handlePageLeave();
    });

    // تتبع الرؤية (Page Visibility API)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseTracking();
      } else {
        this.resumeTracking();
      }
    });
  }

  private updateScrollDepth() {
    if (typeof window === 'undefined') return;
    
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    // تحديث جميع المقالات المُتتبعة
    this.articles.forEach((article, articleId) => {
      if (scrollPercent > article.scrollDepth) {
        article.scrollDepth = scrollPercent;
        article.readingProgress = Math.min(scrollPercent, 100);
      }
    });
  }

  private startPageTimer() {
    this.readingTimer = setInterval(() => {
      this.checkReadingProgress();
    }, 1000); // فحص كل ثانية
  }

  private checkReadingProgress() {
    const currentTime = Date.now();
    
    this.articles.forEach(async (article, articleId) => {
      const duration = Math.floor((currentTime - article.startTime) / 1000);
      
      // تحقق من استيفاء شرط القراءة (30 ثانية)
      if (duration >= 30 && !article.hasEngaged) {
        article.hasEngaged = true;
        await this.sendInteraction(articleId, 'read', {
          duration,
          scrollDepth: article.scrollDepth,
          readingProgress: article.readingProgress
        });
        this.log(`قراءة مقال ${articleId} لمدة ${duration} ثانية`);
      }
      
      // تحقق من القراءة الطويلة (60 ثانية)
      if (duration >= 60 && duration < 65) { // نطاق صغير لتجنب التكرار
        await this.sendInteraction(articleId, 'read', {
          duration,
          scrollDepth: article.scrollDepth,
          readingProgress: article.readingProgress,
          longReading: true
        });
        this.log(`قراءة طويلة للمقال ${articleId}: ${duration} ثانية`);
      }
    });
  }

  private pauseTracking() {
    if (this.readingTimer) {
      clearInterval(this.readingTimer);
      this.readingTimer = null;
    }
  }

  private resumeTracking() {
    if (!this.readingTimer) {
      this.startPageTimer();
    }
  }

  private handlePageLeave() {
    if (typeof navigator === 'undefined') return;
    
    // إرسال آخر تحديث للقراءة
    this.articles.forEach(async (article, articleId) => {
      const duration = Math.floor((Date.now() - article.startTime) / 1000);
      if (duration >= 5) { // حد أدنى 5 ثوان
        navigator.sendBeacon?.(this.apiUrl, JSON.stringify({
          userId: this.config.userId,
          articleId,
          interactionType: 'read',
          metadata: {
            duration,
            scrollDepth: article.scrollDepth,
            readingProgress: article.readingProgress,
            sessionId: this.sessionId,
            pageLeave: true
          }
        }));
      }
    });
  }

  // =================== الطرق العامة ===================

  // بدء تتبع مقال
  public trackArticle(articleId: number) {
    if (!this.articles.has(articleId)) {
      this.articles.set(articleId, {
        articleId,
        startTime: Date.now(),
        scrollDepth: 0,
        readingProgress: 0,
        hasEngaged: false,
        shareCount: 0
      });
      this.log(`بدء تتبع المقال ${articleId}`);
    }
  }

  // تسجيل إعجاب
  public async trackLike(articleId: number) {
    await this.sendInteraction(articleId, 'like', {
      timestamp: Date.now()
    });
    this.log(`إعجاب بالمقال ${articleId}`);
  }

  // تسجيل مشاركة
  public async trackShare(articleId: number, platform: string) {
    const article = this.articles.get(articleId);
    const now = Date.now();
    
    // منع المشاركة المتكررة خلال 24 ساعة
    if (article?.lastShareTime && (now - article.lastShareTime) < 24 * 60 * 60 * 1000) {
      this.log(`مشاركة متكررة للمقال ${articleId} - تم تجاهلها`);
      return;
    }
    
    if (article) {
      article.shareCount++;
      article.lastSharePlatform = platform;
      article.lastShareTime = now;
    }
    
    await this.sendInteraction(articleId, 'share', {
      platform,
      shareCount: article?.shareCount || 1,
      timestamp: now
    });
    this.log(`مشاركة المقال ${articleId} على ${platform}`);
  }

  // تسجيل تعليق
  public async trackComment(articleId: number, commentText?: string) {
    await this.sendInteraction(articleId, 'comment', {
      hasText: !!commentText,
      textLength: commentText?.length || 0,
      timestamp: Date.now()
    });
    this.log(`تعليق على المقال ${articleId}`);
  }

  // تسجيل فتح إشعار
  public async trackNotificationOpen(articleId: number, notificationId?: string) {
    await this.sendInteraction(articleId, 'notification_open', {
      notificationId,
      source: 'push_notification',
      timestamp: Date.now()
    });
    this.log(`فتح إشعار للمقال ${articleId}`);
  }

  // الحصول على إحصائيات المستخدم
  public async getUserStats(): Promise<any> {
    try {
      const response = await fetch(`/api/loyalty/register?userId=${this.config.userId}`);
      if (response.ok) {
        const result = await response.json();
        this.log('إحصائيات المستخدم:', result);
        return result;
      }
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
    }
    return null;
  }

  // عرض شارة النقاط
  public async showLoyaltyBadge(containerId: string) {
    if (typeof document === 'undefined') return;
    
    const stats = await this.getUserStats();
    if (!stats) return;
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const levelColors = {
      Bronze: '#CD7F32',
      Silver: '#C0C0C0', 
      Gold: '#FFD700',
      Platinum: '#E5E4E2'
    };
    
    container.innerHTML = `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: ${levelColors[stats.current_level as keyof typeof levelColors]};
        color: ${stats.current_level === 'Silver' || stats.current_level === 'Platinum' ? '#000' : '#fff'};
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        direction: rtl;
      ">
        <span>🏆</span>
        <span>${stats.current_level}</span>
        <span style="opacity: 0.8;">${stats.total_points} نقطة</span>
      </div>
    `;
  }

  // تنظيف الموارد
  public destroy() {
    if (this.readingTimer) {
      clearInterval(this.readingTimer);
    }
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    this.articles.clear();
    this.log('تم تنظيف مُتتبع الولاء');
  }
}

// =================== التصدير والاستخدام السهل ===================

// إنشاء instance عالمي
let globalTracker: LoyaltyTracker | null = null;

export const initializeLoyaltyTracker = (config: LoyaltyTrackerConfig): LoyaltyTracker => {
  if (globalTracker) {
    globalTracker.destroy();
  }
  globalTracker = new LoyaltyTracker(config);
  return globalTracker;
};

export const getLoyaltyTracker = (): LoyaltyTracker | null => {
  return globalTracker;
};

// دالات مساعدة للاستخدام السريع
export const trackArticleRead = (articleId: number) => {
  globalTracker?.trackArticle(articleId);
};

export const trackArticleLike = (articleId: number) => {
  globalTracker?.trackLike(articleId);
};

export const trackArticleShare = (articleId: number, platform: string) => {
  globalTracker?.trackShare(articleId, platform);
};

export const trackArticleComment = (articleId: number, commentText?: string) => {
  globalTracker?.trackComment(articleId, commentText);
};

export const trackNotificationOpen = (articleId: number, notificationId?: string) => {
  globalTracker?.trackNotificationOpen(articleId, notificationId);
};

export default LoyaltyTracker; 