import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

interface Category {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  cover_image?: string;
  icon: string;
  color_hex: string;
  position: number;
  parent_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function loadCategories(): Promise<Category[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'categories.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.categories || [];
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categorySlug: string }> }
) {
  try {
    const { categorySlug } = await params;
    
    // Try database first
    try {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        include: {
          parent: true,
          _count: {
            select: { articles: true }
          }
        }
      });
      
      if (category) {
        return NextResponse.json({
          success: true,
          data: {
            ...category,
            name_ar: category.name,
            name_en: category.nameEn,
            color_hex: category.color,
            articles_count: category._count.articles,
            is_active: category.isActive,
            parent_id: category.parentId,
            position: category.displayOrder
          }
        });
      }
    } catch (dbError) {
      console.log('Database not available, falling back to JSON');
    }
    
    // Fallback to JSON
    const categories = await loadCategories();
    const category = categories.find(cat => cat.slug === categorySlug && cat.is_active);
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: category
    });
    
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT: تحديث فئة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categorySlug: string }> }
) {
  try {
    const body = await request.json();
    const { categorySlug } = await params;
    
    // Find category by slug
    const existingCategory = await prisma.category.findUnique({
      where: { slug: categorySlug }
    });
    
    if (!existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'الفئة غير موجودة'
      }, { status: 404 });
    }
    
    // Check for duplicate slug if changing
    if (body.slug && body.slug !== existingCategory.slug) {
      const duplicateSlug = await prisma.category.findUnique({
        where: { slug: body.slug }
      });
      
      if (duplicateSlug) {
        return NextResponse.json({
          success: false,
          error: 'يوجد فئة أخرى بنفس المعرف (slug)'
        }, { status: 400 });
      }
    }
    
    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: existingCategory.id },
      data: {
        name: body.name || body.name_ar || existingCategory.name,
        nameEn: body.name_en !== undefined ? body.name_en : existingCategory.nameEn,
        slug: body.slug || existingCategory.slug,
        description: body.description !== undefined ? body.description : existingCategory.description,
        color: body.color || body.color_hex || existingCategory.color,
        icon: body.icon !== undefined ? body.icon : existingCategory.icon,
        parentId: body.parent_id !== undefined ? body.parent_id : existingCategory.parentId,
        displayOrder: body.order_index ?? body.position ?? existingCategory.displayOrder,
        isActive: body.is_active ?? existingCategory.isActive,
        metadata: {
          meta_title: body.meta_title,
          meta_description: body.meta_description,
          og_image_url: body.og_image_url,
          canonical_url: body.canonical_url,
          noindex: body.noindex,
          og_type: body.og_type || 'website'
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'تم تحديث الفئة بنجاح'
    });
    
  } catch (error) {
    console.error('خطأ في تحديث الفئة:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في تحديث الفئة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// DELETE: حذف فئة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categorySlug: string }> }
) {
  try {
    const { categorySlug } = await params;
    
    // Find category by slug
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug }
    });
    
    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'الفئة غير موجودة'
      }, { status: 404 });
    }
    
    // Check for related articles
    const articlesCount = await prisma.article.count({
      where: { categoryId: category.id }
    });
    
    if (articlesCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'لا يمكن حذف الفئة لوجود مقالات مرتبطة بها',
        articlesCount
      }, { status: 400 });
    }
    
    // Delete category
    await prisma.category.delete({
      where: { id: category.id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف الفئة بنجاح'
    });
    
  } catch (error) {
    console.error('خطأ في حذف الفئة:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في حذف الفئة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
} 