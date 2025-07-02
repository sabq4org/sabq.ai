'use client';

import React from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  articles_count?: number;
}

interface InterestSelectorProps {
  categories: Category[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export default function InterestSelector({
  categories,
  selectedIds,
  onToggle,
  loading,
  error,
  onRetry,
  className = ''
}: InterestSelectorProps) {
  // حالة التحميل
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">جاري تحميل التصنيفات...</p>
          <p className="text-sm text-gray-500 mt-1">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  // حالة الخطأ
  if (error) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">حدث خطأ</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    );
  }

  // حالة عدم وجود تصنيفات
  if (!categories || categories.length === 0) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <span className="text-3xl">📭</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">لا توجد تصنيفات</h3>
          <p className="text-gray-600">لم نجد أي تصنيفات متاحة حالياً</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              تحديث الصفحة
            </button>
          )}
        </div>
      </div>
    );
  }

  // العرض الطبيعي للتصنيفات
  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => {
          const isSelected = selectedIds.includes(category.id);
          const bgColor = category.color || '#3B82F6';
          
          return (
            <button
              key={category.id}
              onClick={() => onToggle(category.id)}
              className={`
                relative group p-5 rounded-2xl border-2 transition-all duration-300 
                transform hover:scale-[1.02] hover:shadow-lg
                ${isSelected 
                  ? 'border-opacity-100 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              style={isSelected ? { borderColor: bgColor } : {}}
            >
              {/* خلفية ملونة عند التحديد */}
              {isSelected && (
                <div 
                  className="absolute inset-0 opacity-5 rounded-2xl transition-opacity duration-300"
                  style={{ backgroundColor: bgColor }}
                />
              )}
              
              <div className="relative z-10">
                {/* الأيقونة */}
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-md transition-transform group-hover:scale-110"
                  style={{ backgroundColor: bgColor }}
                >
                  <span className="text-2xl filter brightness-0 invert">
                    {category.icon || '📁'}
                  </span>
                </div>
                
                {/* اسم التصنيف */}
                <h3 className="text-base font-bold text-gray-800 mb-1">
                  {category.name || category.name_ar || category.name_en}
                </h3>
                
                {/* الوصف */}
                {category.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 px-2">
                    {category.description}
                  </p>
                )}
                
                {/* عدد المقالات */}
                {category.articles_count !== undefined && (
                  <p className="text-xs text-gray-400 mt-2">
                    {category.articles_count} مقال
                  </p>
                )}
                
                {/* علامة التحديد */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 transition-all duration-300">
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                      style={{ backgroundColor: bgColor }}
                    >
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* معلومات إضافية */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          {selectedIds.length === 0 ? (
            <span className="text-amber-600 font-medium">
              اختر تصنيفاً واحداً على الأقل للمتابعة
            </span>
          ) : (
            <span>
              اخترت <span className="font-bold text-blue-600">{selectedIds.length}</span> من {categories.length} تصنيف
            </span>
          )}
        </p>
      </div>
    </div>
  );
} 