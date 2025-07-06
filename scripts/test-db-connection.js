// اختبار بسيط للاتصال بقاعدة البيانات
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

async function testConnection() {
  console.log('🔍 فحص الاتصال بقاعدة البيانات...\n');
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.log('❌ متغير DATABASE_URL غير محدد!');
    return;
  }
  
  console.log('📍 رابط الاتصال:', connectionString.replace(/:[^:@]*@/, ':****@'));
  
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔄 محاولة الاتصال...');
    await client.connect();
    console.log('✅ تم الاتصال بنجاح!');
    
    // فحص الجداول
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 عدد الجداول: ${result.rows.length}`);
    console.log('📋 الجداول المتاحة:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // فحص المقالات
    const articlesResult = await client.query(`
      SELECT COUNT(*) as count, status 
      FROM articles 
      GROUP BY status
    `);
    
    console.log('\n📰 إحصائيات المقالات:');
    articlesResult.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count} مقال`);
    });
    
  } catch (error) {
    console.log('❌ فشل في الاتصال:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 الحلول المقترحة:');
      console.log('1. تأكد أن قاعدة البيانات تعمل على DigitalOcean');
      console.log('2. تأكد من إعدادات Firewall في DigitalOcean');
      console.log('3. تأكد من أن IP جهازك مسموح في إعدادات قاعدة البيانات');
    }
    
  } finally {
    await client.end();
  }
}

testConnection();
