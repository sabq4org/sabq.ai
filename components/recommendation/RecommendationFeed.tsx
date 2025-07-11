"use client";

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface RecommendationItem {
  article: {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    featured_image?: string;
    category_id: string;
    published_at?: string;
    view_count: number;
    like_count: number;
    reading_time?: number;
    tags: string[];
  };
  score: number;
  reason_type: string;
  reason_explanation: string;
  algorithm_type: string;
  context_data?: any;
}

interface RecommendationFeedProps {
  userId?: string;
  sessionId?: string;
  limit?: number;
  categoryFilter?: string;
  showAlgorithmSelector?: boolean;
  showFilters?: boolean;
  autoRefresh?: boolean;
}

const ALGORITHM_TYPES = [
  { key: 'mixed', label: 'مختلط', description: 'مزيج من جميع الخوارزميات' },
  { key: 'personal', label: 'شخصي', description: 'بناءً على اهتماماتك' },
  { key: 'collaborative', label: 'تعاوني', description: 'مستخدمون مشابهون لك' },
  { key: 'graph', label: 'شبكي', description: 'عبر شبكة التفاعلات' },
  { key: 'trending', label: 'شائع', description: 'المحتوى الأكثر شعبية' },
  { key: 'ai', label: 'ذكي', description: 'ذكاء اصطناعي متقدم' }
];

const CATEGORIES = [
  { key: '', label: 'جميع الفئات' },
  { key: 'news', label: 'أخبار' },
  { key: 'sports', label: 'رياضة' },
  { key: 'tech', label: 'تقنية' },
  { key: 'business', label: 'أعمال' },
  { key: 'health', label: 'صحة' },
  { key: 'entertainment', label: 'ترفيه' }
];

export default function RecommendationFeed({
  userId,
  sessionId,
  limit = 10,
  categoryFilter = '',
  showAlgorithmSelector = true,
  showFilters = true,
  autoRefresh = false
}: RecommendationFeedProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('mixed');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<Set<string>>(new Set());

  // جلب التوصيات
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: selectedAlgorithm,
        limit: limit.toString()
      });

      if (userId) params.append('userId', userId);
      if (sessionId) params.append('sessionId', sessionId);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/recommendations?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data.recommendations);
      } else {
        setError('حدث خطأ في جلب التوصيات');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // تسجيل تقييم المستخدم
  const handleFeedback = async (articleId: string, feedback: string) => {
    try {
      setFeedbackLoading(prev => new Set(prev).add(articleId));

      const response = await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          articleId,
          feedback,
          context: {
            algorithm: selectedAlgorithm,
            category: selectedCategory,
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // إزالة المقال من التوصيات إذا كان التقييم سلبياً
        if (feedback === 'not_interested' || feedback === 'dislike') {
          setRecommendations(prev => prev.filter(rec => rec.article.id !== articleId));
        }
      } else {
        console.error('Error recording feedback:', data.error);
      }
    } catch (error) {
      console.error('Error recording feedback:', error);
    } finally {
      setFeedbackLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
    }
  };

  // معالجة النقر على المقال
  const handleArticleClick = (articleId: string) => {
    handleFeedback(articleId, 'clicked');
  };

  // تحديث التوصيات عند تغيير الخوارزمية أو الفئة
  useEffect(() => {
    fetchRecommendations();
  }, [selectedAlgorithm, selectedCategory, userId, sessionId]);

  // التحديث التلقائي
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchRecommendations, 5 * 60 * 1000); // كل 5 دقائق
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedAlgorithm, selectedCategory]);

  // تنسيق التاريخ
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // تنسيق وقت القراءة
  const formatReadingTime = (minutes?: number) => {
    if (!minutes) return '';
    return `${minutes} دقيقة قراءة`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">التوصيات الذكية</h2>
          <p className="text-gray-600">محتوى مقترح خصيصاً لك</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecommendations}
            disabled={loading}
          >
            {loading ? 'جاري التحديث...' : 'تحديث'}
          </Button>
        </div>
      </div>

      {/* Algorithm Selector */}
      {showAlgorithmSelector && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">نوع التوصية</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {ALGORITHM_TYPES.map(algorithm => (
              <Button
                key={algorithm.key}
                variant={selectedAlgorithm === algorithm.key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedAlgorithm(algorithm.key)}
                title={algorithm.description}
                className="flex flex-col items-center p-3 h-auto"
              >
                <span className="font-medium">{algorithm.label}</span>
                <span className="text-xs opacity-75 mt-1">{algorithm.description}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">تصفية النتائج</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.key)}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="p-6">
              <div className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((recommendation) => (
            <Card key={recommendation.article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Article Image */}
              {recommendation.article.featured_image && (
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={recommendation.article.featured_image}
                    alt={recommendation.article.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => handleArticleClick(recommendation.article.id)}
                  />
                </div>
              )}

              <div className="p-6">
                {/* Article Title */}
                <h3 
                  className="font-bold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleArticleClick(recommendation.article.id)}
                >
                  {recommendation.article.title}
                </h3>

                {/* Article Summary */}
                {recommendation.article.summary && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {recommendation.article.summary}
                  </p>
                )}

                {/* Article Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>{formatDate(recommendation.article.published_at)}</span>
                  {recommendation.article.reading_time && (
                    <span>{formatReadingTime(recommendation.article.reading_time)}</span>
                  )}
                  <span>{recommendation.article.view_count} مشاهدة</span>
                </div>

                {/* Recommendation Reason */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-600 text-sm font-medium">سبب التوصية:</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {recommendation.algorithm_type}
                    </span>
                  </div>
                  <p className="text-blue-700 text-sm">{recommendation.reason_explanation}</p>
                </div>

                {/* Tags */}
                {recommendation.article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {recommendation.article.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(recommendation.article.id, 'like')}
                      disabled={feedbackLoading.has(recommendation.article.id)}
                      className="flex items-center gap-1"
                    >
                      👍 مفيد
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(recommendation.article.id, 'not_interested')}
                      disabled={feedbackLoading.has(recommendation.article.id)}
                      className="flex items-center gap-1"
                    >
                      🚫 غير مهتم
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(recommendation.article.id, 'shared')}
                      disabled={feedbackLoading.has(recommendation.article.id)}
                    >
                      📤 مشاركة
                    </Button>
                    <a
                      href={`/articles/${recommendation.article.slug}`}
                      onClick={() => handleArticleClick(recommendation.article.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      اقرأ المزيد ←
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && recommendations.length === 0 && !error && (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد توصيات متاحة</h3>
          <p className="text-gray-600 mb-4">
            لم نتمكن من العثور على توصيات مناسبة لك في الوقت الحالي
          </p>
          <Button onClick={fetchRecommendations} disabled={loading}>
            جرب مرة أخرى
          </Button>
        </Card>
      )}

      {/* Load More Button */}
      {!loading && recommendations.length > 0 && recommendations.length >= limit && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              // يمكن إضافة منطق تحميل المزيد هنا
              fetchRecommendations();
            }}
            disabled={loading}
          >
            تحميل المزيد من التوصيات
          </Button>
        </div>
      )}
    </div>
  );
} 