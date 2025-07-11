/**
 * تكامل الذكاء الاصطناعي للتوصيات
 * AI Integration for Recommendations
 */

import { PrismaClient } from '@prisma/client';
import { RecommendationItem, RecommendationRequest } from '../recommendation-engine';

const prisma = new PrismaClient();

export interface AIRecommendationRequest {
  userId?: string;
  userProfile?: {
    interests: Record<string, number>;
    categories: Record<string, number>;
    reading_patterns: any;
    behavioral_signals: any;
  };
  contentContext?: {
    recentArticles: string[];
    likedArticles: string[];
    categories: string[];
  };
  preferences?: {
    diversityFactor: number;
    freshnessFactor: number;
    contentLength: 'short' | 'medium' | 'long' | 'any';
    languages: string[];
  };
  limit: number;
}

export interface AIRecommendationResponse {
  recommendations: Array<{
    articleId: string;
    score: number;
    confidence: number;
    explanation: string;
    reasoning: string[];
    tags: string[];
  }>;
  metadata: {
    model: string;
    version: string;
    processingTime: number;
    confidence: number;
  };
}

/**
 * محرك التوصيات بالذكاء الاصطناعي
 */
export class AIRecommendationEngine {
  private static instance: AIRecommendationEngine;
  private readonly AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  private readonly AI_API_KEY = process.env.AI_API_KEY;
  private readonly TIMEOUT = 15000; // 15 ثانية

  public static getInstance(): AIRecommendationEngine {
    if (!AIRecommendationEngine.instance) {
      AIRecommendationEngine.instance = new AIRecommendationEngine();
    }
    return AIRecommendationEngine.instance;
  }

  /**
   * الحصول على توصيات الذكاء الاصطناعي
   */
  async getAIRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { userId, limit = 10, excludeArticleIds = [] } = request;

