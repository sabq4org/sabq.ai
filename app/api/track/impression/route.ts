import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      contentId, 
      contentType, 
      impressionType, 
      duration,
      scrollDepth,
      metadata 
    } = body;

    // التحقق من البيانات المطلوبة
    if (!contentId || !contentType || !impressionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // تسجيل الانطباع
    const impression = await prisma.impression.create({
      data: {
        userId: userId || null,
        contentId,
        contentType,
        impressionType,
        duration: duration || null,
        scrollDepth: scrollDepth || null,
        metadata: metadata || null
      }
    });

    // تحديث إحصائيات المحتوى إذا كان مقالاً
    if (contentType === 'article' && impressionType === 'view') {
      await prisma.article.update({
        where: { id: contentId },
        data: { views: { increment: 1 } }
      }).catch(() => {
        // تجاهل الخطأ إذا لم يكن المقال موجوداً
      });
    }

    return NextResponse.json({ 
      success: true, 
      impression: {
        id: impression.id,
        createdAt: impression.createdAt
      }
    });
  } catch (error) {
    console.error('Error tracking impression:', error);
    return NextResponse.json(
      { error: 'Failed to track impression' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contentType = searchParams.get('contentType');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (userId) where.userId = userId;
    if (contentType) where.contentType = contentType;

    const impressions = await prisma.impression.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ impressions });
  } catch (error) {
    console.error('Error fetching impressions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch impressions' },
      { status: 500 }
    );
  }
} 