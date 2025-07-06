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
    const savedPreference = await prisma.user_preferences.findUnique({
      where: {
        user_id_key: {
          user_id: userId,
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

    // إذا لم نجد تفضيلات محفوظة، نحاول من UserPreference
    if (categoryIds.length === 0) {
      const userPreferences = await prisma.user_preferences.findMany({
        where: { 
          user_id: userId,
          key: { startsWith: 'category_' }
        },
        select: { value: true }
      });

      if (userPreferences.length > 0) {
        const categorySlugs = userPreferences.map((pref: any) => {
          const value = pref.value as any;
          return value?.categorySlug || '';
        }).filter((slug: string) => Boolean(slug));

        const categories = await prisma.categories.findMany({
          where: {
            slug: { in: categorySlugs }
          },
          select: { id: true }
        });

        categoryIds = categories.map((c: { id: string }) => c.id);
      }
    }

    // إذا لم نجد أي اهتمامات، نعيد أحدث المقالات
    if (categoryIds.length === 0) {
      const latestArticles = await prisma.articles.findMany({
        where: { status: 'published' },
        include: {
          category: { select: { id: true, name: true, slug: true,  } }
        },
        orderBy: { published_at: 'desc' },
        take: limit
      });

      return NextResponse.json({
        articles: latestArticles,
        source: 'latest',
        message: 'لم يتم العثور على اهتمامات محفوظة، يتم عرض أحدث المقالات'
      });
    }

    // جلب المقالات من التصنيفات المختارة
    const personalizedArticles = await prisma.articles.findMany({
      where: {
        status: 'published',
        category_id: { in: categoryIds }
      },
      include: {
        category: { select: { id: true, name: true, slug: true,  } }
      },
      orderBy: [
        { featured: 'desc' },
        { published_at: 'desc' }
      ],
      take: limit
    });

    // خلط المقالات بشكل ذكي للتنوع
    const shuffledArticles = personalizedArticles.sort((a: any, b: any) => {
      // الاحتفاظ بالمقالات المميزة في الأعلى
      if (personalizedArticles.some((a: any) => a.featured)) {
        return personalizedArticles[0].featured ? -1 : 1;
      }
      return Math.random() - 0.5;
    });

    // تسجيل النشاط
    await prisma.activity_logs.create({
      data: {
        user_id: userId,
        action: 'personalized_content_viewed',
        entity_type: 'articles',
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