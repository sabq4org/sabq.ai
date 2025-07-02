'use client'

import { useState } from 'react'
import { Plus, Trash2, Move, Link, Mail, Smartphone, Copyright } from 'lucide-react'

interface FooterContent {
  sections?: Array<{
    title: string
    links: Array<{
      label: string
      url: string
    }>
  }>
  newsletter?: {
    enabled: boolean
    title?: string
    description?: string
  }
  apps?: {
    ios?: string
    android?: string
  }
  copyright?: string
}

interface FooterEditorProps {
  content: FooterContent
  onChange: (content: FooterContent) => void
}

export function FooterEditor({ content, onChange }: FooterEditorProps) {
  const [activeSection, setActiveSection] = useState<'sections' | 'newsletter' | 'apps' | 'copyright'>('sections')

  const updateContent = (section: keyof FooterContent, value: any) => {
    onChange({ ...content, [section]: value })
  }

  const addSection = () => {
    const currentSections = content.sections || []
    const newSection = {
      title: 'قسم جديد',
      links: []
    }
    updateContent('sections', [...currentSections, newSection])
  }

  const updateSection = (index: number, field: string, value: any) => {
    const sections = [...(content.sections || [])]
    sections[index] = { ...sections[index], [field]: value }
    updateContent('sections', sections)
  }

  const removeSection = (index: number) => {
    const sections = content.sections || []
    updateContent('sections', sections.filter((_, i) => i !== index))
  }

  const addLinkToSection = (sectionIndex: number) => {
    const sections = [...(content.sections || [])]
    sections[sectionIndex].links.push({ label: 'رابط جديد', url: '#' })
    updateContent('sections', sections)
  }

  const updateSectionLink = (sectionIndex: number, linkIndex: number, field: string, value: string) => {
    const sections = [...(content.sections || [])]
    sections[sectionIndex].links[linkIndex] = {
      ...sections[sectionIndex].links[linkIndex],
      [field]: value
    }
    updateContent('sections', sections)
  }

  const removeSectionLink = (sectionIndex: number, linkIndex: number) => {
    const sections = [...(content.sections || [])]
    sections[sectionIndex].links = sections[sectionIndex].links.filter((_, i) => i !== linkIndex)
    updateContent('sections', sections)
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-xl">
        <button
          onClick={() => setActiveSection('sections')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'sections'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          أقسام الفوتر
        </button>
        <button
          onClick={() => setActiveSection('newsletter')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'newsletter'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          النشرة البريدية
        </button>
        <button
          onClick={() => setActiveSection('apps')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'apps'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          التطبيقات
        </button>
        <button
          onClick={() => setActiveSection('copyright')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'copyright'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          حقوق النشر
        </button>
      </div>

      {/* Footer Sections */}
      {activeSection === 'sections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Link className="w-4 h-4" />
              أقسام الفوتر
            </h3>
            <button
              onClick={addSection}
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              إضافة قسم
            </button>
          </div>

          <div className="space-y-4">
            {(content.sections || []).map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                    className="text-sm font-medium bg-transparent border-b border-gray-300 focus:border-primary outline-none px-1 py-1"
                    placeholder="عنوان القسم"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addLinkToSection(sectionIndex)}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      إضافة رابط
                    </button>
                    <button
                      onClick={() => removeSection(sectionIndex)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mr-4">
                  {section.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex items-center gap-2">
                      <Move className="w-3 h-3 text-gray-400 cursor-move" />
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateSectionLink(sectionIndex, linkIndex, 'label', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                        placeholder="اسم الرابط"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateSectionLink(sectionIndex, linkIndex, 'url', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                        placeholder="الرابط"
                        dir="ltr"
                      />
                      <button
                        onClick={() => removeSectionLink(sectionIndex, linkIndex)}
                        className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {section.links.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      لا توجد روابط. اضغط "إضافة رابط" للبدء
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter Section */}
      {activeSection === 'newsletter' && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            النشرة البريدية
          </h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={content.newsletter?.enabled || false}
              onChange={(e) => updateContent('newsletter', { ...content.newsletter, enabled: e.target.checked })}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="text-sm text-gray-700">تفعيل النشرة البريدية</span>
          </label>

          {content.newsletter?.enabled && (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-2">العنوان</label>
                <input
                  type="text"
                  value={content.newsletter?.title || ''}
                  onChange={(e) => updateContent('newsletter', { ...content.newsletter, title: e.target.value })}
                  className="modern-input text-sm"
                  placeholder="اشترك في النشرة البريدية"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">الوصف</label>
                <textarea
                  value={content.newsletter?.description || ''}
                  onChange={(e) => updateContent('newsletter', { ...content.newsletter, description: e.target.value })}
                  className="modern-input text-sm"
                  rows={2}
                  placeholder="احصل على آخر الأخبار في بريدك الإلكتروني"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Apps Section */}
      {activeSection === 'apps' && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            تطبيقات الجوال
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">رابط تطبيق iOS</label>
              <input
                type="text"
                value={content.apps?.ios || ''}
                onChange={(e) => updateContent('apps', { ...content.apps, ios: e.target.value })}
                className="modern-input text-sm"
                placeholder="https://apps.apple.com/..."
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">رابط تطبيق Android</label>
              <input
                type="text"
                value={content.apps?.android || ''}
                onChange={(e) => updateContent('apps', { ...content.apps, android: e.target.value })}
                className="modern-input text-sm"
                placeholder="https://play.google.com/..."
                dir="ltr"
              />
            </div>
          </div>
        </div>
      )}

      {/* Copyright Section */}
      {activeSection === 'copyright' && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Copyright className="w-4 h-4" />
            حقوق النشر
          </h3>

          <div>
            <label className="block text-sm text-gray-600 mb-2">نص حقوق النشر</label>
            <input
              type="text"
              value={content.copyright || ''}
              onChange={(e) => updateContent('copyright', e.target.value)}
              className="modern-input text-sm"
              placeholder="© 2024 صحيفة سبق الإلكترونية. جميع الحقوق محفوظة."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>متغيرات ديناميكية:</strong>
              <br />
              استخدم {'{year}'} لإدراج السنة الحالية تلقائياً
              <br />
              مثال: © {'{year}'} صحيفة سبق. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 