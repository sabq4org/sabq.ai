"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '../../lib/analytics-tracker';

interface AnalyticsProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export default function AnalyticsProvider({ children, userId }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const startTime = useRef<number>(Date.now());
  const lastPath = useRef<string>('');

  // تتبع تغيير الصفحة
  useEffect(() => {
    // تتبع مغادرة الصفحة السابقة
    if (lastPath.current && lastPath.current !== pathname) {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);
      analytics.trackPageExit({
        previousPath: lastPath.current,
        timeOnPage
      });
    }

    // تتبع الصفحة الجديدة
    startTime.current = Date.now();
    lastPath.current = pathname;
    
    analytics.trackPageView({
      path: pathname,
      title: document.title,
      referrer: document.referrer
    });
  }, [pathname]);

  // تحديث معرف المستخدم
  useEffect(() => {
    if (userId) {
      analytics.setUserId(userId);
    }
  }, [userId]);

  // تنظيف عند الخروج من الصفحة
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);
      analytics.trackPageExit({
        path: pathname,
        timeOnPage
      });
      analytics.flushEvents();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pathname]);

  return <>{children}</>;
} 