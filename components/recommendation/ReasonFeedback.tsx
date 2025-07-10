'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { trackEvent, EventType } from '@/lib/analytics-core';

interface ReasonFeedbackProps {
  recommendationId: string;
  reasonText: string;
  reasonType: 'interest' | 'popular' | 'collaborative' | 'diversity' | 'freshness';
  userId?: string;
  articleId?: string;
  onFeedbackSubmit?: (feedback: FeedbackData) => void;
}

interface FeedbackData {
  recommendationId: string;
  reasonText: string;
  feedback: 'clear' | 'unclear' | 'helpful' | 'not_helpful';
  note?: string;
  improvement_suggestion?: string;
}

export default function ReasonFeedback({ 
  recommendationId, 
  reasonText, 
  reasonType,
  userId,
  articleId,
  onFeedbackSubmit 
}: ReasonFeedbackProps) {
  const [feedback, setFeedback] = useState<null | string>(null);
  const [note, setNote] = useState('');
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // تتبع عرض سبب التوصية
  useEffect(() => {
    trackEvent(EventType.FEATURE_USE, {
      feature: 'recommendation_reason_display',
      recommendationId,
      reasonType,
      userId,
      articleId
    });
  }, [recommendationId, reasonType, userId, articleId]);

  const sendFeedback = async (type: 'clear' | 'unclear' | 'helpful' | 'not_helpful') => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setFeedback(type);

    try {
      const feedbackData: FeedbackData = {
        recommendationId,
        reasonText,
        feedback: type,
        note: note.trim() || undefined,
        improvement_suggestion: improvementSuggestion.trim() || undefined
      };

      const response = await fetch('/api/feedback/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        // تتبع التغذية الراجعة
        trackEvent(EventType.FEATURE_USE, {
          feature: 'recommendation_reason_feedback',
          feedback: type,
          recommendationId,
          reasonType,
          hasNote: !!note.trim(),
          hasImprovement: !!improvementSuggestion.trim(),
          userId,
          articleId
        });

        setShowThankYou(true);
        onFeedbackSubmit?.(feedbackData);

        // إخفاء رسالة الشكر بعد 3 ثوان
        setTimeout(() => setShowThankYou(false), 3000);
      } else {
        throw new Error('فشل في إرسال التغذية الراجعة');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      setFeedback(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReasonIcon = () => {
    switch (reasonType) {
      case 'interest': return '🎯';
      case 'popular': return '🔥';
      case 'collaborative': return '👥';
      case 'diversity': return '🌈';
      case 'freshness': return '✨';
      default: return '💡';
    }
  };

  const getReasonColor = () => {
    switch (reasonType) {
      case 'interest': return 'text-blue-600 bg-blue-50';
      case 'popular': return 'text-red-600 bg-red-50';
      case 'collaborative': return 'text-green-600 bg-green-50';
      case 'diversity': return 'text-purple-600 bg-purple-50';
      case 'freshness': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getReasonTitle = () => {
    switch (reasonType) {
      case 'interest': return 'يطابق اهتماماتك';
      case 'popular': return 'الأكثر شيوعاً';
      case 'collaborative': return 'يعجب المستخدمين المشابهين';
      case 'diversity': return 'اكتشف محتوى جديد';
      case 'freshness': return 'محتوى حديث';
      default: return 'توصية ذكية';
    }
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {/* سبب التوصية */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{getReasonIcon()}</span>
          <span className={`text-sm font-medium px-2 py-1 rounded-full ${getReasonColor()}`}>
            {getReasonTitle()}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 mb-2">
          {reasonText}
        </div>

        {/* زر التفاصيل */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showDetails ? '🔽 إخفاء التفاصيل' : '🔼 عرض التفاصيل'}
        </Button>
      </div>

      {/* التفاصيل المطولة */}
      {showDetails && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="space-y-2">
            <div><strong>نوع التوصية:</strong> {getReasonTitle()}</div>
            <div><strong>السبب التفصيلي:</strong> {reasonText}</div>
            <div><strong>معرف التوصية:</strong> <code className="bg-gray-200 px-1 rounded">{recommendationId}</code></div>
          </div>
        </div>
      )}

      {/* أزرار التغذية الراجعة */}
      {!feedback && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">هل هذا السبب مفيد وواضح؟</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendFeedback('clear')}
              disabled={isSubmitting}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              ✅ واضح ومفيد
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendFeedback('unclear')}
              disabled={isSubmitting}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              ❓ غير واضح
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendFeedback('helpful')}
              disabled={isSubmitting}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              👍 مفيد
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendFeedback('not_helpful')}
              disabled={isSubmitting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              👎 غير مفيد
            </Button>
          </div>
        </div>
      )}

      {/* حقول الإدخال للتغذية الراجعة */}
      {feedback && (feedback === 'unclear' || feedback === 'not_helpful') && !showThankYou && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              لماذا تعتبر هذا السبب {feedback === 'unclear' ? 'غير واضح' : 'غير مفيد'}؟
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={2}
              placeholder="اشرح السبب..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {note.length}/200 حرف
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كيف يمكننا تحسين أسباب التوصية؟
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={2}
              placeholder="اقتراحاتك لتحسين التوصيات..."
              value={improvementSuggestion}
              onChange={(e) => setImprovementSuggestion(e.target.value)}
              maxLength={300}
            />
            <div className="text-xs text-gray-500 mt-1">
              {improvementSuggestion.length}/300 حرف
            </div>
          </div>
        </div>
      )}

      {/* رسالة الشكر */}
      {showThankYou && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <span className="text-lg">🙏</span>
            <span className="text-sm font-medium">شكراً لك على التغذية الراجعة!</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            ملاحظتك تساعدنا في تحسين جودة التوصيات لجميع المستخدمين.
          </p>
        </div>
      )}

      {/* مؤشر الإرسال */}
      {isSubmitting && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>جاري إرسال التغذية الراجعة...</span>
        </div>
      )}

      {/* تأكيد الإرسال */}
      {feedback && !showThankYou && !isSubmitting && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="text-green-600">✓</span> تم إرسال تقييمك بنجاح
        </div>
      )}
    </div>
  );
} 