// ثوابت التطبيق العامة
export const APP_CONFIG = {
  name: 'سبق الذكية',
  description: 'نظام إدارة المحتوى الذكي',
  version: '2.1.0',
  author: 'فريق Sabq AI',
  website: 'https://sabq.ai',
  supportEmail: 'support@sabq.ai',
  defaultLanguage: 'ar' as const,
  defaultTheme: 'light' as const,
};

// ثوابت API
export const API_ROUTES = {
  // المصادقة
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    register: '/api/auth/register',
    me: '/api/auth/me',
    refresh: '/api/auth/refresh',
    resetPassword: '/api/auth/reset-password',
    changePassword: '/api/auth/change-password',
  },
  
  // المقالات
  articles: {
    list: '/api/articles',
    create: '/api/articles',
    get: (id: string) => `/api/articles/${id}`,
    update: (id: string) => `/api/articles/${id}`,
    delete: (id: string) => `/api/articles/${id}`,
    publish: (id: string) => `/api/articles/${id}/publish`,
    unpublish: (id: string) => `/api/articles/${id}/unpublish`,
    like: (id: string) => `/api/articles/${id}/like`,
    unlike: (id: string) => `/api/articles/${id}/unlike`,
  },
  
  // التصنيفات
  categories: {
    list: '/api/categories',
    create: '/api/categories',
    get: (id: string) => `/api/categories/${id}`,
    update: (id: string) => `/api/categories/${id}`,
    delete: (id: string) => `/api/categories/${id}`,
  },
  
  // العلامات
  tags: {
    list: '/api/tags',
    create: '/api/tags',
    get: (id: string) => `/api/tags/${id}`,
    update: (id: string) => `/api/tags/${id}`,
    delete: (id: string) => `/api/tags/${id}`,
  },
  
  // المستخدمون
  users: {
    list: '/api/users',
    create: '/api/users',
    get: (id: string) => `/api/users/${id}`,
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
    profile: '/api/users/profile',
  },
  
  // التعليقات
  comments: {
    list: '/api/comments',
    create: '/api/comments',
    get: (id: string) => `/api/comments/${id}`,
    update: (id: string) => `/api/comments/${id}`,
    delete: (id: string) => `/api/comments/${id}`,
    approve: (id: string) => `/api/comments/${id}/approve`,
    reject: (id: string) => `/api/comments/${id}/reject`,
  },
  
  // التحليلات
  analytics: {
    events: '/api/analytics/events',
    pageviews: '/api/analytics/pageviews',
    dashboard: '/api/analytics/dashboard',
    reports: '/api/analytics/reports',
  },
  
  // البحث
  search: {
    query: '/api/search',
    suggestions: '/api/search/suggestions',
    trending: '/api/search/trending',
  },
  
  // التكاملات
  integrations: {
    list: '/api/integrations',
    create: '/api/integrations',
    get: (id: string) => `/api/integrations/${id}`,
    update: (id: string) => `/api/integrations/${id}`,
    delete: (id: string) => `/api/integrations/${id}`,
    test: (id: string) => `/api/integrations/${id}/test`,
    sync: (id: string) => `/api/integrations/${id}/sync`,
  },
  
  // رفع الملفات
  upload: {
    image: '/api/upload/image',
    file: '/api/upload/file',
    avatar: '/api/upload/avatar',
  },
} as const;

// ثوابت التحليلات
export const ANALYTICS_EVENTS = {
  // أحداث المصادقة
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  REGISTER_ATTEMPT: 'register_attempt',
  REGISTER_SUCCESS: 'register_success',
  REGISTER_FAILURE: 'register_failure',
  
  // أحداث المقالات
  ARTICLE_VIEW: 'article_view',
  ARTICLE_READ: 'article_read',
  ARTICLE_LIKE: 'article_like',
  ARTICLE_SHARE: 'article_share',
  ARTICLE_COMMENT: 'article_comment',
  
  // أحداث التنقل
  PAGE_VIEW: 'page_view',
  CLICK: 'click',
  SCROLL: 'scroll',
  SEARCH: 'search',
  
  // أحداث التفاعل
  INTERACTION: 'interaction',
  DOWNLOAD: 'download',
  FORM_SUBMIT: 'form_submit',
  ERROR: 'error',
} as const;

