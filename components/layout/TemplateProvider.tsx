'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useTemplate } from '@/hooks/useTemplate'
import { Template } from '@/types/template'

interface TemplateContextValue {
  headerTemplate: Template | null
  footerTemplate: Template | null
  sidebarTemplate: Template | null
  loading: boolean
}

const TemplateContext = createContext<TemplateContextValue | null>(null)

export function TemplateProvider({ 
  children,
  categoryId,
  countryCode 
}: { 
  children: ReactNode
  categoryId?: number
  countryCode?: string 
}) {
  const { template: headerTemplate, loading: headerLoading } = useTemplate({
    type: 'header',
    categoryId,
    countryCode
  })
  
  const { template: footerTemplate, loading: footerLoading } = useTemplate({
    type: 'footer',
    categoryId,
    countryCode
  })
  
  const { template: sidebarTemplate, loading: sidebarLoading } = useTemplate({
    type: 'sidebar',
    categoryId,
    countryCode
  })
  
  const loading = headerLoading || footerLoading || sidebarLoading
  
  return (
    <TemplateContext.Provider value={{
      headerTemplate,
      footerTemplate,
      sidebarTemplate,
      loading
    }}>
      {children}
    </TemplateContext.Provider>
  )
}

export function useTemplates() {
  const context = useContext(TemplateContext)
  if (!context) {
    throw new Error('useTemplates must be used within TemplateProvider')
  }
  return context
} 