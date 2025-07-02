import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/app/lib/auth'
import { templateService } from '@/lib/services/templateService'

// POST /api/templates/[id]/preview
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission('templates.view')
    const { id } = await params
    
    const previewUrl = await templateService.createPreviewLink(
      parseInt(id),
      parseInt(user.id),
      24 // 24 ساعة صلاحية
    )
    
    if (!previewUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to create preview link' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      url: previewUrl
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
} 