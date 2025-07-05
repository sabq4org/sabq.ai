const { Client } = require('pg');

// قراءة بيانات الاتصال من متغيرات البيئة أو .env.local
require('dotenv').config({ path: '.env.local' });

// تحليل connection string لإضافة إعدادات SSL
let connectionConfig = {
  connectionString: process.env.DATABASE_URL
};

// إضافة إعدادات SSL للتطوير
if (process.env.NODE_ENV !== 'production') {
  connectionConfig.ssl = {
    rejectUnauthorized: false
  };
}

const client = new Client(connectionConfig);

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
    
    // معلومات الاتصال
    const connectionInfo = await client.query(`
      SELECT current_database() as database,
             current_user as user,
             inet_server_addr() as server_ip,
             inet_server_port() as server_port
    `);
    console.log('\n🔗 معلومات الاتصال:');
    const info = connectionInfo.rows[0];
    console.log(`  - قاعدة البيانات: ${info.database}`);
    console.log(`  - المستخدم: ${info.user}`);
    console.log(`  - الخادم: ${info.server_ip || 'remote'}:${info.server_port}`);
    
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
      
      // عد السجلات في الجداول الرئيسية
      console.log('\n📊 إحصائيات البيانات:');
      const mainTables = ['users', 'articles', 'categories', 'keywords'];
      
      for (const table of mainTables) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
          console.log(`  - ${table}: ${countResult.rows[0].count} سجل`);
        } catch (e) {
          // تجاهل الجداول غير الموجودة
        }
      }
    } else {
      console.log('  لا توجد جداول بعد');
    }
    
    await client.end();
    console.log('\n✨ الاتصال بقاعدة البيانات يعمل بشكل ممتاز!');
    
  } catch (error) {
    console.error('\n❌ فشل الاتصال!');
    console.error('الخطأ:', error.message);
    console.log('\nتأكد من:');
    console.log('1. وجود DATABASE_URL في .env.local');
    console.log('2. البيانات صحيحة');
    console.log('3. IP الخاص بك مسموح في Trusted Sources');
    
    if (error.message.includes('certificate')) {
      console.log('\n💡 لحل مشكلة الشهادة، تأكد من أن DATABASE_URL يحتوي على:');
      console.log('   ?sslmode=require في نهاية الرابط');
    }
    
    process.exit(1);
  }
}

testConnection(); 