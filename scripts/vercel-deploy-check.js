#!/usr/bin/env node

/**
 * سكريبت التحقق من جاهزية النشر في Vercel
 * تاريخ الإنشاء: 2025-01-29
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 بدء التحقق من جاهزية النشر في Vercel...\n');

let hasErrors = false;

// التحقق من ملفات التكوين الأساسية
const configFiles = [
  { file: 'package.json', required: true },
  { file: 'next.config.js', required: true },
  { file: 'prisma/schema.prisma', required: true },
  { file: 'vercel.json', required: false },
  { file: '.env', required: false }
];

console.log('📁 التحقق من ملفات التكوين:');
configFiles.forEach(({ file, required }) => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else if (required) {
    console.log(`   ❌ ${file} - مطلوب!`);
    hasErrors = true;
  } else {
    console.log(`   ⚠️  ${file} - غير موجود (اختياري)`);
  }
});

// التحقق من مجلدات مهمة
const requiredDirs = [
  'app',
  'components',
  'lib',
  'prisma'
];

console.log('\n📂 التحقق من المجلدات المطلوبة:');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`   ✅ ${dir}/`);
  } else {
    console.log(`   ❌ ${dir}/ - مطلوب!`);
    hasErrors = true;
  }
});

// التحقق من متغيرات البيئة المطلوبة
console.log('\n🔐 التحقق من متغيرات البيئة:');
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

const optionalEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}`);
  } else {
    console.log(`   ⚠️  ${varName} - غير موجود محلياً (سيتم التحقق في Vercel)`);
    // لا نعتبر هذا خطأ في البيئة المحلية
  }
});

optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}`);
  } else {
    console.log(`   ⚠️  ${varName} - غير موجود (اختياري)`);
  }
});

// التحقق من إعدادات Prisma
console.log('\n🗄️  التحقق من إعدادات Prisma:');
try {
  const schemaPath = 'prisma/schema.prisma';
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (schema.includes('generator client')) {
      console.log('   ✅ generator client موجود');
    } else {
      console.log('   ❌ generator client مفقود');
      hasErrors = true;
    }
    
    if (schema.includes('datasource db')) {
      console.log('   ✅ datasource موجود');
    } else {
      console.log('   ❌ datasource مفقود');
      hasErrors = true;
    }
    
    if (schema.includes('model')) {
      console.log('   ✅ نماذج قاعدة البيانات موجودة');
    } else {
      console.log('   ⚠️  لا توجد نماذج قاعدة البيانات');
    }
  }
} catch (error) {
  console.log(`   ❌ خطأ في قراءة schema.prisma: ${error.message}`);
  hasErrors = true;
}

// التحقق من إعدادات Next.js
console.log('\n⚡ التحقق من إعدادات Next.js:');
try {
  const nextConfigPath = 'next.config.js';
  if (fs.existsSync(nextConfigPath)) {
    const config = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (config.includes('images')) {
      console.log('   ✅ إعدادات الصور موجودة');
    }
    
    if (config.includes('headers')) {
      console.log('   ✅ إعدادات Headers موجودة');
    }
    
    if (config.includes('webpack')) {
      console.log('   ✅ إعدادات Webpack موجودة');
    }
  }
} catch (error) {
  console.log(`   ❌ خطأ في قراءة next.config.js: ${error.message}`);
  hasErrors = true;
}

// التحقق من package.json
console.log('\n📦 التحقق من package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('   ✅ سكريبت البناء موجود');
  } else {
    console.log('   ❌ سكريبت البناء مفقود');
    hasErrors = true;
  }
  
  if (packageJson.dependencies && packageJson.dependencies.next) {
    console.log('   ✅ Next.js موجود في dependencies');
  } else {
    console.log('   ❌ Next.js مفقود من dependencies');
    hasErrors = true;
  }
  
  if (packageJson.dependencies && packageJson.dependencies['@prisma/client']) {
    console.log('   ✅ Prisma Client موجود');
  } else {
    console.log('   ❌ Prisma Client مفقود');
    hasErrors = true;
  }
} catch (error) {
  console.log(`   ❌ خطأ في قراءة package.json: ${error.message}`);
  hasErrors = true;
}

// النتيجة النهائية
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ فشل التحقق - يرجى إصلاح الأخطاء المذكورة أعلاه');
  process.exit(1);
} else {
  console.log('✅ المشروع جاهز للنشر في Vercel!');
  console.log('\n💡 نصائح للنشر:');
  console.log('   - تأكد من إضافة جميع متغيرات البيئة في Vercel');
  console.log('   - تأكد من أن قاعدة البيانات متاحة');
  console.log('   - راقب لوج البناء في Vercel');
  console.log('   - اختبر التطبيق بعد النشر');
} 