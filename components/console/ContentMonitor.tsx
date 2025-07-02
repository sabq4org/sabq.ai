'use client';

import React from 'react';
import { 
  FileText, TrendingUp, TrendingDown, Edit3, 
  AlertCircle, Clock, Eye,
  MessageSquare, BarChart3
} from 'lucide-react';
import { SabqCard } from '@/components/ui/SabqCard';
import { SabqBadge } from '@/components/ui/SabqBadge';

interface ContentStat {
  id: string;
  title: string;
  author: string;
  section: string;
  publishedAt: Date;
  views: number;
  engagement: number;
  aiScore: number;
  status: 'trending' | 'normal' | 'declining';
  editCount: number;
  comments: number;
}

export default function ContentMonitor() {
  // محاكاة البيانات
  const contentStats: ContentStat[] = [
    {
      id: '1',
      title: 'إطلاق مشروع نيوم الجديد يجذب اهتمام المستثمرين',
      author: 'سارة المطيري',
      section: 'اقتصاد',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      views: 15432,
      engagement: 89.5,
      aiScore: 94,
      status: 'trending',
      editCount: 2,
      comments: 234
    },
    {
      id: '2',
      title: 'الأخضر السعودي يستعد لمواجهة مصيرية',
      author: 'محمد العتيبي',
      section: 'رياضة',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      views: 8921,
      engagement: 67.3,
      aiScore: 82,
      status: 'normal',
      editCount: 1,
      comments: 156
    },
    {
      id: '3',
      title: 'تحديث جديد لتطبيق أبشر يثير الجدل',
      author: 'خالد السالم',
      section: 'تقنية',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      views: 3245,
      engagement: 42.1,
      aiScore: 71,
      status: 'declining',
      editCount: 4,
      comments: 45
    }
  ];

  const totalArticles = 147;
  const articlesWithAI = 89;
  const avgEngagement = 71.2;
  const failedPublish = 3;

  return (
    <SabqCard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            مراقبة المحتوى
          </h2>
          <SabqBadge variant="info" size="sm">
            آخر 24 ساعة
          </SabqBadge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalArticles}</p>
            <p className="text-xs text-gray-500">مقال منشور</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{articlesWithAI}</p>
            <p className="text-xs text-gray-500">بمساعدة AI</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{avgEngagement}%</p>
            <p className="text-xs text-gray-500">متوسط التفاعل</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{failedPublish}</p>
            <p className="text-xs text-gray-500">فشل في النشر</p>
          </div>
        </div>

        {/* Top Content */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            المحتوى الأكثر تفاعلاً
          </h3>
          
          {contentStats.map((content) => (
            <div
              key={content.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                    {content.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{content.author}</span>
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                      {content.section}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor((Date.now() - content.publishedAt.getTime()) / (1000 * 60 * 60))} ساعة
                    </span>
                  </div>
                </div>
                
                {content.status === 'trending' && (
                  <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
                {content.status === 'declining' && (
                  <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-5 gap-2 mt-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
                    <Eye className="h-3 w-3" />
                    <span className="text-xs font-medium">{(content.views / 1000).toFixed(1)}K</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
                    <BarChart3 className="h-3 w-3" />
                    <span className="text-xs font-medium">{content.engagement}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600">
                    <span className="text-xs font-medium">AI: {content.aiScore}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
                    <MessageSquare className="h-3 w-3" />
                    <span className="text-xs font-medium">{content.comments}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
                    <Edit3 className="h-3 w-3" />
                    <span className="text-xs font-medium">{content.editCount}</span>
                  </div>
                </div>
              </div>

              {/* AI Score Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">جودة المحتوى (AI)</span>
                  <span className="text-xs font-medium text-purple-600">{content.aiScore}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full"
                    style={{ width: `${content.aiScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Failed Content Alert */}
        {failedPublish > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {failedPublish} مقالات فشلت في النشر - تحتاج مراجعة
              </p>
            </div>
          </div>
        )}
      </div>
    </SabqCard>
  );
} 