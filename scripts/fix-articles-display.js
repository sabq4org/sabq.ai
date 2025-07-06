const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixArticlesDisplay() {
  console.log('🔧 إصلاح مشكلة عرض المقالات...\n');
  
  try {
    // 1. فحص قاعدة البيانات
    console.log('📊 فحص قاعدة البيانات...');
    const articles = await prisma.article.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        authorId: true,
        categoryId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`✅ تم العثور على ${articles.length} مقال منشور`);
    
    if (articles.length === 0) {
      console.log('❌ لا توجد مقالات منشورة!');
      return;
    }
    
    // 2. عرض تفاصيل المقالات
    console.log('\n📰 تفاصيل المقالات:');
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   - الحالة: ${article.status}`);
      console.log(`   - تاريخ النشر: ${article.publishedAt}`);
      console.log(`   - المؤلف: ${article.authorId}`);
      console.log(`   - التصنيف: ${article.categoryId}\n`);
    });
    
    // 3. إنشاء مقال جديد للتأكد من أن النظام يعمل
    console.log('➕ إنشاء مقال جديد للتأكد من النظام...');
    
    // جلب أول مؤلف
    const author = await prisma.user.findFirst({
      where: { role: 'author' }
    });
    
    // جلب أول تصنيف
    const category = await prisma.category.findFirst({
      where: { isActive: true }
    });
    
    if (!author || !category) {
      console.log('❌ لا يوجد مؤلف أو تصنيف متاح');
      return;
    }
    
    const newArticle = await prisma.article.create({
      data: {
        title: 'مقال تجريبي للتأكد من النظام',
        slug: 'test-article-' + Date.now(),
        content: 'هذا مقال تجريبي للتأكد من أن نظام عرض المقالات يعمل بشكل صحيح.',
        excerpt: 'مقال تجريبي للتأكد من النظام',
        status: 'published',
        publishedAt: new Date(),
        authorId: author.id,
        categoryId: category.id,
        views: 0,
        readingTime: 2
      }
    });
    
    console.log(`✅ تم إنشاء مقال جديد: ${newArticle.title}`);
    console.log(`   - المعرف: ${newArticle.id}`);
    console.log(`   - المؤلف: ${author.name}`);
    console.log(`   - التصنيف: ${category.name}`);
    
    console.log('\n🎉 تم إصلاح المشكلة! المقالات يجب أن تظهر الآن.');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixArticlesDisplay(); 