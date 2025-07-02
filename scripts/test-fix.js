#!/usr/bin/env node

/**
 * سكريبت اختبار حالة الإصلاح
 * يتحقق من عمل قاعدة البيانات و API endpoints
 */

const https = require('https');

console.log('🧪 اختبار حالة الإصلاح...\n');

// دالة لإجراء HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

// قائمة الاختبارات
const tests = [
  {
    name: 'اختبار اتصال قاعدة البيانات',
    url: 'https://sabq-ai-cms.vercel.app/api/test-db',
    check: (result) => result.data.success === true
  },
  {
    name: 'اختبار API الفئات',
    url: 'https://sabq-ai-cms.vercel.app/api/categories',
    check: (result) => result.status === 200 && Array.isArray(result.data)
  },
  {
    name: 'اختبار API المقالات',
    url: 'https://sabq-ai-cms.vercel.app/api/articles',
    check: (result) => result.status === 200 || result.status === 401 // 401 OK للمحتوى المحمي
  },
  {
    name: 'اختبار صحة النظام',
    url: 'https://sabq-ai-cms.vercel.app/api/health',
    check: (result) => result.status === 200
  }
];

// تشغيل الاختبارات
async function runTests() {
  console.log('📊 تشغيل الاختبارات...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      const result = await makeRequest(test.url);
      
      if (test.check(result)) {
        console.log(`✅ نجح - ${test.name}`);
        passed++;
      } else {
        console.log(`❌ فشل - ${test.name}`);
        console.log(`   الحالة: ${result.status}`);
        console.log(`   البيانات: ${JSON.stringify(result.data).substring(0, 100)}...`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ خطأ في ${test.name}: ${error.message}`);
      failed++;
    }
    console.log('');
  }
  
  // النتيجة النهائية
  console.log('📋 ملخص النتائج:');
  console.log(`✅ نجح: ${passed}`);
  console.log(`❌ فشل: ${failed}`);
  console.log(`📊 النسبة: ${Math.round(passed / tests.length * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 تهانينا! جميع الاختبارات نجحت');
    console.log('🚀 الموقع يعمل بشكل صحيح');
  } else {
    console.log('\n⚠️  بعض الاختبارات فشلت');
    console.log('💡 راجع APPLY_FIX_MANUAL.md للمزيد من الحلول');
  }
}

// تشغيل الاختبارات
runTests().catch(console.error); 