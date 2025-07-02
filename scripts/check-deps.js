#!/usr/bin/env node

/**
 * سكريبت للتحقق من التبعيات المفقودة
 * يعمل تلقائياً بعد git pull
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 التحقق من التبعيات...\n');

// قراءة package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};

let missingDeps = [];
let outdatedDeps = [];

// التحقق من كل حزمة
for (const [dep, version] of Object.entries(allDeps)) {
  const depPath = path.join('node_modules', dep);
  
  if (!fs.existsSync(depPath)) {
    missingDeps.push(dep);
  } else {
    try {
      const installedPackage = JSON.parse(
        fs.readFileSync(path.join(depPath, 'package.json'), 'utf8')
      );
      
      // تحقق بسيط من الإصدار
      if (installedPackage.version !== version.replace(/[\^~]/, '')) {
        // هذا تحقق مبسط، في الواقع معقد أكثر
      }
    } catch (e) {
      // تجاهل الأخطاء
    }
  }
}

// عرض النتائج
if (missingDeps.length > 0) {
  console.log('❌ حزم مفقودة:');
  missingDeps.forEach(dep => console.log(`   - ${dep}`));
  console.log('\n⚠️  يجب تشغيل: npm install\n');
  process.exit(1);
} else {
  console.log('✅ جميع الحزم مثبتة!\n');
  
  // تذكير إضافي
  console.log('💡 تذكير:');
  console.log('   - لبناء المشروع: npm run build');
  console.log('   - لتشغيل المشروع: npm start');
  console.log('   - عند مشاكل البناء: npm run fix-build\n');
} 