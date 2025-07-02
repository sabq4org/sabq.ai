#!/usr/bin/env node

/**
 * سكريبت لحل مشكلة الحزم المفقودة عند البناء
 * يقوم بحذف node_modules وإعادة تثبيت الحزم ثم البناء
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 بدء إصلاح مشكلة البناء...\n');

// التحقق من وجود package.json
if (!fs.existsSync('package.json')) {
  console.error('❌ خطأ: لم يتم العثور على package.json');
  console.error('تأكد من تشغيل هذا السكريبت من مجلد المشروع الرئيسي');
  process.exit(1);
}

try {
  // 1. حذف node_modules و package-lock.json
  console.log('🗑️  حذف node_modules و package-lock.json...');
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  if (fs.existsSync('package-lock.json')) {
    execSync('rm -f package-lock.json', { stdio: 'inherit' });
  }
  console.log('✅ تم الحذف بنجاح\n');

  // 2. تثبيت الحزم
  console.log('📦 تثبيت جميع الحزم...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ تم تثبيت الحزم بنجاح\n');

  // 3. التحقق من وجود الحزم المطلوبة
  console.log('🔍 التحقق من الحزم المطلوبة...');
  const requiredPackages = [
    '@radix-ui/react-dialog',
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-slot',
    'class-variance-authority',
    'react-hot-toast'
  ];

  let allPackagesInstalled = true;
  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
      console.log(`✅ ${pkg} - مثبت`);
    } catch (e) {
      console.log(`❌ ${pkg} - غير مثبت`);
      allPackagesInstalled = false;
    }
  }

  if (!allPackagesInstalled) {
    console.log('\n📦 إعادة محاولة تثبيت الحزم المفقودة...');
    execSync('npm install ' + requiredPackages.join(' '), { stdio: 'inherit' });
  }
  console.log('\n');

  // 4. بناء المشروع
  console.log('🏗️  بناء المشروع...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ تم بناء المشروع بنجاح!\n');

  console.log('🎉 تم إصلاح جميع المشاكل!');
  console.log('يمكنك الآن تشغيل المشروع باستخدام: npm start');

} catch (error) {
  console.error('\n❌ حدث خطأ:', error.message);
  process.exit(1);
} 