#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 اختبار إصلاح نظام رفع الصور');
console.log('==========================================');

// 1. التحقق من وجود مجلد uploads
const uploadsPath = path.join(__dirname, '..', 'public', 'uploads', 'featured');
if (fs.existsSync(uploadsPath)) {
  console.log('✅ مجلد uploads/featured موجود');
  
  // عرض آخر 5 ملفات مرفوعة
  const files = fs.readdirSync(uploadsPath)
    .filter(file => file.includes('-'))
    .sort()
    .slice(-5);
  
  console.log('\n📁 آخر 5 ملفات مرفوعة:');
  files.forEach(file => {
    const filePath = path.join(uploadsPath, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`   • ${file} (${size} KB)`);
  });
  
} else {
  console.log('❌ مجلد uploads/featured غير موجود');
}

console.log('\n💡 تعليمات الاختبار:');
console.log('1. تأكد من تشغيل الخادم: npm run dev');
console.log('2. افتح صفحة تحرير مقال');
console.log('3. جرب رفع صورة AVIF أو JPG');
console.log('4. تحقق من عرض الصورة بدون "Image Error"');
