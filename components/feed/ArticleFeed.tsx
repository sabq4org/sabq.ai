'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { trackEvent, trackArticleView, EventType } from '@/lib/analytics-core';
import { useAuth } from '@/hooks/useAuth';

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
  const fetchRecommendations = useCallback(async () => {
    if (!user || !showRecommendations) return;

    setLoadingRecommendations(true);

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
          top_n: 5,
          context
        })
      });

      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData.recommendations || []);

        // تتبع عرض التوصيات
        trackEvent(EventType.FEATURE_USE, {
          feature: 'smart_recommendations',
          recommendations_count: recommendationsData.recommendations?.length || 0,
          context
        });
      }

    } catch (err) {
      console.error('خطأ في جلب التوصيات:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [user, showRecommendations, articles, context]);

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
      is_recommended: !!article.recommendation_score
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

  // مكون المقال الواحد
  const ArticleCard = ({ article, isRecommended = false }: { article: Article; isRecommended?: boolean }) => (
    <Card 
      className={`p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group relative
        ${isRecommended ? 'border-blue-200 bg-blue-50' : 'hover:border-gray-300'}`}
      onClick={() => handleArticleClick(article)}
    >
      {/* علامة التوصية */}
      {isRecommended && (
        <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          🎯 موصى لك
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
        <span className="text-blue-600 text-sm font-medium">
          {article.category.name}
        </span>
        {article.reading_time && (
          <span className="text-gray-500 text-sm">
            📖 {article.reading_time} دقائق
          </span>
        )}
      </div>

      {/* العنوان */}
      <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {article.title}
      </h2>

      {/* الملخص */}
      {article.summary && (
        <p className="text-gray-600 mb-4 line-clamp-3">
          {article.summary}
        </p>
      )}

      {/* سبب التوصية */}
      {isRecommended && article.recommendation_reason && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm">
            💡 {article.recommendation_reason}
          </p>
        </div>
      )}

      {/* الكلمات المفتاحية */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
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
            className="text-red-500 hover:text-red-600"
          >
            ❤️ {article.like_count}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleShare(article, e)}
            className="text-blue-500 hover:text-blue-600"
          >
            📤 مشاركة
          </Button>
        </div>
      </div>
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
            <h2 className="text-2xl font-bold text-gray-900">
              🎯 مقالات موصى لك خصيصاً
            </h2>
            {loadingRecommendations && (
              <div className="text-blue-600 text-sm">جاري التحديث...</div>
            )}
          </div>
          
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