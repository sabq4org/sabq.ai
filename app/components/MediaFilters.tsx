'use client';

import { useState } from 'react';
import { X, Calendar, Tag, User, HardDrive } from 'lucide-react';

interface MediaFilters {
  search: string;
  media_type: string;
  classification: string;
  source_type: string;
  date_range: string;
  usage_status: string;
  size_range: string;
  tags: string[];
}

interface MediaFiltersProps {
  filters: MediaFilters;
  onFiltersChange: (filters: Partial<MediaFilters>) => void;
  onClose: () => void;
}

export default function MediaFilters({ filters, onFiltersChange, onClose }: MediaFiltersProps) {
  const [tempFilters, setTempFilters] = useState<MediaFilters>(filters);

  // التصنيفات المتاحة
  const classifications = [
    'شخصيات', 'مباني', 'فعاليات', 'شعارات', 'طبيعة',
    'نقل ومواصلات', 'تقنية', 'رياضة', 'ثقافة', 'أخرى'
  ];

  // مصادر الوسائط
  const sourcesTypes = [
    'داخلي', 'وكالة أنباء', 'موقع رسمي', 'شبكات اجتماعية', 
    'مصور متعاون', 'أرشيف', 'مصدر خارجي'
  ];

  // أنواع الوسائط
  const mediaTypes = [
    { value: 'image', label: 'صور' },
    { value: 'video', label: 'فيديو' },
    { value: 'audio', label: 'صوت' },
    { value: 'document', label: 'مستندات' }
  ];

  // خيارات نطاق التاريخ
  const dateRanges = [
    { value: 'today', label: 'اليوم' },
    { value: 'yesterday', label: 'أمس' },
    { value: 'this_week', label: 'هذا الأسبوع' },
    { value: 'last_week', label: 'الأسبوع الماضي' },
    { value: 'this_month', label: 'هذا الشهر' },
    { value: 'last_month', label: 'الشهر الماضي' },
    { value: 'this_year', label: 'هذا العام' },
    { value: 'custom', label: 'نطاق مخصص' }
  ];

  // خيارات حالة الاستخدام
  const usageStatuses = [
    { value: 'all', label: 'جميع الملفات' },
    { value: 'used', label: 'مستخدم' },
    { value: 'unused', label: 'غير مستخدم' },
    { value: 'recent', label: 'استخدم مؤخراً' }
  ];

  // خيارات حجم الملف
  const sizeRanges = [
    { value: 'small', label: 'صغير (أقل من 1MB)' },
    { value: 'medium', label: 'متوسط (1-10MB)' },
    { value: 'large', label: 'كبير (10-50MB)' },
    { value: 'xlarge', label: 'كبير جداً (أكثر من 50MB)' }
  ];

  // تحديث الفلاتر المؤقتة
  const updateTempFilters = (newFilters: Partial<MediaFilters>) => {
    setTempFilters(prev => ({ ...prev, ...newFilters }));
  };

  // تطبيق الفلاتر
  const applyFilters = () => {
    onFiltersChange(tempFilters);
    onClose();
  };

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    const emptyFilters: MediaFilters = {
      search: '',
      media_type: '',
      classification: '',
      source_type: '',
      date_range: '',
      usage_status: '',
      size_range: '',
      tags: []
    };
    setTempFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto" dir="rtl">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">فلترة الوسائط</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* نوع الوسائط */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            نوع الوسائط
          </label>
          <div className="space-y-2">
            {mediaTypes.map(type => (
              <label key={type.value} className="flex items-center">
                <input
                  type="radio"
                  name="media_type"
                  value={type.value}
                  checked={tempFilters.media_type === type.value}
                  onChange={(e) => updateTempFilters({ media_type: e.target.value })}
                  className="ml-2 text-blue-600"
                />
                <span className="text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
            <label className="flex items-center">
              <input
                type="radio"
                name="media_type"
                value=""
                checked={tempFilters.media_type === ''}
                onChange={(e) => updateTempFilters({ media_type: e.target.value })}
                className="ml-2 text-blue-600"
              />
              <span className="text-sm text-gray-700">جميع الأنواع</span>
            </label>
          </div>
        </div>

        {/* التصنيف */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            التصنيف
          </label>
          <select
            value={tempFilters.classification}
            onChange={(e) => updateTempFilters({ classification: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع التصنيفات</option>
            {classifications.map(classification => (
              <option key={classification} value={classification}>
                {classification}
              </option>
            ))}
          </select>
        </div>

        {/* المصدر */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            مصدر الوسائط
          </label>
          <select
            value={tempFilters.source_type}
            onChange={(e) => updateTempFilters({ source_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع المصادر</option>
            {sourcesTypes.map(source => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        {/* نطاق التاريخ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Calendar className="w-4 h-4 ml-2" />
            تاريخ الرفع
          </label>
          <select
            value={tempFilters.date_range}
            onChange={(e) => updateTempFilters({ date_range: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع التواريخ</option>
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* حالة الاستخدام */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
            <User className="w-4 h-4 ml-2" />
            حالة الاستخدام
          </label>
          <select
            value={tempFilters.usage_status}
            onChange={(e) => updateTempFilters({ usage_status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {usageStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* حجم الملف */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
            <HardDrive className="w-4 h-4 ml-2" />
            حجم الملف
          </label>
          <select
            value={tempFilters.size_range}
            onChange={(e) => updateTempFilters({ size_range: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع الأحجام</option>
            {sizeRanges.map(size => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        {/* الوسوم */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Tag className="w-4 h-4 ml-2" />
            الوسوم الشائعة
          </label>
          <div className="space-y-2">
            {/* وسوم مقترحة */}
            {['ملكي', 'رسمي', 'مؤتمر', 'احتفال', 'رياضة', 'تقنية'].map(tag => (
              <label key={tag} className="flex items-center">
                <input
                  type="checkbox"
                  checked={tempFilters.tags.includes(tag)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateTempFilters({ tags: [...tempFilters.tags, tag] });
                    } else {
                      updateTempFilters({ tags: tempFilters.tags.filter(t => t !== tag) });
                    }
                  }}
                  className="ml-2 text-blue-600"
                />
                <span className="text-sm text-gray-700">{tag}</span>
              </label>
            ))}
          </div>
        </div>

        {/* الوسوم المخصصة */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            إضافة وسم مخصص
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="أدخل وسم..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  const newTag = input.value.trim();
                  if (newTag && !tempFilters.tags.includes(newTag)) {
                    updateTempFilters({ tags: [...tempFilters.tags, newTag] });
                    input.value = '';
                  }
                }
              }}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* عرض الوسوم المحددة */}
          {tempFilters.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tempFilters.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => updateTempFilters({ 
                      tags: tempFilters.tags.filter(t => t !== tag) 
                    })}
                    className="mr-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <button
            onClick={applyFilters}
            className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600"
          >
            تطبيق الفلاتر
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-600 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            إعادة تعيين
          </button>
        </div>
        
        {/* عدد النتائج */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          سيتم تطبيق الفلاتر على جميع الوسائط
        </div>
      </div>
    </div>
  );
}
