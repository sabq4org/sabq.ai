'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ReasonFeedback from '../recommendation/ReasonFeedback';
import { trackEvent, trackArticleView, EventType } from '../../lib/analytics-core';
import { useAuth } from '../../hooks/useAuth';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  featured_image?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string;
  };
  published_at: string;
  view_count: number;
  like_count: number;
  reading_time?: number;
  tags: string[];
  recommendation_score?: number;
  recommendation_reason?: string;
  recommendation_type?: 'interest' | 'popular' | 'collaborative' | 'diversity' | 'freshness';
  recommendation_id?: string;
}

interface ArticleFeedProps {
  initialArticles?: Article[];
  category?: string;
  featured?: boolean;
  showRecommendations?: boolean;
  context?: string;
}

export default function ArticleFeed({ 
  initialArticles = [], 
  category,
  featured,
  showRecommendations = false,
  context = 'homepage'
}: ArticleFeedProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [recommendations, setRecommendations] = useState<Article[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);
  const [showRecommendationSettings, setShowRecommendationSettings] = useState(false);
  
  const { user } = useAuth();

  // جلب المقالات
  const fetchArticles = useCallback(async (pageNum: number = 1, replace: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        ...(category && { category }),
        ...(featured && { featured: 'true' })
      });

      const response = await fetch(`/api/articles?${params}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب المقالات');
      }

      const data = await response.json();
      
      if (replace) {
        setArticles(data.articles);
      } else {
        setArticles(prev => [...prev, ...data.articles]);
      }
      
      setHasMore(data.pagination.current_page < data.pagination.total_pages);
      setPage(pageNum);

      // تتبع تحميل المقالات
      trackEvent(EventType.PAGE_VIEW, {
        context: 'article_feed',
        category,
        page: pageNum,
        total_articles: data.articles.length
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, [category, featured]);

  // جلب التوصيات الذكية
  const fetchRecommendations = useCallback(async (refresh: boolean = false) => {
    if (!user || !showRecommendations) return;

    if (refresh) {
      setRefreshingRecommendations(true);
    } else {
      setLoadingRecommendations(true);
    }

    try {
      // جلب الأحداث السلوكية للمستخدم
      const eventsResponse = await fetch('/api/analytics/user-events', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!eventsResponse.ok) {
        throw new Error('فشل في جلب بيانات المستخدم');
      }

      const userEvents = await eventsResponse.json();

      // طلب التوصيات من خدمة الذكاء الاصطناعي
      const recommendationsResponse = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          user_events: userEvents.events || [],
          articles: articles,
          top_n: refresh ? 8 : 5,
          context
        })
      });

      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        const processedRecommendations = recommendationsData.recommendations?.map((rec: any) => ({
          ...rec,
          recommendation_id: rec.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          recommendation_type: determineRecommendationType(rec.recommendation_reason),
        })) || [];

        setRecommendations(processedRecommendations);

        // تتبع عرض التوصيات
        trackEvent(EventType.FEATURE_USE, {
          feature: 'smart_recommendations',
          action: refresh ? 'refresh' : 'load',
          recommendations_count: processedRecommendations.length,
          context
        });
      }

    } catch (err) {
      console.error('خطأ في جلب التوصيات:', err);
    } finally {
      setLoadingRecommendations(false);
      setRefreshingRecommendations(false);
    }
  }, [user, showRecommendations, articles, context]);

  // تحديد نوع التوصية من النص
  const determineRecommendationType = (reason: string): 'interest' | 'popular' | 'collaborative' | 'diversity' | 'freshness' => {
    if (reason?.includes('اهتمام') || reason?.includes('تقرأ')) return 'interest';
    if (reason?.includes('شائع') || reason?.includes('الأكثر')) return 'popular';
    if (reason?.includes('مشابه') || reason?.includes('المستخدمين')) return 'collaborative';
    if (reason?.includes('جديد') || reason?.includes('اكتشف')) return 'diversity';
    if (reason?.includes('حديث') || reason?.includes('مؤخراً')) return 'freshness';
    return 'interest';
  };

  // تأثير جانبي لجلب المقالات عند التحميل
  useEffect(() => {
    if (initialArticles.length === 0) {
      fetchArticles(1, true);
    }
  }, [fetchArticles, initialArticles.length]);

  // تأثير جانبي لجلب التوصيات
  useEffect(() => {
    if (articles.length > 0 && showRecommendations) {
      fetchRecommendations();
    }
  }, [articles.length, fetchRecommendations, showRecommendations]);

  // تعامل مع النقر على المقال
  const handleArticleClick = (article: Article) => {
    // تتبع عرض المقال
    trackArticleView(article.id, {
      title: article.title,
      category: article.category.name,
      author: article.author.name,
      tags: article.tags,
      readingTime: article.reading_time,
      source: 'article_feed',
      context,
      recommendation_score: article.recommendation_score,
      is_recommended: !!article.recommendation_score,
      recommendation_type: article.recommendation_type
    });

    // الانتقال لصفحة المقال
    window.location.href = `/articles/${article.slug}`;
  };

  // تعامل مع الإعجاب
  const handleLike = async (articleId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      const response = await fetch(`/api/articles/${articleId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // تحديث المقال في القائمة
        setArticles(prev => prev.map(article => 
          article.id === articleId 
            ? { ...article, like_count: data.like_count }
            : article
        ));

        setRecommendations(prev => prev.map(article => 
          article.id === articleId 
            ? { ...article, like_count: data.like_count }
            : article
        ));

        // تتبع الإعجاب
        trackEvent(EventType.ARTICLE_LIKE, {
          articleId,
          action: 'like',
          context: 'article_feed'
        });
      }
    } catch (err) {
      console.error('خطأ في الإعجاب:', err);
    }
  };

  // تعامل مع المشاركة
  const handleShare = (article: Article, event: React.MouseEvent) => {
    event.stopPropagation();

    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: `${window.location.origin}/articles/${article.slug}`
      });
    } else {
      // نسخ الرابط للحافظة
      navigator.clipboard.writeText(`${window.location.origin}/articles/${article.slug}`);
    }

    // تتبع المشاركة
    trackEvent(EventType.ARTICLE_SHARE, {
      articleId: article.id,
      platform: navigator.share ? 'native' : 'clipboard',
      method: 'share_button',
      context: 'article_feed'
    });
  };

  // تحميل المزيد
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchArticles(page + 1);
    }
  };

  // تحديث التوصيات
  const refreshRecommendations = () => {
    fetchRecommendations(true);
  };

  // معالجة التغذية الراجعة
  const handleFeedbackSubmit = (feedbackData: any) => {
    // تتبع إرسال التغذية الراجعة
    trackEvent(EventType.FEATURE_USE, {
      feature: 'recommendation_feedback_submit',
      feedback: feedbackData.feedback,
      hasNote: !!feedbackData.note,
      recommendationId: feedbackData.recommendationId
    });
  };

  // مكون المقال الواحد
  const ArticleCard = ({ article, isRecommended = false }: { article: Article; isRecommended?: boolean }) => (
    <Card 
      className={`p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group relative
        ${isRecommended ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md' : 'hover:border-gray-300'}`}
      onClick={() => handleArticleClick(article)}
    >
      {/* علامة التوصية */}
      {isRecommended && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
          🎯 موصى خصيصاً لك
        </div>
      )}

      {/* الصورة المميزة */}
      {article.featured_image && (
        <div className="mb-4 overflow-hidden rounded-lg">
          <img 
            src={article.featured_image} 
            alt={article.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}

      {/* التصنيف */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium px-2 py-1 rounded-full
          ${isRecommended ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
          {article.category.name}
        </span>
        {article.reading_time && (
          <span className="text-gray-500 text-sm flex items-center">
            📖 {article.reading_time} دقائق
          </span>
        )}
      </div>

      {/* العنوان */}
      <h2 className={`text-xl font-bold mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors
        ${isRecommended ? 'text-gray-900' : 'text-gray-900'}`}>
        {article.title}
      </h2>

      {/* الملخص */}
      {article.summary && (
        <p className="text-gray-600 mb-4 line-clamp-3">
          {article.summary}
        </p>
      )}

      {/* الكلمات المفتاحية */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className={`px-2 py-1 text-xs rounded-full
                ${isRecommended ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* المعلومات السفلية */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500">
          <span>✍️ {article.author.name}</span>
          <span>👁️ {article.view_count.toLocaleString()}</span>
          <span>📅 {new Date(article.published_at).toLocaleDateString('ar-SA')}</span>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleLike(article.id, e)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            ❤️ {article.like_count}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleShare(article, e)}
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
          >
            📤 مشاركة
          </Button>
        </div>
      </div>

      {/* التغذية الراجعة للتوصيات */}
      {isRecommended && article.recommendation_reason && article.recommendation_id && (
        <ReasonFeedback
          recommendationId={article.recommendation_id}
          reasonText={article.recommendation_reason}
          reasonType={article.recommendation_type || 'interest'}
          userId={user?.id}
          articleId={article.id}
          onFeedbackSubmit={handleFeedbackSubmit}
        />
      )}
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* عرض خطأ */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="text-center text-red-800">
            <p className="font-medium">⚠️ حدث خطأ</p>
            <p className="text-sm mt-1">{error}</p>
            <Button 
              onClick={() => fetchArticles(1, true)} 
              className="mt-3"
              variant="outline"
            >
              إعادة المحاولة
            </Button>
          </div>
        </Card>
      )}

      {/* التوصيات الذكية */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🎯 مقالات موصى لك خصيصاً
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {recommendations.length} توصية
              </span>
            </h2>
            
            <div className="flex items-center gap-3">
              {loadingRecommendations && (
                <div className="text-blue-600 text-sm">جاري التحديث...</div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={refreshRecommendations}
                disabled={refreshingRecommendations}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {refreshingRecommendations ? '🔄 جاري التحديث...' : '🔄 تحديث التوصيات'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRecommendationSettings(!showRecommendationSettings)}
                className="text-gray-600 hover:text-gray-800"
              >
                ⚙️ إعدادات
              </Button>
            </div>
          </div>

          {/* إعدادات التوصيات */}
          {showRecommendationSettings && (
            <Card className="p-4 bg-gray-50 border-gray-200">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">إعدادات التوصيات</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span>🎯</span>
                    <span>بناءً على اهتماماتك</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🔥</span>
                    <span>المحتوى الشائع</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>تفضيلات مشابهة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🌈</span>
                    <span>محتوى متنوع</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  التوصيات تتحسن تلقائياً بناءً على تفاعلك مع المحتوى وتغذيتك الراجعة.
                </p>
              </div>
            </Card>
          )}
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map(article => (
              <ArticleCard 
                key={`rec-${article.id}`} 
                article={article} 
                isRecommended={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* المقالات العادية */}
      <div className="space-y-4">
        {!showRecommendations && (
          <h2 className="text-2xl font-bold text-gray-900">
            📰 أحدث المقالات
          </h2>
        )}
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map(article => (
            <ArticleCard 
              key={article.id} 
              article={article}
            />
          ))}
        </div>
      </div>

      {/* تحميل المزيد */}
      {hasMore && (
        <div className="text-center pt-8">
          <Button 
            onClick={loadMore}
            disabled={loading}
            size="lg"
            className="px-8"
          >
            {loading ? '⏳ جاري التحميل...' : '📖 تحميل المزيد'}
          </Button>
        </div>
      )}

      {/* رسالة عدم وجود مقالات */}
      {!loading && articles.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <p className="text-lg font-medium">📭 لا توجد مقالات متاحة</p>
            <p className="text-sm mt-2">تحقق مرة أخرى لاحقاً</p>
          </div>
        </Card>
      )}

      {/* مؤشر التحميل الأولي */}
      {loading && articles.length === 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="p-6 animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-4"></div>
              <div className="bg-gray-200 h-16 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="bg-gray-200 h-4 rounded w-1/3"></div>
                <div className="bg-gray-200 h-4 rounded w-1/4"></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 