#!/usr/bin/env node

/**
 * سكريبت تحسين البناء في Vercel
 * تاريخ الإنشاء: 2025-01-29
 */

const fs = require('fs');
const path = require('path');

const platform = process.env.VERCEL ? 'Vercel' : 
                process.env.DO_APP_PLATFORM ? 'DigitalOcean' : 
                'Local';
console.log(`🚀 بدء تحسين البناء لـ ${platform}...`);

// التحقق من وجود ملفات مهمة
const requiredFiles = [
  '.env',
  'prisma/schema.prisma',
  'package.json',
  'next.config.js'
];

console.log('📋 التحقق من الملفات المطلوبة...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - مفقود!`);
  }
});

// التحقق من متغيرات البيئة
console.log('\n🔍 التحقق من متغيرات البيئة...');
const envVars = [
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'JWT_SECRET'
];

envVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName} موجود`);
  } else {
    console.log(`   ⚠️  ${varName} مفقود`);
  }
});

// تنظيف الكاش
console.log('\n🧹 تنظيف الكاش...');
const cacheDirs = [
  '.next',
  'node_modules/.cache',
  '.turbo'
];

cacheDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`   ✅ تم حذف ${dir}`);
    } catch (error) {
      console.log(`   ⚠️  فشل في حذف ${dir}: ${error.message}`);
    }
  }
});

// إنشاء مجلد .next إذا لم يكن موجوداً
if (!fs.existsSync('.next')) {
  fs.mkdirSync('.next', { recursive: true });
  console.log('   ✅ تم إنشاء مجلد .next');
}

// التحقق من إعدادات Prisma
console.log('\n🗄️  التحقق من إعدادات Prisma...');
try {
  const prismaSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  if (prismaSchema.includes('generator client')) {
    console.log('   ✅ ملف schema.prisma صحيح');
  } else {
    console.log('   ❌ ملف schema.prisma غير صحيح');
  }
} catch (error) {
  console.log(`   ❌ خطأ في قراءة schema.prisma: ${error.message}`);
}

// التحقق من إعدادات Next.js
console.log('\n⚡ التحقق من إعدادات Next.js...');
try {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8');
  if (nextConfig.includes('images')) {
    console.log('   ✅ إعدادات الصور موجودة');
  }
  if (nextConfig.includes('cloudinary')) {
    console.log('   ✅ إعدادات Cloudinary موجودة');
  }
} catch (error) {
  console.log(`   ⚠️  خطأ في قراءة next.config.js: ${error.message}`);
}

console.log('\n✅ تم الانتهاء من تحسين البناء!');
console.log('\n💡 نصائح:');
console.log('   - تأكد من وجود جميع متغيرات البيئة في Vercel');
console.log('   - تأكد من أن إصدار Node.js متوافق');
console.log('   - راقب لوج البناء في Vercel للتفاصيل'); 