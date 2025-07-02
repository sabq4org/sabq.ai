import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { handleOptions, corsResponse } from '@/lib/cors';

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return handleOptions();
}

// بدء انطباع قراءة
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie?.value) {
      return corsResponse(
        { error: 'يجب تسجيل الدخول' },
        401
      );
    }

    // استخراج معرف المستخدم من كوكي user
    let userId: string;
    try {
      const userData = JSON.parse(decodeURIComponent(userCookie.value));
      userId = userData.id;
      
      if (!userId) {
        return corsResponse(
          { error: 'معرف المستخدم غير صالح' },
          401
        );
      }
    } catch (error) {
      console.error('Error parsing user cookie:', error);
      return corsResponse(
        { error: 'بيانات المستخدم غير صالحة' },
        401
      );
    }

    const body = await request.json();
    const { sessionId, impressions } = body;

    if (!sessionId || !impressions || !Array.isArray(impressions)) {
      return NextResponse.json(
        { error: 'بيانات غير كاملة' },
        { status: 400 }
      );
    }

    // إنشاء الانطباعات دفعة واحدة
    const createdImpressions = await prisma.impression.createMany({
      data: impressions.map((impression: any) => ({
        userId,
        articleId: impression.articleId,
        sessionId,
        metadata: impression.metadata || {}
      })),
      skipDuplicates: true
    });

    // إضافة نقاط ولاء للمشاهدة (نقطة واحدة لكل جلسة مشاهدة)
    if (createdImpressions.count > 0) {
      await prisma.loyaltyPoint.create({
        data: {
          userId,
          points: 1,
          action: 'content_view',
          referenceId: sessionId,
          referenceType: 'session',
          metadata: {
            impressionsCount: createdImpressions.count,
            timestamp: new Date().toISOString()
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      count: createdImpressions.count,
      message: `تم تسجيل ${createdImpressions.count} انطباع بنجاح`
    });

  } catch (error) {
    console.error('Error recording impressions:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الانطباعات' },
      { status: 500 }
    );
  }
}

// انتهاء انطباع القراءة
export async function PUT(request: NextRequest) {
  try {
    const { impressionId, readDuration } = await request.json();
    
    if (!impressionId || readDuration === undefined) {
      return NextResponse.json(
        { error: 'Impression ID and read duration are required' },
        { status: 400 }
      );
    }
    
    // تحديث مدة القراءة ووقت الانتهاء
    const impression = await prisma.impression.update({
      where: { id: impressionId },
      data: {
        endedAt: new Date(),
        metadata: {
          readDuration
        }
      }
    });
    
    // إضافة نقاط ولاء إضافية إذا كانت القراءة مكتملة (أكثر من 30 ثانية)
    if (readDuration > 30 && impression.userId) {
      try {
        await prisma.loyaltyPoint.create({
          data: {
            userId: impression.userId,
            points: 2,
            action: 'read_complete',
            referenceId: impression.articleId,
            referenceType: 'article'
          }
        });
      } catch (error) {
        // تجاهل إذا كانت النقاط موجودة
      }
    }
    
    return NextResponse.json({
      success: true,
      impression
    });
    
  } catch (error) {
    console.error('Error updating impression:', error);
    return NextResponse.json(
      { error: 'Failed to update impression' },
      { status: 500 }
    );
  }
}

// جلب انطباعات المستخدم أو المقال
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const articleId = searchParams.get('articleId');
    const sessionId = searchParams.get('sessionId');
    
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (articleId) where.articleId = articleId;
    if (sessionId) where.sessionId = sessionId;
    
    const impressions = await prisma.impression.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
            categoryId: true,
            readingTime: true
          }
        }
      }
    });
    
    // حساب الإحصائيات
    const stats = {
      totalImpressions: impressions.length,
      completedReads: impressions.filter(i => i.readingComplete).length,
      averageScrollDepth: impressions.reduce((sum, i) => sum + (i.scrollDepth || 0), 0) / impressions.length || 0,
      averageActiveTime: impressions.reduce((sum, i) => sum + (i.activeTime || 0), 0) / impressions.length || 0,
      totalReadingTime: impressions.reduce((sum, i) => sum + (i.durationSeconds || 0), 0)
    };
    
    return NextResponse.json({
      success: true,
      impressions,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching impressions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch impressions' },
      { status: 500 }
    );
  }
}

// دالة مساعدة لتحديث سجل القراءة
async function updateReadingHistory(
  userId: string,
  articleId: string,
  scrollDepth: number,
  activeTime: number
) {
  try {
    const existingHistory = await prisma.readingHistory.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId
        }
      }
    });
    
    if (existingHistory) {
      await prisma.readingHistory.update({
        where: {
          userId_articleId: {
            userId,
            articleId
          }
        },
        data: {
          readingProgress: Math.max(existingHistory.readingProgress, scrollDepth),
          totalReadTime: existingHistory.totalReadTime + activeTime,
          readCount: existingHistory.readCount + 1
        }
      });
    } else {
      await prisma.readingHistory.create({
        data: {
          userId,
          articleId,
          readingProgress: scrollDepth,
          totalReadTime: activeTime,
          readCount: 1
        }
      });
    }
    
    // تحديث اهتمامات المستخدم بناءً على القراءة
    if (scrollDepth > 50) {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { categoryId: true }
      });
      
      if (article?.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: article.categoryId },
          select: { slug: true }
        });
        
        if (category?.slug) {
          await prisma.userInterest.upsert({
            where: {
              userId_interest: {
                userId,
                interest: category.slug
              }
            },
            update: {
              score: {
                increment: 0.1
              }
            },
            create: {
              userId,
              interest: category.slug,
              score: 1.0,
              source: 'implicit'
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating reading history:', error);
  }
} 