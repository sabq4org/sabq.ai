const fs = require('fs');
const path = require('path');

// مسار ملف المقالات
const articlesPath = path.join(__dirname, '../data/articles.json');

async function fixArticlesStructure() {
  try {
    console.log('🔄 بدء إصلاح بنية المقالات...');

    // قراءة المقالات الحالية
    let articles = [];
    if (fs.existsSync(articlesPath)) {
      const data = fs.readFileSync(articlesPath, 'utf8');
      articles = JSON.parse(data);
    }

    console.log(`📊 تم العثور على ${articles.length} مقال`);

    // إصلاح كل مقال
    const fixedArticles = articles.map(article => {
      const fixed = { ...article };

      // إضافة views_count إذا لم يكن موجوداً
      if (typeof fixed.views_count === 'undefined') {
        fixed.views_count = fixed.views || 0;
      }

      // إضافة likes_count إذا لم يكن موجوداً
      if (typeof fixed.likes_count === 'undefined') {
        fixed.likes_count = fixed.likes || 0;
      }

      // إضافة shares_count إذا لم يكن موجوداً
      if (typeof fixed.shares_count === 'undefined') {
        fixed.shares_count = fixed.shares || 0;
      }

      // إضافة comments_count إذا لم يكن موجوداً
      if (typeof fixed.comments_count === 'undefined') {
        fixed.comments_count = 0;
      }

      return fixed;
    });

    // حفظ المقالات المحدثة
    fs.writeFileSync(articlesPath, JSON.stringify(fixedArticles, null, 2), 'utf8');

    console.log('✅ تم إصلاح بنية المقالات بنجاح!');
    console.log(`📈 تم تحديث ${fixedArticles.length} مقال`);

  } catch (error) {
    console.error('❌ خطأ في إصلاح بنية المقالات:', error);
  }
}

// تشغيل السكريبت
fixArticlesStructure();
