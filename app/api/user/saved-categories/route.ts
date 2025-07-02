import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // جلب التصنيفات المحفوظة من UserPreference
    const savedPreference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key: 'selected_categories'
        }
      }
    });

    if (savedPreference && savedPreference.value) {
      // التأكد من أن القيمة مصفوفة
      const categoryIds = Array.isArray(savedPreference.value) 
        ? savedPreference.value 
        : [];
      
      return NextResponse.json({ 
        success: true,
        categoryIds,
        source: 'database'
      });
    }

    // إذا لم نجد في UserPreference، نحاول من UserInterest
    const userInterests = await prisma.userInterest.findMany({
      where: { userId },
      select: { interest: true }
    });

    if (userInterests.length > 0) {
      // جلب التصنيفات بناءً على الـ slug
      const categories = await prisma.category.findMany({
        where: {
          slug: { in: userInterests.map(ui => ui.interest) }
        },
        select: { id: true }
      });

      const categoryIds = categories.map(c => c.id);
      
      return NextResponse.json({ 
        success: true,
        categoryIds,
        source: 'interests'
      });
    }

    // لا توجد تفضيلات محفوظة
    return NextResponse.json({ 
      success: true,
      categoryIds: [],
      source: 'none'
    });

  } catch (error) {
    console.error('Error fetching saved categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved categories' },
      { status: 500 }
    );
  }
} 