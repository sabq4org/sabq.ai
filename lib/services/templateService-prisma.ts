import { prisma } from '@/lib/prisma'
import { Template, TemplateType, TemplatePreview } from '@/types/template'
import { cache, DEFAULT_TTL, getFromCache, setInCache } from '@/lib/cache'

class TemplateService {
  private generateId(): string {
    return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * الحصول على القالب النشط حسب النوع والسياق
   */
  async getActiveTemplate(
    type: TemplateType,
    options?: {
      categoryId?: number
      countryCode?: string
      currentTime?: Date
    }
  ): Promise<Template | null> {
    try {
      const cacheKey = `template:active:${type}:${options?.categoryId || 'all'}:${options?.countryCode || 'all'}`
      const cached = await getFromCache<Template>(cacheKey)
      if (cached) return cached

      const now = options?.currentTime || new Date()
      
      // بناء شروط البحث
      const where: any = {
        category: type,
        is_active: true,
      }

      // إضافة شروط إضافية إذا وجدت
      const templates = await prisma.templates.findMany({
        where,
        orderBy: {
          created_at: 'desc'
        }
      })

      // فلترة حسب الشروط المعقدة
      const filtered = templates.filter(t => {
        // التحقق من الجدولة الزمنية
        const metadata = t.metadata as any
        if (metadata?.starts_at && new Date(metadata.starts_at) > now) return false
        if (metadata?.ends_at && new Date(metadata.ends_at) < now) return false
        
        // التحقق من الاستهداف
        if (options?.categoryId && metadata?.category_id && metadata.category_id !== options.categoryId) return false
        if (options?.countryCode && metadata?.country_code && metadata.country_code !== options.countryCode) return false
        
        return true
      })
      
      // ترتيب حسب الأولوية
      filtered.sort((a, b) => {
        const aMeta = a.metadata as any
        const bMeta = b.metadata as any
        const aScore = (aMeta?.category_id ? 2 : 0) + (aMeta?.country_code ? 1 : 0) + (aMeta?.is_default ? 0.5 : 0)
        const bScore = (bMeta?.category_id ? 2 : 0) + (bMeta?.country_code ? 1 : 0) + (bMeta?.is_default ? 0.5 : 0)
        return bScore - aScore
      })
      
      const result = filtered[0] || null
      if (result) {
        await setInCache(cacheKey, result, DEFAULT_TTL.ARTICLES_LIST)
      }
      
      return result
    } catch (error) {
      console.error('Error fetching active template:', error)
      return null
    }
  }

  /**
   * الحصول على جميع القوالب حسب النوع
   */
  async getTemplatesByType(type: TemplateType): Promise<Template[]> {
    try {
      const cacheKey = `templates:type:${type}`
      const cached = await getFromCache<Template[]>(cacheKey)
      if (cached) return cached

      const templates = await prisma.templates.findMany({
        where: {
          category: type
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      await setInCache(cacheKey, templates, DEFAULT_TTL.ARTICLES_LIST)
      return templates
    } catch (error) {
      console.error('Error fetching templates:', error)
      return []
    }
  }

  /**
   * الحصول على قالب محدد
   */
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      const cacheKey = `template:${id}`
      const cached = await getFromCache<Template>(cacheKey)
      if (cached) return cached

      const template = await prisma.templates.findUnique({
        where: { id }
      })

      if (template) {
        await setInCache(cacheKey, template, DEFAULT_TTL.ARTICLE_DETAIL)
      }

      return template
    } catch (error) {
      console.error('Error fetching template:', error)
      return null
    }
  }

  /**
   * إنشاء قالب جديد
   */
  async createTemplate(template: Partial<Template>, userId: string): Promise<Template | null> {
    try {
      const newTemplate = await prisma.templates.create({
        data: {
          id: this.generateId(),
          name: template.name || 'قالب جديد',
          slug: template.slug || this.generateSlug(template.name || 'قالب جديد'),
          category: template.type as string,
          content: template.content || {},
          is_active: template.is_active || false,
          created_by: userId,
          metadata: {
            is_default: template.is_default || false,
            country_code: template.country_code,
            category_id: template.category_id,
            starts_at: template.starts_at,
            ends_at: template.ends_at,
          },
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      
      // مسح الكاش
      await cache.articles.invalidate()
      
      return newTemplate
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  /**
   * تحديث قالب موجود
   */
  async updateTemplate(
    id: string, 
    updates: Partial<Template>, 
    userId: string
  ): Promise<Template | null> {
    try {
      const updated = await prisma.templates.update({
        where: { id },
        data: {
          ...updates,
          metadata: {
            ...(updates.metadata as any || {}),
            updated_by: userId,
          },
          updated_at: new Date()
        }
      })
      
      // مسح الكاش
      await cache.articles.invalidate()
      
      return updated
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  /**
   * تبديل حالة التفعيل للقالب
   */
  async toggleTemplateActive(id: string, userId: string): Promise<boolean> {
    try {
      const template = await this.getTemplateById(id)
      if (!template) return false

      await prisma.templates.update({
        where: { id },
        data: {
          is_active: !template.is_active,
          updated_at: new Date()
        }
      })
      
      // مسح الكاش
      await cache.articles.invalidate()
      
      return true
    } catch (error) {
      console.error('Error toggling template active:', error)
      return false
    }
  }

  /**
   * تعيين قالب كافتراضي
   */
  async setTemplateAsDefault(id: string, userId: string): Promise<boolean> {
    try {
      const template = await this.getTemplateById(id)
      if (!template) return false

      // إلغاء الافتراضي من جميع القوالب من نفس النوع
      await prisma.$transaction(async (tx) => {
        // تحديث جميع القوالب من نفس النوع
        await tx.templates.updateMany({
          where: {
            category: template.category
          },
          data: {
            metadata: {
              is_default: false
            },
            updated_at: new Date()
          }
        })

        // تعيين القالب الجديد كافتراضي
        await tx.templates.update({
          where: { id },
          data: {
            is_active: true,
            metadata: {
              ...(template.metadata as any || {}),
              is_default: true,
              updated_by: userId
            },
            updated_at: new Date()
          }
        })
      })
      
      // مسح الكاش
      await cache.articles.invalidate()
      
      return true
    } catch (error) {
      console.error('Error setting template as default:', error)
      return false
    }
  }

  /**
   * حذف قالب
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const template = await this.getTemplateById(id)
      const metadata = template?.metadata as any
      if (!template || metadata?.is_default) {
        // لا يمكن حذف القالب الافتراضي
        return false
      }

      await prisma.templates.delete({
        where: { id }
      })
      
      // مسح الكاش
      await cache.articles.invalidate()
      
      return true
    } catch (error) {
      console.error('Error deleting template:', error)
      return false
    }
  }

  /**
   * إنشاء رابط معاينة مؤقت
   */
  async createPreviewLink(
    templateId: string, 
    userId: string,
    expiresInHours: number = 24
  ): Promise<string | null> {
    try {
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + expiresInHours)

      await prisma.template_previews.create({
        data: {
          id: this.generateId(),
          template_id: templateId,
          title: 'معاينة القالب',
          content: '',
          metadata: {
            preview_token: token,
            expires_at: expiresAt.toISOString(),
            created_by: userId
          },
          created_at: new Date()
        }
      })
      
      return `/preview/template/${token}`
    } catch (error) {
      console.error('Error creating preview link:', error)
      return null
    }
  }

  /**
   * التحقق من صلاحية رابط المعاينة
   */
  async validatePreviewToken(token: string): Promise<Template | null> {
    try {
      const previews = await prisma.template_previews.findMany({
        where: {
          metadata: {
            path: ['preview_token'],
            equals: token
          }
        }
      })

      const validPreview = previews.find(p => {
        const metadata = p.metadata as any
        return metadata?.expires_at && new Date(metadata.expires_at) > new Date()
      })
      
      if (!validPreview) return null
      
      return await this.getTemplateById(validPreview.template_id)
    } catch (error) {
      console.error('Error validating preview token:', error)
      return null
    }
  }

  /**
   * الحصول على القوالب المجدولة النشطة
   */
  async getScheduledTemplates(): Promise<Template[]> {
    try {
      const templates = await prisma.templates.findMany({
        where: {
          is_active: true
        }
      })
      
      const now = new Date()
      return templates.filter(t => {
        const metadata = t.metadata as any
        return metadata?.starts_at && 
               new Date(metadata.starts_at) <= now &&
               metadata?.ends_at && 
               new Date(metadata.ends_at) >= now
      }).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } catch (error) {
      console.error('Error fetching scheduled templates:', error)
      return []
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
}

export const templateService = new TemplateService() 