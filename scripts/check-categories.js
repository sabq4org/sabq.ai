const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function checkCategories() {
  try {
    const categories = await prisma.category.findMany();
    console.log('عدد التصنيفات:', categories.length);
    
    if (categories.length === 0) {
      console.log('إضافة تصنيفات تجريبية...');
      const testCategories = [
        { name: 'سياسة', slug: 'politics', displayOrder: 1, isActive: true },
        { name: 'اقتصاد', slug: 'economy', displayOrder: 2, isActive: true },
        { name: 'رياضة', slug: 'sports', displayOrder: 3, isActive: true },
        { name: 'تقنية', slug: 'technology', displayOrder: 4, isActive: true },
        { name: 'ثقافة', slug: 'culture', displayOrder: 5, isActive: true },
        { name: 'محلي', slug: 'local', displayOrder: 6, isActive: true },
        { name: 'دولي', slug: 'international', displayOrder: 7, isActive: true }
      ];
      
      for (const cat of testCategories) {
        const created = await prisma.category.create({ data: cat });
        console.log(`✓ تم إضافة تصنيف: ${created.name} (${created.id})`);
      }
      console.log('تم إضافة جميع التصنيفات التجريبية بنجاح!');
    } else {
      console.log('التصنيفات الموجودة:');
      categories.forEach(cat => {
        console.log(`- ${cat.name} (ID: ${cat.id}, Slug: ${cat.slug}, Active: ${cat.isActive})`);
      });
    }
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories(); 