const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function fixArticlesAuthors() {
  try {
    console.log('🔍 البحث عن المقالات بدون مؤلف صالح...');
    
    // جلب أول مستخدم (كمؤلف افتراضي)
    const defaultUser = await prisma.user.findFirst({
      where: {
        isVerified: true
      }
    });
    
    if (!defaultUser) {
      console.error('❌ لا يوجد مستخدمين في قاعدة البيانات!');
      return;
    }
    
    console.log(`✅ سيتم استخدام ${defaultUser.name} (${defaultUser.email}) كمؤلف افتراضي`);
    
    // البحث عن المقالات بدون مؤلف
    const articlesWithoutAuthor = await prisma.article.findMany({
      where: {
        authorId: 'default-author-id'
      }
    });
    
    console.log(`📊 تم العثور على ${articlesWithoutAuthor.length} مقال بدون مؤلف صالح`);
    
    if (articlesWithoutAuthor.length > 0) {
      // تحديث المقالات
      const result = await prisma.article.updateMany({
        where: {
          authorId: 'default-author-id'
        },
        data: {
          authorId: defaultUser.id
        }
      });
      
      console.log(`✅ تم تحديث ${result.count} مقال بنجاح`);
    }
    
    // التحقق من النتيجة
    const remainingArticles = await prisma.article.count({
      where: {
        authorId: 'default-author-id'
      }
    });
    
    console.log(`📊 المقالات المتبقية بدون مؤلف: ${remainingArticles}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixArticlesAuthors(); 