import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const articleId = searchParams.get('articleId');

    if (!userId || !articleId) {
      return NextResponse.json(
        { error: 'Missing userId or articleId' },
        { status: 400 }
      );
    }
    
    // إذا كان المستخدم غير مسجل، نرجع قيم افتراضية
    if (userId === 'anonymous') {
      return NextResponse.json({
        success: true,
        data: {
          liked: false,
          saved: false,
          shared: false
        },
        totalInteractions: 0,
        message: 'Anonymous user - using default state'
      });
    }

    // جلب جميع التفاعلات للمستخدم مع هذا المقال من قاعدة البيانات
    const interactions = await prisma.interaction.findMany({
      where: {
        userId: userId,
        articleId: articleId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // تحديد آخر حالة لكل نوع من التفاعلات
    let liked = false;
    let saved = false;
    let shared = false;

    // البحث عن آخر تفاعل من نوع like/unlike
    const lastLikeInteraction = interactions.find(i => 
      i.type === 'like' || i.type === 'unlike'
    );
    if (lastLikeInteraction) {
      liked = lastLikeInteraction.type === 'like';
    }

    // البحث عن آخر تفاعل من نوع save/unsave
    const lastSaveInteraction = interactions.find(i => 
      i.type === 'save' || i.type === 'unsave'
    );
    if (lastSaveInteraction) {
      saved = lastSaveInteraction.type === 'save';
    }

    // المشاركة لا يمكن إلغاؤها، لذا نبحث فقط عن وجودها
    shared = interactions.some(i => i.type === 'share');

    // الحالة النهائية
    const interactionState = {
      liked,
      saved,
      shared
    };

    return NextResponse.json({
      success: true,
      data: interactionState,
      totalInteractions: interactions.length
    });
  } catch (error) {
    console.error('Error fetching user-article interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
} 