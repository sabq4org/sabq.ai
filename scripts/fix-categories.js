const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function fixCategories() {
  try {
    console.log('🔧 بدء إصلاح التصنيفات...');

    // تعريف التصنيفات الصحيحة مع الألوان والأيقونات والأسماء الإنجليزية
    const categories = [
      {
        id: 'category-tech',
        name: 'تقنية',
        nameEn: 'Technology',
        slug: 'technology',
        description: 'أخبار وتطورات التقنية والذكاء الاصطناعي',
        color: '#8B5CF6',
        icon: '💻',
        displayOrder: 1
      },
      {
        id: 'category-sports',
        name: 'رياضة',
        nameEn: 'Sports',
        slug: 'sports',
        description: 'أخبار رياضية محلية وعالمية',
        color: '#F59E0B',
        icon: '⚽',
        displayOrder: 2
      },
      {
        id: 'category-economy',
        name: 'اقتصاد',
        nameEn: 'Economy',
        slug: 'economy',
        description: 'تقارير السوق والمال والأعمال والطاقة',
        color: '#10B981',
        icon: '💰',
        displayOrder: 3
      },
      {
        id: 'category-politics',
        name: 'سياسة',
        nameEn: 'Politics',
        slug: 'politics',
        description: 'مستجدات السياسة المحلية والدولية وتحليلاتها',
        color: '#EF4444',
        icon: '🏛️',
        displayOrder: 4
      },
      {
        id: 'category-local',
        name: 'محليات',
        nameEn: 'Local',
        slug: 'local',
        description: 'أخبار المناطق والمدن السعودية',
        color: '#3B82F6',
        icon: '🗺️',
        displayOrder: 5
      },
      {
        id: 'category-culture',
        name: 'ثقافة ومجتمع',
        nameEn: 'Culture',
        slug: 'culture',
        description: 'فعاليات ثقافية، مناسبات، قضايا اجتماعية',
        color: '#EC4899',
        icon: '🎭',
        displayOrder: 6
      },
      {
        id: 'category-opinion',
        name: 'مقالات رأي',
        nameEn: 'Opinion',
        slug: 'opinion',
        description: 'تحليلات ووجهات نظر كتاب الرأي',
        color: '#7C3AED',
        icon: '✍️',
        displayOrder: 7
      },
      {
        id: 'category-misc',
        name: 'منوعات',
        nameEn: 'Misc',
        slug: 'misc',
        description: 'أخبار خفيفة، لقطات، طرائف وأحداث غير تقليدية',
        color: '#6B7280',
        icon: '🎉',
        displayOrder: 8
      }
    ];

    // تحديث كل تصنيف
    for (const category of categories) {
      console.log(`🔄 تحديث تصنيف: ${category.name}`);
      
      await prisma.category.update({
        where: { id: category.id },
        data: {
          nameEn: category.nameEn,
          color: category.color,
          icon: category.icon,
          displayOrder: category.displayOrder
        }
      });
      
      console.log(`✅ تم تحديث: ${category.name} - ${category.color} - ${category.icon}`);
    }

    console.log('🎉 تم إصلاح جميع التصنيفات بنجاح!');

    // عرض النتائج
    const updatedCategories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    console.log('\n📊 التصنيفات المحدثة:');
    updatedCategories.forEach(cat => {
      console.log(`${cat.icon} ${cat.name} (${cat.nameEn}) - ${cat.color}`);
    });

  } catch (error) {
    console.error('❌ خطأ في إصلاح التصنيفات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategories(); 