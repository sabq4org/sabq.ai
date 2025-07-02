#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 بدء إصلاح الصور المؤقتة (blob URLs)...\n');

// قراءة ملف المقالات
const articlesPath = path.join(__dirname, '../data/articles.json');

if (!fs.existsSync(articlesPath)) {
  console.error('❌ ملف المقالات غير موجود:', articlesPath);
  process.exit(1);
}

const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));

// خريطة الصور الافتراضية حسب التصنيف
const defaultImages = {
  1: '/uploads/featured/tech-default.jpg',     // تقنية
  2: '/uploads/featured/sports-default.jpg',   // رياضة
  3: '/uploads/featured/economy-default.jpg',  // اقتصاد
  4: '/uploads/featured/politics-default.jpg', // سياسة
  5: '/uploads/featured/local-default.jpg',    // محليات
  6: '/uploads/featured/culture-default.jpg',  // ثقافة ومجتمع
  7: '/uploads/featured/health-default.jpg'    // صحة
};

// دالة لاختيار صورة مناسبة حسب المحتوى
function selectAppropriateImage(article) {
  const title = article.title?.toLowerCase() || '';
  const content = article.content?.toLowerCase() || '';
  const categoryId = article.category_id;

  // صور خاصة بالمحتوى
  if (title.includes('ترامب') || content.includes('ترامب')) {
    return '/uploads/featured/trump-politics.jpg';
  }
  
  if (title.includes('الهلال') || content.includes('الهلال')) {
    return '/uploads/featured/hilal-logo.jpg';
  }
  
  if (title.includes('النصر') || content.includes('النصر')) {
    return '/uploads/featured/nassr-logo.jpg';
  }
  
  if (title.includes('أرامكو') || content.includes('أرامكو')) {
    return '/uploads/featured/aramco-building.jpg';
  }
  
  if (title.includes('غزة') || title.includes('فلسطين') || content.includes('غزة') || content.includes('فلسطين')) {
    return '/uploads/featured/gaza-palestine.jpg';
  }
  
  if (title.includes('الذكي') || title.includes('ai') || content.includes('ذكي اصطناعي')) {
    return '/uploads/featured/ai-technology.jpg';
  }
  
  if (title.includes('النوم') || content.includes('النوم')) {
    return '/uploads/featured/sleep-health.jpg';
  }
  
  if (title.includes('الرياض') || content.includes('الرياض')) {
    return '/uploads/featured/riyadh-city.jpg';
  }

  // الصورة الافتراضية حسب التصنيف
  return defaultImages[categoryId] || '/uploads/featured/tech-default.jpg';
}

let fixedCount = 0;
const fixedArticles = [];

// معالجة كل مقال
articlesData.articles.forEach(article => {
  const currentImage = article.featured_image;
  
  // التحقق من الصور المؤقتة
  if (!currentImage || 
      currentImage === '' || 
      currentImage.startsWith('blob:') ||
      currentImage.startsWith('data:image')) {
    
    const appropriateImage = selectAppropriateImage(article);
    article.featured_image = appropriateImage;
    
    // إضافة alt text مناسب إذا لم يكن موجوداً
    if (!article.featured_image_alt) {
      article.featured_image_alt = `صورة تعبيرية للمقال: ${article.title}`;
    }
    
    fixedCount++;
    fixedArticles.push({
      id: article.id,
      title: article.title,
      category_id: article.category_id,
      old_image: currentImage || 'لا توجد صورة',
      new_image: appropriateImage
    });
    
    console.log(`✅ تم إصلاح: ${article.title}`);
    console.log(`   التصنيف: ${article.category_id}`);
    console.log(`   الصورة الجديدة: ${appropriateImage}\n`);
  }
});

// حفظ الملف المحدث
if (fixedCount > 0) {
  // إنشاء نسخة احتياطية
  const backupPath = path.join(__dirname, `../data/articles_backup_before_blob_fix_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(articlesData, null, 2));
  console.log(`💾 تم إنشاء نسخة احتياطية: ${backupPath}\n`);

  // حفظ الملف المحدث
  fs.writeFileSync(articlesPath, JSON.stringify(articlesData, null, 2));
  
  console.log('📊 ملخص العملية:');
  console.log(`   إجمالي المقالات المعالجة: ${fixedCount}`);
  console.log(`   الملف المحدث: ${articlesPath}`);
  
  // إنشاء تقرير مفصل
  const reportPath = path.join(__dirname, `../reports/blob-images-fix-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    total_fixed: fixedCount,
    fixed_articles: fixedArticles,
    default_images_used: defaultImages
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`   تقرير مفصل: ${reportPath}`);
  
} else {
  console.log('✅ لا توجد مقالات تحتاج إصلاح!');
}

console.log('\n🎉 تمت العملية بنجاح!');
