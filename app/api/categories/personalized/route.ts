import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleOptions, corsResponse } from '@/lib/cors';

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return handleOptions();
}

export const runtime = 'nodejs';

// GET: جلب التصنيفات المخصصة للمستخدم
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '6');
    
    if (!userId) {
      return corsResponse({
        success: false,
        error: 'معرف المستخدم مطلوب'
      }, 400);
    }

    // جلب تفضيلات المستخدم
    const userPreferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    // جلب اهتمامات المستخدم من UserPreference
    const userInterestPreference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key: 'interests'
        }
      }
    });
    
    const userInterests = userInterestPreference ? (userInterestPreference.value as any[]) || [] : [];

    // جلب تفاعلات المستخدم مع المقالات
    const userInteractions = await prisma.interaction.findMany({
      where: { 
        userId,
        type: { in: ['like', 'share'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // جلب معرفات المقالات من التفاعلات
    const articleIds = userInteractions.map(interaction => interaction.articleId);
    
    // جلب مقالات مع تصنيفاتها
    const articlesWithCategories = articleIds.length > 0 ? await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, categoryId: true }
    }) : [];
    
    const articleCategoryMap = new Map(
      articlesWithCategories.map(article => [article.id, article.categoryId])
    );

    // حساب تفضيلات التصنيفات بناءً على التفاعلات
    const categoryScores: { [categoryId: string]: number } = {};
    
    // إضافة نقاط من التفضيلات المباشرة
    userPreferences.forEach(pref => {
      if (pref.key.startsWith('category_')) {
        const categoryId = pref.key.replace('category_', '');
        const value = typeof pref.value === 'string' ? pref.value : String(pref.value);
        categoryScores[categoryId] = (categoryScores[categoryId] || 0) + parseFloat(value) * 10;
      }
    });

    // إضافة نقاط من الاهتمامات
    userInterests.forEach(interest => {
      // البحث عن التصنيفات التي تتطابق مع الاهتمام
      const interestName = interest.name || interest;
      if (interestName) {
        // يمكن تحسين هذا المنطق ليكون أكثر دقة
        categoryScores[interestName] = (categoryScores[interestName] || 0) + (interest.score || 1.0) * 5;
      }
    });

    // إضافة نقاط من التفاعلات
    userInteractions.forEach((interaction) => {
      const categoryId = articleCategoryMap.get(interaction.articleId);
      if (categoryId) {
        let points = 0;
        
        switch (interaction.type) {
          case 'like':
            points = 5;
            break;
          case 'share':
            points = 8;
            break;
          default:
            points = 1;
        }
        
        categoryScores[categoryId] = (categoryScores[categoryId] || 0) + points;
      }
    });

    // ترتيب التصنيفات حسب النقاط
    const sortedCategoryIds = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)
      .map(([categoryId]) => categoryId)
      .slice(0, limit);

    // جلب التصنيفات المفضلة
    let personalizedCategories: any[] = [];
    
    if (sortedCategoryIds.length > 0) {
      personalizedCategories = await prisma.category.findMany({
        where: {
          id: { in: sortedCategoryIds },
          isActive: true
        },
        orderBy: {
          displayOrder: 'asc'
        }
      });
    }

    // إذا لم تكن هناك تصنيفات مخصصة، جلب التصنيفات الأكثر شعبية
    if (personalizedCategories.length === 0) {
      const popularCategories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { articles: true }
          }
        },
        orderBy: {
          articles: {
            _count: 'desc'
          }
        },
        take: limit
      });

      personalizedCategories = popularCategories.map(cat => ({
        ...cat,
        _count: cat._count
      }));
    }

    // حساب عدد المقالات لكل تصنيف
    const categoryIds = personalizedCategories.map(c => c.id);
    const articleCounts = await prisma.article.groupBy({
      by: ['categoryId'],
      where: {
        categoryId: { in: categoryIds },
        status: 'published'
      },
      _count: {
        id: true
      }
    });

    const articleCountMap = new Map(
      articleCounts.map(item => [item.categoryId, item._count.id])
    );

    // تنسيق البيانات
    const formattedCategories = personalizedCategories.map(category => {
      const articleCount = articleCountMap.get(category.id) || 0;
      const score = categoryScores[category.id] || 0;
      
      // معالجة JSON من حقل description
      let metadata: any = {};
      let icon = '📁';
      let colorHex = '#6B7280';
      let nameAr = category.name;
      let nameEn = '';
      let descriptionText = '';
      
      if (category.description) {
        try {
          // محاولة تحليل JSON من حقل description
          const parsedData = JSON.parse(category.description);
          if (parsedData && typeof parsedData === 'object') {
            icon = parsedData.icon || icon;
            // البحث عن اللون في color_hex أو color
            colorHex = parsedData.color_hex || parsedData.color || colorHex;
            nameAr = parsedData.name_ar || nameAr;
            nameEn = parsedData.name_en || nameEn;
            descriptionText = parsedData.ar || parsedData.en || '';
            metadata = parsedData;
          } else {
            // إذا لم يكن JSON، استخدم النص كما هو
            descriptionText = category.description;
          }
        } catch (e) {
          // إذا فشل تحليل JSON، استخدم النص كما هو
          descriptionText = category.description;
        }
      }
      
      return {
        id: category.id,
        name: nameAr,
        name_ar: nameAr,
        name_en: nameEn,
        slug: category.slug,
        description: descriptionText,
        color: colorHex,
        color_hex: colorHex,
        icon: icon,
        articles_count: articleCount,
        is_active: category.isActive,
        created_at: category.createdAt.toISOString(),
        updated_at: category.updatedAt.toISOString(),
        personalization_score: score,
        is_personalized: score > 0,
        metadata: metadata
      };
    });

    return corsResponse({
      success: true,
      categories: formattedCategories,
      total: formattedCategories.length,
      personalization_info: {
        has_preferences: userPreferences.length > 0,
        has_interests: userInterests.length > 0,
        has_interactions: userInteractions.length > 0,
        total_interactions: userInteractions.length
      }
    });

  } catch (error) {
    console.error('خطأ في جلب التصنيفات المخصصة:', error);
    return corsResponse({
      success: false,
      error: 'فشل في جلب التصنيفات المخصصة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, 500);
  }
} 