const fs = require('fs');
const path = require('path');

// مسار ملف المقالات
const articlesPath = path.join(__dirname, '..', 'data', 'articles.json');

// قراءة المقالات
const data = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
const articles = data.articles || data;

console.log(`📚 عدد المقالات: ${articles.length}`);

// تحديث كل مقال
let updatedCount = 0;
const updatedArticles = articles.map(article => {
  // إضافة published_at إذا لم يكن موجوداً
  if (!article.published_at) {
    article.published_at = article.created_at || new Date().toISOString();
    updatedCount++;
  }
  
  // التأكد من وجود views_count
  if (typeof article.views_count === 'undefined') {
    article.views_count = 0;
  }
  
  // التأكد من وجود stats
  if (!article.stats) {
    article.stats = {
      views: article.views_count || 0,
      likes: article.likes_count || 0,
      shares: article.shares_count || 0,
      comments: article.comments_count || 0,
      saves: article.saves_count || 0
    };
  }
  
  return article;
});

// حفظ المقالات المحدثة
const dataToSave = { articles: updatedArticles };
fs.writeFileSync(articlesPath, JSON.stringify(dataToSave, null, 2), 'utf-8');

console.log(`✅ تم تحديث ${updatedCount} مقال`);
console.log('✅ تمت إضافة published_at و stats لجميع المقالات بنجاح!'); 