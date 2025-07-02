import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/app/lib/auth'
import { templateService } from '@/lib/services/templateService'

// POST /api/templates/[id]/set-default
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission('templates.update')
    const { id } = await params
    
    const success = await templateService.setTemplateAsDefault(
      parseInt(id),
      parseInt(user.id)
    )
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to set template as default' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Template set as default successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
} 