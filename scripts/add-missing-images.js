const fs = require('fs');
const path = require('path');

// قائمة الصور المناسبة حسب التصنيف والموضوع
const imagesByCategory = {
  1: { // تقنية
    default: '/uploads/featured/tech-default.jpg',
    ai: '/uploads/featured/ai-technology.jpg',
    health: '/uploads/featured/tech-health.jpg',
    innovation: '/uploads/featured/tech-innovation.jpg'
  },
  2: { // رياضة
    default: '/uploads/featured/sports-default.jpg',
    football: '/uploads/featured/football-stadium.jpg',
    hilal: '/uploads/featured/hilal-logo.jpg',
    nassr: '/uploads/featured/nassr-logo.jpg',
    asian_champions: '/uploads/featured/asian-champions.jpg'
  },
  3: { // اقتصاد
    default: '/uploads/featured/economy-default.jpg',
    aramco: '/uploads/featured/aramco-building.jpg',
    oil: '/uploads/featured/oil-industry.jpg',
    stock: '/uploads/featured/stock-market.jpg'
  },
  4: { // سياسة
    default: '/uploads/featured/politics-default.jpg',
    summit: '/uploads/featured/arab-summit.jpg',
    international: '/uploads/featured/international-relations.jpg',
    gaza: '/uploads/featured/gaza-palestine.jpg',
    trump: '/uploads/featured/trump-politics.jpg'
  },
  5: { // محليات
    default: '/uploads/featured/local-default.jpg',
    riyadh: '/uploads/featured/riyadh-city.jpg',
    entertainment: '/uploads/featured/entertainment-complex.jpg',
    tourism: '/uploads/featured/saudi-tourism.jpg',
    security: '/uploads/featured/security-forces.jpg'
  },
  6: { // ثقافة ومجتمع
    default: '/uploads/featured/culture-default.jpg',
    festival: '/uploads/featured/cultural-festival.jpg',
    heritage: '/uploads/featured/saudi-heritage.jpg'
  },
  8: { // صحة
    default: '/uploads/featured/health-default.jpg',
    sleep: '/uploads/featured/sleep-health.jpg',
    medical: '/uploads/featured/medical-research.jpg'
  }
};

// دالة لاختيار الصورة المناسبة بناءً على المحتوى والتصنيف
function selectAppropriateImage(article) {
  const categoryImages = imagesByCategory[article.category_id] || imagesByCategory[5];
  const title = article.title.toLowerCase();
  const content = article.content.toLowerCase();
  
  // اختيار الصورة بناءً على الكلمات المفتاحية
  if (article.category_id === 1) { // تقنية
    if (title.includes('ذكاء اصطناعي') || content.includes('ذكاء اصطناعي')) {
      return categoryImages.ai;
    }
    if (title.includes('صحة') || content.includes('صحة')) {
      return categoryImages.health;
    }
    return categoryImages.default;
  }
  
  if (article.category_id === 2) { // رياضة
    if (title.includes('هلال') || content.includes('هلال')) {
      return categoryImages.hilal;
    }
    if (title.includes('نصر') || content.includes('نصر')) {
      return categoryImages.nassr;
    }
    if (title.includes('آسيا') || content.includes('آسيا')) {
      return categoryImages.asian_champions;
    }
    return categoryImages.football;
  }
  
  if (article.category_id === 3) { // اقتصاد
    if (title.includes('أرامكو') || content.includes('أرامكو')) {
      return categoryImages.aramco;
    }
    if (title.includes('نفط') || content.includes('نفط')) {
      return categoryImages.oil;
    }
    return categoryImages.default;
  }
  
  if (article.category_id === 4) { // سياسة
    if (title.includes('قمة') || content.includes('قمة')) {
      return categoryImages.summit;
    }
    if (title.includes('غزة') || title.includes('فلسطين') || content.includes('غزة')) {
      return categoryImages.gaza;
    }
    if (title.includes('ترامب') || content.includes('ترامب')) {
      return categoryImages.trump;
    }
    return categoryImages.default;
  }
  
  if (article.category_id === 5) { // محليات
    if (title.includes('رياض') || content.includes('رياض')) {
      return categoryImages.riyadh;
    }
    if (title.includes('ترفيه') || content.includes('ترفيه')) {
      return categoryImages.entertainment;
    }
    if (title.includes('سياحة') || content.includes('سياحة')) {
      return categoryImages.tourism;
    }
    if (title.includes('مخدرات') || title.includes('أمن') || content.includes('مخدرات')) {
      return categoryImages.security;
    }
    return categoryImages.default;
  }
  
  if (article.category_id === 6) { // ثقافة ومجتمع
    if (title.includes('مهرجان') || content.includes('مهرجان')) {
      return categoryImages.festival;
    }
    return categoryImages.default;
  }
  
  if (article.category_id === 8) { // صحة
    if (title.includes('نوم') || content.includes('نوم')) {
      return categoryImages.sleep;
    }
    return categoryImages.medical;
  }
  
  return categoryImages.default;
}

