const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCategories() {
  console.log('🚀 بدء إضافة التصنيفات إلى قاعدة البيانات...');

  const categories = [
    {
      name: 'تقنية',
      nameEn: 'Technology',
      description: 'أخبار وتطورات التقنية والذكاء الاصطناعي',
      slug: 'technology',
      color: '#8B5CF6',
      icon: '💻',
      displayOrder: 1,
      isActive: true
    },
    {
      name: 'رياضة',
      nameEn: 'Sports',
      description: 'أخبار رياضية محلية وعالمية',
      slug: 'sports',
      color: '#F59E0B',
      icon: '⚽',
      displayOrder: 2,
      isActive: true
    },
    {
      name: 'اقتصاد',
      nameEn: 'Economy',
      description: 'تقارير السوق والمال والأعمال والطاقة',
      slug: 'economy',
      color: '#10B981',
      icon: '💰',
      displayOrder: 3,
      isActive: true
    },
    {
      name: 'سياسة',
      nameEn: 'Politics',
      description: 'مستجدات السياسة المحلية والدولية وتحليلاتها',
      slug: 'politics',
      color: '#EF4444',
      icon: '🏛️',
      displayOrder: 4,
      isActive: true
    },
    {
      name: 'محليات',
      nameEn: 'Local',
      description: 'أخبار المناطق والمدن السعودية',
      slug: 'local',
      color: '#3B82F6',
      icon: '🗺️',
      displayOrder: 5,
      isActive: true
    },
    {
      name: 'ثقافة ومجتمع',
      nameEn: 'Culture',
      description: 'فعاليات ثقافية، مناسبات، قضايا اجتماعية',
      slug: 'culture',
      color: '#EC4899',
      icon: '🎭',
      displayOrder: 6,
      isActive: true
    },
    {
      name: 'مقالات رأي',
      nameEn: 'Opinion',
      description: 'تحليلات ووجهات نظر كتاب الرأي',
      slug: 'opinion',
      color: '#7C3AED',
      icon: '✍️',
      displayOrder: 7,
      isActive: true
    },
    {
      name: 'منوعات',
      nameEn: 'Misc',
      description: 'أخبار خفيفة، لقطات، طرائف وأحداث غير تقليدية',
      slug: 'misc',
      color: '#6B7280',
      icon: '🎉',
      displayOrder: 8,
      isActive: true
    }
  ];

  try {
    for (const category of categories) {
      const result = await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category
      });
      console.log(`✅ تمت إضافة/تحديث التصنيف: ${result.name} (${result.nameEn})`);
    }

    console.log('\n📊 إحصائيات التصنيفات:');
    const count = await prisma.category.count();
    console.log(`إجمالي التصنيفات في قاعدة البيانات: ${count}`);

    console.log('\n📋 قائمة جميع التصنيفات:');
    const allCategories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    
    allCategories.forEach(cat => {
      console.log(`${cat.icon} ${cat.name} (${cat.nameEn}) - ${cat.slug} - ${cat.isActive ? 'نشط' : 'غير نشط'}`);
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة التصنيفات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCategories(); 