import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

const updateTagSchema = createTagSchema.partial();

/**
 * GET /api/tags
 * جلب قائمة الوسوم
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const includeStats = searchParams.get('include_stats') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const popular = searchParams.get('popular') === 'true';

    const whereClause: any = {
      is_active: true
    };

    if (q) {
      whereClause.name = {
        contains: q,
        mode: 'insensitive'
      };
    }

    const orderBy: any = popular 
      ? { usage_count: 'desc' }
      : { name: 'asc' };

    const tags = await prisma.tag.findMany({
      where: whereClause,
      include: {
        ...(includeStats && {
          _count: {
            select: {
              article_tags: {
                where: {
                  article: {
                    status: 'published'
                  }
                }
              }
            }
          }
        })
      },
      orderBy,
      take: limit
    });

    const formattedTags = tags.map(tag => ({
      ...tag,
      ...(includeStats && {
        articles_count: tag._count?.article_tags || 0,
        _count: undefined
      })
    }));

    return NextResponse.json({
      success: true,
      data: { tags: formattedTags }
    });

  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tags
 * إنشاء وسم جديد
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
    if (!['editor', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createTagSchema.parse(body);

    // إنشاء slug من الاسم
    const slug = validatedData.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // التحقق من عدم تكرار الاسم
    const existingTag = await prisma.tag.findUnique({
      where: { name: validatedData.name }
    });

    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag already exists' },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        ...validatedData,
        slug
      }
    });

    return NextResponse.json({
      success: true,
      data: { tag }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating tag:', error);
    
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