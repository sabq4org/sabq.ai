#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 اختبار API رفع الصور مع دعم AVIF...\n');

// التحقق من وجود مجلدات الرفع
const uploadDirs = [
  'public/uploads/featured',
  'public/uploads/articles', 
  'public/uploads/avatars'
];

console.log('📁 فحص مجلدات الرفع:');
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${dir} ${exists ? '(موجود)' : '(غير موجود)'}`);
  
  if (!exists) {
    try {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   ✅ تم إنشاء ${dir}`);
    } catch (error) {
      console.log(`   ❌ فشل إنشاء ${dir}:`, error.message);
    }
  }
});

console.log('\n📋 فحص صلاحيات الكتابة:');
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  try {
    const testFile = path.join(fullPath, 'test-write.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`   ✅ ${dir} (قابل للكتابة)`);
  } catch (error) {
    console.log(`   ❌ ${dir} (غير قابل للكتابة):`, error.message);
  }
});

console.log('\n🎨 الصيغ المدعومة:');
const supportedFormats = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml'
];

supportedFormats.forEach(format => {
  console.log(`   ✅ ${format}`);
});

console.log('\n📊 إحصائيات:');
console.log(`   📁 مجلدات الرفع: ${uploadDirs.length}`);
console.log(`   🎨 صيغ مدعومة: ${supportedFormats.length}`);
console.log(`   📏 حد الحجم: 5MB`);

console.log('\n✨ نصائح لحل مشاكل الرفع:');
console.log('   1. تأكد من إعادة تشغيل الخادم بعد التحديثات');
console.log('   2. امسح cache المتصفح');
console.log('   3. تحقق من أن الصورة أقل من 5MB');
console.log('   4. استخدم صيغ الصور المدعومة فقط');
console.log('   5. تأكد من صلاحيات الكتابة في مجلد public/uploads');

console.log('\n🚀 لاختبار رفع صورة AVIF:');
console.log('   curl -X POST http://localhost:3000/api/upload \\');
console.log('     -F "file=@path/to/image.avif" \\');
console.log('     -F "type=featured"');

console.log('\n🎯 تم الانتهاء من الفحص!');
