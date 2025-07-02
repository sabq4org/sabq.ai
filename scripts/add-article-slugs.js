const fs = require('fs');
const path = require('path');

// دالة تحويل النص العربي إلى slug
function generateSlug(text) {
  // إزالة التشكيل العربي
  const withoutDiacritics = text.replace(/[\u064B-\u065F\u0670]/g, '');
  
  // استبدال الأحرف الخاصة
  const replacements = {
    'أ': 'a', 'إ': 'e', 'آ': 'a', 'ا': 'a',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
    'ة': 'h', 'ء': 'a', 'ئ': 'e', 'ؤ': 'o',
    ' ': '-'
  };
  
  // تحويل الأحرف العربية
  let slug = withoutDiacritics.split('').map(char => 
    replacements[char] || char
  ).join('');
  
  // تنظيف النص
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // استبدال الأحرف غير المسموحة
    .replace(/-+/g, '-') // دمج الشرطات المتعددة
    .replace(/^-|-$/g, ''); // إزالة الشرطات من البداية والنهاية
  
  // قص الطول إذا كان طويلاً جداً
  if (slug.length > 60) {
    slug = slug.substring(0, 60).replace(/-[^-]*$/, '');
  }
  
  return slug || 'article';
}

// قراءة ملف المقالات
const articlesPath = path.join(__dirname, '..', 'data', 'articles.json');
const articlesData = fs.readFileSync(articlesPath, 'utf-8');
const data = JSON.parse(articlesData);
const articles = data.articles || data;

console.log(`📝 معالجة ${articles.length} مقال...`);

// إضافة slug لكل مقال
const slugMap = new Map();
let updatedCount = 0;

const updatedArticles = articles.map(article => {
  // إذا كان المقال له slug بالفعل، تخطيه
  if (article.slug) {
    console.log(`✅ المقال "${article.title.substring(0, 50)}..." له slug بالفعل: ${article.slug}`);
    return article;
  }
  
  // توليد slug من العنوان
  let baseSlug = generateSlug(article.title);
  let finalSlug = baseSlug;
  let counter = 1;
  
  // التأكد من عدم تكرار الـ slug
  while (slugMap.has(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  slugMap.set(finalSlug, true);
  updatedCount++;
  
  console.log(`🔄 إضافة slug للمقال: "${article.title.substring(0, 50)}..." => ${finalSlug}`);
  
  return {
    ...article,
    slug: finalSlug
  };
});

// حفظ الملف المحدث
const updatedData = {
  ...data,
  articles: updatedArticles
};

fs.writeFileSync(articlesPath, JSON.stringify(updatedData, null, 2), 'utf-8');

console.log(`
✨ تم الانتهاء!
📊 الإحصائيات:
   - إجمالي المقالات: ${articles.length}
   - مقالات محدثة: ${updatedCount}
   - مقالات لها slug مسبقاً: ${articles.length - updatedCount}
`);

// إنشاء تقرير بالـ slugs الجديدة
const reportPath = path.join(__dirname, '..', 'data', 'article-slugs-report.json');
const report = updatedArticles.map(article => ({
  id: article.id,
  title: article.title,
  slug: article.slug,
  url: `/article/${article.slug}`
}));

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`📄 تم حفظ تقرير الـ slugs في: ${reportPath}`); 