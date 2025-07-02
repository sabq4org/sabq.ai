#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

console.log('🚀 بدء إعداد المشروع للنشر...\n');

// فحص الملفات المطلوبة
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'vercel.json',
  '.vercelignore'
];

console.log('📋 فحص الملفات المطلوبة...');
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ ملفات مفقودة:', missingFiles.join(', '));
  process.exit(1);
}
console.log('✅ جميع الملفات المطلوبة موجودة');

// فحص package.json
console.log('\n📦 فحص package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

if (!packageJson.scripts?.build) {
  console.error('❌ مفقود: npm script "build"');
  process.exit(1);
}

console.log('✅ package.json صحيح');

console.log('\n🎉 المشروع جاهز للنشر!');
console.log('\n📋 الخطوات التالية:');
console.log('1. ارفع التغييرات إلى GitHub:');
console.log('   git add .');
console.log('   git commit -m "إعداد المشروع للنشر"');
console.log('   git push');
console.log('');
console.log('2. اربط المشروع بـ Vercel:');
console.log('   - اذهب إلى vercel.com');
console.log('   - اختر "Import Project"');
console.log('   - اختر repository من GitHub');
console.log('   - استخدم الإعدادات الافتراضية');
