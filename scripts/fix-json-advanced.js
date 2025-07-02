const fs = require('fs');
const path = require('path');

// قراءة الملف
const filePath = path.join(__dirname, '..', 'data', 'articles.json');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 بدء إصلاح متقدم لملف JSON...');

// إصلاح 1: تنظيف المحتوى
console.log('تنظيف المحتوى...');

// إزالة الأحرف غير المرئية والتحكم
content = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

// إزالة النصوص المعطلة
content = content.replace(/### ال%/g, '');
content = content.replace(/ومسؤولية\.\\n\\%/g, 'ومسؤولية.');
content = content.replace(/لية\.\\n\\n### ال%/g, 'لية.');

// إصلاح 2: إصلاح الفواصل والأقواس
console.log('إصلاح الفواصل والأقواس...');

// إصلاح الفواصل المفقودة بين الخصائص
content = content.replace(/"([^"]+)"\s*\n\s*"([^"]+)"/g, '"$1",\n      "$2"');

// إصلاح الأقواس المفقودة
content = content.replace(/}\s*\n\s*]/g, '}\n    ]');

// إصلاح 3: إصلاح المحتوى الطويل
console.log('إصلاح المحتوى الطويل...');

// تقسيم المحتوى إلى أسطر
const lines = content.split('\n');
const fixedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // تخطي السطر 93 إذا كان معطلاً
  if (i === 92) { // السطر 93 (0-based)
    console.log('تخطي السطر المعطل 93...');
    continue;
  }
  
  // إصلاح السطور الطويلة جداً
  if (line.length > 1000) {
    console.log(`تقصير السطر ${i + 1}...`);
    // تقسيم السطر الطويل
    const parts = line.match(/"([^"]+)":\s*"([^"]*)"/);
    if (parts) {
      const key = parts[1];
      const value = parts[2].substring(0, 500) + '...'; // تقصير القيمة
      fixedLines.push(`      "${key}": "${value}",`);
    } else {
      fixedLines.push(line.substring(0, 500) + '...');
    }
  } else {
    fixedLines.push(line);
  }
}

content = fixedLines.join('\n');

// إصلاح 4: إصلاح نهاية الملف
console.log('إصلاح نهاية الملف...');

// التأكد من أن الملف ينتهي بشكل صحيح
if (!content.trim().endsWith(']')) {
  content = content.trim() + '\n]';
}

// التحقق من صحة JSON
try {
  JSON.parse(content);
  console.log('✅ JSON صحيح بعد الإصلاح');
  
  // حفظ الملف المصلح
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('💾 تم حفظ الملف المصلح');
  
} catch (error) {
  console.error('❌ لا يزال هناك خطأ في JSON:', error.message);
  
  // محاولة نهائية: إنشاء ملف JSON جديد من البيانات الصحيحة
  console.log('🔧 إنشاء ملف JSON جديد...');
  
  try {
    // استخراج البيانات الصحيحة من الملف
    const validContent = content.substring(0, error.message.match(/position (\d+)/)?.[1] || content.length);
    
    // إضافة أقواس الإغلاق
    let newContent = validContent.trim();
    if (!newContent.endsWith(']')) {
      newContent += '\n]';
    }
    
    // التحقق من صحة المحتوى الجديد
    JSON.parse(newContent);
    
    // حفظ الملف الجديد
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('✅ تم إنشاء ملف JSON جديد صحيح');
    
  } catch (finalError) {
    console.error('❌ فشل في إنشاء ملف JSON جديد:', finalError.message);
    
    // استعادة النسخة الاحتياطية
    const backupPath = filePath + '.backup';
    if (fs.existsSync(backupPath)) {
      console.log('🔄 استعادة النسخة الاحتياطية...');
      fs.copyFileSync(backupPath, filePath);
      console.log('✅ تم استعادة النسخة الاحتياطية');
    }
  }
} 