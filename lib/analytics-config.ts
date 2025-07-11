/**
 * تكوين التحليلات المتقدمة
 * Advanced Analytics Configuration
 */

export interface AnalyticsConfig {
  // إعدادات أعمار الجلسة
  sessionDuration: {
    defaultPeriodDays: number;
    maxSessionsToAnalyze: number;
    buckets: Array<{
      max: number;
      label: string;
      color: string;
    }>;
    cacheTimeout: number; // بالميلي ثانية
  };

  // إعدادات مسارات المستخدم
  userJourneys: {
    defaultPeriodDays: number;
    maxSessionsToAnalyze: number;
    minSteps: number;
    maxSteps: number;
    maxPathsToShow: number;
    cacheTimeout: number;
  };

  // إعدادات الاتجاهات
  trends: {
    defaultPeriodDays: number;
    maxDataPoints: number;
    updateInterval: number; // بالميلي ثانية
    metrics: Array<{
      key: string;
      label: string;
      color: string;
      formatter: (value: number) => string;
    }>;
  };

  // إعدادات الأداء
  performance: {
    enableCaching: boolean;
    cacheSize: number;
    batchSize: number;
    queryTimeout: number;
    maxConcurrentQueries: number;
  };

  // إعدادات التصدير
  export: {
    maxRecords: number;
    formats: string[];
    compressionLevel: number;
  };
}

export const defaultAnalyticsConfig: AnalyticsConfig = {
  sessionDuration: {
    defaultPeriodDays: 30,
    maxSessionsToAnalyze: 10000,
    buckets: [
      { max: 30, label: 'أقل من 30 ثانية', color: '#ef4444' },
      { max: 60, label: '30 ثانية - دقيقة', color: '#f97316' },
      { max: 180, label: '1 - 3 دقائق', color: '#eab308' },
      { max: 600, label: '3 - 10 دقائق', color: '#22c55e' },
      { max: 1800, label: '10 - 30 دقيقة', color: '#3b82f6' },
      { max: 3600, label: '30 - 60 دقيقة', color: '#8b5cf6' },
      { max: Infinity, label: 'أكثر من ساعة', color: '#ec4899' }
    ],
    cacheTimeout: 15 * 60 * 1000 // 15 دقيقة
  },

  userJourneys: {
    defaultPeriodDays: 30,
    maxSessionsToAnalyze: 5000,
    minSteps: 2,
    maxSteps: 10,
    maxPathsToShow: 15,
    cacheTimeout: 10 * 60 * 1000 // 10 دقائق
  },

  trends: {
    defaultPeriodDays: 30,
    maxDataPoints: 90,
    updateInterval: 5 * 60 * 1000, // 5 دقائق
    metrics: [
      {
        key: 'sessions',
        label: 'الجلسات',
        color: '#3b82f6',
        formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString()
      },
      {
        key: 'duration',
        label: 'متوسط المدة',
        color: '#10b981',
        formatter: (value: number) => `${Math.round(value / 60)} دقيقة`
      },
      {
        key: 'pageViews',
        label: 'مشاهدات الصفحات',
        color: '#f59e0b',
        formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString()
      },
      {
        key: 'bounceRate',
        label: 'معدل الارتداد',
        color: '#ef4444',
        formatter: (value: number) => `${value}%`
      },
      {
        key: 'users',
        label: 'المستخدمون الفريدون',
        color: '#8b5cf6',
        formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString()
      }
    ]
  },

  performance: {
    enableCaching: true,
    cacheSize: 100, // عدد الاستعلامات المحفوظة
    batchSize: 1000, // عدد السجلات لكل دفعة
    queryTimeout: 30000, // 30 ثانية
    maxConcurrentQueries: 5
  },

  export: {
    maxRecords: 50000,
    formats: ['csv', 'json', 'pdf'],
    compressionLevel: 6
  }
};

/**
 * مدير التكوين
 */
