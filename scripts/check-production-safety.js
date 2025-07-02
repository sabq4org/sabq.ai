#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 فحص سلامة البيئة الإنتاجية...\n');

let errors = 0;
let warnings = 0;

// دالة مساعدة للطباعة الملونة
const log = {
  error: (msg) => {
    console.log(`❌ ${msg}`);
    errors++;
  },
  warning: (msg) => {
    console.log(`⚠️  ${msg}`);
    warnings++;
  },
  success: (msg) => console.log(`✅ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`)
};

// 1. فحص ملف البيئة
log.info('فحص ملف .env.production...');
if (fs.existsSync('.env.production')) {
  const envContent = fs.readFileSync('.env.production', 'utf8');
  
  // فحص المتغيرات الحرجة
  if (envContent.includes('SEED_FAKE_DATA=true')) {
    log.error('SEED_FAKE_DATA يجب أن يكون false في الإنتاج!');
  } else {
    log.success('SEED_FAKE_DATA معطّل بشكل صحيح');
  }
  
  if (envContent.includes('USE_MOCK_DATA=true')) {
    log.error('USE_MOCK_DATA يجب أن يكون false في الإنتاج!');
  } else {
    log.success('USE_MOCK_DATA معطّل بشكل صحيح');
  }
  
  if (!envContent.includes('NODE_ENV=production')) {
    log.error('NODE_ENV يجب أن يكون production!');
  } else {
    log.success('NODE_ENV مضبوط على production');
  }
  
  // فحص قاعدة البيانات
  if (!envContent.includes('DATABASE_URL=')) {
    log.error('DATABASE_URL غير موجود!');
  } else if (envContent.includes('localhost') || envContent.includes('127.0.0.1')) {
    log.warning('DATABASE_URL يشير إلى قاعدة بيانات محلية!');
  } else {
    log.success('DATABASE_URL يبدو صحيحاً');
  }
  
} else {
  log.error('ملف .env.production غير موجود!');
}

// 2. فحص مجلد البيانات التجريبية
log.info('\nفحص مجلدات البيانات التجريبية...');
const dangerousDirs = ['data/mock', 'data/seed', 'data/test'];
dangerousDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    log.warning(`مجلد ${dir} موجود - يجب حذفه من الإنتاج`);
  }
});

// 3. فحص ملفات السيد
log.info('\nفحص ملفات البيانات التجريبية...');
const seedFiles = [
  'scripts/seed-data.js',
  'scripts/seed-data.ts',
  'prisma/seed.js',
  'prisma/seed.ts'
];
seedFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('NODE_ENV') || !content.includes('production')) {
      log.error(`${file} لا يتحقق من البيئة قبل التشغيل!`);
    } else {
      log.success(`${file} محمي من التشغيل في الإنتاج`);
    }
  }
});

// 4. فحص package.json
log.info('\nفحص package.json...');
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // فحص السكريبتات الخطرة
  const dangerousScripts = ['db:reset', 'db:seed', 'seed'];
  dangerousScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      log.warning(`سكريبت "${script}" موجود - تأكد من عدم تشغيله في الإنتاج`);
    }
  });
  
  // فحص وجود سكريبتات آمنة
  const safeScripts = ['db:migrate:deploy', 'build:production', 'db:backup'];
  safeScripts.forEach(script => {
    if (!pkg.scripts || !pkg.scripts[script]) {
      log.warning(`سكريبت "${script}" غير موجود - يُنصح بإضافته`);
    }
  });
}

// 5. فحص .gitignore
log.info('\nفحص .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const requiredIgnores = [
    '.env',
    '.env.production',
    'uploads/',
    'backups/',
    'data/production/'
  ];
  
  requiredIgnores.forEach(pattern => {
    if (!gitignore.includes(pattern)) {
      log.error(`${pattern} غير موجود في .gitignore!`);
    }
  });
} else {
  log.error('.gitignore غير موجود!');
}

// 6. فحص النسخ الاحتياطي
log.info('\nفحص نظام النسخ الاحتياطي...');
if (!fs.existsSync('scripts/backup-production.sh')) {
  log.error('سكريبت النسخ الاحتياطي غير موجود!');
} else {
  log.success('سكريبت النسخ الاحتياطي موجود');
}

// 7. فحص middleware الحماية
log.info('\nفحص middleware الحماية...');
if (fs.existsSync('middleware.ts') || fs.existsSync('middleware.js')) {
  log.success('Middleware موجود');
} else {
  log.warning('Middleware غير موجود - يُنصح بإضافته للحماية');
}

// النتيجة النهائية
console.log('\n' + '='.repeat(50));
console.log(`📊 النتيجة النهائية:`);
console.log(`   أخطاء: ${errors}`);
console.log(`   تحذيرات: ${warnings}`);

if (errors > 0) {
  console.log('\n🚫 البيئة غير آمنة للإنتاج! يجب إصلاح الأخطاء أولاً.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  البيئة بها تحذيرات - راجعها قبل النشر.');
  process.exit(0);
} else {
  console.log('\n✅ البيئة آمنة للإنتاج!');
  process.exit(0);
} 