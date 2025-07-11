"use client";

import { useEffect, useRef, useState } from 'react';
import { analytics } from '../../lib/analytics-tracker';

interface ArticleTrackerProps {
  articleId: string;
  title: string;
  children: React.ReactNode;
}

export default function ArticleTracker({ articleId, title, children }: ArticleTrackerProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const startTime = useRef<number>(Date.now());
  const lastProgressReported = useRef<number>(0);
  const scrollDepthReported = useRef<number>(0);

  // تتبع تقدم القراءة والتمرير
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.round((scrollTop / docHeight) * 100);
      
      setReadingProgress(progress);

      // تتبع تقدم القراءة كل 25%
      if (progress >= lastProgressReported.current + 25) {
        analytics.trackReadingProgress(articleId, progress);
        lastProgressReported.current = progress;
      }

      // تتبع عمق التمرير كل 50%
      if (progress >= scrollDepthReported.current + 50) {
        analytics.trackScroll({
          articleId,
          scrollDepth: progress,
          scrollY: scrollTop
        });
        scrollDepthReported.current = progress;
      }
    };

    // تتبع أحداث التفاعل
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // تتبع نقرات خاصة بالمقال
      if (target.closest('[data-track="like"]')) {
        analytics.trackArticleInteraction(articleId, 'like');
      } else if (target.closest('[data-track="share"]')) {
        analytics.trackArticleInteraction(articleId, 'share');
      } else if (target.closest('[data-track="comment"]')) {
        analytics.trackArticleInteraction(articleId, 'comment');
      } else if (target.closest('[data-track="bookmark"]')) {
        analytics.trackArticleInteraction(articleId, 'bookmark');
      }
    };

    // تتبع تحديد النص
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 10) {
        analytics.trackEvent('text_selection', {
          articleId,
          selectedText: selection.toString().substring(0, 100),
          selectionLength: selection.toString().length
        });
      }
    };

    // إضافة مستمعي الأحداث
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick);
    document.addEventListener('mouseup', handleTextSelection);

    // تتبع بداية قراءة المقال
    analytics.trackEvent('article_start_reading', {
      articleId,
      title,
      timestamp: new Date().toISOString()
    });

    return () => {
      // تتبع وقت القراءة عند الخروج
      const readingTime = Math.round((Date.now() - startTime.current) / 1000);
      analytics.trackReadingTime(articleId, readingTime);
      
      // تتبع انتهاء قراءة المقال
      analytics.trackEvent('article_end_reading', {
        articleId,
        title,
        readingTime,
        finalProgress: readingProgress,
        timestamp: new Date().toISOString()
      });

      // إزالة مستمعي الأحداث
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [articleId, title, readingProgress]);

  // تتبع الوقت المقضي في القراءة كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Math.round((Date.now() - startTime.current) / 1000);
      if (currentTime >= 30) {
        analytics.trackEvent('reading_checkpoint', {
          articleId,
          timeSpent: currentTime,
          progress: readingProgress
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [articleId, readingProgress]);

  return (
    <div className="relative">
      {/* شريط تقدم القراءة */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* المحتوى */}
      <div className="article-content">
        {children}
      </div>

      {/* أزرار التفاعل مع تتبع الأحداث */}
      <div className="fixed bottom-4 right-4 flex flex-col space-y-2 z-40">
        <button
          data-track="like"
          className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
          title="إعجاب"
        >
          ❤️
        </button>
        <button
          data-track="share"
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          title="مشاركة"
        >
          📤
        </button>
        <button
          data-track="bookmark"
          className="bg-yellow-500 text-white p-3 rounded-full shadow-lg hover:bg-yellow-600 transition-colors"
          title="حفظ"
        >
          🔖
        </button>
        <button
          data-track="comment"
          className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors"
          title="تعليق"
        >
          💬
        </button>
      </div>

      {/* مؤشر تقدم القراءة */}
      <div className="fixed bottom-4 left-4 bg-white rounded-full shadow-lg p-2 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 relative">
            <svg className="w-8 h-8 transform -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-300"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - readingProgress / 100)}`}
                className="text-blue-600 transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {readingProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 