import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/app/lib/auth'
import { templateService } from '@/lib/services/templateService'
import { promises as fs } from 'fs'
import path from 'path'

// GET /api/templates/[id]
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const templateId = parseInt(params.id)
    
    const dataPath = path.join(process.cwd(), 'data', 'templates.json')
    const data = await fs.readFile(dataPath, 'utf-8')
    const templates = JSON.parse(data)
    
    const template = templates.find((t: any) => t.id === templateId)
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// PATCH /api/templates/[id]
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission('templates.update')
    const params = await props.params;
    const { id } = params
    const data = await request.json()
    
    const updatedTemplate = await templateService.updateTemplate(
      parseInt(id),
      data,
      parseInt(user.id)
    )
    
    if (!updatedTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: updatedTemplate
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// DELETE /api/templates/[id]
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission('templates.delete')
    const params = await props.params;
    const { id } = params
    
    const success = await templateService.deleteTemplate(parseInt(id))
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default template or template not found' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const templateId = parseInt(params.id)
    const updatedData = await request.json()
    
    const dataPath = path.join(process.cwd(), 'data', 'templates.json')
    const data = await fs.readFile(dataPath, 'utf-8')
    const templates = JSON.parse(data)
    
    // البحث عن القالب المطلوب
    const templateIndex = templates.findIndex((t: any) => t.id === templateId)
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    // استخراج بيانات الشعار من content إذا كانت موجودة
    if (updatedData.content?.logo?.url) {
      updatedData.logo_url = updatedData.content.logo.url
      updatedData.logo_alt = updatedData.content.logo.alt || 'شعار الموقع'
      updatedData.logo_width = updatedData.content.logo.width
      updatedData.logo_height = updatedData.content.logo.height
    }
    
    // استخراج ارتفاع الهيدر من content إذا كان موجوداً
    if (updatedData.content?.theme?.headerHeight) {
      updatedData.header_height = updatedData.content.theme.headerHeight
    }
    
    // استخراج روابط التواصل الاجتماعي من content
    if (updatedData.content?.socialLinks) {
      updatedData.social_links = updatedData.content.socialLinks
    }
    
    // تحديث القالب
    templates[templateIndex] = {
      ...templates[templateIndex],
      ...updatedData,
      updated_at: new Date().toISOString()
    }
    
    // إذا كان القالب is_default = true، تأكد من إلغاء default للقوالب الأخرى من نفس النوع
    if (updatedData.is_default === true) {
      templates.forEach((t: any, index: number) => {
        if (t.type === templates[templateIndex].type && index !== templateIndex) {
          t.is_default = false
        }
      })
    }
    
    // حفظ التحديثات
    await fs.writeFile(dataPath, JSON.stringify(templates, null, 2))
    
    return NextResponse.json(templates[templateIndex])
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
} 