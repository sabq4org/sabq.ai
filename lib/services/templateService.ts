import { promises as fs } from 'fs'
import path from 'path'
import { Template, TemplateType, TemplatePreview } from '@/types/template'

const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'templates.json')
const PREVIEWS_FILE = path.join(process.cwd(), 'data', 'template_previews.json')

class TemplateService {
  private async ensureDataFile() {
    try {
      await fs.access(TEMPLATES_FILE)
    } catch {
      await fs.mkdir(path.dirname(TEMPLATES_FILE), { recursive: true })
      await fs.writeFile(TEMPLATES_FILE, JSON.stringify([]))
    }
    
    try {
      await fs.access(PREVIEWS_FILE)
    } catch {
      await fs.writeFile(PREVIEWS_FILE, JSON.stringify([]))
    }
  }

  private async readTemplates(): Promise<Template[]> {
    await this.ensureDataFile()
    const data = await fs.readFile(TEMPLATES_FILE, 'utf-8')
    return JSON.parse(data)
  }

  private async writeTemplates(templates: Template[]): Promise<void> {
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2))
  }

  private async readPreviews(): Promise<TemplatePreview[]> {
    await this.ensureDataFile()
    const data = await fs.readFile(PREVIEWS_FILE, 'utf-8')
    return JSON.parse(data)
  }

  private async writePreviews(previews: TemplatePreview[]): Promise<void> {
    await fs.writeFile(PREVIEWS_FILE, JSON.stringify(previews, null, 2))
  }

  private generateId(): number {
    return Date.now() + Math.floor(Math.random() * 1000)
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
      const templates = await this.readTemplates()
      const now = options?.currentTime || new Date()
      
      // فلترة القوالب حسب الشروط
      const filtered = templates.filter(t => {
        if (t.type !== type) return false
        if (!t.is_active) return false
        
        // التحقق من الجدولة الزمنية
        if (t.starts_at && new Date(t.starts_at) > now) return false
        if (t.ends_at && new Date(t.ends_at) < now) return false
        
        // التحقق من الاستهداف
        if (options?.categoryId && t.category_id && t.category_id !== options.categoryId) return false
        if (options?.countryCode && t.country_code && t.country_code !== options.countryCode) return false
        
        return true
      })
      
      // ترتيب حسب الأولوية
      filtered.sort((a, b) => {
        // الأولوية: تصنيف محدد > دولة محددة > افتراضي
        const aScore = (a.category_id ? 2 : 0) + (a.country_code ? 1 : 0) + (a.is_default ? 0.5 : 0)
        const bScore = (b.category_id ? 2 : 0) + (b.country_code ? 1 : 0) + (b.is_default ? 0.5 : 0)
        return bScore - aScore
      })
      
      return filtered[0] || null
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
      const templates = await this.readTemplates()
      return templates
        .filter(t => t.type === type)
        .sort((a, b) => {
          if (a.is_default !== b.is_default) return b.is_default ? 1 : -1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    } catch (error) {
      console.error('Error fetching templates:', error)
      return []
    }
  }

  /**
   * الحصول على قالب محدد
   */
  async getTemplateById(id: number): Promise<Template | null> {
    try {
      const templates = await this.readTemplates()
      return templates.find(t => t.id === id) || null
    } catch (error) {
      console.error('Error fetching template:', error)
      return null
    }
  }

  /**
   * إنشاء قالب جديد
   */
  async createTemplate(template: Partial<Template>, userId: number): Promise<Template | null> {
    try {
      const templates = await this.readTemplates()
      const newTemplate: Template = {
        id: this.generateId(),
        name: template.name || 'قالب جديد',
        type: template.type as TemplateType,
        content: template.content || {},
        is_active: template.is_active || false,
        is_default: template.is_default || false,
        ...template,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      templates.push(newTemplate)
      await this.writeTemplates(templates)
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
    id: number, 
    updates: Partial<Template>, 
    userId: number
  ): Promise<Template | null> {
    try {
      const templates = await this.readTemplates()
      const index = templates.findIndex(t => t.id === id)
      
      if (index === -1) return null
      
      templates[index] = {
        ...templates[index],
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      }
      
      await this.writeTemplates(templates)
      return templates[index]
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  /**
   * تبديل حالة التفعيل للقالب
   */
  async toggleTemplateActive(id: number, userId: number): Promise<boolean> {
    try {
      const template = await this.getTemplateById(id)
      if (!template) return false

      await this.updateTemplate(id, {
        is_active: !template.is_active
      }, userId)
      
      return true
    } catch (error) {
      console.error('Error toggling template active:', error)
      return false
    }
  }

  /**
   * تعيين قالب كافتراضي
   */
  async setTemplateAsDefault(id: number, userId: number): Promise<boolean> {
    try {
      const template = await this.getTemplateById(id)
      if (!template) return false

      const templates = await this.readTemplates()
      
      // إلغاء الافتراضي من جميع القوالب من نفس النوع
      templates.forEach(t => {
        if (t.type === template.type && t.is_default) {
          t.is_default = false
          t.updated_by = userId
          t.updated_at = new Date().toISOString()
        }
      })
      
      // تعيين القالب الجديد كافتراضي
      const index = templates.findIndex(t => t.id === id)
      if (index !== -1) {
        templates[index].is_default = true
        templates[index].is_active = true // تفعيل القالب تلقائياً
        templates[index].updated_by = userId
        templates[index].updated_at = new Date().toISOString()
      }
      
      await this.writeTemplates(templates)
      return true
    } catch (error) {
      console.error('Error setting template as default:', error)
      return false
    }
  }

  /**
   * حذف قالب
   */
  async deleteTemplate(id: number): Promise<boolean> {
    try {
      const template = await this.getTemplateById(id)
      if (!template || template.is_default) {
        // لا يمكن حذف القالب الافتراضي
        return false
      }

      const templates = await this.readTemplates()
      const filtered = templates.filter(t => t.id !== id)
      await this.writeTemplates(filtered)
      
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
    templateId: number, 
    userId: number,
    expiresInHours: number = 24
  ): Promise<string | null> {
    try {
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + expiresInHours)

      const previews = await this.readPreviews()
      const newPreview: TemplatePreview = {
        id: this.generateId(),
        template_id: templateId,
        preview_token: token,
        expires_at: expiresAt.toISOString(),
        created_by: userId,
        created_at: new Date().toISOString()
      }
      
      previews.push(newPreview)
      await this.writePreviews(previews)
      
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
      const previews = await this.readPreviews()
      const preview = previews.find(p => 
        p.preview_token === token && 
        new Date(p.expires_at) > new Date()
      )
      
      if (!preview) return null
      
      return await this.getTemplateById(preview.template_id)
    } catch (error) {
      console.error('Error validating preview token:', error)
      return null
    }
  }

  /**
   * تطبيق القالب على الموقع
   */
  async applyTemplate(templateId: number): Promise<boolean> {
    try {
      const template = await this.getTemplateById(templateId)
      if (!template) return false

      // هنا يمكن إضافة منطق إضافي لتطبيق القالب
      // مثل تحديث الكاش، إعادة تحميل الإعدادات، إلخ

      return true
    } catch (error) {
      console.error('Error applying template:', error)
      return false
    }
  }

  /**
   * الحصول على القوالب المجدولة النشطة
   */
  async getScheduledTemplates(): Promise<Template[]> {
    try {
      const templates = await this.readTemplates()
      const now = new Date()
      
      return templates.filter(t =>
        t.is_active &&
        t.starts_at && new Date(t.starts_at) <= now &&
        t.ends_at && new Date(t.ends_at) >= now
      ).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } catch (error) {
      console.error('Error fetching scheduled templates:', error)
      return []
    }
  }
}

export const templateService = new TemplateService() 