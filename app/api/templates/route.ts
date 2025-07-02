import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs';

// GET /api/templates
export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'templates.json')
    const data = await fs.readFile(dataPath, 'utf-8')
    const templates = JSON.parse(data)
    
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error reading templates:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// POST /api/templates
export async function POST(request: NextRequest) {
  try {
    const newTemplate = await request.json()
    
    const dataPath = path.join(process.cwd(), 'data', 'templates.json')
    const data = await fs.readFile(dataPath, 'utf-8')
    const templates = JSON.parse(data)
    
    // إنشاء ID جديد
    const maxId = templates.reduce((max: number, t: any) => Math.max(max, t.id), 0)
    newTemplate.id = maxId + 1
    
    // إضافة التواريخ
    newTemplate.created_at = new Date().toISOString()
    newTemplate.updated_at = new Date().toISOString()
    
    // استخراج بيانات الشعار من content إذا كانت موجودة
    if (newTemplate.content?.logo?.url) {
      newTemplate.logo_url = newTemplate.content.logo.url
      newTemplate.logo_alt = newTemplate.content.logo.alt || 'شعار الموقع'
      newTemplate.logo_width = newTemplate.content.logo.width
      newTemplate.logo_height = newTemplate.content.logo.height
    }
    
    // استخراج ارتفاع الهيدر من content إذا كان موجوداً
    if (newTemplate.content?.theme?.headerHeight) {
      newTemplate.header_height = newTemplate.content.theme.headerHeight
    }
    
    // استخراج روابط التواصل الاجتماعي من content
    if (newTemplate.content?.socialLinks) {
      newTemplate.social_links = newTemplate.content.socialLinks
    }
    
    // إذا كان القالب is_default = true، تأكد من إلغاء default للقوالب الأخرى من نفس النوع
    if (newTemplate.is_default === true) {
      templates.forEach((t: any) => {
        if (t.type === newTemplate.type) {
          t.is_default = false
        }
      })
    }
    
    // إضافة القالب الجديد
    templates.push(newTemplate)
    
    // حفظ التحديثات
    await fs.writeFile(dataPath, JSON.stringify(templates, null, 2))
    
    return NextResponse.json(newTemplate)
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
} 