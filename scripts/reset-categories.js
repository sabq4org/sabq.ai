const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function resetCategories() {
  try {
    console.log('🔍 فحص التصنيفات الموجودة...');
    
    const existingCategories = await prisma.category.findMany();
    console.log(`📋 عدد التصنيفات الموجودة: ${existingCategories.length}`);

    // إنشاء تصنيف افتراضي مؤقت للمقالات التي لا تحتوي على تصنيف
    console.log('📝 إنشاء تصنيف افتراضي مؤقت...');
    const tempCategory = await prisma.category.upsert({
      where: { slug: 'temp-default' },
      update: {},
      create: {
        name: 'تصنيف مؤقت',
        slug: 'temp-default',
        description: 'تصنيف مؤقت للمقالات',
        color: '#6B7280',
        icon: '📁',
        displayOrder: 999,
        isActive: false,
        nameEn: 'Temporary'
      }
    });

    console.log('🔄 تحديث المقالات لاستخدام التصنيف المؤقت...');
    
    // تحديث جميع المقالات لاستخدام التصنيف المؤقت
    const updatedArticles = await prisma.article.updateMany({
      data: {
        categoryId: tempCategory.id
      }
    });
    
    console.log(`✅ تم تحديث ${updatedArticles.count} مقال`);

    console.log('🗑️ حذف التصنيفات القديمة...');
    
    // حذف التصنيفات القديمة (ما عدا المؤقت)
    const deletedCount = await prisma.category.deleteMany({
      where: {
        slug: {
          not: 'temp-default'
        }
      }
    });
    
    console.log(`✅ تم حذف ${deletedCount.count} تصنيف`);

    console.log('📝 إضافة التصنيفات الجديدة...');

    // إضافة التصنيفات الجديدة
    const newCategories = await prisma.category.createMany({
      data: [
        {
          name: 'تقنية',
          slug: 'technology',
          description: 'أخبار وتطورات التقنية والذكاء الاصطناعي',
          color: '#8B5CF6',
          icon: '💻',
          displayOrder: 1,
          isActive: true,
          nameEn: 'Technology'
        },
        {
          name: 'رياضة',
          slug: 'sports',
          description: 'أخبار رياضية محلية وعالمية',
          color: '#F59E0B',
          icon: '⚽',
          displayOrder: 2,
          isActive: true,
          nameEn: 'Sports'
        },
        {
          name: 'اقتصاد',
          slug: 'economy',
          description: 'تقارير السوق والمال والأعمال والطاقة',
          color: '#10B981',
          icon: '💰',
          displayOrder: 3,
          isActive: true,
          nameEn: 'Economy'
        },
        {
          name: 'سياسة',
          slug: 'politics',
          description: 'مستجدات السياسة المحلية والدولية وتحليلاتها',
          color: '#EF4444',
          icon: '🏛️',
          displayOrder: 4,
          isActive: true,
          nameEn: 'Politics'
        },
        {
          name: 'محليات',
          slug: 'local',
          description: 'أخبار المناطق والمدن السعودية',
          color: '#3B82F6',
          icon: '🗺️',
          displayOrder: 5,
          isActive: true,
          nameEn: 'Local'
        },
        {
          name: 'ثقافة ومجتمع',
          slug: 'culture',
          description: 'فعاليات ثقافية، مناسبات، قضايا اجتماعية',
          color: '#EC4899',
          icon: '🎭',
          displayOrder: 6,
          isActive: true,
          nameEn: 'Culture'
        },
        {
          name: 'مقالات رأي',
          slug: 'opinion',
          description: 'تحليلات ووجهات نظر كتاب الرأي',
          color: '#7C3AED',
          icon: '✍️',
          displayOrder: 7,
          isActive: true,
          nameEn: 'Opinion'
        },
        {
          name: 'منوعات',
          slug: 'misc',
          description: 'أخبار خفيفة، لقطات، طرائف وأحداث غير تقليدية',
          color: '#6B7280',
          icon: '🎉',
          displayOrder: 8,
          isActive: true,
          nameEn: 'Misc'
        }
      ]
    });

    console.log(`✅ تم إضافة ${newCategories.count} تصنيف جديد`);

    // الحصول على التصنيف الافتراضي الجديد (منوعات)
    const defaultCategory = await prisma.category.findFirst({
      where: { slug: 'misc' }
    });

    if (defaultCategory) {
      console.log('🔄 تحديث المقالات للتصنيف الافتراضي الجديد...');
      
      // تحديث المقالات من التصنيف المؤقت إلى المنوعات
      const finalUpdate = await prisma.article.updateMany({
        where: {
          categoryId: tempCategory.id
        },
        data: {
          categoryId: defaultCategory.id
        }
      });
      
      console.log(`✅ تم تحديث ${finalUpdate.count} مقال للتصنيف الجديد`);
    }

    // حذف التصنيف المؤقت
    console.log('🗑️ حذف التصنيف المؤقت...');
    await prisma.category.delete({
      where: { id: tempCategory.id }
    });

    // عرض التصنيفات الجديدة
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    console.log('\n📋 التصنيفات الجديدة:');
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.icon} ${category.name} (${category.nameEn})`);
      console.log(`   🔗 ${category.slug}`);
      console.log(`   📝 ${category.description}`);
      console.log(`   🎨 ${category.color}`);
      console.log('');
    });

    console.log('🎉 تم إعادة تعيين التصنيفات بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين التصنيفات:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  resetCategories()
    .then(() => {
      console.log('✅ انتهى السكريبت بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل السكريبت:', error);
      process.exit(1);
    });
}

module.exports = { resetCategories }; 