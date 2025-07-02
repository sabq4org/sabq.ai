'use client';

import React, { useState, useEffect } from 'react';
import { X, Eye, Save, Globe, Tag, Hash, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Category, CategoryFormData } from '@/types/category';

interface CategoryFormModalProps {
  isOpen: boolean;
  isEdit?: boolean;
  category?: Category | null;
  categories: Category[];
  darkMode: boolean;
  onClose: () => void;
  onSave: (data: CategoryFormData) => Promise<void>;
  loading: boolean;
}

export default function CategoryFormModal({
  isOpen,
  isEdit = false,
  category,
  categories,
  darkMode,
  onClose,
  onSave,
  loading
}: CategoryFormModalProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name_ar: '',
    name_en: '',
    description: '',
    slug: '',
    color_hex: '#E5F1FA',
    icon: '📰',
    parent_id: undefined,
    position: 0,
    is_active: true,
    meta_title: '',
    meta_description: '',
    og_image_url: '',
    canonical_url: '',
    noindex: false,
    og_type: 'website'
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'seo' | 'advanced'>('basic');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // ألوان التصنيفات المتاحة
  const categoryColors = [
    { name: 'أزرق سماوي', value: '#E5F1FA', textColor: '#1E40AF' },
    { name: 'أخضر ناعم', value: '#E3FCEF', textColor: '#065F46' },
    { name: 'برتقالي دافئ', value: '#FFF5E5', textColor: '#C2410C' },
    { name: 'وردي خفيف', value: '#FDE7F3', textColor: '#BE185D' },
    { name: 'بنفسجي فاتح', value: '#F2F6FF', textColor: '#6366F1' },
    { name: 'أصفر ذهبي', value: '#FEF3C7', textColor: '#D97706' },
    { name: 'أخضر زمردي', value: '#F0FDF4', textColor: '#047857' },
    { name: 'أزرق غامق', value: '#EFF6FF', textColor: '#1D4ED8' },
    { name: 'بنفسجي وردي', value: '#FAF5FF', textColor: '#7C3AED' },
    { name: 'برتقالي فاتح', value: '#FFF7ED', textColor: '#EA580C' },
    { name: 'رمادي هادئ', value: '#F9FAFB', textColor: '#374151' },
    { name: 'تركوازي ناعم', value: '#F0FDFA', textColor: '#0F766E' }
  ];

  // الأيقونات المتاحة
  const categoryIcons = [
    '📰', '🏛️', '💼', '⚽', '🎭', '💡', '🌍', '📱', 
    '🏥', '🚗', '✈️', '🏠', '🎓', '💰', '⚖️', '🔬',
    '🎨', '🎵', '📺', '🍽️', '👗', '💊', '🌱', '🔥',
    '💎', '⭐', '🎯', '🚀', '🏆', '📊', '🎪', '🌈'
  ];

  // تحميل بيانات التصنيف عند التحرير
  useEffect(() => {
    if (isEdit && category) {
      setFormData({
        name_ar: category.name_ar || '',
        name_en: category.name_en || '',
        description: category.description || '',
        slug: category.slug || '',
        color_hex: category.color_hex || '#E5F1FA',
        icon: category.icon || '📰',
        parent_id: category.parent_id?.toString(),
        position: category.position || 0,
        is_active: category.is_active ?? true,
        meta_title: category.meta_title || '',
        meta_description: category.meta_description || '',
        og_image_url: category.og_image_url || '',
        canonical_url: category.canonical_url || '',
        noindex: category.noindex ?? false,
        og_type: category.og_type || 'website'
      });
    } else {
      // إعادة تعيين النموذج للإضافة
      setFormData({
        name_ar: '',
        name_en: '',
        description: '',
        slug: '',
        color_hex: '#E5F1FA',
        icon: '📰',
        parent_id: undefined,
        position: 0,
        is_active: true,
        meta_title: '',
        meta_description: '',
        og_image_url: '',
        canonical_url: '',
        noindex: false,
        og_type: 'website'
      });
    }
    setErrors({});
  }, [isEdit, category, isOpen]);

  // توليد slug تلقائي من الاسم العربي
  const generateSlug = (text: string) => {
    return text
      .replace(/[أإآ]/g, 'a')
      .replace(/[ؤ]/g, 'o')
      .replace(/[ئ]/g, 'i')
      .replace(/[ة]/g, 'h')
      .replace(/[ىي]/g, 'y')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name_ar: value,
      slug: prev.slug === '' ? generateSlug(value) : prev.slug,
      meta_title: prev.meta_title === '' ? `${value} - صحيفة سبق` : prev.meta_title
    }));
    
    if (errors.name_ar) {
      setErrors(prev => ({ ...prev, name_ar: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name_ar.trim()) {
      newErrors.name_ar = 'اسم التصنيف بالعربية مطلوب';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'رابط التصنيف مطلوب';
    }

    if (formData.meta_title && formData.meta_title.length > 60) {
      newErrors.meta_title = 'عنوان SEO يجب أن يكون أقل من 60 حرف';
    }

    if (formData.meta_description && formData.meta_description.length > 160) {
      newErrors.meta_description = 'وصف SEO يجب أن يكون أقل من 160 حرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('خطأ في حفظ التصنيف:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {isEdit ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className={darkMode ? 'text-gray-400 hover:text-white' : ''}
            >
              <Eye className="w-4 h-4 ml-2" />
              {showPreview ? 'إخفاء المعاينة' : 'معاينة'}
            </Button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Fields */}
            <div className="space-y-4">
              {/* الاسم بالعربية */}
              <div>
                <Label htmlFor="name_ar" className={darkMode ? 'text-gray-200' : ''}>
                  الاسم بالعربية <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => {
                    handleNameChange(e.target.value);
                  }}
                  placeholder="مثال: أخبار"
                  required
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>

              {/* الاسم بالإنجليزية */}
              <div>
                <Label htmlFor="name_en" className={darkMode ? 'text-gray-200' : ''}>
                  الاسم بالإنجليزية
                </Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="مثال: News"
                  dir="ltr"
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>

              {/* المعرف (Slug) */}
              <div>
                <Label htmlFor="slug" className={darkMode ? 'text-gray-200' : ''}>
                  المعرف (slug) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="news"
                  dir="ltr"
                  required
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  سيظهر في الرابط: /categories/{formData.slug || 'slug'}
                </p>
              </div>

              {/* الوصف */}
              <div>
                <Label htmlFor="description" className={darkMode ? 'text-gray-200' : ''}>
                  الوصف
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للتصنيف"
                  rows={3}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>

              {/* اللون والأيقونة */}
              <div className="grid grid-cols-2 gap-4">
                {/* اللون */}
                <div>
                  <Label className={darkMode ? 'text-gray-200' : ''}>اللون</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {categoryColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          color_hex: color.value 
                        })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color_hex === color.value
                            ? 'border-gray-900 scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* الأيقونة */}
                <div>
                  <Label className={darkMode ? 'text-gray-200' : ''}>الأيقونة</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2 max-h-32 overflow-y-auto">
                    {categoryIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
                          formData.icon === icon
                            ? darkMode 
                              ? 'border-blue-400 bg-blue-900/20' 
                              : 'border-blue-500 bg-blue-50'
                            : darkMode
                              ? 'border-gray-600 hover:border-gray-500'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* التصنيف الأب */}
              <div>
                <Label htmlFor="parent_id" className={darkMode ? 'text-gray-200' : ''}>
                  التصنيف الأب
                </Label>
                <select
                  id="parent_id"
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    parent_id: e.target.value || undefined
                  })}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">بدون تصنيف أب</option>
                  {categories
                    .filter(cat => cat.id !== category?.id && !cat.parent_id)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name_ar || cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* الترتيب والحالة */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position" className={darkMode ? 'text-gray-200' : ''}>
                    الترتيب
                  </Label>
                  <Input
                    id="position"
                    type="number"
                    value={formData.position}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      position: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>

                <div className="flex items-center justify-between pt-8">
                  <Label htmlFor="is_active" className={darkMode ? 'text-gray-200' : ''}>
                    نشط
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      is_active: checked 
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className={`p-6 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  معاينة التصنيف
                </h3>
                
                {/* معاينة البطاقة */}
                <div className={`p-4 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ 
                        backgroundColor: formData.color_hex,
                        color: categoryColors.find(c => c.value === formData.color_hex)?.textColor || '#000'
                      }}
                    >
                      {formData.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formData.name_ar || 'اسم التصنيف'}
                      </h4>
                      {formData.name_en && (
                        <p className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formData.name_en}
                        </p>
                      )}
                    </div>
                    {!formData.is_active && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        مخفي
                      </span>
                    )}
                  </div>
                  
                  {formData.description && (
                    <p className={`mt-2 text-sm ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {formData.description}
                    </p>
                  )}
                  
                  <div className={`mt-3 flex items-center gap-4 text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <span>/{formData.slug || 'slug'}</span>
                    <span>0 مقال</span>
                  </div>
                </div>

                {/* معاينة SEO */}
                <div className="mt-6">
                  <h4 className={`text-sm font-semibold mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    معاينة محرك البحث
                  </h4>
                  <div className={`p-3 rounded border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="text-blue-600 text-sm font-medium">
                      {formData.meta_title || formData.name_ar || 'عنوان الصفحة'} - اسم الموقع
                    </div>
                    <div className="text-green-700 text-xs mt-1">
                      https://example.com/categories/{formData.slug || 'slug'}
                    </div>
                    <div className={`text-sm mt-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {formData.meta_description || formData.description || 'وصف الصفحة في نتائج البحث'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end gap-3 mt-6 pt-6 border-t ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  {isEdit ? 'حفظ التغييرات' : 'إضافة التصنيف'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 