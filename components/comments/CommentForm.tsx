'use client';

import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  placeholder?: string;
  submitText?: string;
  initialValue?: string;
}

export default function CommentForm({ 
  onSubmit, 
  onCancel, 
  placeholder = 'اكتب تعليقك هنا...',
  submitText = 'إرسال التعليق',
  initialValue = ''
}: CommentFormProps) {
  const { darkMode } = useDarkModeContext();
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('الرجاء كتابة تعليق');
      return;
    }

    if (content.length < 3) {
      alert('التعليق قصير جداً');
      return;
    }

    if (content.length > 1000) {
      alert('التعليق طويل جداً (الحد الأقصى 1000 حرف)');
      return;
    }

    // إزالة التحذير المسبق - سيتم التحليل في الخادم
    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          disabled={isSubmitting}
          className={`w-full p-4 rounded-lg border resize-none transition-all ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400'
          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          rows={4}
        />
        
        {/* عداد الأحرف */}
        <div className={`absolute bottom-2 left-2 text-xs ${
          content.length > 900 
            ? 'text-red-500' 
            : darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {content.length} / 1000
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isSubmitting || !content.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {submitText}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            darkMode 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } active:scale-95`}
        >
          <X className="w-4 h-4" />
          إلغاء
        </button>
      </div>

      {/* تعليمات محدثة */}
      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>• يرجى الالتزام بآداب الحوار واحترام الآخرين</p>
        <p>• يتم تحليل التعليقات بالذكاء الاصطناعي لضمان جودة المحتوى</p>
        <p>• التعليقات المسيئة أو المخالفة سيتم رفضها تلقائياً</p>
      </div>
    </form>
  );
} 