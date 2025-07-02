'use client'

import { useState, useEffect } from 'react'
import { Template, TemplateType } from '@/types/template'

interface UseTemplateOptions {
  type: TemplateType
  categoryId?: number
  countryCode?: string
}

export function useTemplate(options: UseTemplateOptions) {
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchTemplate() {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          type: options.type,
          ...(options.categoryId && { category_id: options.categoryId.toString() }),
          ...(options.countryCode && { country_code: options.countryCode })
        })
        
        const response = await fetch(`/api/templates/active?${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch template')
        }
        
        const data = await response.json()
        setTemplate(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setTemplate(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [options.type, options.categoryId, options.countryCode])

  return { template, loading, error }
}

// Hook للحصول على معاينة القالب
export function useTemplatePreview(templateId: number) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generatePreview = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/templates/${templateId}/preview`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate preview')
      }
      
      const data = await response.json()
      setPreviewUrl(data.url)
      
      // فتح المعاينة في نافذة جديدة
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return { previewUrl, generatePreview, loading, error }
} 