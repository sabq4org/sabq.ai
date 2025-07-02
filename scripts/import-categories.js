const fs = require('fs');
const path = require('path');

console.log('📁 استيراد التصنيفات...');

try {
  // قراءة ملف التصنيفات
  const categoriesPath = path.join(__dirname, '../data/categories.json');
  const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  
  console.log(`✅ تم العثور على ${categoriesData.categories.length} تصنيف`);
  
  // عرض التصنيفات
  categoriesData.categories.forEach(cat => {
    console.log(`- ${cat.name_ar} (${cat.name_en}) - ${cat.icon}`);
  });
  
  console.log('\n✅ التصنيفات جاهزة للاستخدام!');
  console.log('💡 تأكد من أن الملف موجود في: data/categories.json');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.log('\n📝 تأكد من وجود الملف في المسار الصحيح');
} 