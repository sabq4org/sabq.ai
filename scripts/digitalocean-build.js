#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🌊 بدء تحسين البناء لـ DigitalOcean...');

// التحقق من المتغيرات المطلوبة
const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dybhezmvb',
  NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '559894124915114',
  JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret-for-build',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'default-nextauth-secret-for-build',
  NODE_ENV: 'production'
};

// إنشاء ملف .env.production للبناء
let envContent = '';
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (value) {
    envContent += `${key}="${value}"\n`;
  }
}

// كتابة ملف البيئة
fs.writeFileSync('.env.production', envContent);
console.log('✅ تم إنشاء ملف .env.production');

// التحقق من وجود مجلد prisma
const prismaDir = path.join(process.cwd(), 'prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
  console.log('✅ تم إنشاء مجلد prisma');
}

// التحقق من وجود مجلد lib/generated/prisma
const generatedDir = path.join(process.cwd(), 'lib', 'generated', 'prisma');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
  console.log('✅ تم إنشاء مجلد lib/generated/prisma');
}

// تعيين متغيرات Prisma للبناء
process.env.PRISMA_SKIP_POSTINSTALL_GENERATE = 'true';
process.env.PRISMA_CLI_BINARY_TARGETS = '["debian-openssl-3.0.x"]';

console.log('📦 إعدادات Prisma:');
console.log('   - PRISMA_SKIP_POSTINSTALL_GENERATE:', process.env.PRISMA_SKIP_POSTINSTALL_GENERATE);
console.log('   - PRISMA_CLI_BINARY_TARGETS:', process.env.PRISMA_CLI_BINARY_TARGETS);

console.log('\n🚀 البناء جاهز للبدء!');
console.log('💡 نصائح لـ DigitalOcean:');
console.log('   - تأكد من إضافة جميع متغيرات البيئة في App Platform');
console.log('   - استخدم Node.js 18 أو 20 (ليس 22)');
console.log('   - تحقق من حجم الذاكرة المتاحة');

process.exit(0); 