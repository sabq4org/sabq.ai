const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔄 اختبار الاتصال بقاعدة البيانات PlanetScale...');
    const article = await prisma.article.findFirst();
    if (article) {
      console.log('✅ الاتصال ناجح! تم جلب مقال واحد:');
      console.log(article);
    } else {
      console.log('⚠️ الاتصال ناجح لكن لا توجد مقالات في قاعدة البيانات.');
    }
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات أو حدث خطأ:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
