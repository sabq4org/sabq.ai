#!/usr/bin/env node

console.log('🧪 اختبار عرض الصور في البلوكات الذكية');
console.log('===========================================');

// 1. التحقق من وجود الصور المرفوعة حديثاً
const fs = require('fs');
const path = require('path');

const uploadsPath = path.join(__dirname, '..', 'public', 'uploads', 'featured');
if (fs.existsSync(uploadsPath)) {
  const files = fs.readdirSync(uploadsPath)
    .filter(file => file.includes('1750690') && file.endsWith('.avif'))
    .sort();
  
  console.log('✅ الصور المرفوعة حديثاً:');
  files.forEach(file => {
    const filePath = path.join(uploadsPath, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`   📸 ${file} (${size} KB)`);
  });
} else {
  console.log('❌ مجلد uploads/featured غير موجود');
}

// 2. التحقق من بيانات المقالات
const articlesPath = path.join(__dirname, '..', 'data', 'articles.json');
if (fs.existsSync(articlesPath)) {
  const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
  const articles = articlesData.data || articlesData.articles || articlesData || [];
  
  console.log('\n📰 المقالات مع الصور المميزة:');
  articles.forEach(article => {
    if (article.featuredImage) {
      console.log(`   ✅ ${article.title.substring(0, 50)}...`);
      console.log(`      🖼️ ${article.featuredImage}`);
    }
  });
} else {
  console.log('❌ ملف articles.json غير موجود');
}

console.log('\n💡 للتحقق من عمل البلوكات:');
console.log('1. افتح الصفحة الرئيسية');
console.log('2. ابحث عن البلوكات الذكية');
console.log('3. تأكد من ظهور الصور في البلوكات');
console.log('4. إذا لم تظهر الصور، تحقق من:');
console.log('   - وجود كلمات مفتاحية مطابقة');
console.log('   - حالة البلوك (مفعل)');
console.log('   - موقع البلوك في الصفحة');
