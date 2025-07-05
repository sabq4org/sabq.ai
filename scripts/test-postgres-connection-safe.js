const { Client } = require('pg');

// قراءة بيانات الاتصال من متغيرات البيئة أو .env.local
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('🔍 اختبار الاتصال بقاعدة بيانات PostgreSQL');
console.log('==================================================');

async function testConnection() {
  try {
    console.log('\n📡 محاولة الاتصال...');
    await client.connect();
    
    console.log('\n✅ الاتصال ناجح!');
    
    // معلومات قاعدة البيانات
    const versionResult = await client.query('SELECT version()');
    console.log('\n📊 معلومات قاعدة البيانات:');
    console.log(versionResult.rows[0].version);
    
    // عرض الجداول
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 الجداول الموجودة:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  لا توجد جداول بعد');
    }
    
    await client.end();
  } catch (error) {
    console.error('\n❌ فشل الاتصال!');
    console.error('الخطأ:', error.message);
    console.log('\nتأكد من:');
    console.log('1. وجود DATABASE_URL في .env.local');
    console.log('2. البيانات صحيحة');
    console.log('3. IP الخاص بك مسموح في Trusted Sources');
    process.exit(1);
  }
}

testConnection(); 