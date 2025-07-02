export type TemplateType = 'header' | 'footer' | 'sidebar' | 'article' | 'category' | 'special'

export interface Template {
  id: number
  name: string
  description?: string
  type: TemplateType
  content: any
  settings?: any
  
  // إعدادات التفعيل
  is_active: boolean
  is_default: boolean
  
  // الجدولة الزمنية
  starts_at?: string
  ends_at?: string
  
  // الاستهداف
  country_code?: string
  category_id?: number
  
  // إعدادات الشعار
  logo_url?: string
  logo_alt?: string
  logo_width?: number
  logo_height?: number
  
  // الألوان والتصميم
  primary_color?: string
  secondary_color?: string
  custom_styles?: string
  
  // روابط التواصل الاجتماعي
  social_links?: SocialLink[]
  
  // البلوكات النشطة
  active_blocks?: string[]
  
  // التتبع
  created_by?: number
  created_at: string
  updated_by?: number
  updated_at: string
}

export interface SocialLink {
  platform: 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'linkedin' | 'telegram' | 'whatsapp'
  url: string
  icon?: string
}

export interface TemplatePreview {
  id: number
  template_id: number
  preview_token: string
  preview_data?: any
  expires_at: string
  created_by: number
  created_at: string
}

export interface HeaderContent {
  logo: {
    url: string
    alt: string
    width?: number
    height?: number
  }
  navigation: {
    items: NavigationItem[]
  }
  topBar?: {
    showBreakingNews?: boolean
    showDateTime?: boolean
    showWeather?: boolean
  }
  socialLinks?: SocialLink[]
}

export interface NavigationItem {
  label: string
  url: string
  order: number
  children?: NavigationItem[]
  icon?: string
  isExternal?: boolean
}

export interface FooterContent {
  sections: FooterSection[]
  newsletter?: {
    enabled: boolean
    title?: string
    description?: string
  }
  copyright?: string
  socialLinks?: SocialLink[]
}

export interface FooterSection {
  title: string
  links: FooterLink[]
  order: number
}

export interface FooterLink {
  label: string
  url: string
  isExternal?: boolean
} 