// ثوابت حالات المقالات
export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

// ثوابت أدوار المستخدمين
export const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  AUTHOR: 'author',
  USER: 'user',
} as const;

// ثوابت حالات التعليقات
export const COMMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// ثوابت أنواع الإشعارات
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// ثوابت أنواع التكاملات
export const INTEGRATION_TYPES = {
  PAYMENT: 'payment',
  NOTIFICATION: 'notification',
  SOCIAL: 'social',
  CDN: 'cdn',
  ANALYTICS: 'analytics',
  AI: 'ai',
  SEARCH: 'search',
} as const;

// ثوابت مزودي الخدمات
export const INTEGRATION_PROVIDERS = {
  // الدفع
  STRIPE: 'stripe',
  TAP: 'tap',
  PAYPAL: 'paypal',
  
  // الإشعارات
  ONESIGNAL: 'onesignal',
  FCM: 'fcm',
  PUSHER: 'pusher',
  
  // الشبكات الاجتماعية
  TWITTER: 'twitter',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  
  // CDN والتخزين
  CLOUDFLARE: 'cloudflare',
  CLOUDINARY: 'cloudinary',
  AWS_S3: 'aws_s3',
  SUPABASE: 'supabase',
  
  // التحليلات
  GOOGLE_ANALYTICS: 'google_analytics',
  METABASE: 'metabase',
  MIXPANEL: 'mixpanel',
  
  // الذكاء الاصطناعي
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE_AI: 'google_ai',
} as const;

// ثوابت التخزين المحلي
export const STORAGE_KEYS = {
  USER: 'sabq_user',
  SESSION_ID: 'sabq_session_id',
  AUTH_TOKEN: 'sabq_auth_token',
  PREFERENCES: 'sabq_preferences',
  THEME: 'sabq_theme',
  LANGUAGE: 'sabq_language',
  DRAFT_ARTICLE: 'sabq_draft_article',
  SEARCH_HISTORY: 'sabq_search_history',
} as const;

// ثوابت التحقق من الصحة
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+966|966|0)?[5][0-9]{8}$/,
  URL_REGEX: /^https?:\/\/.+/,
  SLUG_REGEX: /^[a-z0-9-]+$/,
  
  // حدود رفع الملفات
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: ['application/pdf', 'application/doc', 'application/docx'],
} as const;

// ثوابت الترقيم
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  ARTICLES_PER_PAGE: 12,
  COMMENTS_PER_PAGE: 10,
  USERS_PER_PAGE: 20,
} as const;

// ثوابت وقت التخزين المؤقت
export const CACHE_DURATION = {
  SHORT: 5 * 60, // 5 دقائق
  MEDIUM: 30 * 60, // 30 دقيقة
  LONG: 24 * 60 * 60, // 24 ساعة
  WEEK: 7 * 24 * 60 * 60, // أسبوع
} as const;

// ثوابت الألوان
export const COLORS = {
  PRIMARY: '#2563eb',
  SECONDARY: '#6b7280',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
} as const;

// ثوابت التصنيفات المعتمدة
export const APPROVED_CATEGORIES = [
  { id: 'local', name: 'محليات', slug: 'local', color: '#2563eb' },
  { id: 'world', name: 'العالم', slug: 'world', color: '#dc2626' },
  { id: 'life', name: 'حياتنا', slug: 'life', color: '#059669' },
  { id: 'stations', name: 'محطات', slug: 'stations', color: '#7c3aed' },
  { id: 'sports', name: 'رياضة', slug: 'sports', color: '#ea580c' },
  { id: 'tourism', name: 'سياحة', slug: 'tourism', color: '#0891b2' },
  { id: 'business', name: 'أعمال', slug: 'business', color: '#374151' },
  { id: 'technology', name: 'تقنية', slug: 'technology', color: '#6366f1' },
  { id: 'cars', name: 'سيارات', slug: 'cars', color: '#dc2626' },
  { id: 'media', name: 'ميديا', slug: 'media', color: '#7c2d12' },
] as const; 