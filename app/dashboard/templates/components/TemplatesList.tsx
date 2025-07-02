'use client'

import { useState, useEffect } from 'react'
import { Edit, Trash2, ToggleLeft, ToggleRight, Calendar, Globe, Tag, Star, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useTemplatePreview } from '@/hooks/useTemplate'
import { Template, TemplateType } from '@/types/template'

interface TemplatesListProps {
  type: TemplateType | string
  onEdit: (template: Template) => void
}

export function TemplatesList({ type, onEdit }: TemplatesListProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [previewingId, setPreviewingId] = useState<number | null>(null)
  const { generatePreview } = useTemplatePreview(previewingId || 0)

  useEffect(() => {
    fetchTemplates()
  }, [type])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/templates?type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !template.is_active })
      })
      
      if (response.ok) {
        await fetchTemplates()
      }
    } catch (error) {
      console.error('Error toggling template:', error)
    }
  }

  const setAsDefault = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}/set-default`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchTemplates()
      }
    } catch (error) {
      console.error('Error setting default template:', error)
    }
  }

  const deleteTemplate = async (template: Template) => {
    if (!confirm(`هل أنت متأكد من حذف قالب "${template.name}"؟`)) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handlePreview = async (templateId: number) => {
    setPreviewingId(templateId)
    await generatePreview()
    setPreviewingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    )
  }

  // Mock data for demonstration
  const mockTemplates: Template[] = [
    {
      id: 1,
      name: 'الهيدر الافتراضي',
      description: 'قالب الهيدر الأساسي للموقع',
      type: 'header' as TemplateType,
      content: {},
      is_active: true,
      is_default: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 2,
      name: 'هيدر رمضان',
      description: 'قالب خاص بشهر رمضان المبارك',
      type: 'header' as TemplateType,
      content: {},
      is_active: false,
      is_default: false,
      starts_at: '2024-03-11T00:00:00Z',
      ends_at: '2024-04-10T00:00:00Z',
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-15T00:00:00Z'
    },
    {
      id: 3,
      name: 'هيدر اليوم الوطني',
      description: 'قالب خاص باليوم الوطني السعودي',
      type: 'header' as TemplateType,
      content: {},
      is_active: false,
      is_default: false,
      starts_at: '2024-09-20T00:00:00Z',
      ends_at: '2024-09-25T00:00:00Z',
      country_code: 'SA',
      created_at: '2024-08-01T00:00:00Z',
      updated_at: '2024-08-15T00:00:00Z'
    }
  ].filter(t => t.type === type)

  const displayTemplates = templates.length > 0 ? templates : mockTemplates

  return (
    <div className="grid gap-4">
      {displayTemplates.map((template) => (
        <div
          key={template.id}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {template.name}
                </h3>
                {template.is_default && (
                  <span className="badge badge-info flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    افتراضي
                  </span>
                )}
                {template.is_active && (
                  <span className="badge badge-success">نشط</span>
                )}
              </div>
              
              {template.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {template.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                {template.starts_at && template.ends_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      من {format(new Date(template.starts_at), 'd MMMM', { locale: ar })}
                      {' '}إلى{' '}
                      {format(new Date(template.ends_at), 'd MMMM yyyy', { locale: ar })}
                    </span>
                  </div>
                )}
                
                {template.country_code && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <span>خاص بـ {template.country_code}</span>
                  </div>
                )}
                
                {template.category_id && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span>مرتبط بقسم</span>
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-400">
                آخر تحديث: {format(new Date(template.updated_at), 'd MMMM yyyy', { locale: ar })}
              </div>
            </div>

            <div className="flex items-center gap-2 mr-4">
              <button
                onClick={() => handlePreview(template.id)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="معاينة"
                disabled={previewingId === template.id}
              >
                <Eye className="w-5 h-5" />
              </button>
              
              {!template.is_default && (
                <button
                  onClick={() => setAsDefault(template)}
                  className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                  title="تعيين كافتراضي"
                >
                  <Star className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={() => toggleActive(template)}
                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                title={template.is_active ? 'تعطيل' : 'تفعيل'}
              >
                {template.is_active ? (
                  <ToggleRight className="w-5 h-5 text-green-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={() => onEdit(template)}
                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                title="تعديل"
              >
                <Edit className="w-5 h-5" />
              </button>
              
              {!template.is_default && (
                <button
                  onClick={() => deleteTemplate(template)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {displayTemplates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500">لا توجد قوالب من هذا النوع</p>
        </div>
      )}
    </div>
  )
} 