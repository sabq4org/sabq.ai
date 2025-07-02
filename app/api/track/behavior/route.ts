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

    // تسجيل السلوك
    const behavior = await prisma.userBehavior.create({
      data: {
        userId: userId || null,
        sessionId: sessionId || null,
        action,
        page: page || null,
        element: element || null,
        value: value || null,
        metadata: metadata || null,
        ipAddress: ipAddress.split(',')[0].trim(), // في حالة وجود عدة IPs
        userAgent: userAgent.substring(0, 500) // تحديد الطول
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
    await prisma.userInterest.upsert({
      where: {
        userId_interest: {
          userId,
          interest
        }
      },
      update: {
        score: { increment: 0.1 },
        updatedAt: new Date()
      },
      create: {
        userId,
        interest,
        score: 1.0,
        source: 'implicit'
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

    const where: any = {};
    if (userId) where.userId = userId;
    if (sessionId) where.sessionId = sessionId;
    if (action) where.action = action;

    const behaviors = await prisma.userBehavior.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        page: true,
        element: true,
        value: true,
        createdAt: true,
        metadata: true
      }
    });

    return NextResponse.json({ behaviors });
  } catch (error) {
    console.error('Error fetching behaviors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch behaviors' },
      { status: 500 }
    );
  }
} 