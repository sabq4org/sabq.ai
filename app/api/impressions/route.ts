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
      interaction = await prisma.interactions.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          article_id: articleId,
          type: 'view',
          created_at: new Date()
        }
      });
    }

    // تسجيل النشاط إذا كان هناك مستخدم
    if (userId) {
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          action: 'article_viewed',
          entity_type: 'article',
          entity_id: articleId,
          metadata: {
            sessionId,
            userAgent,
            ipAddress,
            referrer,
            ...metadata
          },
          created_at: new Date()
        }
      });
    }

    // إضافة نقاط ولاء إذا كان هناك مستخدم
    if (userId) {
      try {
        await prisma.loyalty_points.create({
          data: {
            id: crypto.randomUUID(),
            user_id: userId,
            points: 1,
            action: 'article_view',
            reference_id: articleId,
            reference_type: 'article',
            created_at: new Date()
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
    const interaction = await prisma.interactions.update({
      where: { id: interactionId },
      data: {
        // يمكن إضافة metadata للتفاعل إذا لزم الأمر
      }
    });
    
    // إضافة نقاط ولاء إضافية إذا كانت القراءة مكتملة (أكثر من 30 ثانية)
    if (readDuration > 30 && interaction.user_id) {
      try {
        await prisma.loyalty_points.create({
          data: {
            id: crypto.randomUUID(),
            user_id: interaction.user_id,
            points: 2,
            action: 'read_complete',
            reference_id: interaction.article_id,
            reference_type: 'article',
            created_at: new Date()
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
    
    if (userId) where.user_id = userId;
    if (articleId) where.article_id = articleId;
    
    const interactions = await prisma.interactions.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50
    });

    // جلب معلومات المقالات بشكل منفصل
    const articleIds = [...new Set(interactions.map((i: { article_id: string }) => i.article_id).filter(Boolean))];
    const articles = await prisma.articles.findMany({
      where: { id: { in: articleIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        featured_image: true
      }
    });
    const articlesMap = new Map(articles.map((a: { id: string }) => [a.id, a]));
    const impressionsWithArticles = interactions.map((interaction: { article_id: string }) => ({
      ...interaction,
      article: interaction.article_id ? articlesMap.get(interaction.article_id) : null
    }));
    
    // حساب الإحصائيات
    const stats = {
      totalViews: interactions.length,
      uniqueUsers: new Set(interactions.filter((i: any) => i.user_id).map((i: any) => i.user_id)).size,
      totalArticles: new Set(interactions.map((i: any) => i.article_id)).size
    };
    
    return NextResponse.json({
      success: true,
      interactions: impressionsWithArticles,
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
        select: { category_id: true }
      });
      
      if (article?.category_id) {
        const category = await prisma.categories.findUnique({
          where: { id: article.category_id },
          select: { slug: true }
        });
        
        if (category?.slug) {
          // تحديث اهتمامات المستخدم في UserPreference
          const userPreference = await prisma.user_preferences.findUnique({
            where: {
              user_id_key: {
                user_id: userId,
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
          
          await prisma.user_preferences.upsert({
            where: {
              user_id_key: {
                user_id: userId,
                key: 'interests'
              }
            },
            update: {
              value: currentInterests,
              updated_at: new Date()
            },
            create: {
              id: crypto.randomUUID(),
              user_id: userId,
              key: 'interests',
              value: currentInterests,
              updated_at: new Date()
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating reading history:', error);
  }
} 