    try {
      // التحقق من توفر الخدمة
      if (!this.AI_SERVICE_URL) {
        console.warn('AI service URL not configured');
        return [];
      }

      // بناء طلب الذكاء الاصطناعي
      const aiRequest = await this.buildAIRequest(userId, limit, excludeArticleIds);
      
      // إرسال الطلب
      const aiResponse = await this.callAIService(aiRequest);
      
      // تحويل النتائج
      const recommendations = await this.convertAIResponse(aiResponse);
      
      return recommendations;
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      return [];
    }
  }

  /**
   * بناء طلب الذكاء الاصطناعي
   */
  private async buildAIRequest(
    userId?: string, 
    limit: number = 10, 
    excludeArticleIds: string[] = []
  ): Promise<AIRecommendationRequest> {
    const request: AIRecommendationRequest = {
      userId,
      limit,
      preferences: {
        diversityFactor: 0.3,
        freshnessFactor: 0.2,
        contentLength: 'any',
        languages: ['ar', 'en']
      }
    };

    // إضافة ملف المستخدم إذا كان متاحاً
    if (userId) {
      request.userProfile = await this.getUserProfile(userId);
      request.contentContext = await this.getContentContext(userId, excludeArticleIds);
    }

    return request;
  }

  /**
   * استدعاء خدمة الذكاء الاصطناعي
   */
  private async callAIService(request: AIRecommendationRequest): Promise<AIRecommendationResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.AI_API_KEY && { 'Authorization': `Bearer ${this.AI_API_KEY}` })
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * تحويل استجابة الذكاء الاصطناعي
   */
  private async convertAIResponse(aiResponse: AIRecommendationResponse): Promise<RecommendationItem[]> {
    const articleIds = aiResponse.recommendations.map(rec => rec.articleId);
    
    // جلب تفاصيل المقالات
    const articles = await prisma.article.findMany({
      where: {
        id: { in: articleIds },
        status: 'published'
      },
      include: {
        category: true,
        author: { select: { id: true, name: true } }
      }
    });

    // تحويل إلى تنسيق التوصيات
    const recommendations: RecommendationItem[] = [];

    for (const aiRec of aiResponse.recommendations) {
      const article = articles.find(a => a.id === aiRec.articleId);
      if (article) {
        recommendations.push({
          article: {
            id: article.id,
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            featured_image: article.featured_image,
            category_id: article.category_id,
            published_at: article.published_at,
            view_count: article.view_count,
            like_count: article.like_count,
            reading_time: article.reading_time,
            tags: article.tags
          },
          score: aiRec.score,
          reason_type: 'ai',
          reason_explanation: aiRec.explanation,
          algorithm_type: 'ai',
          context_data: {
            confidence: aiRec.confidence,
            reasoning: aiRec.reasoning,
            aiTags: aiRec.tags,
            model: aiResponse.metadata.model,
            version: aiResponse.metadata.version
          }
        });
      }
    }

    return recommendations;
  }

  /**
   * جلب ملف المستخدم
   */
  private async getUserProfile(userId: string): Promise<any> {
    const profile = await prisma.userInterestProfile.findUnique({
      where: { user_id: userId }
    });

    if (profile) {
      return {
        interests: profile.interests,
        categories: profile.categories,
        reading_patterns: profile.reading_patterns,
        behavioral_signals: profile.behavioral_signals
      };
    }

    // إنشاء ملف أساسي من السلوك
    return await this.buildBasicProfile(userId);
  }

  /**
   * جلب سياق المحتوى
   */
  private async getContentContext(userId: string, excludeArticleIds: string[]): Promise<any> {
    // المقالات المقروءة مؤخراً
    const recentViews = await prisma.analyticsEvent.findMany({
      where: {
        user_id: userId,
        event_type: 'page_view',
        article_id: { not: null }
      },
      select: { article_id: true },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    // المقالات المُعجب بها
    const likedArticles = await prisma.articleLike.findMany({
      where: { user_id: userId },
      select: { article_id: true },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // الفئات المفضلة
    const categoryInteractions = await prisma.analyticsEvent.findMany({
      where: {
        user_id: userId,
        event_type: { in: ['like', 'share', 'comment'] },
        article_id: { not: null }
      },
      include: {
        article: {
          select: { category_id: true }
        }
      },
      take: 50
    });

    const categories = categoryInteractions
      .map(e => e.article?.category_id)
      .filter(Boolean)
      .reduce((acc: Record<string, number>, categoryId: string) => {
        acc[categoryId] = (acc[categoryId] || 0) + 1;
        return acc;
      }, {});

    return {
      recentArticles: recentViews.map(v => v.article_id).filter(Boolean),
      likedArticles: likedArticles.map(l => l.article_id),
      categories: Object.keys(categories)
    };
  }

  /**
   * بناء ملف أساسي للمستخدم
   */
  private async buildBasicProfile(userId: string): Promise<any> {
    const events = await prisma.analyticsEvent.findMany({
      where: { user_id: userId },
      include: {
        article: {
          include: { category: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    const interests: Record<string, number> = {};
    const categories: Record<string, number> = {};

    events.forEach(event => {
      if (event.article) {
        // تحليل الاهتمامات من العلامات
        event.article.tags.forEach(tag => {
          interests[tag] = (interests[tag] || 0) + this.getEventWeight(event.event_type);
        });

        // تحليل الفئات
        const categoryName = event.article.category.name;
        categories[categoryName] = (categories[categoryName] || 0) + this.getEventWeight(event.event_type);
      }
    });

    return {
      interests,
      categories,
      reading_patterns: {},
      behavioral_signals: {}
    };
  }

  /**
   * وزن الأحداث
   */
  private getEventWeight(eventType: string): number {
    const weights: Record<string, number> = {
      'like': 1.0,
      'share': 0.9,
      'comment': 0.8,
      'reading_time': 0.6,
      'page_view': 0.2
    };
    return weights[eventType] || 0.1;
  }

  /**
   * تحليل النص بالذكاء الاصطناعي
   */
  async analyzeContent(content: string): Promise<{
    topics: string[];
    sentiment: number;
    complexity: number;
    readability: number;
    keywords: string[];
  }> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.AI_API_KEY && { 'Authorization': `Bearer ${this.AI_API_KEY}` })
        },
        body: JSON.stringify({ text: content }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing content:', error);
      return {
        topics: [],
        sentiment: 0,
        complexity: 0,
        readability: 0,
        keywords: []
      };
    }
  }

  /**
   * تحديث نموذج الذكاء الاصطناعي
   */
  async updateAIModel(feedbackData: any[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/update-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.AI_API_KEY && { 'Authorization': `Bearer ${this.AI_API_KEY}` })
        },
        body: JSON.stringify({ feedback: feedbackData }),
        signal: AbortSignal.timeout(30000)
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating AI model:', error);
      return false;
    }
  }

  /**
   * جلب إحصائيات الذكاء الاصطناعي
   */
  async getAIStats(): Promise<{
    modelVersion: string;
    accuracy: number;
    totalRecommendations: number;
    averageConfidence: number;
    lastUpdated: string;
  }> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/stats`, {
        headers: {
          ...(this.AI_API_KEY && { 'Authorization': `Bearer ${this.AI_API_KEY}` })
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Stats request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting AI stats:', error);
      return {
        modelVersion: 'unknown',
        accuracy: 0,
        totalRecommendations: 0,
        averageConfidence: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * اختبار الاتصال بخدمة الذكاء الاصطناعي
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/health`, {
        method: 'GET',
        headers: {
          ...(this.AI_API_KEY && { 'Authorization': `Bearer ${this.AI_API_KEY}` })
        },
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch (error) {
      console.error('AI service connection test failed:', error);
      return false;
    }
  }

  /**
   * تدريب النموذج بالبيانات الجديدة
   */
  async trainModel(trainingData: {
    userInteractions: any[];
    articleFeatures: any[];
    feedbackData: any[];
  }): Promise<{
    success: boolean;
    modelId: string;
    accuracy: number;
    trainingTime: number;
  }> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.AI_API_KEY && { 'Authorization': `Bearer ${this.AI_API_KEY}` })
        },
        body: JSON.stringify(trainingData),
        signal: AbortSignal.timeout(60000) // دقيقة واحدة للتدريب
      });

      if (!response.ok) {
        throw new Error(`Training failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error training AI model:', error);
      return {
        success: false,
        modelId: '',
        accuracy: 0,
        trainingTime: 0
      };
    }
  }
}

export const aiRecommendationEngine = AIRecommendationEngine.getInstance(); 