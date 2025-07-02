'use client';

import React, { useState } from 'react';
import { Bookmark, Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface SavedArticle {
  id: string;
  title: string;
  category?: string;
  savedAt: string;
}

interface UnfinishedArticle {
  id: string;
  title: string;
  category?: string;
  readingTime: number;
  excerpt?: string;
}

interface Props {
  savedArticles: SavedArticle[];
  unfinishedArticles: UnfinishedArticle[];
}

export default function SavedArticles({ savedArticles, unfinishedArticles }: Props) {
  const [showSaved, setShowSaved] = useState(true);
  const [showUnfinished, setShowUnfinished] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'أمس';
    if (diffDays === 0) return 'اليوم';
    if (diffDays < 7) return `قبل ${diffDays} أيام`;
    if (diffDays < 30) return `قبل ${Math.floor(diffDays / 7)} أسابيع`;
    return `قبل ${Math.floor(diffDays / 30)} أشهر`;
  };

  return (
    <div className="space-y-6">
      {/* المقالات المحفوظة */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <button
          onClick={() => setShowSaved(!showSaved)}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-500" />
            المقالات المحفوظة
            <span className="text-sm text-gray-500">({savedArticles.length})</span>
          </h3>
          {showSaved ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showSaved && (
          <div className="space-y-3">
            {savedArticles.length > 0 ? (
              savedArticles.slice(0, 5).map((article) => (
                <div
                  key={article.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                      {article.category && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {article.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        {formatDate(article.savedAt)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/article/${article.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    قراءة
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">لا توجد مقالات محفوظة</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  احفظ المقالات التي تريد قراءتها لاحقاً
                </p>
              </div>
            )}

            {savedArticles.length > 5 && (
              <div className="text-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/saved-articles"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  عرض جميع المقالات المحفوظة ({savedArticles.length})
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* المقالات غير المكتملة */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <button
          onClick={() => setShowUnfinished(!showUnfinished)}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            المقالات غير المكتملة
            <span className="text-sm text-gray-500">({unfinishedArticles.length})</span>
          </h3>
          {showUnfinished ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showUnfinished && (
          <div className="space-y-3">
            {unfinishedArticles.length > 0 ? (
              unfinishedArticles.slice(0, 3).map((article) => (
                <div
                  key={article.id}
                  className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">
                      {article.title}
                    </h4>
                    {article.excerpt && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                      {article.category && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          {article.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readingTime} دقيقة مقروءة
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/article/${article.id}`}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
                  >
                    إكمال
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">لا توجد مقالات غير مكتملة</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  أحسنت! أكملت قراءة جميع المقالات
                </p>
              </div>
            )}

            {unfinishedArticles.length > 3 && (
              <div className="text-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/unfinished-articles"
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
                >
                  عرض جميع المقالات غير المكتملة ({unfinishedArticles.length})
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 