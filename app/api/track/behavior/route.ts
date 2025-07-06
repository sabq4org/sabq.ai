import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      sessionId, 
      action, 
      page, 
      element, 
      value, 
      metadata 
    } = body;

    // التحقق من البيانات المطلوبة
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // الحصول على معلومات الطلب
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // تسجيل السلوك في activityLog
    const behavior = await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action: `behavior_${action}`,
        entityType: 'behavior',
        entityId: sessionId || 'anonymous',
        metadata: {
          sessionId: sessionId || null,
          page: page || null,
          element: element || null,
          value: value || null,
          ipAddress: ipAddress.split(',')[0].trim(),
          userAgent: userAgent.substring(0, 500),
          ...metadata
        },
        ipAddress: ipAddress.split(',')[0].trim(),
        userAgent: userAgent.substring(0, 500)
      }
    });

    // تحديث اهتمامات المستخدم بناءً على السلوك
    if (userId && action === 'view' && metadata?.category) {
      await updateUserInterest(userId, metadata.category);
    }

    return NextResponse.json({ 
      success: true, 
      behavior: {
        id: behavior.id,
        createdAt: behavior.createdAt
      }
    });
  } catch (error) {
    console.error('Error tracking behavior:', error);
    return NextResponse.json(
      { error: 'Failed to track behavior' },
      { status: 500 }
    );
  }
}

async function updateUserInterest(userId: string, interest: string) {
  try {
    // تحديث اهتمامات المستخدم في UserPreference
    const userPreference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key: 'interests'
        }
      }
    });
    
    let currentInterests = userPreference ? (userPreference.value as any[]) || [] : [];
    const existingIndex = currentInterests.findIndex((i: any) => i.name === interest);
    
    if (existingIndex >= 0) {
      currentInterests[existingIndex].score = (currentInterests[existingIndex].score || 1.0) + 0.1;
    } else {
      currentInterests.push({ name: interest, score: 1.0 });
    }
    
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
  } catch (error) {
    console.error('Error updating user interest:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { entityType: 'behavior' };
    if (userId) where.userId = userId;
    if (action) where.action = `behavior_${action}`;

    const behaviors = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        createdAt: true,
        metadata: true
      }
    });

    // تصفية السلوكيات حسب sessionId إذا تم تحديده
    const filteredBehaviors = sessionId 
      ? behaviors.filter((b: any) => {
          const metadata = b.metadata as any;
          return metadata?.sessionId === sessionId;
        })
      : behaviors;

    return NextResponse.json({ behaviors: filteredBehaviors });
  } catch (error) {
    console.error('Error fetching behaviors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch behaviors' },
      { status: 500 }
    );
  }
} 