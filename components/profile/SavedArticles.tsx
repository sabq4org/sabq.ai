'use client';

import React, { useState } from 'react';
import { Bookmark, Clock, Eye, AlertCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'saved' | 'unfinished'>('saved');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* التبويبات */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'saved'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Bookmark className="w-4 h-4" />
            مقالات محفوظة ({savedArticles.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('unfinished')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'unfinished'
              ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50 dark:bg-orange-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            لم تكتمل ({unfinishedArticles.length})
          </div>
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'saved' ? (
          <div className="space-y-3">
            {savedArticles.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">لا توجد مقالات محفوظة</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  احفظ المقالات المهمة لقراءتها لاحقاً
                </p>
              </div>
            ) : (
              savedArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.id}`}
                  className="block p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <h4 className="font-medium mb-2 line-clamp-2">{article.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {article.category && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {typeof article.category === 'string' ? article.category : ((article.category as any)?.name_ar || (article.category as any)?.name || 'عام')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Bookmark className="w-3 h-3" />
                      {new Date(article.savedAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {unfinishedArticles.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">رائع! أكملت جميع قراءاتك</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  استمر في القراءة والتفاعل
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    💡 هذه المقالات بدأت قراءتها ولكن لم تكملها. أكمل القراءة لكسب نقاط إضافية!
                  </p>
                </div>
                {unfinishedArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
                    className="block p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <h4 className="font-medium mb-2 line-clamp-2">{article.title}</h4>
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {article.category && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          {typeof article.category === 'string' ? article.category : ((article.category as any)?.name_ar || (article.category as any)?.name || 'عام')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readingTime} دقيقة للإكمال
                      </span>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 