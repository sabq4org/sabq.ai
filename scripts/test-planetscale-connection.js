const { PrismaClient } = require('../lib/generated/prisma');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 اختبار الاتصال بقاعدة بيانات PlanetScale...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ موجود' : '❌ غير موجود');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL غير موجود في متغيرات البيئة');
    return;
  }
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // اختبار الاتصال
    console.log('\n📊 جلب عدد المقالات...');
    const count = await prisma.articles.count();
    console.log(`✅ عدد المقالات: ${count}`);
    
    // جلب أول 3 مقالات
    console.log('\n📰 جلب أول 3 مقالات...');
    const articles = await prisma.articles.findMany({
      take: 3,
      where: {
        status: 'published'
      },
      select: {
        id: true,
        title: true,
        status: true,
        created_at: true
      }
    });
    
    console.log(`✅ تم جلب ${articles.length} مقال:`);
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} (${article.status})`);
    });
    
    // اختبار التصنيفات
    console.log('\n📂 جلب التصنيفات...');
    const categories = await prisma.categories.count();
    console.log(`✅ عدد التصنيفات: ${categories}`);
    
  } catch (error) {
    console.error('\n❌ خطأ في الاتصال:', error.message);
    if (error.code) {
      console.error('كود الخطأ:', error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 تم قطع الاتصال');
  }
}

// تشغيل الاختبار
testConnection(); 