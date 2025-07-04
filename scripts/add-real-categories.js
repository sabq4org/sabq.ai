const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

// التصنيفات الفعلية
const categories = [
  {
    name: 'تقنية',
    slug: 'technology',
    description: JSON.stringify({
      ar: 'أخبار وتطورات التقنية والذكاء الاصطناعي',
      en: 'Technology',
      color: '#8B5CF6',
      icon: '💻'
    }),
    displayOrder: 1,
    isActive: true
  },
  {
    name: 'رياضة',
    slug: 'sports',
    description: JSON.stringify({
      ar: 'أخبار رياضية محلية وعالمية',
      en: 'Sports',
      color: '#F59E0B',
      icon: '⚽'
    }),
    displayOrder: 2,
    isActive: true
  },
  {
    name: 'اقتصاد',
    slug: 'economy',
    description: JSON.stringify({
      ar: 'تقارير السوق والمال والأعمال والطاقة',
      en: 'Economy',
      color: '#10B981',
      icon: '💰'
    }),
    displayOrder: 3,
    isActive: true
  },
  {
    name: 'سياسة',
    slug: 'politics',
    description: JSON.stringify({
      ar: 'مستجدات السياسة المحلية والدولية وتحليلاتها',
      en: 'Politics',
      color: '#EF4444',
      icon: '🏛️'
    }),
    displayOrder: 4,
    isActive: true
  },
  {
    name: 'محليات',
    slug: 'local',
    description: JSON.stringify({
      ar: 'أخبار المناطق والمدن السعودية',
      en: 'Local',
      color: '#3B82F6',
      icon: '🗺️'
    }),
    displayOrder: 5,
    isActive: true
  },
  {
    name: 'ثقافة ومجتمع',
    slug: 'culture',
    description: JSON.stringify({
      ar: 'فعاليات ثقافية، مناسبات، قضايا اجتماعية',
      en: 'Culture',
      color: '#EC4899',
      icon: '🎭'
    }),
    displayOrder: 6,
    isActive: true
  },
  {
    name: 'مقالات رأي',
    slug: 'opinion',
    description: JSON.stringify({
      ar: 'تحليلات ووجهات نظر كتاب الرأي',
      en: 'Opinion',
      color: '#7C3AED',
      icon: '✍️'
    }),
    displayOrder: 7,
    isActive: true
  },
  {
    name: 'منوعات',
    slug: 'misc',
    description: JSON.stringify({
      ar: 'أخبار خفيفة، لقطات، طرائف وأحداث غير تقليدية',
      en: 'Misc',
      color: '#6B7280',
      icon: '🎉'
    }),
    displayOrder: 8,
    isActive: true
  }
];

async function addCategories() {
  console.log('🚀 بدء إضافة التصنيفات الفعلية إلى قاعدة البيانات...\n');

  try {
    // عد التصنيفات الموجودة
    const existingCount = await prisma.category.count();
    console.log(`📊 عدد التصنيفات الموجودة حالياً: ${existingCount}\n`);

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const category of categories) {
      try {
        // التحقق من وجود التصنيف
        const existing = await prisma.category.findFirst({
          where: {
            OR: [
              { slug: category.slug },
              { name: category.name }
            ]
          }
        });

        if (existing) {
          // تحديث التصنيف الموجود
          await prisma.category.update({
            where: { id: existing.id },
            data: {
              name: category.name,
              slug: category.slug,
              description: category.description,
              displayOrder: category.displayOrder,
              isActive: category.isActive,
              updatedAt: new Date()
            }
          });
          const descData = JSON.parse(category.description);
          console.log(`✅ تم تحديث: ${category.name} (${descData.en})`);
          updated++;
        } else {
          // إضافة تصنيف جديد
          await prisma.category.create({
            data: {
              name: category.name,
              slug: category.slug,
              description: category.description,
              displayOrder: category.displayOrder,
              isActive: category.isActive
            }
          });
          const descData = JSON.parse(category.description);
          console.log(`✨ تم إضافة: ${category.name} (${descData.en})`);
          added++;
        }
      } catch (error) {
        console.error(`❌ خطأ في معالجة التصنيف ${category.name_ar}:`, error.message);
        skipped++;
      }
    }

    console.log('\n📊 ملخص العملية:');
    console.log(`   ✨ تم إضافة: ${added} تصنيف جديد`);
    console.log(`   ✅ تم تحديث: ${updated} تصنيف`);
    console.log(`   ⏭️  تم تخطي: ${skipped} تصنيف`);

    // عرض جميع التصنيفات النشطة
    const allCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    console.log('\n📋 التصنيفات النشطة حالياً:');
    allCategories.forEach(cat => {
      try {
        const descData = JSON.parse(cat.description || '{}');
        console.log(`   ${cat.displayOrder}. ${descData.icon || '📁'} ${cat.name} (${descData.en || ''}) - ${descData.color || '#3B82F6'}`);
      } catch {
        console.log(`   ${cat.displayOrder}. ${cat.name}`);
      }
    });

  } catch (error) {
    console.error('❌ خطأ في العملية:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// تشغيل السكريبت
addCategories()
  .then(() => console.log('\n🎉 تمت العملية بنجاح!'))
  .catch(error => {
    console.error('\n❌ فشلت العملية:', error);
    process.exit(1);
  }); 