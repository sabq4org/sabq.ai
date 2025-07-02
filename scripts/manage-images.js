const fs = require('fs');
const path = require('path');

// قراءة ملف المقالات
const articlesPath = path.join(__dirname, '../data/articles.json');
const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));

// دالة للتحقق من وجود الصورة
function checkImageExists(imagePath) {
  if (!imagePath) return false;
  
  // التحقق من الصور المحلية
  if (imagePath.startsWith('/uploads/')) {
    const fullPath = path.join(__dirname, '../public', imagePath);
    return fs.existsSync(fullPath);
  }
  
  // التحقق من الصور الخارجية (نفترض أنها موجودة)
  if (imagePath.startsWith('http')) {
    return true;
  }
  
  // التحقق من صور البيانات
  if (imagePath.startsWith('data:image')) {
    return true;
  }
  
  return false;
}

// دالة لتحليل حالة الصور
function analyzeImages() {
  const analysis = {
    total_articles: articlesData.articles.length,
    published_articles: 0,
    articles_with_images: 0,
    articles_without_images: 0,
    broken_images: 0,
    data_images: 0,
    external_images: 0,
    local_images: 0,
    missing_alt_text: 0,
    articles_by_category: {},
    problematic_articles: []
  };

  articlesData.articles.forEach(article => {
    // تحليل المقالات المنشورة فقط
    if (article.status === 'published') {
      analysis.published_articles++;
      
      // تحليل الصور
      if (article.featured_image && article.featured_image.trim() !== '') {
        analysis.articles_with_images++;
        
        // تصنيف نوع الصورة
        if (article.featured_image.startsWith('data:image')) {
          analysis.data_images++;
        } else if (article.featured_image.startsWith('http')) {
          analysis.external_images++;
        } else if (article.featured_image.startsWith('/uploads/')) {
          analysis.local_images++;
          
          // التحقق من وجود الصورة المحلية
          if (!checkImageExists(article.featured_image)) {
            analysis.broken_images++;
            analysis.problematic_articles.push({
              id: article.id,
              title: article.title,
              issue: 'صورة محلية مفقودة',
              image_path: article.featured_image
            });
          }
        }
      } else {
        analysis.articles_without_images++;
        analysis.problematic_articles.push({
          id: article.id,
          title: article.title,
          issue: 'لا توجد صورة رئيسية',
          image_path: null
        });
      }
      
      // التحقق من النص البديل
      if (!article.featured_image_alt || article.featured_image_alt.trim() === '') {
        analysis.missing_alt_text++;
      }
      
      // تحليل حسب التصنيف
      const categoryId = article.category_id;
      if (!analysis.articles_by_category[categoryId]) {
        analysis.articles_by_category[categoryId] = {
          total: 0,
          with_images: 0,
          without_images: 0
        };
      }
      
      analysis.articles_by_category[categoryId].total++;
      if (article.featured_image && article.featured_image.trim() !== '') {
        analysis.articles_by_category[categoryId].with_images++;
      } else {
        analysis.articles_by_category[categoryId].without_images++;
      }
    }
  });

  return analysis;
}

// دالة لإصلاح المشاكل الشائعة
function fixCommonIssues() {
  let fixedCount = 0;
  const fixes = [];

  articlesData.articles.forEach(article => {
    if (article.status === 'published') {
      let hasChanges = false;
      
      // إصلاح النص البديل المفقود
      if (article.featured_image && (!article.featured_image_alt || article.featured_image_alt.trim() === '')) {
        article.featured_image_alt = `صورة تعبيرية للمقال: ${article.title}`;
        hasChanges = true;
        fixes.push({
          id: article.id,
          title: article.title,
          fix: 'إضافة نص بديل للصورة'
        });
      }
      
      // تنظيف مسارات الصور
      if (article.featured_image) {
        const cleanPath = article.featured_image.trim();
        if (cleanPath !== article.featured_image) {
          article.featured_image = cleanPath;
          hasChanges = true;
          fixes.push({
            id: article.id,
            title: article.title,
            fix: 'تنظيف مسار الصورة'
          });
        }
      }
      
      if (hasChanges) {
        fixedCount++;
      }
    }
  });

  // حفظ التغييرات
  if (fixedCount > 0) {
    fs.writeFileSync(articlesPath, JSON.stringify(articlesData, null, 2), 'utf8');
  }

  return { fixedCount, fixes };
}

