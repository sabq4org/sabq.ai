'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface ReportButtonProps {
  commentId: string;
  disabled?: boolean;
  className?: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description?: string) => void;
  submitting: boolean;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'رسائل مزعجة أو إعلانات' },
  { value: 'inappropriate', label: 'محتوى غير لائق' },
  { value: 'offensive', label: 'محتوى مسيء أو مهين' },
  { value: 'harassment', label: 'تحرش أو تنمر' },
  { value: 'misinformation', label: 'معلومات خاطئة أو مضللة' },
  { value: 'other', label: 'أسباب أخرى' }
];

function ReportModal({ isOpen, onClose, onSubmit, submitting }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    
    onSubmit(selectedReason, description.trim() || undefined);
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="تبليغ عن التعليق">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            سبب التبليغ *
          </label>
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <label key={reason.value} className="flex items-center">
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{reason.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            تفاصيل إضافية (اختياري)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="اكتب تفاصيل إضافية حول سبب التبليغ..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="mt-1 text-xs text-gray-500">
            {500 - description.length} حرف متبقي
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">تنبيه:</p>
              <p>التبليغات الكاذبة قد تؤدي إلى تقييد حسابك. يرجى التبليغ فقط عن المحتوى الذي ينتهك فعلاً قوانين المنصة.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={!selectedReason || submitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال التبليغ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ReportButton({ commentId, disabled = false, className = '' }: ReportButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);

  const handleReport = async (reason: string, description?: string) => {
    if (!isAuthenticated) {
      alert('يجب تسجيل الدخول للتبليغ');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, description })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إرسال التبليغ');
      }

      setReported(true);
      setIsModalOpen(false);
      
      // إظهار رسالة نجاح
      alert('تم إرسال التبليغ بنجاح. سيتم مراجعته من قبل فريق الإدارة.');
    } catch (error) {
      console.error('Error reporting comment:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ في إرسال التبليغ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || disabled) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        disabled={reported}
        className={`
          text-gray-500 hover:text-red-500 transition-colors duration-200
          ${reported ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {reported ? 'تم التبليغ' : 'تبليغ'}
      </Button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReport}
        submitting={submitting}
      />
    </>
  );
} 