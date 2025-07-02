const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function updateArticleCategories() {
  try {
    console.log('🔄 تحديث تصنيفات المقالات...');
    
    // جلب المقالات بدون تصنيفات
    const articles = await prisma.article.findMany({
      where: {
        categoryId: null
      }
    });
    
    console.log(`📋 وجدت ${articles.length} مقال بدون تصنيف`);
    
    // جلب التصنيفات المتاحة
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      }
    });
    
    console.log(`📂 التصنيفات المتاحة: ${categories.length}`);
    
    // تحديث المقالات بتصنيفات مناسبة
    const updates = [
      {
        title: 'ثورة الذكاء الاصطناعي في 2024',
        categorySlug: 'technology'
      },
      {
        title: 'أخبار الرياضة - نتائج المباريات',
        categorySlug: 'sports'
      },
      {
        title: 'مقال تجريبي أول - أخبار اليوم',
        categorySlug: 'local'
      },
      {
        title: 'مقال تجريبي جديد',
        categorySlug: 'misc'
      }
    ];
    
    for (const update of updates) {
      const article = articles.find(a => a.title === update.title);
      const category = categories.find(c => c.slug === update.categorySlug);
      
      if (article && category) {
        await prisma.article.update({
          where: { id: article.id },
          data: { categoryId: category.id }
        });
        console.log(`✅ تم تحديث "${article.title}" بتصنيف "${category.name}"`);
      }
    }
    
    // تحديث أي مقالات متبقية بتصنيف عشوائي
    const remainingArticles = await prisma.article.findMany({
      where: {
        categoryId: null
      }
    });
    
    for (const article of remainingArticles) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      await prisma.article.update({
        where: { id: article.id },
        data: { categoryId: randomCategory.id }
      });
      console.log(`✅ تم تحديث "${article.title}" بتصنيف "${randomCategory.name}"`);
    }
    
    console.log('✨ تم تحديث جميع التصنيفات بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateArticleCategories(); 