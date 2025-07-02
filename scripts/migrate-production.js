#!/usr/bin/env node

// سكريبت لتشغيل مهاجرة قاعدة البيانات في الإنتاج
const https = require('https');

const VERCEL_URL = process.env.VERCEL_URL || 'https://sabq-ai-cms.vercel.app';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-admin-secret';

async function migrateDatabase() {
  console.log('🚀 بدء مهاجرة قاعدة البيانات في الإنتاج...');
  console.log(`📡 الخادم: ${VERCEL_URL}`);

  const postData = JSON.stringify({});
  
  const options = {
    hostname: VERCEL_URL.replace('https://', ''),
    port: 443,
    path: '/api/admin/migrate-db',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_SECRET}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.success) {
            console.log('✅ نجحت المهاجرة!');
            console.log('📄 التفاصيل:', response.message);
            console.log('⏰ الوقت:', response.timestamp);
            if (response.output) {
              console.log('📋 مخرجات Prisma:');
              console.log(response.output);
            }
            resolve(response);
          } else {
            console.error('❌ فشلت المهاجرة:', response.error);
            if (response.details) {
              console.error('🔍 التفاصيل:', response.details);
            }
            reject(new Error(response.error));
          }
        } catch (parseError) {
          console.error('❌ خطأ في تحليل الاستجابة:', parseError);
          console.error('📄 الاستجابة الخام:', data);
          reject(parseError);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ خطأ في الشبكة:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// تشغيل السكريبت
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('\n🎉 تمت العملية بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 فشلت العملية:', error.message);
      process.exit(1);
    });
}

module.exports = { migrateDatabase }; 