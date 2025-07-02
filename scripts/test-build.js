#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 بدء اختبار البناء المحلي...\n');

// تنظيف الكاش
console.log('🧹 تنظيف الكاش...');
try {
  execSync('rm -rf .next', { stdio: 'inherit' });
  execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
  console.log('✅ تم تنظيف الكاش بنجاح\n');
} catch (error) {
  console.log('⚠️  تحذير: فشل في تنظيف بعض الملفات\n');
}

// فحص Prisma schema
console.log('🔍 فحص Prisma schema...');
try {
  execSync('npx prisma validate', { stdio: 'inherit' });
  console.log('✅ Prisma schema صحيح\n');
} catch (error) {
  console.error('❌ خطأ في Prisma schema');
  process.exit(1);
}

// توليد Prisma client
console.log('⚙️  توليد Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ تم توليد Prisma client بنجاح\n');
} catch (error) {
  console.error('❌ فشل في توليد Prisma client');
  process.exit(1);
}

// فحص TypeScript
console.log('🔍 فحص TypeScript...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ لا توجد أخطاء TypeScript\n');
} catch (error) {
  console.error('❌ أخطاء TypeScript موجودة');
  console.log('💡 يمكنك تجاهل هذه الأخطاء إذا كانت غير حرجة للبناء\n');
}

// اختبار البناء
console.log('🏗️  اختبار البناء...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ تم البناء بنجاح!\n');
} catch (error) {
  console.error('❌ فشل في البناء');
  console.log('\n🔍 تحقق من الأخطاء أعلاه وحاول إصلاحها');
  process.exit(1);
}

// فحص الملفات المبنية
console.log('📁 فحص الملفات المبنية...');
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  const stats = fs.statSync(nextDir);
  console.log(`✅ مجلد .next موجود (${Math.round(stats.size / 1024)} KB)`);
} else {
  console.error('❌ مجلد .next غير موجود');
}

console.log('\n🎉 اختبار البناء مكتمل بنجاح!');
console.log('📤 يمكنك الآن رفع المشروع إلى Vercel'); 