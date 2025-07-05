// اختبار الاتصال باستخدام Prisma
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('../lib/generated/prisma');

async function testConnection() {
  console.log('🔍 اختبار الاتصال بقاعدة البيانات PostgreSQL عبر Prisma');
  console.log('=====================================================');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('\n📡 محاولة الاتصال...');
    
    // اختبار بسيط - عد المستخدمين
    const userCount = await prisma.user.count();
    console.log(`\n✅ الاتصال ناجح!`);
    console.log(`\n📊 إحصائيات قاعدة البيانات:`);
    console.log(`👥 عدد المستخدمين: ${userCount}`);
    
    // عد التصنيفات
    const categoryCount = await prisma.category.count();
    console.log(`📁 عدد التصنيفات: ${categoryCount}`);
    
    // عد المقالات
    const articleCount = await prisma.article.count();
    console.log(`📝 عدد المقالات: ${articleCount}`);
    
    // عد التعليقات
    const commentCount = await prisma.comment.count();
    console.log(`💬 عدد التعليقات: ${commentCount}`);
    
    // عد الكلمات المفتاحية
    const keywordCount = await prisma.keyword.count();
    console.log(`🏷️  عدد الكلمات المفتاحية: ${keywordCount}`);
    
    // معلومات آخر مقال
    const lastArticle = await prisma.article.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { title: true, createdAt: true }
    });
    
    if (lastArticle) {
      console.log(`\n📰 آخر مقال:`);
      console.log(`   العنوان: ${lastArticle.title}`);
      console.log(`   التاريخ: ${lastArticle.createdAt.toLocaleDateString('ar-SA')}`);
    }
    
    console.log('\n✨ قاعدة البيانات PostgreSQL تعمل بشكل ممتاز!');
    
  } catch (error) {
    console.error('\n❌ فشل الاتصال!');
    console.error('الخطأ:', error.message);
    
    if (error.message.includes('P1001')) {
      console.log('\n🔍 مشكلة في الاتصال بالخادم. تأكد من:');
      console.log('1. قاعدة البيانات تعمل في DigitalOcean');
      console.log('2. IP الخاص بك مضاف في Trusted Sources');
      console.log('3. إعدادات SSL صحيحة');
    } else if (error.message.includes('P1002')) {
      console.log('\n⏱️  انتهت مهلة الاتصال. قد تكون المشكلة:');
      console.log('1. الخادم بعيد أو بطيء');
      console.log('2. جدار الحماية يحجب الاتصال');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 