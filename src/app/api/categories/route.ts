import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
  sort_order: z.number().int().min(0).default(0)
});

const updateCategorySchema = createCategorySchema.partial();

/**
 * GET /api/categories
 * جلب قائمة الفئات
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('include_stats') === 'true';
    const isActive = searchParams.get('active');

    const whereClause: any = {};
    if (isActive !== null) {
      whereClause.is_active = isActive === 'true';
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        ...(includeStats && {
          _count: {
            select: {
              articles: {
                where: { status: 'published' }
              }
            }
          }
        })
      },
      orderBy: [
        { sort_order: 'asc' },
        { name: 'asc' }
      ]
    });

    const formattedCategories = categories.map(category => ({
      ...category,
      ...(includeStats && {
        articles_count: category._count?.articles || 0,
        _count: undefined
      })
    }));

    return NextResponse.json({
      success: true,
      data: { categories: formattedCategories }
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * إنشاء فئة جديدة
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    if (!['admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // التحقق من عدم تكرار الاسم أو الـ slug
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          { slug: validatedData.slug }
        ]
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name or slug already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      data: { category }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 