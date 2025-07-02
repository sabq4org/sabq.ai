import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface TrackingOptions {
  metadata?: any;
  duration?: number;
  scrollDepth?: number;
}

export function useTracking() {
  const { user } = useAuth();
  
  // توليد معرف الجلسة
  const getSessionId = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }, []);

  // تسجيل انطباع
  const trackImpression = useCallback(async (
    contentId: string,
    contentType: string,
    impressionType: string = 'view',
    options?: TrackingOptions
  ) => {
    try {
      await fetch('/api/track/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          contentId,
          contentType,
          impressionType,
          duration: options?.duration,
          scrollDepth: options?.scrollDepth,
          metadata: options?.metadata
        })
      });
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  }, [user]);

  // تسجيل سلوك
  const trackBehavior = useCallback(async (
    action: string,
    element?: string,
    value?: string,
    metadata?: any
  ) => {
    try {
      await fetch('/api/track/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          sessionId: getSessionId(),
          action,
          page: window.location.pathname,
          element,
          value,
          metadata
        })
      });
    } catch (error) {
      console.error('Failed to track behavior:', error);
    }
  }, [user, getSessionId]);

  // تسجيل إعجاب
  const trackLike = useCallback(async (articleId: string) => {
    try {
      const response = await fetch(`/api/interactions/${articleId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || getSessionId() })
      });
      
      if (response.ok) {
        trackBehavior('like', 'article', articleId);
      }
      
      return response.ok;
    } catch (error) {
      console.error('Failed to track like:', error);
      return false;
    }
  }, [user, getSessionId, trackBehavior]);

  // تسجيل حفظ (bookmark)
  const trackBookmark = useCallback(async (itemId: string, itemType: string = 'article') => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          itemId,
          itemType
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        trackBehavior('bookmark', itemType, itemId, { action: data.action });
      }
      
      return data;
    } catch (error) {
      console.error('Failed to track bookmark:', error);
      return null;
    }
  }, [user, trackBehavior]);

  // تسجيل مشاركة
  const trackShare = useCallback(async (itemId: string, platform: string) => {
    try {
      await trackBehavior('share', 'article', itemId, { platform });
      
      // يمكن أيضاً تسجيلها كتفاعل
      await fetch(`/api/interactions/${itemId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || getSessionId() })
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  }, [user, getSessionId, trackBehavior]);

  // تسجيل البحث
  const trackSearch = useCallback(async (query: string, results?: number) => {
    try {
      await trackBehavior('search', 'search-box', query, { 
        resultsCount: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }, [trackBehavior]);

  // تسجيل التمرير
  const trackScroll = useCallback(async (contentId: string, scrollDepth: number) => {
    try {
      await trackBehavior('scroll', 'article', contentId, { 
        scrollDepth,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track scroll:', error);
    }
  }, [trackBehavior]);

  // تسجيل وقت القراءة
  const trackReadingTime = useCallback(async (contentId: string, duration: number) => {
    try {
      await trackImpression(contentId, 'article', 'read', {
        duration,
        metadata: { completed: duration > 30 } // اعتبر المقال مقروءاً إذا قضى أكثر من 30 ثانية
      });
    } catch (error) {
      console.error('Failed to track reading time:', error);
    }
  }, [trackImpression]);

  // تتبع تلقائي لزيارة الصفحة
  useEffect(() => {
    trackBehavior('page_view', 'page', window.location.pathname);
  }, [trackBehavior]);

  return {
    trackImpression,
    trackBehavior,
    trackLike,
    trackBookmark,
    trackShare,
    trackSearch,
    trackScroll,
    trackReadingTime,
    sessionId: getSessionId()
  };
}

// Hook لتتبع المشاهدة التلقائية عند ظهور العنصر
export function useImpressionTracking(
  contentId: string,
  contentType: string,
  options?: { threshold?: number; rootMargin?: string }
) {
  const { trackImpression } = useTracking();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackImpression(contentId, contentType, 'view');
          observer.disconnect();
        }
      },
      {
        threshold: options?.threshold || 0.5,
        rootMargin: options?.rootMargin || '0px'
      }
    );

    const element = document.getElementById(`${contentType}-${contentId}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [contentId, contentType, trackImpression, options]);
}

// Hook لتتبع وقت القراءة
export function useReadingTimeTracking(contentId: string) {
  const { trackReadingTime } = useTracking();
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    const handleBeforeUnload = () => {
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      if (duration > 0) {
        trackReadingTime(contentId, duration);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      if (duration > 0) {
        trackReadingTime(contentId, duration);
      }
    };
  }, [contentId, trackReadingTime]);
} 