// قراءة ملف المقالات
const articlesPath = path.join(__dirname, '../data/articles.json');
const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));

let updatedCount = 0;
const updatedArticles = [];

// معالجة كل مقال
articlesData.articles.forEach(article => {
  // التحقق من المقالات المنشورة التي تفتقر للصور
  if (article.status === 'published' && 
      (!article.featured_image || 
       article.featured_image === '' || 
       article.featured_image.startsWith('blob:') ||
       article.featured_image.startsWith('data:image'))) {
    
    const appropriateImage = selectAppropriateImage(article);
    article.featured_image = appropriateImage;
    
    // إضافة alt text مناسب
    if (!article.featured_image_alt) {
      article.featured_image_alt = `صورة تعبيرية للمقال: ${article.title}`;
    }
    
    updatedCount++;
    updatedArticles.push({
      id: article.id,
      title: article.title,
      category_id: article.category_id,
      old_image: 'لا توجد صورة',
      new_image: appropriateImage
    });
  }
});

// حفظ الملف المحدث
fs.writeFileSync(articlesPath, JSON.stringify(articlesData, null, 2), 'utf8');

// إنشاء تقرير
const reportPath = path.join(__dirname, '../reports/missing-images-report.json');
const reportDir = path.dirname(reportPath);

// إنشاء مجلد التقارير إذا لم يكن موجوداً
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  total_articles_processed: articlesData.articles.length,
  updated_articles_count: updatedCount,
  updated_articles: updatedArticles,
  summary: {
    'تقنية': updatedArticles.filter(a => a.category_id === 1).length,
    'رياضة': updatedArticles.filter(a => a.category_id === 2).length,
    'اقتصاد': updatedArticles.filter(a => a.category_id === 3).length,
    'سياسة': updatedArticles.filter(a => a.category_id === 4).length,
    'محليات': updatedArticles.filter(a => a.category_id === 5).length,
    'ثقافة ومجتمع': updatedArticles.filter(a => a.category_id === 6).length,
    'صحة': updatedArticles.filter(a => a.category_id === 8).length
  }
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log('✅ تم الانتهاء من إضافة الصور للمقالات');
console.log(`📊 إجمالي المقالات المعالجة: ${articlesData.articles.length}`);
console.log(`🖼️ عدد المقالات التي تم تحديث صورها: ${updatedCount}`);
console.log(`📁 تم حفظ التقرير في: ${reportPath}`);

if (updatedCount > 0) {
  console.log('\n📋 ملخص التحديثات حسب التصنيف:');
  Object.entries(report.summary).forEach(([category, count]) => {
    if (count > 0) {
      console.log(`   ${category}: ${count} مقال`);
    }
  });
  
  console.log('\n🔍 أمثلة على المقالات المحدثة:');
  updatedArticles.slice(0, 5).forEach(article => {
    console.log(`   - ${article.title}`);
    console.log(`     الصورة الجديدة: ${article.new_image}`);
  });
} 