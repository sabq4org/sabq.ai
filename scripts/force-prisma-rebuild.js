const fs = require('fs');
const path = require('path');

console.log('🔧 إجبار إعادة بناء Prisma Client...');

// حذف المجلد المولد
const generatedPath = path.join(__dirname, '..', 'lib', 'generated', 'prisma');
if (fs.existsSync(generatedPath)) {
  fs.rmSync(generatedPath, { recursive: true, force: true });
  console.log('✅ تم حذف Prisma Client القديم');
}

// حذف ذاكرة التخزين المؤقت
const cacheDir = path.join(__dirname, '..', 'node_modules', '.prisma');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ تم حذف ذاكرة التخزين المؤقت');
}

console.log('🎯 جاهز لإعادة البناء');
