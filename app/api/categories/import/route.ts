import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()
import { getCurrentUser } from '@/app/lib/auth'

export const runtime = 'nodejs'

// POST /api/categories/import
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const user = await getCurrentUser()
    
    // في بيئة التطوير، يمكن تجاوز المصادقة بـ API key
    const apiKey = request.headers.get('x-api-key')
    const isDevelopment = process.env.NODE_ENV === 'development'
    const hasValidApiKey = apiKey === process.env.API_SECRET_KEY
    
    if (!user && !(isDevelopment && hasValidApiKey)) {
      return NextResponse.json({
        error: 'غير مصرح لك - يجب تسجيل الدخول أولاً',
        message: 'يتطلب استيراد التصنيفات تسجيل الدخول بحساب له صلاحيات إدارية'
      }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ 
        error: 'لم يتم رفع أي ملف',
        message: 'يرجى اختيار ملف JSON يحتوي على التصنيفات'
      }, { status: 400 })
    }

    const fileContent = await file.text()
    let categoriesToImport
    
    try {
      categoriesToImport = JSON.parse(fileContent)
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'صيغة الملف غير صالحة',
        message: 'يجب أن يكون الملف بصيغة JSON صحيحة'
      }, { status: 400 })
    }

    if (!Array.isArray(categoriesToImport)) {
      return NextResponse.json({ 
        error: 'صيغة البيانات غير صالحة',
        message: 'يجب أن يحتوي الملف على مصفوفة من التصنيفات'
      }, { status: 400 })
    }

    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors: any[] = []

    for (const category of categoriesToImport) {
      try {
        const { id, name, slug, ...rest } = category
        
        if (!name) {
          errors.push({ category, error: 'اسم التصنيف مطلوب' })
          skippedCount++
          continue
        }
        
        const data = {
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          name_en: rest.name_en || rest.name_en,
          description: rest.description,
          color: rest.color || rest.color_hex,
          icon: rest.icon,
          parent_id: rest.parent_id || rest.parentId,
          display_order: rest.order_index || rest.display_order || rest.displayOrder || 0,
          is_active: rest.is_active !== false && rest.isActive !== false,
          metadata: rest.metadata
        }

        // البحث عن تصنيف موجود بنفس المعرف أو الـ slug
        const existingCategory = await prisma.categories.findFirst({
          where: {
            OR: [
              { id: id },
              { slug: data.slug }
            ]
          }
        })

        if (existingCategory) {
          await prisma.categories.update({
            where: { id: existingCategory.id },
            data: data,
          })
          updatedCount++
        } else {
          const createData = id ? { ...data, id } : data;
          await prisma.categories.create({
            data: createData as any,
          })
          createdCount++
        }
      } catch (error) {
        errors.push({ 
          category, 
          error: error instanceof Error ? error.message : 'خطأ غير معروف' 
        })
        skippedCount++
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'تم استيراد التصنيفات',
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: categoriesToImport.length,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 200 })

  } catch (error) {
    console.error('فشل في استيراد التصنيفات:', error)
    return NextResponse.json({ 
      success: false,
      error: 'فشل في استيراد التصنيفات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 })
  }
} 