const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function createSampleCategories() {
  try {
    console.log('🔄 إنشاء التصنيفات التجريبية...');
    
    const categories = [
      {
        id: 'cat-1',
        name: 'أخبار محلية',
        slug: 'local-news',
        description: 'الأخبار المحلية والداخلية',
        color: '#3B82F6',
        icon: '🏠',
        isActive: true,
        displayOrder: 1
      },
      {
        id: 'cat-2',
        name: 'أخبار دولية',
        slug: 'international-news',
        description: 'الأخبار العالمية والدولية',
        color: '#10B981',
        icon: '🌍',
        isActive: true,
        displayOrder: 2
      },
      {
        id: 'cat-3',
        name: 'رياضة',
        slug: 'sports',
        description: 'الأخبار الرياضية',
        color: '#F59E0B',
        icon: '⚽',
        isActive: true,
        displayOrder: 3
      },
      {
        id: 'cat-4',
        name: 'تقنية',
        slug: 'technology',
        description: 'أخبار التقنية والابتكار',
        color: '#8B5CF6',
        icon: '💻',
        isActive: true,
        displayOrder: 4
      },
      {
        id: 'cat-5',
        name: 'اقتصاد',
        slug: 'economy',
        description: 'الأخبار الاقتصادية والمالية',
        color: '#EF4444',
        icon: '💰',
        isActive: true,
        displayOrder: 5
      },
      {
        id: 'cat-6',
        name: 'صحة',
        slug: 'health',
        description: 'أخبار الصحة والطب',
        color: '#06B6D4',
        icon: '🏥',
        isActive: true,
        displayOrder: 6
      }
    ];
    
    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category
      });
      console.log(`✅ تم إنشاء التصنيف: ${category.name}`);
    }
    
    console.log(`🎉 تم إنشاء ${categories.length} تصنيف بنجاح!`);
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء التصنيفات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleCategories(); 