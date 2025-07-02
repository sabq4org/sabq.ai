import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    const userId = searchParams.get('userId');

    if (!articleId || !userId) {
      return NextResponse.json(
        { error: 'معرف المقال والمستخدم مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من الإعجاب
    const liked = await prisma.interaction.findFirst({
      where: {
        userId,
        articleId,
        type: 'like'
      }
    });

    // التحقق من الحفظ
    const saved = await prisma.interaction.findFirst({
      where: {
        userId,
        articleId,
        type: 'save'
      }
    });

    return NextResponse.json({
      liked: !!liked,
      saved: !!saved
    });

  } catch (error) {
    console.error('Error checking interactions:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في التحقق من التفاعلات' },
      { status: 500 }
    );
  }
} 