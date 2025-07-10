// أنواع المستخدمين
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'author' | 'user';
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showEmail: boolean;
    showLastSeen: boolean;
  };
}

// أنواع المقالات
export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: User;
  categoryId: string;
  category: Category;
  tags: Tag[];
  imageUrl?: string;
  imageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  readTime: number; // بالدقائق
  featured: boolean;
  seoScore?: number;
}

// أنواع التصنيفات
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  articlesCount: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// أنواع العلامات
export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  articlesCount: number;
  createdAt: string;
  updatedAt: string;
}

// أنواع التعليقات
export interface Comment {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  authorId: string;
  author: User;
  articleId: string;
  article: Article;
  parentId?: string;
  parent?: Comment;
  children?: Comment[];
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// أنواع التحليلات
export interface AnalyticsEvent {
  id: string;
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  timestamp: string;
}

export interface PageView {
  id: string;
  path: string;
  title: string;
  userId?: string;
  sessionId: string;
  duration?: number; // بالثواني
  source?: string;
  medium?: string;
  campaign?: string;
  timestamp: string;
}

export interface UserSession {
  id: string;
  sessionId: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  country?: string;
  city?: string;
  device: string;
  browser: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  pageViews: number;
  eventsCount: number;
}

// أنواع التكاملات
export interface Integration {
  id: string;
  name: string;
  type: 'payment' | 'notification' | 'social' | 'cdn' | 'analytics' | 'ai' | 'search';
  provider: string;
  isActive: boolean;
  config: Record<string, any>;
  credentials: Record<string, any>;
  lastSync?: string;
  status: 'connected' | 'error' | 'pending';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// أنواع الإشعارات
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

// أنواع الإعدادات
export interface Setting {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: string;
  description?: string;
  isPublic: boolean;
  updatedAt: string;
  updatedBy: string;
}

// أنواع الاستجابات من API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// أنواع النماذج
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface ArticleFormData {
  title: string;
  summary: string;
  content: string;
  categoryId: string;
  tags: string[];
  imageUrl?: string;
  imageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  status: 'draft' | 'published';
  publishedAt?: string;
  featured: boolean;
}

export interface ProfileFormData {
  name: string;
  bio?: string;
  avatar?: string;
  preferences: UserPreferences;
}

// أنواع البحث
export interface SearchResult {
  id: string;
  type: 'article' | 'category' | 'tag' | 'user';
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  relevance: number;
  highlightedText?: string;
}

export interface SearchOptions {
  query: string;
  type?: 'all' | 'articles' | 'categories' | 'tags' | 'users';
  categoryId?: string;
  authorId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'relevance' | 'date' | 'views' | 'likes';
  limit?: number;
  offset?: number;
}

// أنواع الملفات
export interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  userId: string;
  createdAt: string;
}

// أنواع التصريحات
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
} 