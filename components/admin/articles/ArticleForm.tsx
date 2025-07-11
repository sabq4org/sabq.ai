"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  Eye, 
  Calendar, 
  Star, 
  Tag, 
  Image, 
  Settings,
  AlertCircle,
  Clock,
  Users
} from 'lucide-react';
import SmartRichEditor from '@/components/editor/SmartRichEditor';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Article {
  id?: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  featured_image?: string;
  category_id: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived' | 'in_review';
  featured: boolean;
  tags: string[];
  scheduled_at?: string;
  seo_data?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}

interface ArticleFormProps {
  article?: Article;
  categories: Category[];
  tags: Tag[];
  isEdit?: boolean;
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
}

export default function ArticleForm({ 
  article, 
  categories, 
  tags, 
  isEdit = false,
  currentUser
}: ArticleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSeoSettings, setShowSeoSettings] = useState(false);

  // بيانات النموذج
  const [formData, setFormData] = useState<Article>({
    title: article?.title || '',
    slug: article?.slug || '',
    summary: article?.summary || '',
    content: article?.content || '',
    featured_image: article?.featured_image || '',
    category_id: article?.category_id || '',
    status: article?.status || 'draft',
    featured: article?.featured || false,
    tags: article?.tags || [],
    scheduled_at: article?.scheduled_at || '',
    seo_data: article?.seo_data || {
      meta_title: '',
      meta_description: '',
      keywords: []
    }
  });

  // وسوم متاحة للاختيار
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags);
  const [tagInput, setTagInput] = useState('');

  // إنشاء slug تلقائياً من العنوان
  useEffect(() => {
    if (formData.title && !isEdit) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, isEdit]);

  // تحديث البيانات
  const updateFormData = (field: keyof Article, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // إضافة وسم جديد
  const addTag = (tagName: string) => {
    if (!tagName.trim()) return;
    
    const normalizedTag = tagName.trim().toLowerCase();
    if (formData.tags.includes(normalizedTag)) return;

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, normalizedTag]
    }));

    // إضافة الوسم للقائمة المتاحة إذا لم يكن موجوداً
    if (!availableTags.find(t => t.name.toLowerCase() === normalizedTag)) {
      setAvailableTags(prev => [...prev, {
        id: `temp-${Date.now()}`,
        name: tagName.trim(),
        slug: normalizedTag
      }]);
    }

    setTagInput('');
  };

  // إزالة وسم
  const removeTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagName)
    }));
  };

  // حفظ المقال
  const handleSave = async (publishStatus?: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // التحقق من البيانات المطلوبة
      if (!formData.title.trim()) {
        throw new Error('العنوان مطلوب');
      }
      if (!formData.content.trim()) {
        throw new Error('المحتوى مطلوب');
      }
      if (!formData.category_id) {
        throw new Error('الفئة مطلوبة');
      }

      const dataToSave = {
        ...formData,
        status: publishStatus || formData.status,
        seo_data: {
          ...formData.seo_data,
          keywords: formData.seo_data?.keywords?.filter(k => k.trim()) || []
        }
      };

      const url = isEdit ? `/api/articles/${article?.id}` : '/api/articles';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في حفظ المقال');
      }

      const result = await response.json();
      setSuccess(isEdit ? 'تم تحديث المقال بنجاح' : 'تم إنشاء المقال بنجاح');

      // إعادة توجيه بعد الحفظ
      setTimeout(() => {
        router.push('/admin/articles');
      }, 1500);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  // حفظ كمسودة
  const handleSaveDraft = () => handleSave('draft');

  // نشر المقال
  const handlePublish = () => handleSave('published');

  // جدولة النشر
  const handleSchedule = () => handleSave('scheduled');

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'تحرير المقال' : 'مقال جديد'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'تحرير وتحديث المقال' : 'إنشاء مقال جديد'}
          </p>
        </div>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>حفظ كمسودة</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={loading}
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <span>{loading ? 'جاري النشر...' : 'نشر'}</span>
          </button>
        </div>
      </div>

      {/* رسائل النجاح والخطأ */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 rtl:space-x-reverse">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 rtl:space-x-reverse">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* المحتوى الرئيسي */}
        <div className="lg:col-span-3 space-y-6">
          {/* العنوان */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="أدخل عنوان المقال"
                  className="w-full text-2xl font-bold border-0 focus:ring-0 p-0 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرابط (Slug)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateFormData('slug', e.target.value)}
                  placeholder="article-slug"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الملخص
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => updateFormData('summary', e.target.value)}
                  placeholder="ملخص قصير عن المقال"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* المحرر */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">المحتوى</h2>
            </div>
            <div className="p-6">
              <SmartRichEditor
                content={formData.content}
                onChange={(content) => updateFormData('content', content)}
                placeholder="ابدأ كتابة المقال..."
                articleId={article?.id}
                userId={currentUser?.id}
                userName={currentUser?.name}
                enableCollaboration={isEdit}
              />
            </div>
          </div>

          {/* إعدادات SEO */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <button
                onClick={() => setShowSeoSettings(!showSeoSettings)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-lg font-semibold text-gray-900">إعدادات SEO</h2>
                <Settings className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {showSeoSettings && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان الصفحة (Meta Title)
                  </label>
                  <input
                    type="text"
                    value={formData.seo_data?.meta_title || ''}
                    onChange={(e) => updateFormData('seo_data', {
                      ...formData.seo_data,
                      meta_title: e.target.value
                    })}
                    placeholder="عنوان الصفحة لمحركات البحث"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف الصفحة (Meta Description)
                  </label>
                  <textarea
                    value={formData.seo_data?.meta_description || ''}
                    onChange={(e) => updateFormData('seo_data', {
                      ...formData.seo_data,
                      meta_description: e.target.value
                    })}
                    placeholder="وصف الصفحة لمحركات البحث"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الكلمات المفتاحية
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل الكلمات المفتاحية مفصولة بفواصل"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const keywords = (e.target as HTMLInputElement).value.split(',').map(k => k.trim()).filter(k => k);
                        updateFormData('seo_data', {
                          ...formData.seo_data,
                          keywords: [...(formData.seo_data?.keywords || []), ...keywords]
                        });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  {formData.seo_data?.keywords && formData.seo_data.keywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.seo_data.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center space-x-1 rtl:space-x-reverse"
                        >
                          <span>{keyword}</span>
                          <button
                            onClick={() => {
                              const newKeywords = formData.seo_data?.keywords?.filter((_, i) => i !== index) || [];
                              updateFormData('seo_data', {
                                ...formData.seo_data,
                                keywords: newKeywords
                              });
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* إعدادات النشر */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">إعدادات النشر</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحالة
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">مسودة</option>
                  <option value="published">منشور</option>
                  <option value="scheduled">مجدول</option>
                  <option value="in_review">قيد المراجعة</option>
                </select>
              </div>

              {formData.status === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ النشر
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => updateFormData('scheduled_at', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => updateFormData('featured', e.target.checked)}
                  className="mr-2 rtl:ml-2"
                />
                <label htmlFor="featured" className="text-sm text-gray-700 flex items-center">
                  <Star className="w-4 h-4 ml-1 rtl:mr-1" />
                  مقال مميز
                </label>
              </div>
            </div>
          </div>

          {/* الفئة */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الفئة</h3>
            <select
              value={formData.category_id}
              onChange={(e) => updateFormData('category_id', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر الفئة</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* الوسوم */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الوسوم</h3>
            
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="أضف وسم جديد"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center space-x-1 rtl:space-x-reverse"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{tag}</span>
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-600">
                الوسوم الشائعة:
                <div className="mt-2 flex flex-wrap gap-1">
                  {availableTags.slice(0, 10).map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => addTag(tag.name)}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* الصورة المميزة */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الصورة المميزة</h3>
            
            <div className="space-y-3">
              <input
                type="url"
                value={formData.featured_image}
                onChange={(e) => updateFormData('featured_image', e.target.value)}
                placeholder="رابط الصورة المميزة"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {formData.featured_image && (
                <div className="border rounded-lg p-2">
                  <img
                    src={formData.featured_image}
                    alt="الصورة المميزة"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}

              <button
                type="button"
                className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Image className="w-4 h-4" />
                <span>اختر صورة</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 