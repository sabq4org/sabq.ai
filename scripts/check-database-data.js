const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 التحقق من البيانات في قاعدة البيانات...\n');

    // عد المستخدمين
    const usersCount = await prisma.user.count();
    console.log(`👥 المستخدمون: ${usersCount}`);

    // عد التصنيفات
    const categoriesCount = await prisma.category.count();
    console.log(`📁 التصنيفات: ${categoriesCount}`);
    
    // عرض التصنيفات
    if (categoriesCount > 0) {
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true
        }
      });
      console.log('\nالتصنيفات الموجودة:');
      categories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug}) - نشط: ${cat.isActive ? 'نعم' : 'لا'}`);
      });
    }

    // عد المقالات
    const articlesCount = await prisma.article.count();
    console.log(`\n📝 المقالات: ${articlesCount}`);
    
    // عد المقالات المنشورة
    const publishedCount = await prisma.article.count({
      where: { status: 'published' }
    });
    console.log(`📰 المقالات المنشورة: ${publishedCount}`);

    // التحقق من الجداول الأخرى
    const rolesCount = await prisma.role.count();
    console.log(`\n🔐 الأدوار: ${rolesCount}`);

    const templatesCount = await prisma.emailTemplate.count();
    console.log(`📧 قوالب البريد: ${templatesCount}`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 