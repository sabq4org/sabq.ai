'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FeedbackStats {
  total: number;
  by_type: Record<string, number>;
  with_notes: number;
  with_improvements: number;
  satisfaction_rate: number;
}

interface FeedbackItem {
  id: string;
  feedback: string;
  note?: string;
  improvement_suggestion?: string;
  created_at: string;
  reason_text: string;
}

interface FeedbackData {
  stats: FeedbackStats;
  recent_feedback: FeedbackItem[];
  timeframe: string;
  date_range: {
    start: string;
    end: string;
  };
}

export default function FeedbackDashboard() {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  useEffect(() => {
    fetchFeedbackData();
  }, [timeframe]);

  const fetchFeedbackData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/feedback/reason?timeframe=${timeframe}`);
      if (response.ok) {
        const feedbackData = await response.json();
        setData(feedbackData);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات التغذية الراجعة:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'clear':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'helpful':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'unclear':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'not_helpful':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFeedbackTypeLabel = (type: string) => {
    switch (type) {
      case 'clear': return 'واضح ومفيد';
      case 'helpful': return 'مفيد';
      case 'unclear': return 'غير واضح';
      case 'not_helpful': return 'غير مفيد';
      default: return type;
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'clear': return '✅';
      case 'helpful': return '👍';
      case 'unclear': return '❓';
      case 'not_helpful': return '👎';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">فشل في تحميل بيانات التغذية الراجعة</p>
        <Button onClick={fetchFeedbackData} className="mt-4">
          إعادة المحاولة
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان والفلاتر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 لوحة تحليل التغذية الراجعة</h1>
          <p className="text-gray-600 mt-1">تحليل آراء المستخدمين حول وضوح أسباب التوصيات</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="1d">آخر يوم</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
          </select>
          
          <Button
            onClick={fetchFeedbackData}
            variant="outline"
            size="sm"
            className="text-blue-600"
          >
            🔄 تحديث
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">إجمالي التغذية الراجعة</p>
              <p className="text-3xl font-bold text-gray-900">{data.stats.total}</p>
            </div>
            <div className="text-3xl">📝</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">معدل الرضا</p>
              <p className="text-3xl font-bold text-green-600">
                {data.stats.satisfaction_rate.toFixed(1)}%
              </p>
            </div>
            <div className="text-3xl">😊</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">تعليقات مفصلة</p>
              <p className="text-3xl font-bold text-blue-600">{data.stats.with_notes}</p>
            </div>
            <div className="text-3xl">💬</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">اقتراحات تحسين</p>
              <p className="text-3xl font-bold text-purple-600">{data.stats.with_improvements}</p>
            </div>
            <div className="text-3xl">💡</div>
          </div>
        </Card>
      </div>

      {/* التوزيع حسب نوع التغذية الراجعة */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📈 توزيع آراء المستخدمين</h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.stats.by_type).map(([type, count]) => {
            const percentage = data.stats.total > 0 ? (count / data.stats.total * 100).toFixed(1) : 0;
            
            return (
              <div
                key={type}
                className={`p-4 rounded-lg border ${getFeedbackTypeColor(type)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{getFeedbackTypeIcon(type)}</span>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <div className="text-sm font-medium">{getFeedbackTypeLabel(type)}</div>
                <div className="text-xs opacity-75">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* التعليقات الأخيرة */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💬 آخر التعليقات والاقتراحات</h2>
        
        {data.recent_feedback.length === 0 ? (
          <p className="text-gray-500 text-center py-8">لا توجد تعليقات مفصلة حتى الآن</p>
        ) : (
          <div className="space-y-4">
            {data.recent_feedback.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedFeedback(item)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getFeedbackTypeIcon(item.feedback)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeedbackTypeColor(item.feedback)}`}>
                      {getFeedbackTypeLabel(item.feedback)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('ar-SA')}
                  </span>
                </div>

                <div className="text-sm text-gray-700 mb-2">
                  <strong>سبب التوصية:</strong> {item.reason_text}
                </div>

                {item.note && (
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>تعليق المستخدم:</strong> {item.note}
                  </div>
                )}

                {item.improvement_suggestion && (
                  <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                    <strong>💡 اقتراح للتحسين:</strong> {item.improvement_suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* تفاصيل التغذية الراجعة المحددة */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">تفاصيل التغذية الراجعة</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع التقييم</label>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getFeedbackTypeColor(selectedFeedback.feedback)}`}>
                  {getFeedbackTypeIcon(selectedFeedback.feedback)}
                  {getFeedbackTypeLabel(selectedFeedback.feedback)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سبب التوصية</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                  {selectedFeedback.reason_text}
                </p>
              </div>

              {selectedFeedback.note && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تعليق المستخدم</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedFeedback.note}
                  </p>
                </div>
              )}

              {selectedFeedback.improvement_suggestion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اقتراح للتحسين</label>
                  <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded border border-blue-200">
                    💡 {selectedFeedback.improvement_suggestion}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الإرسال</label>
                <p className="text-sm text-gray-600">
                  {new Date(selectedFeedback.created_at).toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* معلومات إضافية */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">نصائح لتحسين التوصيات</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• راجع التعليقات التي تشير إلى عدم وضوح الأسباب</li>
              <li>• استخدم اقتراحات المستخدمين لتحسين صياغة أسباب التوصية</li>
              <li>• ركز على التوصيات التي تحصل على تقييم "غير مفيد" لتحسينها</li>
              <li>• اختبر صياغات مختلفة لأسباب التوصية وقس الأثر</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
} 