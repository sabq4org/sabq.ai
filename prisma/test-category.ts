import { prisma } from '../lib/prisma';

async function testCategory() {
  try {
    console.log('🔍 بدء اختبار إدراج تصنيف جديد...');
    
    // إدراج تصنيف تجريبي جديد
    const testCategory = await prisma.category.upsert({
      where: { slug: 'test-category-2025' },
      update: {
        name: 'تصنيف تجريبي 2025',
        description: 'تصنيف تجريبي للتأكد من الإدراج',
        color: '#FF0000',
        icon: '🧪',
        displayOrder: 999,
        isActive: true,
      },
      create: {
        name: 'تصنيف تجريبي 2025',
        slug: 'test-category-2025',
        description: 'تصنيف تجريبي للتأكد من الإدراج',
        color: '#FF0000',
        icon: '🧪',
        displayOrder: 999,
        isActive: true,
      },
    });
    
    console.log('✅ تم إدراج التصنيف التجريبي:', testCategory);
    
    // جلب جميع التصنيفات من قاعدة البيانات
    console.log('\n📋 جميع التصنيفات في قاعدة البيانات:');
    const allCategories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    
    allCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug}) - نشط: ${cat.isActive} - ترتيب: ${cat.displayOrder}`);
    });
    
    console.log(`\n📊 إجمالي التصنيفات: ${allCategories.length}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategory(); 