'use client';

import React from 'react';
import { 
  Users, Clock, Bot, Award,
  Zap, FileText, CheckCircle, XCircle,
  Activity
} from 'lucide-react';
import { SabqCard } from '@/components/ui/SabqCard';
import { SabqBadge } from '@/components/ui/SabqBadge';

interface EditorStat {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  articlesPublished: number;
  aiUsageCount: number;
  aiAcceptanceRate: number;
  avgWritingTime: number; // minutes
  peakHour: number;
  performance: 'excellent' | 'good' | 'average' | 'needs_improvement';
  lastActive: Date;
}

export default function EditorBehavior() {
  const editorStats: EditorStat[] = [
    {
      id: '1',
      name: 'عبدالله العتيبي',
      role: 'محرر رئيسي',
      articlesPublished: 23,
      aiUsageCount: 45,
      aiAcceptanceRate: 92,
      avgWritingTime: 35,
      peakHour: 10,
      performance: 'excellent',
      lastActive: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      id: '2',
      name: 'سارة المطيري',
      role: 'محررة',
      articlesPublished: 18,
      aiUsageCount: 32,
      aiAcceptanceRate: 78,
      avgWritingTime: 42,
      peakHour: 14,
      performance: 'good',
      lastActive: new Date(Date.now() - 45 * 60 * 1000)
    },
    {
      id: '3',
      name: 'محمد الشمري',
      role: 'مراسل',
      articlesPublished: 12,
      aiUsageCount: 8,
      aiAcceptanceRate: 45,
      avgWritingTime: 58,
      peakHour: 20,
      performance: 'needs_improvement',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ];

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'good': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'average': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'needs_improvement': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getPerformanceText = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'average': return 'متوسط';
      case 'needs_improvement': return 'يحتاج تحسين';
      default: return performance;
    }
  };

  const topAIUser = editorStats.reduce((prev, current) => 
    prev.aiUsageCount > current.aiUsageCount ? prev : current
  );

  const mostProductive = editorStats.reduce((prev, current) => 
    prev.articlesPublished > current.articlesPublished ? prev : current
  );

  return (
    <SabqCard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            سلوك المحررين
          </h2>
          <SabqBadge variant="info" size="sm">
            {editorStats.length} محرر نشط
          </SabqBadge>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                أكثر استخدامًا لـ AI
              </p>
            </div>
            <p className="font-semibold text-purple-900 dark:text-purple-100">
              {topAIUser.name}
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {topAIUser.aiUsageCount} طلب
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                الأكثر إنتاجية
              </p>
            </div>
            <p className="font-semibold text-green-900 dark:text-green-100">
              {mostProductive.name}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              {mostProductive.articlesPublished} مقال
            </p>
          </div>
        </div>

        {/* Editor Details */}
        <div className="space-y-3">
          {editorStats.map((editor) => (
            <div
              key={editor.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {editor.name}
                  </h4>
                  <p className="text-sm text-gray-500">{editor.role}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getPerformanceColor(editor.performance)}`}>
                  {getPerformanceText(editor.performance)}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">المقالات</p>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{editor.articlesPublished}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">استخدام AI</p>
                  <div className="flex items-center gap-1">
                    <Bot className="h-4 w-4 text-purple-400" />
                    <span className="font-medium">{editor.aiUsageCount}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">قبول AI</p>
                  <div className="flex items-center gap-1">
                    {editor.aiAcceptanceRate > 70 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{editor.aiAcceptanceRate}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">وقت الكتابة</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{editor.avgWritingTime}د</span>
                  </div>
                </div>
              </div>

              {/* AI Usage Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">كفاءة استخدام AI</span>
                  <span className="text-xs font-medium text-purple-600">
                    {Math.round((editor.aiAcceptanceRate * editor.aiUsageCount) / 100)} نتيجة مقبولة
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                    style={{ width: `${editor.aiAcceptanceRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Activity Status */}
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  آخر نشاط: {Math.floor((Date.now() - editor.lastActive.getTime()) / (1000 * 60))} دقيقة
                </span>
                <span>
                  ساعة الذروة: {editor.peakHour}:00
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Recommendation */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                توصية AI
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                يُنصح بتدريب المحررين ذوي معدل قبول AI المنخفض على استخدام الأدوات الذكية بشكل أفضل
              </p>
            </div>
          </div>
        </div>
      </div>
    </SabqCard>
  );
} 