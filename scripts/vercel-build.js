#!/usr/bin/env node

/**
 * Vercel Build Script
 * يساعد في تحضير المشروع للبناء على Vercel
 */

console.log('🚀 Starting Vercel build preparation...');

// التحقق من وجود متغيرات البيئة المطلوبة
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXTAUTH_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ متغيرات البيئة المطلوبة مفقودة:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nتأكد من إضافتها في إعدادات Vercel > Environment Variables');
  process.exit(1);
}

console.log('✅ جميع متغيرات البيئة المطلوبة موجودة');

// إنشاء ملف .env.local إذا لم يكن موجود (لـ local testing)
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.log('📝 Creating .env.local for build...');
  fs.writeFileSync(envLocalPath, '# Auto-generated for build\n');
}

console.log('✅ Build preparation complete!'); 