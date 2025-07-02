import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // جلب اهتمامات المستخدم المحفوظة
    const savedPreference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key: 'selected_categories'
        }
      }
    });

    let categoryIds: string[] = [];

    if (savedPreference && savedPreference.value) {
      // تحويل JsonValue إلى string[]
      const value = savedPreference.value;
      if (Array.isArray(value)) {
        categoryIds = value.filter(id => typeof id === 'string') as string[];
      }
    }

    // إذا لم نجد تفضيلات محفوظة، نحاول من UserInterest
    if (categoryIds.length === 0) {
      const userInterests = await prisma.userInterest.findMany({
        where: { userId },
        select: { interest: true }
      });

      if (userInterests.length > 0) {
        const categories = await prisma.category.findMany({
          where: {
            slug: { in: userInterests.map(ui => ui.interest) }
          },
          select: { id: true }
        });

        categoryIds = categories.map(c => c.id);
      }
    }

    // إذا لم نجد أي اهتمامات، نعيد أحدث المقالات
    if (categoryIds.length === 0) {
      const latestArticles = await prisma.article.findMany({
        where: { status: 'published' },
        include: {
          category: {
            select: { id: true, name: true, slug: true, color: true, icon: true }
          }
        },
        orderBy: { publishedAt: 'desc' },
        take: limit
      });

      return NextResponse.json({
        articles: latestArticles,
        source: 'latest',
        message: 'لم يتم العثور على اهتمامات محفوظة، يتم عرض أحدث المقالات'
      });
    }

    // جلب المقالات من التصنيفات المختارة
    const personalizedArticles = await prisma.article.findMany({
      where: {
        status: 'published',
        categoryId: { in: categoryIds }
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true, color: true, icon: true }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit
    });

    // خلط المقالات بشكل ذكي للتنوع
    const shuffledArticles = personalizedArticles.sort(() => {
      // الاحتفاظ بالمقالات المميزة في الأعلى
      if (personalizedArticles.some(a => a.featured)) {
        return personalizedArticles[0].featured ? -1 : 1;
      }
      return Math.random() - 0.5;
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'personalized_content_viewed',
        entityType: 'articles',
        metadata: {
          categoryIds,
          articlesCount: shuffledArticles.length
        }
      }
    });

    return NextResponse.json({
      articles: shuffledArticles,
      source: 'personalized',
      categoryIds,
      message: 'مقالات مخصصة بناءً على اهتماماتك'
    });

  } catch (error) {
    console.error('Error fetching personalized articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personalized articles' },
      { status: 500 }
    );
  }
} 