export class AnalyticsConfigManager {
  private config: AnalyticsConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: AnalyticsConfig = defaultAnalyticsConfig) {
    this.config = config;
  }

  /**
   * الحصول على التكوين الكامل
   */
  getConfig(): AnalyticsConfig {
    return this.config;
  }

  /**
   * تحديث التكوين
   */
  updateConfig(updates: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...updates };
    this.clearCache(); // مسح الذاكرة المؤقتة عند تغيير التكوين
  }

  /**
   * الحصول على إعدادات أعمار الجلسة
   */
  getSessionDurationConfig() {
    return this.config.sessionDuration;
  }

  /**
   * الحصول على إعدادات مسارات المستخدم
   */
  getUserJourneysConfig() {
    return this.config.userJourneys;
  }

  /**
   * الحصول على إعدادات الاتجاهات
   */
  getTrendsConfig() {
    return this.config.trends;
  }

  /**
   * الحصول على إعدادات الأداء
   */
  getPerformanceConfig() {
    return this.config.performance;
  }

  /**
   * التحقق من وجود البيانات في الذاكرة المؤقتة
   */
  getCachedData(key: string): any | null {
    if (!this.config.performance.enableCaching) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - cached.timestamp > this.getCacheTimeout(key);
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * حفظ البيانات في الذاكرة المؤقتة
   */
  setCachedData(key: string, data: any): void {
    if (!this.config.performance.enableCaching) {
      return;
    }

    // إدارة حجم الذاكرة المؤقتة
    if (this.cache.size >= this.config.performance.cacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * مسح الذاكرة المؤقتة
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * الحصول على مهلة الذاكرة المؤقتة حسب نوع البيانات
   */
  private getCacheTimeout(key: string): number {
    if (key.includes('session-duration')) {
      return this.config.sessionDuration.cacheTimeout;
    }
    if (key.includes('user-journeys')) {
      return this.config.userJourneys.cacheTimeout;
    }
    if (key.includes('trends')) {
      return this.config.trends.updateInterval;
    }
    return 5 * 60 * 1000; // 5 دقائق افتراضي
  }

  /**
   * تحسين الاستعلام حسب التكوين
   */
  optimizeQuery(queryType: string, params: any): any {
    const performanceConfig = this.config.performance;
    
    return {
      ...params,
      limit: Math.min(params.limit || 1000, this.getMaxLimit(queryType)),
      timeout: performanceConfig.queryTimeout,
      batchSize: performanceConfig.batchSize
    };
  }

  /**
   * الحصول على الحد الأقصى للسجلات حسب نوع الاستعلام
   */
  private getMaxLimit(queryType: string): number {
    switch (queryType) {
      case 'session-duration':
        return this.config.sessionDuration.maxSessionsToAnalyze;
      case 'user-journeys':
        return this.config.userJourneys.maxSessionsToAnalyze;
      case 'trends':
        return this.config.trends.maxDataPoints;
      default:
        return 1000;
    }
  }

  /**
   * التحقق من صحة المعاملات
   */
  validateParams(queryType: string, params: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // التحقق من الفترة الزمنية
    if (params.days && params.days > 365) {
      errors.push('الفترة الزمنية لا يمكن أن تتجاوز 365 يوم');
    }

    // التحقق من حجم البيانات
    const maxLimit = this.getMaxLimit(queryType);
    if (params.limit && params.limit > maxLimit) {
      errors.push(`عدد السجلات لا يمكن أن يتجاوز ${maxLimit}`);
    }

    // التحقق من معاملات مسارات المستخدم
    if (queryType === 'user-journeys') {
      if (params.minSteps && params.minSteps < 1) {
        errors.push('الحد الأدنى للخطوات يجب أن يكون 1 على الأقل');
      }
      if (params.maxSteps && params.maxSteps > 50) {
        errors.push('الحد الأقصى للخطوات لا يمكن أن يتجاوز 50');
      }
      if (params.minSteps && params.maxSteps && params.minSteps > params.maxSteps) {
        errors.push('الحد الأدنى للخطوات لا يمكن أن يكون أكبر من الحد الأقصى');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * إنشاء مفتاح ذاكرة مؤقتة
   */
  createCacheKey(queryType: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result: any, key) => {
        result[key] = params[key];
        return result;
      }, {});

    return `${queryType}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * تنسيق البيانات للتصدير
   */
  formatForExport(data: any, format: 'csv' | 'json' | 'pdf'): string {
    switch (format) {
      case 'csv':
        return this.formatAsCSV(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'pdf':
        return this.formatAsPDF(data);
      default:
        return JSON.stringify(data);
    }
  }

  /**
   * تنسيق البيانات كـ CSV
   */
  private formatAsCSV(data: any): string {
    if (!data || !Array.isArray(data)) {
      return '';
    }

    const headers = Object.keys(data[0] || {});
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  /**
   * تنسيق البيانات كـ PDF (مبسط)
   */
  private formatAsPDF(data: any): string {
    // هذا مثال مبسط - في التطبيق الحقيقي يجب استخدام مكتبة PDF
    return `PDF Report\n\nData: ${JSON.stringify(data, null, 2)}`;
  }
}

// إنشاء مثيل عام للمدير
export const analyticsConfig = new AnalyticsConfigManager();

/**
 * دوال مساعدة للتحليلات
 */
export class AnalyticsHelpers {
  /**
   * تحويل الثواني إلى نص قابل للقراءة
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds} ثانية`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} ساعة`;
    return `${Math.round(seconds / 86400)} يوم`;
  }

  /**
   * تنسيق الأرقام الكبيرة
   */
  static formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  /**
   * حساب النسبة المئوية للتغيير
   */
  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * تحديد اتجاه التغيير
   */
  static getTrendDirection(change: number): 'up' | 'down' | 'stable' {
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  /**
   * تجميع البيانات حسب الفترة الزمنية
   */
  static groupByTimePeriod(data: any[], period: 'hour' | 'day' | 'week' | 'month'): any[] {
    const groups: { [key: string]: any[] } = {};

    data.forEach(item => {
      const date = new Date(item.timestamp || item.date);
      let key: string;

      switch (period) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth()}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return Object.entries(groups).map(([key, items]) => ({
      period: key,
      items,
      count: items.length
    }));
  }

  /**
   * حساب الإحصائيات الوصفية
   */
  static calculateStats(values: number[]): {
    mean: number;
    median: number;
    mode: number;
    min: number;
    max: number;
    std: number;
  } {
    if (values.length === 0) {
      return { mean: 0, median: 0, mode: 0, min: 0, max: 0, std: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // حساب المنوال
    const frequency: { [key: number]: number } = {};
    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    const mode = Object.entries(frequency).reduce((a, b) => 
      frequency[a[0]] > frequency[b[0]] ? a : b
    )[0];

    // حساب الانحراف المعياري
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    return {
      mean: Math.round(mean),
      median: Math.round(median),
      mode: parseInt(mode),
      min: Math.min(...values),
      max: Math.max(...values),
      std: Math.round(std)
    };
  }
} 