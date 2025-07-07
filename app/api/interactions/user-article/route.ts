import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

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
    const interactions = await prisma.interactions.findMany({
      where: {
        user_id: userId,
        article_id: articleId
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // تحديد آخر حالة لكل نوع من التفاعلات
    let liked = false;
    let saved = false;
    let shared = false;

    // البحث عن آخر تفاعل من نوع like
    const lastLikeInteraction = interactions.find((i: any) => 
      i.type === 'like'
    );
    if (lastLikeInteraction) {
      liked = true;
    }

    // البحث عن آخر تفاعل من نوع save
    const lastSaveInteraction = interactions.find((i: any) => 
      i.type === 'save'
    );
    if (lastSaveInteraction) {
      saved = true;
    }

    // المشاركة لا يمكن إلغاؤها، لذا نبحث فقط عن وجودها
    shared = interactions.some((i: any) => i.type === 'share');

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