const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPublishedArticles() {
  try {
    console.log('🔍 البحث عن المقالات المنشورة...\n');
    
    // جلب جميع المقالات
    const allArticles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        categoryId: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 إجمالي المقالات: ${allArticles.length}`);
    console.log('------------------------\n');
    
    // تصنيف المقالات حسب الحالة
    const published = allArticles.filter(a => a.status === 'published');
    const draft = allArticles.filter(a => a.status === 'draft');
    const scheduled = allArticles.filter(a => a.status === 'scheduled');
    
    console.log(`✅ منشور: ${published.length}`);
    console.log(`📝 مسودة: ${draft.length}`);
    console.log(`⏰ مجدول: ${scheduled.length}`);
    console.log('------------------------\n');
    
    // عرض المقالات المنشورة
    if (published.length > 0) {
      console.log('📰 المقالات المنشورة:');
      published.forEach((article, index) => {
        console.log(`\n${index + 1}. ${article.title}`);
        console.log(`   - ID: ${article.id}`);
        console.log(`   - التصنيف: ${article.category?.name || 'غير مصنف'}`);
        console.log(`   - تاريخ النشر: ${article.publishedAt ? new Date(article.publishedAt).toLocaleString('ar-SA') : 'غير محدد'}`);
        console.log(`   - تاريخ الإنشاء: ${new Date(article.createdAt).toLocaleString('ar-SA')}`);
      });
    } else {
      console.log('⚠️  لا توجد مقالات منشورة حالياً');
      console.log('\n💡 نصيحة: تأكد من:');
      console.log('   1. تغيير حالة المقال إلى "منشور" من لوحة التحكم');
      console.log('   2. التأكد من حفظ التغييرات');
      console.log('   3. إعادة تحميل الصفحة الرئيسية');
    }
    
    // عرض المسودات
    if (draft.length > 0) {
      console.log('\n\n📝 المسودات الموجودة:');
      draft.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (ID: ${article.id})`);
      });
      console.log('\n💡 يمكنك نشر هذه المسودات من لوحة التحكم');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPublishedArticles(); 