#!/usr/bin/env node

/**
 * سكريپت إضافة كلمات مفتاحية عينة للمقالات
 * لاختبار ميزة تحميل الكلمات المفتاحية في صفحة التعديل
 */

const fs = require('fs').promises;
const path = require('path');

const ARTICLES_FILE = path.join(process.cwd(), 'data', 'articles.json');

// كلمات مفتاحية عينة حسب التصنيف
const SAMPLE_KEYWORDS = {
  sport: ['رياضة', 'كرة قدم', 'الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'دوري', 'مباراة'],
  economy: ['اقتصاد', 'استثمار', 'صندوق', 'تمويل', 'أسهم', 'تداول', 'رؤية 2030', 'نيوم'],
  politics: ['سياسة', 'حكومة', 'وزير', 'قرار', 'مجلس', 'أمير', 'ملك', 'دبلوماسية'],
  technology: ['تقنية', 'ذكاء اصطناعي', 'تطبيق', 'موقع', 'برمجة', 'إنترنت', 'هاتف', 'كمبيوتر'],
  general: ['السعودية', 'الرياض', 'جدة', 'مكة', 'أخبار', 'جديد', 'مهم', 'عاجل']
};

function getRandomKeywords(category = 'general', count = 3) {
  const keywords = SAMPLE_KEYWORDS[category] || SAMPLE_KEYWORDS.general;
  const shuffled = [...keywords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function categorizeArticle(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('رياض') || text.includes('كرة') || text.includes('مباراة') || text.includes('هلال') || text.includes('نصر')) {
    return 'sport';
  } else if (text.includes('اقتصاد') || text.includes('استثمار') || text.includes('صندوق') || text.includes('تمويل')) {
    return 'economy';
  } else if (text.includes('حكومة') || text.includes('وزير') || text.includes('سياسة') || text.includes('قرار')) {
    return 'politics';
  } else if (text.includes('تقنية') || text.includes('ذكاء') || text.includes('تطبيق') || text.includes('موقع')) {
    return 'technology';
  }
  
  return 'general';
}

async function addSampleKeywords() {
  console.log('\n🏷️  إضافة كلمات مفتاحية عينة للمقالات');
  console.log('=' .repeat(50));

  try {
    // قراءة ملف المقالات
    const articlesData = await fs.readFile(ARTICLES_FILE, 'utf-8');
    const articles = JSON.parse(articlesData);
    
    if (!articles.articles || !Array.isArray(articles.articles)) {
      throw new Error('بنية ملف المقالات غير صحيحة');
    }

    let updatedCount = 0;
    let skippedCount = 0;

    // معالجة كل مقال
    articles.articles.forEach((article, index) => {
      if (article.is_deleted) return;

      // تحقق من وجود كلمات مفتاحية
      const hasKeywords = (
        (article.seo_keywords && Array.isArray(article.seo_keywords) && article.seo_keywords.length > 0) ||
        (article.keywords && Array.isArray(article.keywords) && article.keywords.length > 0) ||
        (article.tags && Array.isArray(article.tags) && article.tags.length > 0)
      );

      if (hasKeywords) {
        console.log(`⏭️  تجاهل المقال "${article.title?.substring(0, 40)}..." - يحتوي على كلمات مفتاحية بالفعل`);
        skippedCount++;
        return;
      }

      // تصنيف المقال وإضافة كلمات مفتاحية مناسبة
      const category = categorizeArticle(article.title || '', article.content || '');
      const keywords = getRandomKeywords(category, 4);

      // إضافة الكلمات المفتاحية
      article.seo_keywords = keywords;
      
      // إضافة كلمات عامة إضافية
      if (!keywords.includes('السعودية')) {
        article.seo_keywords.push('السعودية');
      }

      console.log(`✅ تم تحديث المقال "${article.title?.substring(0, 40)}..."`);
      console.log(`   📂 التصنيف: ${category}`);
      console.log(`   🏷️  الكلمات المفتاحية: [${article.seo_keywords.join(', ')}]`);
      
      updatedCount++;
    });

    // حفظ التحديثات
    await fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf-8');

    console.log('\n📊 ملخص العملية:');
    console.log(`   ✅ تم تحديث ${updatedCount} مقال`);
    console.log(`   ⏭️  تم تجاهل ${skippedCount} مقال (يحتوي على كلمات مفتاحية)`);
    console.log(`   💾 تم حفظ التحديثات في ${ARTICLES_FILE}`);

    // اختبار سريع
    if (updatedCount > 0) {
      console.log('\n🧪 اختبار سريع:');
      const testArticle = articles.articles.find(a => !a.is_deleted && a.seo_keywords && a.seo_keywords.length > 0);
      if (testArticle) {
        console.log(`   📄 مقال الاختبار: ${testArticle.title?.substring(0, 50)}...`);
        console.log(`   🆔 ID: ${testArticle.id}`);
        console.log(`   🏷️  الكلمات: [${testArticle.seo_keywords.join(', ')}]`);
        console.log(`   🔗 رابط التعديل: http://localhost:3000/dashboard/article/edit/${testArticle.id}`);
      }
    }

    console.log('\n✅ تمت العملية بنجاح!');
    console.log('💡 يمكنك الآن اختبار تحميل الكلمات المفتاحية في صفحة التعديل');

  } catch (error) {
    console.error('\n❌ خطأ في العملية:', error.message);
    process.exit(1);
  }
}

// تشغيل السكريپت
addSampleKeywords().catch(console.error); 