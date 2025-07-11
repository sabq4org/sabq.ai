import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/moderation/comments
 * جلب التعليقات للمراجعة الإدارية
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'needs_review';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'newest'; // newest, oldest, risk_score
    const user_id = searchParams.get('user_id');

    // التحقق من صلاحيات المشرف
    const user = await prisma.user.findUnique({
      where: { id: user_id! },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مسموح لك بالوصول' },
        { status: 403 }
      );
    }

    const skip = (page - 1) * limit;

    // بناء شروط البحث
    const whereConditions: any = {
      status
    };

    if (search) {
      whereConditions.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { ai_category: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (category && category !== 'all') {
      whereConditions.ai_category = category;
    }

    // ترتيب النتائج
    let orderBy: any = { created_at: 'desc' };
    if (sort === 'oldest') {
      orderBy = { created_at: 'asc' };
    } else if (sort === 'risk_score') {
      orderBy = { ai_risk_score: 'desc' };
    } else if (sort === 'confidence') {
      orderBy = { ai_confidence: 'desc' };
    }

    // جلب التعليقات
    const comments = await prisma.articleComment.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image: true,
            created_at: true
          }
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        appeals: {
          where: { status: 'pending' },
          select: {
            id: true,
            reason: true,
            created_at: true
          }
        },
        reports: {
          where: { status: 'pending' },
          select: {
            id: true,
            reason: true,
            created_at: true
          }
        },
        _count: {
          select: {
            appeals: true,
            reports: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    // إجمالي عدد التعليقات
    const total = await prisma.articleComment.count({
      where: whereConditions
    });

    // إحصائيات سريعة
    const statusCounts = await prisma.articleComment.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const statusStats = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // فئات الذكاء الاصطناعي
    const categoryStats = await prisma.articleComment.groupBy({
      by: ['ai_category'],
      where: {
        ai_category: { not: null },
        created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      _count: { id: true }
    });

    const categories = categoryStats.map(item => ({
      name: item.ai_category,
      count: item._count.id
    }));

    return NextResponse.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          status_counts: statusStats,
          categories
        }
      }
    });

  } catch (error) {
    console.error('Error fetching moderation comments:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التعليقات' },
      { status: 500 }
    );
  }
} 