// أنواع البيانات لنظام التحليل العميق

export type SourceType = 'manual' | 'gpt' | 'hybrid' | 'original' | 'article' | 'external';
export type CreationType = 'from_article' | 'new' | 'external_link' | 'category_based' | 'manual' | 'gpt' | 'mixed';
export type AnalysisStatus = 'draft' | 'published' | 'archived';
export type DisplayPosition = 'top' | 'middle' | 'custom_block' | 'sidebar' | 'normal' | 'featured';
export type InteractionType = 'view' | 'like' | 'share' | 'save' | 'comment';

// واجهة التحليل العميق الرئيسية
export interface DeepAnalysis {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: AnalysisContent;
  rawContent?: string;
  featuredImage?: string | null;
  
  // التصنيفات والوسوم
  categories: string[];
  tags: string[];
  
  // معلومات الإنشاء
  authorId?: string;
  authorName: string;
  sourceType: SourceType;
  creationType: CreationType;
  analysisType?: 'manual' | 'ai' | 'mixed';
  sourceArticleId?: string;
  externalLink?: string;
  
  // معلومات الجودة
  readingTime: number;
  qualityScore: number;
  contentScore: ContentScore;
  
  // إعدادات النشر
  status: AnalysisStatus;
  isActive: boolean;
  isFeatured: boolean;
  displayPosition: DisplayPosition;
  
  // الإحصائيات
  views: number;
  likes: number;
  shares: number;
  saves: number;
  commentsCount: number;
  avgReadTime: number;
  
  // التواريخ
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  lastGptUpdate?: string;
  
  // بيانات إضافية
  metadata?: Record<string, any>;
}

// محتوى التحليل المنسق
export interface AnalysisContent {
  sections: ContentSection[];
  tableOfContents?: TableOfContentsItem[];
  recommendations?: string[];
  keyInsights?: string[];
  dataPoints?: DataPoint[];
}

// قسم من المحتوى
export interface ContentSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'data' | 'chart' | 'table' | 'quote';
  metadata?: Record<string, any>;
}

// عنصر في جدول المحتويات
export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  sectionId: string;
}

// نقطة بيانات
export interface DataPoint {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

// تقييم جودة المحتوى
export interface ContentScore {
  overall: number;
  contentLength: number;
  hasSections: boolean;
  hasData: boolean;
  hasRecommendations: boolean;
  readability: number;
  uniqueness: number;
}

// سجل GPT
export interface GPTAnalysisLog {
  id: string;
  analysisId: string;
  prompt: string;
  response?: string;
  model: string;
  tokensUsed?: number;
  cost?: number;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  errorMessage?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

// إعدادات GPT
export interface GPTSettings {
  id: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  rateLimit: number;
  monthlyBudget: number;
  currentUsage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// تفاعل مع التحليل
export interface AnalysisInteraction {
  id: string;
  analysisId: string;
  userId: string;
  interactionType: InteractionType;
  duration?: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

// تعليق على التحليل
export interface AnalysisComment {
  id: string;
  analysisId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  parentId?: string;
  content: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: AnalysisComment[];
}

// طلب إنشاء تحليل
export interface CreateAnalysisRequest {
  title: string;
  summary: string;
  content?: string;
  sourceType: SourceType;
  creationType: CreationType;
  analysisType?: 'manual' | 'ai' | 'mixed';
  sourceArticleId?: string;
  externalLink?: string;
  categories: string[];
  tags: string[];
  authorName?: string;
  generateWithGPT?: boolean;
  gptPrompt?: string;
  openaiApiKey?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  displayPosition?: DisplayPosition;
  status?: AnalysisStatus;
  featuredImage?: string | null;
}

// طلب تحديث تحليل
export interface UpdateAnalysisRequest {
  title?: string;
  summary?: string;
  content?: string;
  categories?: string[];
  tags?: string[];
  status?: AnalysisStatus;
  isActive?: boolean;
  isFeatured?: boolean;
  displayPosition?: DisplayPosition;
  featuredImage?: string | null;
}

// فلاتر البحث
export interface AnalysisFilters {
  status?: AnalysisStatus;
  sourceType?: SourceType;
  creationType?: CreationType;
  authorId?: string;
  categories?: string[];
  tags?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  minQualityScore?: number;
}

// إحصائيات التحليل
export interface AnalysisStats {
  totalAnalyses: number;
  publishedAnalyses: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  avgReadingTime: number;
  avgQualityScore: number;
  topCategories: { category: string; count: number }[];
  topAuthors: { authorName: string; count: number }[];
  sourceTypeDistribution: { sourceType: SourceType; count: number }[];
}

// طلب توليد تحليل بـ GPT
export interface GenerateAnalysisRequest {
  sourceType: 'article' | 'topic' | 'external';
  sourceId?: string;
  externalUrl?: string;
  topic?: string;
  category?: string;
  customPrompt?: string;
  language?: 'ar' | 'en';
  tone?: 'professional' | 'casual' | 'academic';
  length?: 'short' | 'medium' | 'long';
  includeSections?: string[];
}

// استجابة توليد التحليل
export interface GenerateAnalysisResponse {
  success: boolean;
  analysis?: {
    title: string;
    summary: string;
    content: AnalysisContent;
    qualityScore: number;
    estimatedReadingTime: number;
  };
  error?: string;
  tokensUsed?: number;
  cost?: number;
} 