// اختبار بسيط للاتصال بقاعدة البيانات
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 اختبار الاتصال بقاعدة البيانات PostgreSQL');
  console.log('==========================================');
  
  // التحقق من وجود DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ خطأ: DATABASE_URL غير موجود في .env.local');
    return;
  }
  
  console.log('\n📡 محاولة الاتصال...');
  
  try {
    // استخدام Prisma للاتصال
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    // اختبار بسيط - عد المستخدمين
    const userCount = await prisma.user.count();
    console.log(`\n✅ الاتصال ناجح!`);
    console.log(`📊 عدد المستخدمين: ${userCount}`);
    
    // عد التصنيفات
    const categoryCount = await prisma.category.count();
    console.log(`📁 عدد التصنيفات: ${categoryCount}`);
    
    // عد المقالات
    const articleCount = await prisma.article.count();
    console.log(`📝 عدد المقالات: ${articleCount}`);
    
    await prisma.$disconnect();
    console.log('\n✨ قاعدة البيانات تعمل بشكل ممتاز!');
    
  } catch (error) {
    console.error('\n❌ فشل الاتصال!');
    console.error('الخطأ:', error.message);
    
    // محاولة بديلة مع pg مباشرة
    console.log('\n🔄 محاولة بديلة...');
    
    const { Client } = require('pg');
    const connectionString = process.env.DATABASE_URL.replace('sslmode=require', 'sslmode=no-verify');
    
    const client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      await client.connect();
      const result = await client.query('SELECT NOW()');
      console.log('✅ الاتصال البديل ناجح!');
      console.log('⏰ وقت الخادم:', result.rows[0].now);
      await client.end();
      
      console.log('\n💡 تلميح: قد تحتاج لتحديث DATABASE_URL في .env.local');
      console.log('   استبدل sslmode=require بـ sslmode=no-verify');
      
    } catch (altError) {
      console.error('❌ فشل الاتصال البديل أيضاً:', altError.message);
      console.log('\n🔍 تأكد من:');
      console.log('1. IP الخاص بك (176.45.56.154) مضاف في Trusted Sources');
      console.log('2. قاعدة البيانات تعمل في DigitalOcean');
      console.log('3. كلمة المرور صحيحة');
    }
  }
}

testConnection();
