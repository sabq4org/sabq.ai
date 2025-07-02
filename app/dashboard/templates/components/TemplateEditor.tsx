'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Calendar, Globe, Tag, Eye, Palette, Image } from 'lucide-react'
import { HeaderEditor } from './editors/HeaderEditor'
import { FooterEditor } from './editors/FooterEditor'
import { Template, TemplateType } from '@/types/template'

interface TemplateEditorProps {
  template: Template | null
  type: TemplateType
  isNew: boolean
  onSave: (template: Partial<Template>) => void
  onCancel: () => void
}

export function TemplateEditor({ template, type, isNew, onSave, onCancel }: TemplateEditorProps) {
  const [formData, setFormData] = useState<Partial<Template>>({
    name: '',
    description: '',
    type: type,
    content: {},
    settings: {},
    is_active: false,
    is_default: false,
    starts_at: '',
    ends_at: '',
    country_code: '',
    category_id: undefined,
    logo_url: '',
    logo_alt: '',
    logo_width: undefined,
    logo_height: undefined,
    primary_color: '',
    secondary_color: '',
    custom_styles: '',
    social_links: [],
    active_blocks: []
  })

  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'design' | 'conditions'>('general')

  useEffect(() => {
    if (template) {
      setFormData(template)
    } else {
      // إعداد المحتوى الافتراضي حسب النوع
      setFormData(prev => ({
        ...prev,
        type: type,
        content: getDefaultContent(type)
      }))
    }
  }, [template, type])

  const getDefaultContent = (templateType: TemplateType) => {
    switch (templateType) {
      case 'header':
        return {
          logo: { url: '', alt: 'شعار الموقع' },
          navigation: { items: [] },
          topBar: { showBreakingNews: true, showDateTime: true },
          socialLinks: []
        }
      case 'footer':
        return {
          sections: [],
          newsletter: { enabled: true },
          copyright: '© 2024 جميع الحقوق محفوظة'
        }
      default:
        return {}
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/templates' : `/api/templates/${template?.id}`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const data = await response.json()
        onSave(data)
      } else {
        throw new Error('Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      // يمكن إضافة رسالة خطأ هنا
    }
  }

  const updateContent = (newContent: any) => {
    setFormData(prev => ({ ...prev, content: newContent }))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isNew ? 'إنشاء قالب جديد' : 'تعديل القالب'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {type === 'header' && 'قالب رأس الصفحة'}
                {type === 'footer' && 'قالب ذيل الصفحة'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'إخفاء المعاينة' : 'معاينة'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            معلومات عامة
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'design'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            التصميم
          </button>
          <button
            onClick={() => setActiveTab('conditions')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'conditions'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            الشروط والجدولة
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم القالب
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="modern-input"
                  required
                  placeholder="مثال: هيدر رمضان"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="modern-input"
                  rows={3}
                  placeholder="وصف مختصر للقالب واستخدامه"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700">قالب نشط</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700">قالب افتراضي</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-6">
              {/* إعدادات الشعار */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Image className="w-4 h-4" />
                  إعدادات الشعار
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      رابط الشعار
                    </label>
                    <input
                      type="url"
                      value={formData.logo_url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                      className="modern-input text-sm"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      النص البديل
                    </label>
                    <input
                      type="text"
                      value={formData.logo_alt || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_alt: e.target.value }))}
                      className="modern-input text-sm"
                      placeholder="شعار الموقع"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      العرض (بكسل)
                    </label>
                    <input
                      type="number"
                      value={formData.logo_width || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_width: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="modern-input text-sm"
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      الارتفاع (بكسل)
                    </label>
                    <input
                      type="number"
                      value={formData.logo_height || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_height: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="modern-input text-sm"
                      placeholder="50"
                    />
                  </div>
                </div>
              </div>

              {/* إعدادات الألوان */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Palette className="w-4 h-4" />
                  الألوان والتصميم
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      اللون الأساسي
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.primary_color || '#000000'}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="h-10 w-20"
                      />
                      <input
                        type="text"
                        value={formData.primary_color || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="modern-input text-sm flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      اللون الثانوي
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.secondary_color || '#ffffff'}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="h-10 w-20"
                      />
                      <input
                        type="text"
                        value={formData.secondary_color || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="modern-input text-sm flex-1"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    أنماط CSS مخصصة
                  </label>
                  <textarea
                    value={formData.custom_styles || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_styles: e.target.value }))}
                    className="modern-input text-sm font-mono"
                    rows={5}
                    placeholder=".header { background: linear-gradient(...); }"
                  />
                </div>
              </div>
              
              {/* محرر المحتوى الخاص بكل نوع */}
              {type === 'header' && (
                <HeaderEditor
                  content={formData.content || {}}
                  onChange={updateContent}
                />
              )}
              {type === 'footer' && (
                <FooterEditor
                  content={formData.content || {}}
                  onChange={updateContent}
                />
              )}
            </div>
          )}

          {activeTab === 'conditions' && (
            <div className="space-y-6">
              {/* جدولة القالب */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4" />
                  جدولة القالب
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      تاريخ البداية
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.starts_at || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                      className="modern-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      تاريخ النهاية
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.ends_at || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                      className="modern-input text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* الاستهداف الجغرافي */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Globe className="w-4 h-4" />
                  الاستهداف الجغرافي
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    رمز الدولة
                  </label>
                  <select
                    value={formData.country_code || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, country_code: e.target.value }))}
                    className="modern-input text-sm"
                  >
                    <option value="">جميع الدول</option>
                    <option value="SA">السعودية</option>
                    <option value="AE">الإمارات</option>
                    <option value="KW">الكويت</option>
                    <option value="QA">قطر</option>
                    <option value="BH">البحرين</option>
                    <option value="OM">عُمان</option>
                    <option value="EG">مصر</option>
                    <option value="JO">الأردن</option>
                  </select>
                </div>
              </div>

              {/* ربط بالتصنيف */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Tag className="w-4 h-4" />
                  ربط بالتصنيف
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    التصنيف
                  </label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="modern-input text-sm"
                  >
                    <option value="">جميع التصنيفات</option>
                    <option value="1">محليات</option>
                    <option value="2">دولي</option>
                    <option value="3">اقتصاد</option>
                    <option value="4">رياضة</option>
                    <option value="5">ثقافة</option>
                    <option value="6">تقنية</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isNew ? 'إنشاء القالب' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">معاينة القالب</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {/* معاينة القالب هنا */}
              <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                معاينة القالب ستظهر هنا
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 