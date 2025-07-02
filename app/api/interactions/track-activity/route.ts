import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface InteractionRequest {
  userId: string;
  articleId: string;
  interactionType: 'read' | 'like' | 'share' | 'save' | 'view' | 'comment' | 'unlike' | 'unsave';
  metadata?: {
    duration?: number;
    source?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

// نظام النقاط المحدث
const POINT_RULES: { [key: string]: { points: number; description: string } } = {
  read: { points: 1, description: 'قراءة مقال' },
  like: { points: 1, description: 'إعجاب بمقال' },
  share: { points: 3, description: 'مشاركة مقال' },
  save: { points: 1, description: 'حفظ مقال' },
  comment: { points: 4, description: 'تعليق على مقال' },
  view: { points: 0, description: 'مشاهدة مقال' },
  unlike: { points: -1, description: 'إلغاء إعجاب' },
  unsave: { points: -1, description: 'إلغاء حفظ' }
};

export async function POST(request: NextRequest) {
  try {
    const body: InteractionRequest = await request.json();
    const { userId, articleId, interactionType, metadata = {} } = body;

    console.log('=== تتبع التفاعل ===');
    console.log('userId:', userId);
    console.log('articleId:', articleId);
    console.log('interactionType:', interactionType);
    console.log('metadata:', metadata);

    if (!userId || !articleId || !interactionType) {
      console.error('بيانات غير كاملة:', { userId, articleId, interactionType });
      return NextResponse.json(
        { success: false, error: 'بيانات غير كاملة' },
        { status: 400 }
      );
    }

    // التحقق من صحة نوع التفاعل
    if (!POINT_RULES[interactionType]) {
      return NextResponse.json(
        { success: false, error: 'نوع تفاعل غير صحيح' },
        { status: 400 }
      );
    }

    const rule = POINT_RULES[interactionType];
    const pointsEarned = rule.points;

    // معالجة التفاعلات like/unlike و save/unsave
    if (interactionType === 'like' || interactionType === 'save') {
      console.log(`محاولة حفظ ${interactionType} في قاعدة البيانات...`);
      
      // إنشاء أو تحديث التفاعل
      const result = await prisma.interaction.upsert({
        where: {
          userId_articleId_type: {
            userId,
            articleId,
            type: interactionType
          }
        },
        create: {
          userId,
          articleId,
          type: interactionType
        },
        update: {} // لا نحتاج تحديث أي شيء
      });
      
      console.log('نتيجة الحفظ في DB:', result);
    } else if (interactionType === 'unlike') {
      console.log('محاولة حذف الإعجاب من قاعدة البيانات...');
      
      // حذف تفاعل الإعجاب
      try {
        const deleteResult = await prisma.interaction.delete({
          where: {
            userId_articleId_type: {
              userId,
              articleId,
              type: 'like'
            }
          }
        });
        console.log('تم حذف الإعجاب:', deleteResult);
      } catch (error) {
        console.log('التفاعل غير موجود للحذف');
        // قد يكون التفاعل غير موجود، وهذا عادي
      }
    } else if (interactionType === 'unsave') {
      // حذف تفاعل الحفظ
      try {
        await prisma.interaction.delete({
          where: {
            userId_articleId_type: {
              userId,
              articleId,
              type: 'save'
            }
          }
        });
      } catch (error) {
        // قد يكون التفاعل غير موجود، وهذا عادي
      }
    } else if (interactionType === 'share') {
      // تسجيل المشاركة
      await prisma.interaction.create({
        data: {
          userId,
          articleId,
          type: 'share'
        }
      });
    } else if (interactionType === 'view') {
      // تسجيل المشاهدة وتحديث عدد المشاهدات
      await prisma.interaction.create({
        data: {
          userId,
          articleId,
          type: 'view'
        }
      });

      // تحديث عدد المشاهدات في المقال
      await prisma.article.update({
        where: { id: articleId },
        data: {
          views: { increment: 1 }
        }
      });
    }

    // تسجيل نقاط الولاء إذا كانت موجبة
    if (pointsEarned !== 0) {
      try {
        await prisma.loyaltyPoint.create({
          data: {
            userId,
            points: pointsEarned,
            action: interactionType,
            referenceId: articleId,
            referenceType: 'article',
            metadata: {
              ...metadata,
              description: rule.description
            }
          }
        });
      } catch (error) {
        console.error('خطأ في تسجيل نقاط الولاء:', error);
      }
    }

    // تسجيل النشاط
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action: `article_${interactionType}`,
          entityType: 'article',
          entityId: articleId,
          metadata: {
            ...metadata,
            points_earned: pointsEarned,
            description: rule.description
          }
        }
      });
    } catch (error) {
      console.error('خطأ في تسجيل النشاط:', error);
    }

    return NextResponse.json({
      success: true,
      interaction_id: `${userId}_${articleId}_${interactionType}`,
      points_earned: pointsEarned,
      message: pointsEarned > 0 
        ? `تم ${rule.description} وحصلت على ${pointsEarned} نقطة!` 
        : `تم ${rule.description}`,
      loyalty_points: {
        success: true,
        points: pointsEarned
      }
    });

  } catch (error) {
    console.error('خطأ في تسجيل التفاعل:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'حدث خطأ في تسجيل التفاعل',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const articleId = url.searchParams.get('articleId');
    const type = url.searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // بناء شروط البحث
    const where: any = { userId };
    if (articleId) where.articleId = articleId;
    if (type) where.type = type;

    const interactions = await prisma.interaction.findMany({
      where,
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // تحويل البيانات للتوافق مع الشكل المتوقع
    const formattedInteractions = interactions.map(interaction => ({
      id: interaction.id,
      user_id: interaction.userId,
      article_id: interaction.articleId,
      interaction_type: interaction.type,
      timestamp: interaction.createdAt.toISOString(),
      article: interaction.article
    }));

    return NextResponse.json({
      success: true,
      interactions: formattedInteractions,
      total: formattedInteractions.length
    });

  } catch (error) {
    console.error('خطأ في جلب التفاعلات:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب التفاعلات' },
      { status: 500 }
    );
  }
} 