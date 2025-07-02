const fs = require('fs');
const path = require('path');

// قراءة ملف التصنيفات المُصدَّر
const categoriesFile = path.join(__dirname, '../data/exports/categories-export-2025-06-29.json');
const categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));

console.log('📦 استيراد التصنيفات عبر API...');
console.log(`عدد التصنيفات: ${categories.length}`);

// URL الموقع
const API_URL = 'https://jur3a.ai/api/categories';
// أو استخدم localhost إذا كنت على الخادم
// const API_URL = 'http://localhost:3000/api/categories';

// API Key من متغيرات البيئة
const API_KEY = process.env.API_SECRET_KEY || 'X9yZ1aC3eF5gH7jK9mN2pQ4rS6tV8wX0yZ1aC3eF5gH7j';

async function importCategories() {
  let successCount = 0;
  let errorCount = 0;

  for (const category of categories) {
    try {
      console.log(`\n📝 استيراد: ${category.name} (${category.slug})`);
      
      // إعداد البيانات للإرسال
      const categoryData = {
        name: category.name,
        name_ar: category.name,
        name_en: category.name_en,
        slug: category.slug,
        description: category.description,
        color: category.color,
        icon: category.icon,
        parent_id: category.parent_id,
        display_order: category.display_order || 0,
        is_active: category.is_active !== false,
        metadata: category.metadata
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(categoryData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ نجح: ${category.name}`);
        successCount++;
      } else {
        console.error(`❌ فشل: ${category.name} - ${result.error || result.message}`);
        errorCount++;
        
        // إذا كان الخطأ بسبب وجود التصنيف، جرب التحديث
        if (result.error && result.error.includes('يوجد فئة أخرى بنفس المعرف')) {
          console.log('🔄 محاولة تحديث التصنيف...');
          
          // جلب ID التصنيف الموجود
          const getResponse = await fetch(`${API_URL}?slug=${category.slug}`);
          if (getResponse.ok) {
            const data = await getResponse.json();
            const existingCategory = data.categories?.find(c => c.slug === category.slug);
            
            if (existingCategory) {
              // تحديث التصنيف
              const updateResponse = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': API_KEY
                },
                body: JSON.stringify({
                  id: existingCategory.id,
                  ...categoryData
                })
              });
              
              if (updateResponse.ok) {
                console.log(`✅ تم التحديث: ${category.name}`);
                successCount++;
                errorCount--;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ خطأ في ${category.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 ملخص الاستيراد:');
  console.log(`✅ نجح: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  console.log(`📋 المجموع: ${categories.length}`);
}

// تشغيل الاستيراد
importCategories().catch(console.error); 