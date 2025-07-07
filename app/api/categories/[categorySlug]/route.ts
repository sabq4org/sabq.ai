import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ categorySlug: string }> }
) {
  try {
    const { categorySlug } = await context.params;
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: {
        parent: true,
        _count: {
          select: { articles: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // معالجة JSON من حقل description
    let metadata: any = {};
    let icon = '📁';
    let colorHex = '#6B7280';
    let nameAr = category.name;
    let nameEn = '';
    let descriptionText = '';

    if (category.description) {
      try {
        const parsedData = JSON.parse(category.description);
        if (parsedData && typeof parsedData === 'object') {
          icon = parsedData.icon || icon;
          colorHex = parsedData.color_hex || parsedData.color || colorHex;
          nameAr = parsedData.name_ar || nameAr;
          nameEn = parsedData.name_en || nameEn;
          descriptionText = parsedData.ar || parsedData.en || '';
          metadata = parsedData;
        } else {
          descriptionText = category.description;
        }
      } catch (e) {
        descriptionText = category.description;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        name: nameAr,
        name_ar: nameAr,
        name_en: nameEn,
        slug: category.slug,
        description: descriptionText,
        description_ar: descriptionText,
        description_en: metadata.en || '',
        color: colorHex,
        color_hex: colorHex,
        icon: icon,
        articles_count: category._count.articles,
        is_active: category.isActive,
        parent_id: category.parentId,
        parent: category.parent,
        position: category.displayOrder,
        created_at: category.createdAt.toISOString(),
        updated_at: category.updatedAt.toISOString(),
        metadata: metadata
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
} 