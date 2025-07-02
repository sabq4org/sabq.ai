const fs = require('fs');
const path = require('path');

// قراءة الملف
const filePath = path.join(__dirname, '..', 'data', 'articles.json');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 بدء إصلاح ملف JSON...');

// إصلاح المشاكل المعروفة
let fixed = false;

// إصلاح 1: إزالة النصوص المعطلة
const brokenTextPatterns = [
  /### ال%/g,
  /ومسؤولية\.\\n\\%/g,
  /لية\.\\n\\n### ال%/g
];

brokenTextPatterns.forEach((pattern, index) => {
  if (pattern.test(content)) {
    console.log(`إصلاح النص المعطل ${index + 1}...`);
    content = content.replace(pattern, '');
    fixed = true;
  }
});

// إصلاح 2: إصلاح الفواصل المفقودة
const missingCommaPattern = /"([^"]+)"\s*\n\s*"([^"]+)"/g;
if (missingCommaPattern.test(content)) {
  console.log('إصلاح الفواصل المفقودة...');
  content = content.replace(missingCommaPattern, '"$1",\n      "$2"');
  fixed = true;
}

// إصلاح 3: إصلاح الأقواس المفقودة
const missingBracePattern = /}\s*\n\s*]/g;
if (missingBracePattern.test(content)) {
  console.log('إصلاح الأقواس المفقودة...');
  content = content.replace(missingBracePattern, '}\n    ]');
  fixed = true;
}

// إصلاح 4: إزالة الأحرف غير المرئية
content = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

// التحقق من صحة JSON
try {
  JSON.parse(content);
  console.log('✅ JSON صحيح بعد الإصلاح');
  
  if (fixed) {
    // حفظ الملف المصلح
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('💾 تم حفظ الملف المصلح');
  } else {
    console.log('ℹ️ لم يتم العثور على مشاكل واضحة');
  }
} catch (error) {
  console.error('❌ لا يزال هناك خطأ في JSON:', error.message);
  
  // محاولة إصلاح إضافي
  console.log('🔧 محاولة إصلاح إضافي...');
  
  // إزالة السطر المعطل
  const lines = content.split('\n');
  const fixedLines = lines.filter((line, index) => {
    // تخطي السطر 93 إذا كان معطلاً
    if (index === 92) { // السطر 93 (0-based)
      console.log('تخطي السطر المعطل:', line.substring(0, 50) + '...');
      return false;
    }
    return true;
  });
  
  content = fixedLines.join('\n');
  
  try {
    JSON.parse(content);
    console.log('✅ تم إصلاح JSON بنجاح');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('💾 تم حفظ الملف المصلح');
  } catch (finalError) {
    console.error('❌ فشل في إصلاح JSON:', finalError.message);
    
    // استعادة النسخة الاحتياطية
    const backupPath = filePath + '.backup';
    if (fs.existsSync(backupPath)) {
      console.log('🔄 استعادة النسخة الاحتياطية...');
      fs.copyFileSync(backupPath, filePath);
      console.log('✅ تم استعادة النسخة الاحتياطية');
    }
  }
} 