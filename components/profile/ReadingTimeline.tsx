'use client';

import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineEntry {
  date: string;
  articlesCount: number;
  totalReadingTime: number;
  articles: Array<{
    time: string;
    title: string;
    category: string;
    readingTime: number;
  }>;
}

interface Props {
  timeline: TimelineEntry[];
}

export default function ReadingTimeline({ timeline }: Props) {
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const getDateEmoji = (date: string) => {
    const today = new Date().toLocaleDateString('ar-SA');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('ar-SA');
    
    if (date === today) return '📅';
    if (date === yesterday) return '📆';
    return '🗓️';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-indigo-500" />
        سجل رحلتك القرائية
      </h3>

      <div className="space-y-4">
        {timeline.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">لا توجد قراءات مسجلة بعد</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              ابدأ رحلتك القرائية اليوم!
            </p>
          </div>
        ) : (
          timeline.map((entry) => (
            <div
              key={entry.date}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleDate(entry.date)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getDateEmoji(entry.date)}</span>
                  <div className="text-right">
                    <div className="font-medium">{entry.date}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.articlesCount} مقال • {entry.totalReadingTime} دقيقة
                    </div>
                  </div>
                </div>
                {expandedDates.includes(entry.date) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedDates.includes(entry.date) && (
                <div className="p-4 space-y-3">
                  {entry.articles.map((article, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
                        {article.time}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{article.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            {typeof article.category === 'string' ? article.category : ((article.category as any)?.name_ar || (article.category as any)?.name || 'عام')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readingTime} دقيقة
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {timeline.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="font-medium text-indigo-900 dark:text-indigo-200">
                إجمالي القراءة: {timeline.reduce((sum, e) => sum + e.articlesCount, 0)} مقال
              </p>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                وقت القراءة الكلي: {timeline.reduce((sum, e) => sum + e.totalReadingTime, 0)} دقيقة
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 