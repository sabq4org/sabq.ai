const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkArticles() {
  try {
    console.log('🔍 فحص المقالات في قاعدة البيانات...\n');
    
    // جلب جميع المقالات
    const allArticles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        authorId: true,
        categoryId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 إجمالي المقالات: ${allArticles.length}`);
    
    if (allArticles.length === 0) {
      console.log('❌ لا توجد مقالات في قاعدة البيانات!');
      return;
    }
    
    // تصنيف المقالات حسب الحالة
    const published = allArticles.filter(a => a.status === 'published');
    const draft = allArticles.filter(a => a.status === 'draft');
    const other = allArticles.filter(a => !['published', 'draft'].includes(a.status));
    
    console.log(`\n📈 إحصائيات الحالة:`);
    console.log(`   ✅ منشور: ${published.length}`);
    console.log(`   📝 مسودة: ${draft.length}`);
    console.log(`   🔄 أخرى: ${other.length}`);
    
    if (published.length > 0) {
      console.log(`\n📰 المقالات المنشورة:`);
      published.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title}`);
        console.log(`      ID: ${article.id}`);
        console.log(`      تاريخ النشر: ${article.publishedAt || 'غير محدد'}`);
        console.log(`      المؤلف: ${article.authorId}`);
        console.log(`      التصنيف: ${article.categoryId}`);
        console.log('');
      });
    }
    
    // فحص المؤلفين
    const authors = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    console.log(`\n👥 المؤلفون (${authors.length}):`);
    authors.forEach(author => {
      console.log(`   - ${author.name} (${author.email}) - ID: ${author.id}`);
    });
    
    // فحص التصنيفات
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });
    
    console.log(`\n📂 التصنيفات (${categories.length}):`);
    categories.forEach(category => {
      console.log(`   - ${category.name} (${category.isActive ? 'نشط' : 'غير نشط'}) - ID: ${category.id}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في فحص قاعدة البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticles(); 