// دالة لإنشاء تقرير شامل
function generateReport() {
  const analysis = analyzeImages();
  const fixes = fixCommonIssues();
  
  const report = {
    timestamp: new Date().toISOString(),
    analysis,
    fixes,
    recommendations: [],
    quality_score: 0
  };

  // حساب نقاط الجودة
  const totalPublished = analysis.published_articles;
  const withImages = analysis.articles_with_images;
  const withoutBrokenImages = analysis.articles_with_images - analysis.broken_images;
  const withAltText = totalPublished - analysis.missing_alt_text;

  if (totalPublished > 0) {
    const imagesCoverage = (withImages / totalPublished) * 100;
    const imagesQuality = withImages > 0 ? (withoutBrokenImages / withImages) * 100 : 0;
    const altTextCoverage = (withAltText / totalPublished) * 100;
    
    report.quality_score = Math.round((imagesCoverage * 0.5 + imagesQuality * 0.3 + altTextCoverage * 0.2));
  }

  // إضافة التوصيات
  if (analysis.articles_without_images > 0) {
    report.recommendations.push(`إضافة صور لـ ${analysis.articles_without_images} مقال بدون صور`);
  }
  
  if (analysis.broken_images > 0) {
    report.recommendations.push(`إصلاح ${analysis.broken_images} صورة مكسورة`);
  }
  
  if (analysis.missing_alt_text > 0) {
    report.recommendations.push(`إضافة نص بديل لـ ${analysis.missing_alt_text} صورة`);
  }
  
  if (analysis.data_images > 0) {
    report.recommendations.push(`استبدال ${analysis.data_images} صورة مؤقتة بصور حقيقية`);
  }

  return report;
}

// تشغيل التحليل
console.log('🔍 بدء تحليل صور المقالات...');

const report = generateReport();

// حفظ التقرير
const reportPath = path.join(__dirname, '../reports/images-management-report.json');
const reportDir = path.dirname(reportPath);

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

// عرض النتائج
console.log('\n📊 تقرير تحليل الصور:');
console.log(`📰 إجمالي المقالات المنشورة: ${report.analysis.published_articles}`);
console.log(`🖼️ مقالات بصور: ${report.analysis.articles_with_images}`);
console.log(`❌ مقالات بدون صور: ${report.analysis.articles_without_images}`);
console.log(`🔗 صور خارجية: ${report.analysis.external_images}`);
console.log(`💾 صور محلية: ${report.analysis.local_images}`);
console.log(`📄 صور مؤقتة (data): ${report.analysis.data_images}`);
console.log(`💔 صور مكسورة: ${report.analysis.broken_images}`);
console.log(`📝 نص بديل مفقود: ${report.analysis.missing_alt_text}`);

console.log(`\n⭐ نقاط الجودة: ${report.quality_score}/100`);

if (report.fixes.fixedCount > 0) {
  console.log(`\n🔧 تم إصلاح ${report.fixes.fixedCount} مشكلة تلقائياً`);
}

if (report.recommendations.length > 0) {
  console.log('\n💡 التوصيات:');
  report.recommendations.forEach(rec => {
    console.log(`   - ${rec}`);
  });
}

if (report.analysis.problematic_articles.length > 0) {
  console.log('\n⚠️ مقالات تحتاج لمراجعة:');
  report.analysis.problematic_articles.slice(0, 5).forEach(article => {
    console.log(`   - ${article.title} (${article.issue})`);
  });
  
  if (report.analysis.problematic_articles.length > 5) {
    console.log(`   ... و ${report.analysis.problematic_articles.length - 5} مقال آخر`);
  }
}

console.log(`\n📁 تم حفظ التقرير التفصيلي في: ${reportPath}`);

// إنشاء ملخص سريع
const summaryPath = path.join(__dirname, '../reports/images-summary.txt');
const summary = `تقرير سريع - صور المقالات
التاريخ: ${new Date().toLocaleString('ar-SA')}

الإحصائيات:
- المقالات المنشورة: ${report.analysis.published_articles}
- مقالات بصور: ${report.analysis.articles_with_images}
- مقالات بدون صور: ${report.analysis.articles_without_images}
- نقاط الجودة: ${report.quality_score}/100

المشاكل:
- صور مكسورة: ${report.analysis.broken_images}
- نص بديل مفقود: ${report.analysis.missing_alt_text}
- صور مؤقتة: ${report.analysis.data_images}

التوصيات:
${report.recommendations.map(rec => `- ${rec}`).join('\n')}
`;

fs.writeFileSync(summaryPath, summary, 'utf8');
console.log(`📄 تم حفظ الملخص السريع في: ${summaryPath}`); 