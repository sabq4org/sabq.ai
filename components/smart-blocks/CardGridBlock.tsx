'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Eye, Coffee } from 'lucide-react';

interface CardGridBlockProps {
  block: any;
  articles: any[];
}

export function CardGridBlock({ block, articles }: CardGridBlockProps) {
  const displayArticles = articles.slice(0, block.articlesCount || 1);
  
  // دالة لتنسيق التاريخ
  const formatDate = (dateString: string) => {
    if (!dateString) return 'تاريخ غير محدد';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      
      if (diffMinutes < 60) {
        return `منذ ${diffMinutes} دقيقة`;
      } else if (diffMinutes < 1440) { // أقل من 24 ساعة
        const hours = Math.floor(diffMinutes / 60);
        return `منذ ${hours} ${hours === 1 ? 'ساعة' : hours < 11 ? 'ساعات' : 'ساعة'}`;
      } else {
        const days = Math.floor(diffMinutes / 1440);
        if (days === 1) return 'منذ يوم';
        if (days < 7) return `منذ ${days} أيام`;
        return date.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      return 'تاريخ غير صحيح';
    }
  };

  // إذا لم تكن هناك مقالات، لا نعرض البلوك
  if (displayArticles.length === 0) {
    return null;
  }

  const article = displayArticles[0]; // نعرض مقال واحد فقط

  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-300">
        {/* Header مدمج داخل البلوك */}
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-3">
          <Coffee className="w-4 h-4" />
          <span className="font-bold">يوم القهوة العالمي</span>
        </div>
        
        {/* محتوى المقال */}
        <Link href={`/article/${article.id}`} className="block group">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold leading-snug text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {article.title}
            </h3>
            
            {article.excerpt && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>
            )}
            
            {/* معلومات إضافية */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(article.publishedAt || article.published_at || article.created_at)}
              </span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.views || 0} مشاهدة
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
} 