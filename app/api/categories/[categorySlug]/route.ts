import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ categorySlug: string }> }
) {
  try {
    const { categorySlug } = await context.params;
    const category = await prisma.categories.findUnique({
      where: { slug: categorySlug }
    });

    // جلب عدد المقالات بشكل منفصل
    const articlesCount = await prisma.articles.count({
      where: { category_id: category?.id }
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
        articles_count: articlesCount,
        is_active: category.is_active,
        parent_id: category.parent_id,
        parent: null, // سيتم جلبها بشكل منفصل إذا لزم الأمر
        position: category.display_order,
        created_at: category.created_at.toISOString(),
        updated_at: category.updated_at.toISOString(),
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