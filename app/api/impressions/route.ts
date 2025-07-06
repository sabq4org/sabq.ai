import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { handleOptions, corsResponse } from '@/lib/cors';

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
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
    const { 
      articleId, 
      sessionId, 
      userAgent, 
      ipAddress,
      referrer,
      metadata 
    } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // تسجيل التفاعل كـ view (فقط إذا كان هناك مستخدم)
    let interaction = null;
    if (userId) {
      interaction = await prisma.interaction.create({
        data: {
          userId,
          articleId,
          type: 'view'
        }
      });
    }

    // تسجيل النشاط إذا كان هناك مستخدم
    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'article_viewed',
          entityType: 'article',
          entityId: articleId,
          metadata: {
            sessionId,
            userAgent,
            ipAddress,
            referrer,
            ...metadata
          }
        }
      });
    }

    // إضافة نقاط ولاء إذا كان هناك مستخدم
    if (userId) {
      try {
        await prisma.loyaltyPoint.create({
          data: {
            userId,
            points: 1,
            action: 'article_view',
            referenceId: articleId,
            referenceType: 'article'
          }
        });
      } catch (error) {
        // تجاهل إذا كانت النقاط موجودة
      }
    }

    return NextResponse.json({
      success: true,
      interactionId: interaction?.id || null,
      message: 'Impression recorded successfully'
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
    const { interactionId, readDuration } = await request.json();
    
    if (!interactionId || readDuration === undefined) {
      return NextResponse.json(
        { error: 'Interaction ID and read duration are required' },
        { status: 400 }
      );
    }
    
    // تحديث التفاعل مع معلومات القراءة
    const interaction = await prisma.interaction.update({
      where: { id: interactionId },
      data: {
        // يمكن إضافة metadata للتفاعل إذا لزم الأمر
      }
    });
    
    // إضافة نقاط ولاء إضافية إذا كانت القراءة مكتملة (أكثر من 30 ثانية)
    if (readDuration > 30 && interaction.userId) {
      try {
        await prisma.loyaltyPoint.create({
          data: {
            userId: interaction.userId,
            points: 2,
            action: 'read_complete',
            referenceId: interaction.articleId,
            referenceType: 'article'
          }
        });
      } catch (error) {
        // تجاهل إذا كانت النقاط موجودة
      }
    }
    
    return NextResponse.json({
      success: true,
      interaction
    });
    
  } catch (error) {
    console.error('Error updating interaction:', error);
    return NextResponse.json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    );
  }
}

// جلب تفاعلات المستخدم أو المقال
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const articleId = searchParams.get('articleId');
    
    const where: any = { type: 'view' };
    
    if (userId) where.userId = userId;
    if (articleId) where.articleId = articleId;
    
    const interactions = await prisma.interaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
      totalViews: interactions.length,
      uniqueUsers: new Set(interactions.filter(i => i.userId).map(i => i.userId)).size,
      totalArticles: new Set(interactions.map(i => i.articleId)).size
    };
    
    return NextResponse.json({
      success: true,
      interactions,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
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
    // تحديث اهتمامات المستخدم بناءً على القراءة
    if (scrollDepth > 50) {
      const article = await prisma.articles.findUnique({
        where: { id: articleId },
        select: { categoryId: true }
      });
      
      if (article?.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: article.categoryId },
          select: { slug: true }
        });
        
        if (category?.slug) {
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
          const existingIndex = currentInterests.findIndex((i: any) => i.name === category.slug);
          
          if (existingIndex >= 0) {
            currentInterests[existingIndex].score = (currentInterests[existingIndex].score || 1.0) + 0.1;
          } else {
            currentInterests.push({ name: category.slug, score: 1.0 });
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
        }
      }
    }
  } catch (error) {
    console.error('Error updating reading history:', error);
  }
} 