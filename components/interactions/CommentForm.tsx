'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  submitting?: boolean;
  placeholder?: string;
  compact?: boolean;
  maxLength?: number;
  className?: string;
}

export function CommentForm({
  onSubmit,
  onCancel,
  submitting = false,
  placeholder = 'اكتب تعليقك هنا...',
  compact = false,
  maxLength = 2000,
  className = ''
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // تركيز تلقائي عند التركيب
  useEffect(() => {
    if (focused && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [focused]);

  // تحديث ارتفاع textarea تلقائياً
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // التحقق من صحة المحتوى
  const validateContent = (text: string): string => {
    if (!text.trim()) {
      return 'لا يمكن أن يكون التعليق فارغاً';
    }
    
    if (text.length > maxLength) {
      return `التعليق طويل جداً (الحد الأقصى ${maxLength} حرف)`;
    }
    
    if (text.length < 2) {
      return 'التعليق قصير جداً';
    }
    
    // فحص الكلمات المحظورة (أساسي)
    const bannedWords = ['كلمة محظورة']; // يمكن توسيعها
    const lowerContent = text.toLowerCase();
    const foundBannedWord = bannedWords.find(word => lowerContent.includes(word));
    
    if (foundBannedWord) {
      return 'التعليق يحتوي على كلمات غير مناسبة';
    }
    
    return '';
  };

  // إرسال التعليق
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateContent(content);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError('');
    
    try {
      await onSubmit(content);
      setContent('');
      setFocused(false);
    } catch (error) {
      setError('حدث خطأ في إرسال التعليق');
    }
  };

  // إلغاء التعليق
  const handleCancel = () => {
    setContent('');
    setError('');
    setFocused(false);
    onCancel?.();
  };

  // التعامل مع اختصارات لوحة المفاتيح
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
    
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const remainingChars = maxLength - content.length;
  const isNearLimit = remainingChars < 100;
  const isOverLimit = remainingChars < 0;

  return (
    <form onSubmit={handleSubmit} className={`${className}`}>
      <div className="flex gap-3">
        {/* صورة المستخدم */}
        {!compact && user && (
          <Avatar
            src={user.avatar_url}
            alt={user.name}
            size="md"
            className="flex-shrink-0"
          />
        )}

        <div className="flex-1">
          {/* حقل النص */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={submitting}
              className={`
                w-full p-3 border rounded-lg resize-none transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
                ${compact ? 'min-h-[80px]' : 'min-h-[120px]'}
                ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              rows={compact ? 3 : 4}
              dir="auto"
            />
            
            {/* عداد الأحرف */}
            {(focused || content) && (
              <div className={`
                absolute bottom-2 left-2 text-xs
                ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-gray-400'}
              `}>
                {remainingChars} حرف متبقي
              </div>
            )}
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* أزرار التحكم */}
          {(focused || content || compact) && (
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Ctrl + Enter للإرسال</span>
                {!compact && (
                  <span>• ESC للإلغاء</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {(onCancel || !compact) && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    إلغاء
                  </Button>
                )}
                
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !content.trim() || isOverLimit}
                  className="min-w-[80px]"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      إرسال...
                    </div>
                  ) : (
                    'إرسال'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* نصائح للمستخدم */}
          {focused && !compact && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-1">نصائح للتعليق:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• كن مهذباً واحترم الآخرين</li>
                <li>• تجنب الكلمات المسيئة أو المحتوى غير اللائق</li>
                <li>• أضف قيمة للنقاش</li>
                <li>• يمكنك تعديل تعليقك خلال 15 دقيقة من النشر</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </form>
  );
} 