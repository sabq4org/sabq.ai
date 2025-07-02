import { NextRequest, NextResponse } from 'next/server'
import { templateService } from '@/lib/services/templateService'
import { TemplateType } from '@/types/template'

export const runtime = 'nodejs';

// GET /api/templates/active
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as TemplateType
    const categoryId = searchParams.get('category_id')
    const countryCode = searchParams.get('country_code')
    
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Template type is required' },
        { status: 400 }
      )
    }
    
    const template = await templateService.getActiveTemplate(type, {
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      countryCode: countryCode || undefined
    })
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'No active template found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(template)
  } catch (error: any) {
    console.error('Error fetching active template:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 