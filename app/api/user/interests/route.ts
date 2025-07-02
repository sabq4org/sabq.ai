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

    // جلب اهتمامات المستخدم
    const interests = await prisma.userInterest.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
      select: {
        id: true,
        interest: true,
        score: true,
        source: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // جلب الفئات المتاحة للاهتمامات
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true
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

    // حذف الاهتمامات القديمة
    await prisma.userInterest.deleteMany({
      where: { userId }
    });

    // إضافة الاهتمامات الجديدة
    const userInterests = await prisma.userInterest.createMany({
      data: interests.map(interest => ({
        userId,
        interest: interest.name || interest,
        score: interest.score || 1.0,
        source: 'explicit'
      }))
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'interests_updated',
        metadata: { interests: interests.map(i => i.name || i) }
      }
    });

    // تحديث تفضيلات المستخدم
    await prisma.userPreference.upsert({
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

    return NextResponse.json({ 
      success: true,
      message: 'Interests updated successfully',
      count: userInterests.count
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

    if (action === 'remove') {
      // حذف اهتمام
      await prisma.userInterest.delete({
        where: {
          userId_interest: {
            userId,
            interest
          }
        }
      });

      return NextResponse.json({ 
        success: true,
        message: 'Interest removed successfully'
      });
    } else {
      // تحديث أو إضافة اهتمام
      const userInterest = await prisma.userInterest.upsert({
        where: {
          userId_interest: {
            userId,
            interest
          }
        },
        update: {
          score: score || { increment: 0.1 },
          updatedAt: new Date()
        },
        create: {
          userId,
          interest,
          score: score || 1.0,
          source: 'explicit'
        }
      });

      return NextResponse.json({ 
        success: true,
        interest: userInterest
      });
    }
  } catch (error) {
    console.error('Error updating interest:', error);
    return NextResponse.json(
      { error: 'Failed to update interest' },
      { status: 500 }
    );
  }
} 