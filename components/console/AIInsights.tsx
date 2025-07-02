'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, AlertTriangle, Lightbulb, 
  Target, Award, Sparkles, ChevronRight
} from 'lucide-react';
import { SabqCard } from '@/components/ui/SabqCard';
import { SabqButton } from '@/components/ui/SabqButton';

interface AIInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'opportunity' | 'achievement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  metadata?: any;
  timestamp: Date;
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'recommendation': return Lightbulb;
    case 'warning': return AlertTriangle;
    case 'opportunity': return Target;
    case 'achievement': return Award;
    default: return Brain;
  }
};

const getInsightColor = (type: string) => {
  switch (type) {
    case 'recommendation': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    case 'opportunity': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    case 'achievement': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
    default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  }
};

export default function AIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // محاكاة رؤى AI - في الواقع ستأتي من API
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'recommendation',
        priority: 'high',
        title: 'أفضل وقت للنشر اليوم',
        description: 'بناءً على تحليل البيانات، الساعة 8:30 مساءً هي الوقت الأمثل لنشر المحتوى اليوم. متوقع زيادة التفاعل بنسبة 45%',
        action: {
          label: 'جدولة المحتوى',
          href: '/dashboard/schedule'
        },
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'warning',
        priority: 'medium',
        title: 'انخفاض في جودة العناوين',
        description: 'لاحظنا انخفاضًا بنسبة 23% في معدل النقر على العناوين هذا الأسبوع. ننصح بمراجعة استراتيجية كتابة العناوين',
        action: {
          label: 'عرض التحليل',
          href: '/dashboard/analytics/titles'
        },
        metadata: {
          affected_articles: 12,
          average_ctr: '2.3%'
        },
        timestamp: new Date()
      },
      {
        id: '3',
        type: 'opportunity',
        priority: 'high',
        title: 'موضوع ساخن: الذكاء الاصطناعي',
        description: 'رصدنا اهتمامًا متزايدًا بمواضيع الذكاء الاصطناعي. التغطية الآن قد تحقق 3x من المشاهدات المعتادة',
        action: {
          label: 'إنشاء مقال',
          href: '/dashboard/articles/new?topic=ai'
        },
        metadata: {
          trend_score: 94,
          competing_articles: 3
        },
        timestamp: new Date()
      },
      {
        id: '4',
        type: 'achievement',
        priority: 'low',
        title: 'إنجاز: أسرع وقت استجابة',
        description: 'حقق فريق التحرير أسرع وقت استجابة لخبر عاجل (3 دقائق). ممتاز!',
        metadata: {
          team: 'فريق الأخبار العاجلة',
          previous_record: '5 دقائق'
        },
        timestamp: new Date()
      },
      {
        id: '5',
        type: 'recommendation',
        priority: 'medium',
        title: 'تحسين SEO مطلوب',
        description: '15 مقالاً يحتاجون تحسين الكلمات المفتاحية. يمكن زيادة الزيارات العضوية بنسبة 30%',
        action: {
          label: 'بدء التحسين',
          href: '/dashboard/seo/optimize'
        },
        timestamp: new Date()
      }
    ];

    setInsights(mockInsights);
  }, []);

  // Auto-rotate insights
  useEffect(() => {
    if (insights.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [insights.length]);

  if (insights.length === 0) {
    return null;
  }

  const currentInsight = insights[currentIndex];
  const Icon = getInsightIcon(currentInsight.type);
  const colorClass = getInsightColor(currentInsight.type);

  return (
    <SabqCard className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
      <div className="relative p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-lg ${colorClass} flex-shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {currentInsight.title}
                  </h3>
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  {currentInsight.priority === 'high' && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">
                      مهم
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentInsight.description}
                </p>
              </div>

              {/* Action Button */}
              {currentInsight.action && (
                <SabqButton variant="secondary" size="sm" className="ml-4">
                  {currentInsight.action.label}
                  <ChevronRight className="h-3 w-3 mr-1" />
                </SabqButton>
              )}
            </div>

            {/* Metadata */}
            {currentInsight.metadata && (
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {Object.entries(currentInsight.metadata).map(([key, value]) => (
                  <span key={key}>
                    {key.replace(/_/g, ' ')}: <strong>{value as string}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center gap-1 mt-4 justify-center">
          {insights.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-blue-600' 
                  : 'w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </SabqCard>
  );
} 