import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getBehaviorTracker, initBehaviorTracker } from '@/lib/services/behaviorTracker';

interface UseBehaviorTrackingOptions {
  articleId?: string;
  debug?: boolean;
}

export function useBehaviorTracking(options: UseBehaviorTrackingOptions = {}) {
  const { user } = useAuth();
  const trackerRef = useRef<ReturnType<typeof getBehaviorTracker>>(null);
  const impressionStartedRef = useRef(false);

  useEffect(() => {
    // تهيئة المتتبع
    if (!trackerRef.current) {
      trackerRef.current = initBehaviorTracker({
        userId: user?.id,
        debug: options.debug || false
      });
    }

    // تحديث معرف المستخدم إذا تغير
    if (user?.id && trackerRef.current) {
      trackerRef.current.setUserId(user.id);
    }
  }, [user?.id, options.debug]);

  useEffect(() => {
    // بدء تتبع انطباع المقال
    if (options.articleId && trackerRef.current && !impressionStartedRef.current) {
      impressionStartedRef.current = true;
      trackerRef.current.startImpression(options.articleId);

      // إنهاء الانطباع عند مغادرة الصفحة
      return () => {
        if (trackerRef.current && options.articleId) {
          trackerRef.current.endImpression(options.articleId);
          impressionStartedRef.current = false;
        }
      };
    }
  }, [options.articleId]);

  // دوال مساعدة للتفاعلات
  const trackInteraction = async (type: 'like' | 'save' | 'share' | 'comment', metadata?: any) => {
    if (trackerRef.current && options.articleId) {
      await trackerRef.current.trackInteraction(options.articleId, type, metadata);
    }
  };

  const trackRecommendationClick = async (recommendationId: string, articleId: string) => {
    if (trackerRef.current) {
      await trackerRef.current.trackRecommendationClick(recommendationId, articleId);
    }
  };

  return {
    tracker: trackerRef.current,
    trackInteraction,
    trackRecommendationClick
  };
}

// Hook مخصص لصفحة المقال
export function useArticleTracking(articleId: string) {
  const tracking = useBehaviorTracking({ articleId });

  return {
    onLike: (isLiked: boolean) => tracking.trackInteraction(isLiked ? 'like' : 'unlike'),
    onSave: (isSaved: boolean) => tracking.trackInteraction(isSaved ? 'save' : 'unsave'),
    onShare: (platform?: string) => tracking.trackInteraction('share', { platform }),
    onComment: () => tracking.trackInteraction('comment'),
    trackRecommendationClick: tracking.trackRecommendationClick
  };
}

// Hook لتتبع مجموعة من المقالات (مثل في الصفحة الرئيسية)
export function useArticlesTracking() {
  const tracking = useBehaviorTracking();
  const activeArticlesRef = useRef<Set<string>>(new Set());

  const startTrackingArticle = (articleId: string) => {
    if (tracking.tracker && !activeArticlesRef.current.has(articleId)) {
      activeArticlesRef.current.add(articleId);
      tracking.tracker.startImpression(articleId);
    }
  };

  const stopTrackingArticle = (articleId: string) => {
    if (tracking.tracker && activeArticlesRef.current.has(articleId)) {
      activeArticlesRef.current.delete(articleId);
      tracking.tracker.endImpression(articleId);
    }
  };

  useEffect(() => {
    // تنظيف جميع المقالات المتتبعة عند إلغاء التحميل
    return () => {
      if (tracking.tracker) {
        activeArticlesRef.current.forEach(articleId => {
          tracking.tracker!.endImpression(articleId);
        });
        activeArticlesRef.current.clear();
      }
    };
  }, [tracking.tracker]);

  return {
    startTrackingArticle,
    stopTrackingArticle,
    trackInteraction: async (articleId: string, type: 'like' | 'save' | 'share' | 'comment', metadata?: any) => {
      if (tracking.tracker) {
        await tracking.tracker.trackInteraction(articleId, type, metadata);
      }
    }
  };
} 