'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Target, 
  Sparkles,
  ChevronRight,
  Activity,
  BarChart3,
  Brain,
  Calendar
} from 'lucide-react';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';

interface DashboardFooterProps {
  userId?: string;
  onInteraction?: (type: string, data: any) => void;
}

interface Analytics {
  overview: {
    totalImpressions: number;
    totalInteractions: number;
    uniqueArticlesRead: number;
    totalReadingTime: number;
    averageScrollDepth: number;
    completionRate: number;
  };
  readingPatterns: {
    byDayOfWeek: Record<string, number>;
    byHourOfDay: Record<number, number>;
    averageDuration: number;
  };
  categoryInsights: Array<{
    category: string;
    impressions: number;
    totalTime: number;
    completionRate: number;
  }>;
  recommendations: {
    optimalReadingTime?: {
      timeRange: string;
      completionRate: number;
    };
    suggestedCategories: Array<{
      category: string;
      reason: string;
      score: number;
    }>;
    engagementTips: Array<{
      type: string;
      message: string;
      priority: string;
    }>;
  };
}

interface Recommendations {
  recommendations: Array<{
    id: string;
    title: string;
    excerpt: string;
    category: {
      name: string;
      color: string;
    };
    readingTime: number;
  }>;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardFooter({ userId, onInteraction }: DashboardFooterProps) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations' | 'patterns'>('insights');
  
  // جلب التحليلات
  const { data: analyticsData, error: analyticsError } = useSWR(
    effectiveUserId ? `/api/analytics/behavior?userId=${effectiveUserId}&period=7d` : null,
    fetcher,
    { refreshInterval: 300000 } // تحديث كل 5 دقائق
  );
  
  // جلب التوصيات
  const { data: recommendationsData, error: recommendationsError } = useSWR(
    effectiveUserId ? `/api/recommendations?userId=${effectiveUserId}&limit=5&includeReasons=true` : null,
    fetcher,
    { refreshInterval: 600000 } // تحديث كل 10 دقائق
  );
  
  const analytics: Analytics | null = analyticsData?.analytics || null;
  const recommendations = recommendationsData?.recommendations || [];
  
  // تحويل الوقت إلى صيغة مقروءة
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
    return `${minutes} دقيقة`;
  };
  
  // إيجاد أكثر الأوقات نشاطاً
  const getMostActiveTime = () => {
    if (!analytics?.readingPatterns.byHourOfDay) return null;
    
    const entries = Object.entries(analytics.readingPatterns.byHourOfDay);
    if (entries.length === 0) return null;
    
    const sorted = entries.sort(([, a], [, b]) => b - a);
    const hour = parseInt(sorted[0][0]);
    
    return `${hour}:00 - ${hour + 1}:00`;
  };
  
  // إيجاد الفئة المفضلة
  const getFavoriteCategory = () => {
    if (!analytics?.categoryInsights || analytics.categoryInsights.length === 0) {
      return null;
    }
    return analytics.categoryInsights[0];
  };
  
  if (!effectiveUserId || analyticsError || recommendationsError) {
    return null;
  }
  
  if (!analytics) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 bg-gray-300 rounded"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* العنوان والتبويبات */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <Brain className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              مساعدك الذكي للقراءة
            </h2>
          </div>
          
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'insights'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              إحصائيات
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'recommendations'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              مقترحات
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'patterns'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              أنماط القراءة
            </button>
          </div>
        </div>
        
        {/* المحتوى حسب التبويب النشط */}
        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* بطاقة ملخص القراءة */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <span className="text-xs text-gray-500">آخر 7 أيام</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ملخص القراءة
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">مقالات مقروءة</span>
                  <span className="text-sm font-medium">{analytics.overview.uniqueArticlesRead}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">وقت القراءة الكلي</span>
                  <span className="text-sm font-medium">{formatDuration(analytics.overview.totalReadingTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">معدل الإكمال</span>
                  <span className="text-sm font-medium">{Math.round(analytics.overview.completionRate * 100)}%</span>
                </div>
              </div>
            </div>
            
            {/* بطاقة الوقت المفضل */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                أفضل وقت للقراءة
              </h3>
              <div className="space-y-3">
                {analytics.recommendations.optimalReadingTime ? (
                  <>
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.recommendations.optimalReadingTime.timeRange}
                    </div>
                    <p className="text-sm text-gray-600">
                      معدل إكمال القراءة: {analytics.recommendations.optimalReadingTime.completionRate}%
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    لا توجد بيانات كافية بعد
                  </p>
                )}
              </div>
            </div>
            
            {/* بطاقة الفئة المفضلة */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-6 h-6 text-green-600" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                اهتماماتك الأساسية
              </h3>
              {getFavoriteCategory() ? (
                <div className="space-y-2">
                  <div className="text-xl font-bold text-green-600">
                    {getFavoriteCategory()!.category}
                  </div>
                  <p className="text-sm text-gray-600">
                    {getFavoriteCategory()!.impressions} مقالة مقروءة
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${getFavoriteCategory()!.completionRate * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  ابدأ بقراءة المقالات لتحديد اهتماماتك
                </p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {/* نصائح التفاعل */}
            {analytics.recommendations.engagementTips.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">نصيحة لتحسين تجربتك</h4>
                    <p className="text-sm text-blue-700">
                      {analytics.recommendations.engagementTips[0].message}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* قائمة المقالات المقترحة */}
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              مقترحات مخصصة لك
            </h3>
            
            {recommendations.length > 0 ? (
              <div className="grid gap-3">
                {recommendations.map((rec: any) => (
                  <a
                    key={rec.article.id}
                    href={`/article/${rec.article.id}`}
                    onClick={() => onInteraction?.('recommendation_click', { articleId: rec.article.id })}
                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                          {rec.article.title}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span 
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ 
                              backgroundColor: rec.article.category?.color + '20',
                              color: rec.article.category?.color 
                            }}
                          >
                            {rec.article.category?.name}
                          </span>
                          <span>{rec.article.readingTime} دقائق</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{rec.reason}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  اقرأ المزيد من المقالات لنتمكن من تقديم توصيات مخصصة
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'patterns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* رسم بياني لأنماط القراءة حسب اليوم */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">نشاطك خلال الأسبوع</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(analytics.readingPatterns.byDayOfWeek || {}).map(([day, count]) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{day}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(analytics.readingPatterns.byDayOfWeek))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* إحصائيات سرعة القراءة */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">نمط قراءتك</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">متوسط وقت القراءة</span>
                    <span className="font-medium">{formatDuration(analytics.readingPatterns.averageDuration)}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">سرعة القراءة</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">
                        {analytics.readingPatterns.readingSpeed?.fast || 0}
                      </div>
                      <div className="text-xs text-gray-600">سريع</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-600">
                        {analytics.readingPatterns.readingSpeed?.normal || 0}
                      </div>
                      <div className="text-xs text-gray-600">متوسط</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="text-lg font-bold text-purple-600">
                        {analytics.readingPatterns.readingSpeed?.slow || 0}
                      </div>
                      <div className="text-xs text-gray-600">متأني</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 