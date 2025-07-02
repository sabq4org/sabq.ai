'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { SabqButton, SabqCard } from '@/components/ui';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  articleId: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  articleId,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md">
      <div className="animate-fadeIn">
        <SabqCard className="w-full max-w-lg mx-4 relative shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">تأكيد الحذف</h3>
                  <p className="text-red-100 text-sm">عملية لا يمكن التراجع عنها</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* محتوى النافذة */}
            <div className="mb-6 text-right">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-800 font-semibold mb-2">
                      ⚠️ هل أنت متأكد من حذف هذا المقال؟
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      سيتم حذف المقال نهائياً من قاعدة البيانات ولن تتمكن من استرداده. تأكد من أن هذا هو القرار الصحيح.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border-r-4 border-blue-500 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-2">📄 المقال المحدد للحذف:</p>
                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                      <p className="text-gray-800 font-semibold leading-relaxed mb-2">{title}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          رقم المقال: {articleId}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">سيتم الحذف فوراً</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-red-800 font-bold text-sm">🚨 تحذير هام</p>
                    <p className="text-red-700 text-xs">هذا الإجراء غير قابل للتراجع ولا يمكن استرداد البيانات</p>
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار النافذة المحسنة */}
            <div className="flex gap-3 justify-end">
              <SabqButton 
                variant="secondary" 
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 font-bold border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
              >
                <X className="w-4 h-4 ml-2" />
                إلغاء العملية
              </SabqButton>
              <SabqButton 
                variant="danger" 
                onClick={onConfirm}
                loading={loading}
                disabled={loading}
                className="px-6 py-3 font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الحذف...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    تأكيد الحذف النهائي
                  </div>
                )}
              </SabqButton>
            </div>
          </div>
        </SabqCard>
      </div>
    </div>
  );
}; 