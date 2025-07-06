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

    // جلب اهتمامات المستخدم من UserPreference
    const userPreference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key: 'interests'
        }
      }
    });

    const interests = userPreference ? (userPreference.value as any[]) || [] : [];

    // جلب الفئات المتاحة للاهتمامات
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        // color: true
      }
    });

    return NextResponse.json({ 
      interests,
      availableCategories: categories
    });
  } catch (error) {
    console.error('Error fetching interests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, interests } = body;

    if (!userId || !interests || !Array.isArray(interests)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // تحديث تفضيلات المستخدم
    const userPreference = await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId,
          key: 'interests'
        }
      },
      update: {
        value: interests,
        updatedAt: new Date()
      },
      create: {
        userId,
        key: 'interests',
        value: interests
      }
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'interests_updated',
        metadata: { interests: interests.map((i: any) => i.name || i) }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Interests updated successfully',
      count: interests.length
    });
  } catch (error) {
    console.error('Error updating interests:', error);
    return NextResponse.json(
      { error: 'Failed to update interests' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, interest, score, action } = body;

    if (!userId || !interest) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // جلب الاهتمامات الحالية
    const userPreference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key: 'interests'
        }
      }
    });

    let currentInterests = userPreference ? (userPreference.value as any[]) || [] : [];

    if (action === 'remove') {
      // حذف اهتمام
      currentInterests = currentInterests.filter((i: any) => i.name !== interest && i !== interest);
    } else {
      // تحديث أو إضافة اهتمام
      const existingIndex = currentInterests.findIndex((i: any) => i.name === interest || i === interest);
      
      if (existingIndex >= 0) {
        // تحديث الاهتمام الموجود
        if (typeof currentInterests[existingIndex] === 'string') {
          currentInterests[existingIndex] = { name: interest, score: score || 1.0 };
        } else {
          currentInterests[existingIndex].score = score || (currentInterests[existingIndex].score || 1.0) + 0.1;
        }
      } else {
        // إضافة اهتمام جديد
        currentInterests.push({ name: interest, score: score || 1.0 });
      }
    }

    // حفظ التحديثات
    await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId,
          key: 'interests'
        }
      },
      update: {
        value: currentInterests,
        updatedAt: new Date()
      },
      create: {
        userId,
        key: 'interests',
        value: currentInterests
      }
    });

    return NextResponse.json({ 
      success: true,
      message: action === 'remove' ? 'Interest removed successfully' : 'Interest updated successfully',
      interests: currentInterests
    });
  } catch (error) {
    console.error('Error updating interest:', error);
    return NextResponse.json(
      { error: 'Failed to update interest' },
      { status: 500 }
    );
  }
} 