import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { handleOptions, corsResponse } from '@/lib/cors';

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return handleOptions();
}

export const runtime = 'nodejs';

// GET: جلب التفاعلات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('user_id');
    const articleId = searchParams.get('article_id');
    const type = searchParams.get('type');
    
    // بناء شروط البحث
    const where: any = {};
    if (userId) where.userId = userId;
    if (articleId) where.articleId = articleId;
    if (type) where.type = type;
    
    const interactions = await prisma.interaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return corsResponse({
      success: true,
      interactions,
      total: interactions.length
    });
    
  } catch (error) {
    console.error('خطأ في جلب التفاعلات:', error);
    return corsResponse({
      success: false,
      error: 'فشل في جلب التفاعلات'
    }, 500);
  }
}

// POST: إنشاء تفاعل جديد
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة باستخدام cookies
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
    const { articleId, type, action } = body;

    if (!articleId || !type || !action) {
      return corsResponse(
        { error: 'بيانات غير كاملة' },
        400
      );
    }

    // التحقق من وجود المقال
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        category: true
      }
    });

    if (!article) {
      return corsResponse(
        { error: 'المقال غير موجود' },
        404
      );
    }

    // إنشاء session ID
    const sessionId = `session-${userId}-${Date.now()}`;
    let loyaltyPointsEarned = 0;

    // معالجة التفاعلات بناءً على النوع
    if (type === 'like') {
      if (action === 'add') {
        // إضافة إعجاب
        const existingLike = await prisma.interaction.findFirst({
          where: {
            userId,
            articleId,
            type: 'like'
          }
        });

        if (!existingLike) {
          // إنشاء تفاعل جديد
          await prisma.interaction.create({
            data: {
              userId,
              articleId,
              type: 'like'
            }
          });

          // إضافة نقاط الولاء
          loyaltyPointsEarned = 5;
          await prisma.loyaltyPoint.create({
            data: {
              userId,
              points: loyaltyPointsEarned,
              action: 'article_like',
              referenceId: articleId,
              referenceType: 'article',
              metadata: {
                articleTitle: article.title,
                category: article.category?.name || 'general'
              }
            }
          });

          // تسجيل انطباع
          await prisma.impression.create({
            data: {
              userId,
              articleId,
              sessionId,
              metadata: {
                type: 'like',
                category: article.category?.name || 'general'
              }
            }
          });
        }
      } else if (action === 'remove') {
        // إزالة إعجاب
        await prisma.interaction.deleteMany({
          where: {
            userId,
            articleId,
            type: 'like'
          }
        });
      }
    } else if (type === 'save') {
      if (action === 'add') {
        // حفظ المقال - نستخدم جدول interactions بدلاً من bookmarks
        const existingSave = await prisma.interaction.findFirst({
          where: {
            userId,
            articleId,
            type: 'save'
          }
        });

        if (!existingSave) {
          // إنشاء تفاعل حفظ
          await prisma.interaction.create({
            data: {
              userId,
              articleId,
              type: 'save'
            }
          });

          // إضافة نقاط الولاء
          loyaltyPointsEarned = 3;
          await prisma.loyaltyPoint.create({
            data: {
              userId,
              points: loyaltyPointsEarned,
              action: 'article_save',
              referenceId: articleId,
              referenceType: 'article',
              metadata: {
                articleTitle: article.title,
                category: article.category?.name || 'general'
              }
            }
          });

          // تسجيل انطباع
          await prisma.impression.create({
            data: {
              userId,
              articleId,
              sessionId,
              metadata: {
                type: 'save',
                category: article.category?.name || 'general'
              }
            }
          });
        }
      } else if (action === 'remove') {
        // إزالة الحفظ
        await prisma.interaction.deleteMany({
          where: {
            userId,
            articleId,
            type: 'save'
          }
        });
      }
    }

    // جلب إجمالي نقاط الولاء للمستخدم
    const totalPoints = await prisma.loyaltyPoint.aggregate({
      where: { userId },
      _sum: { points: true }
    });

    return corsResponse({
      success: true,
      loyaltyPoints: loyaltyPointsEarned,
      totalLoyaltyPoints: totalPoints._sum.points || 0,
      message: action === 'add' 
        ? (type === 'like' ? 'تم الإعجاب بنجاح' : 'تم حفظ المقال')
        : (type === 'like' ? 'تم إلغاء الإعجاب' : 'تم إلغاء الحفظ')
    });

  } catch (error) {
    console.error('Error processing interaction:', error);
    return corsResponse(
      { error: 'حدث خطأ في معالجة التفاعل' },
      500
    );
  }
}

// DELETE: حذف تفاعل
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, article_id, type } = body;
    
    if (!user_id || !article_id || !type) {
      return corsResponse({
        success: false,
        error: 'معرف المستخدم والمقال ونوع التفاعل مطلوبة'
      }, 400);
    }
    
    // حذف التفاعل
    await prisma.interaction.delete({
      where: {
        userId_articleId_type: {
          userId: user_id,
          articleId: article_id,
          type: type
        }
      }
    });
    
    // خصم نقاط الولاء
    if (type === 'like' || type === 'save') {
      await prisma.loyaltyPoint.create({
        data: {
          userId: user_id,
          points: -(type === 'like' ? 5 : 10),
          action: `cancel_${type}`,
          referenceId: article_id,
          referenceType: 'article'
        }
      });
    }
    
    return corsResponse({
      success: true,
      message: 'تم حذف التفاعل بنجاح'
    });
    
  } catch (error) {
    console.error('خطأ في حذف التفاعل:', error);
    return corsResponse({
      success: false,
      error: 'فشل في حذف التفاعل',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, 500);
  }
}

 