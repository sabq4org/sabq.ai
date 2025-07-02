#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 بدء إصلاح مشاكل البناء على Vercel...');

// التحقق من وجود الملفات المطلوبة
const requiredFiles = [
  'package.json',
  'package-lock.json',
  'next.config.js',
  'prisma/schema.prisma'
];

console.log('📋 التحقق من الملفات المطلوبة...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - مفقود`);
    process.exit(1);
  }
});

// تنظيف الكاش
console.log('🧹 تنظيف الكاش...');
try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('  ✅ تم حذف .next');
  }
  
  if (fs.existsSync('node_modules/.cache')) {
    fs.rmSync('node_modules/.cache', { recursive: true, force: true });
    console.log('  ✅ تم حذف node_modules/.cache');
  }
} catch (error) {
  console.log('  ⚠️ خطأ في تنظيف الكاش:', error.message);
}

// التحقق من المكتبات المفقودة
console.log('📦 التحقق من المكتبات المفقودة...');
const missingDeps = [
  '@radix-ui/react-scroll-area',
  'js-cookie',
  'jwt-decode'
];

missingDeps.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`  ✅ ${dep}`);
  } catch (error) {
    console.log(`  ❌ ${dep} - مفقود`);
  }
});

// إعادة تثبيت المكتبات المفقودة
console.log('📦 إعادة تثبيت المكتبات...');
try {
  execSync('npm install --force', { stdio: 'inherit' });
  console.log('  ✅ تم إعادة تثبيت المكتبات');
} catch (error) {
  console.log('  ❌ خطأ في إعادة تثبيت المكتبات:', error.message);
}

// إنشاء ملف .npmrc لضمان التثبيت الصحيح
console.log('⚙️ إنشاء ملف .npmrc...');
const npmrcContent = `legacy-peer-deps=true
strict-ssl=false
registry=https://registry.npmjs.org/
`;

fs.writeFileSync('.npmrc', npmrcContent);
console.log('  ✅ تم إنشاء .npmrc');

// التحقق من Prisma
console.log('🗄️ التحقق من Prisma...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('  ✅ تم توليد Prisma Client');
} catch (error) {
  console.log('  ❌ خطأ في توليد Prisma Client:', error.message);
}

// إنشاء ملف next.config.js محسن
console.log('⚙️ تحسين next.config.js...');
const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  webpack: (config, { isServer }) => {
    // إصلاح مشاكل المكتبات
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // تحسين الأداء
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\\\/]node_modules[\\\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
    
    return config;
  },
  // إعدادات الصور
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  // تحسين الأداء
  compress: true,
  poweredByHeader: false,
  // إعدادات البيئة
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // إعدادات التصدير
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
`;

fs.writeFileSync('next.config.js', nextConfigContent);
console.log('  ✅ تم تحديث next.config.js');

// إنشاء ملف .vercelignore محسن
console.log('📝 تحديث .vercelignore...');
const vercelignoreContent = `# ملفات التطوير
__dev__/
*.log
.env.local
.env.development

# ملفات النسخ الاحتياطي
backups/
*.backup
*.backup.*

# ملفات الاختبار
test/
tests/
__tests__/
*.test.js
*.test.ts
*.spec.js
*.spec.ts

# ملفات الأدوات
scripts/
docs/
reports/

# ملفات البيانات المحلية
data/
uploads/
public/uploads/

# ملفات النظام
.DS_Store
Thumbs.db

# ملفات Git
.git/
.gitignore

# ملفات IDE
.vscode/
.idea/
*.swp
*.swo

# ملفات Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ملفات البناء
.next/
out/
dist/

# ملفات Prisma
prisma/migrations/
*.db
*.sqlite

# ملفات أخرى
*.md
README.md
LICENSE
`;

fs.writeFileSync('.vercelignore', vercelignoreContent);
console.log('  ✅ تم تحديث .vercelignore');

console.log('✅ تم الانتهاء من إصلاح مشاكل البناء على Vercel!');
console.log('');
console.log('💡 نصائح إضافية:');
console.log('  - تأكد من وجود جميع متغيرات البيئة في Vercel');
console.log('  - تأكد من أن إصدار Node.js متوافق');
console.log('  - راقب لوج البناء في Vercel للتفاصيل');
console.log('');
console.log('🚀 يمكنك الآن إعادة البناء على Vercel'); 