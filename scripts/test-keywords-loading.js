#!/usr/bin/env node

/**
 * سكريبت اختبار تحميل الكلمات المفتاحية في صفحة تعديل المقال
 * يتحقق من أن الكلمات المفتاحية تُحمّل بشكل صحيح من ملف البيانات
 */

const fs = require('fs').promises;
const path = require('path');

const ARTICLES_FILE = path.join(process.cwd(), 'data', 'articles.json');

async function testKeywordsLoading() {
  console.log('\n🧪 اختبار تحميل الكلمات المفتاحية في صفحة التعديل');
  console.log('=' .repeat(60));

  try {
    // قراءة ملف المقالات
    const articlesData = await fs.readFile(ARTICLES_FILE, 'utf-8');
    const articles = JSON.parse(articlesData);
    
    if (!articles.articles || !Array.isArray(articles.articles)) {
      throw new Error('بنية ملف المقالات غير صحيحة');
    }

    console.log(`✅ تم تحميل ${articles.articles.length} مقال من الملف`);

    // فحص المقالات وكلماتها المفتاحية
    let totalArticles = 0;
    let articlesWithKeywords = 0;
    let articlesWithSeoKeywords = 0;
    let articlesWithTags = 0;
    let articlesWithoutKeywords = 0;

    const keywordsReport = [];

    articles.articles.forEach((article, index) => {
      if (article.is_deleted) return; // تجاهل المقالات المحذوفة
      
      totalArticles++;
      const report = {
        id: article.id,
        title: article.title ? article.title.substring(0, 50) + '...' : 'بدون عنوان',
        keywords: article.keywords || null,
        seo_keywords: article.seo_keywords || null,
        tags: article.tags || null,
        hasKeywords: false,
        keywordSources: []
      };

      // فحص أنواع مختلفة من الكلمات المفتاحية
      if (article.keywords && Array.isArray(article.keywords) && article.keywords.length > 0) {
        articlesWithKeywords++;
        report.hasKeywords = true;
        report.keywordSources.push('keywords');
      }

      if (article.seo_keywords && Array.isArray(article.seo_keywords) && article.seo_keywords.length > 0) {
        articlesWithSeoKeywords++;
        report.hasKeywords = true;
        report.keywordSources.push('seo_keywords');
      }

      if (article.tags && Array.isArray(article.tags) && article.tags.length > 0) {
        articlesWithTags++;
        report.hasKeywords = true;
        report.keywordSources.push('tags');
      }

      if (!report.hasKeywords) {
        articlesWithoutKeywords++;
      }

      keywordsReport.push(report);
    });

    // عرض الإحصائيات
    console.log('\n📊 إحصائيات الكلمات المفتاحية:');
    console.log(`   📝 إجمالي المقالات: ${totalArticles}`);
    console.log(`   🏷️  مقالات بـ keywords: ${articlesWithKeywords}`);
    console.log(`   🔍 مقالات بـ seo_keywords: ${articlesWithSeoKeywords}`);
    console.log(`   🏷️  مقالات بـ tags: ${articlesWithTags}`);
    console.log(`   ❌ مقالات بدون كلمات مفتاحية: ${articlesWithoutKeywords}`);

    // عرض أمثلة من المقالات التي تحتوي على كلمات مفتاحية
    console.log('\n📋 أمثلة على المقالات مع الكلمات المفتاحية:');
    const samplesWithKeywords = keywordsReport.filter(r => r.hasKeywords).slice(0, 3);
    
    samplesWithKeywords.forEach((sample, index) => {
      console.log(`\n   ${index + 1}. ${sample.title}`);
      console.log(`      🆔 ID: ${sample.id}`);
      console.log(`      📂 مصادر الكلمات: ${sample.keywordSources.join(', ')}`);
      
      if (sample.keywords) {
        console.log(`      🏷️  keywords: [${sample.keywords.join(', ')}]`);
      }
      if (sample.seo_keywords) {
        console.log(`      🔍 seo_keywords: [${sample.seo_keywords.join(', ')}]`);
      }
      if (sample.tags) {
        console.log(`      🏷️  tags: [${sample.tags.join(', ')}]`);
      }
    });

    // اختبار تحميل مقال محدد
    console.log('\n🧪 اختبار تحميل مقال محدد:');
    const testArticle = keywordsReport.find(r => r.hasKeywords);
    
    if (testArticle) {
      console.log(`   📄 اختبار المقال: ${testArticle.title}`);
      console.log(`   🆔 ID: ${testArticle.id}`);
      
      // محاكاة منطق التحميل من صفحة التعديل
      const articleData = articles.articles.find(a => a.id === testArticle.id);
      const keywordsData = articleData.seo_keywords || articleData.keywords || articleData.tags || [];
      
      let loadedKeywords = [];
      if (Array.isArray(keywordsData)) {
        loadedKeywords = keywordsData.filter(k => k && typeof k === 'string' && k.trim());
      } else if (typeof keywordsData === 'string' && keywordsData.trim()) {
        loadedKeywords = keywordsData.split(',').map(k => k.trim()).filter(k => k);
      }
      
      console.log(`   ✅ تم تحميل ${loadedKeywords.length} كلمة مفتاحية: [${loadedKeywords.join(', ')}]`);
      
      // اختبار URL صفحة التعديل
      const editUrl = `http://localhost:3000/dashboard/article/edit/${testArticle.id}`;
      console.log(`   🔗 رابط صفحة التعديل: ${editUrl}`);
    } else {
      console.log('   ⚠️  لم يتم العثور على مقالات تحتوي على كلمات مفتاحية للاختبار');
    }

    // تقرير المشاكل المحتملة
    console.log('\n⚠️  تحليل المشاكل المحتملة:');
    
    if (articlesWithoutKeywords > 0) {
      console.log(`   📝 ${articlesWithoutKeywords} مقال بدون كلمات مفتاحية`);
    }
    
    // فحص أنواع البيانات غير المتوقعة
    const problematicArticles = keywordsReport.filter(r => {
      const article = articles.articles.find(a => a.id === r.id);
      return (
        (article.keywords && !Array.isArray(article.keywords)) ||
        (article.seo_keywords && !Array.isArray(article.seo_keywords)) ||
        (article.tags && !Array.isArray(article.tags))
      );
    });

    if (problematicArticles.length > 0) {
      console.log(`   ⚠️  ${problematicArticles.length} مقال بأنواع بيانات غير متوقعة للكلمات المفتاحية`);
      problematicArticles.slice(0, 2).forEach(p => {
        const article = articles.articles.find(a => a.id === p.id);
        console.log(`      - ${p.title}`);
        if (article.keywords && !Array.isArray(article.keywords)) {
          console.log(`        keywords نوع: ${typeof article.keywords}, قيمة: ${article.keywords}`);
        }
        if (article.seo_keywords && !Array.isArray(article.seo_keywords)) {
          console.log(`        seo_keywords نوع: ${typeof article.seo_keywords}, قيمة: ${article.seo_keywords}`);
        }
      });
    }

    // خلاصة النتائج
    console.log('\n🎯 خلاصة النتائج:');
    
    if (articlesWithKeywords > 0 || articlesWithSeoKeywords > 0 || articlesWithTags > 0) {
      console.log('   ✅ الكلمات المفتاحية موجودة في البيانات');
      console.log('   ✅ منطق التحميل في صفحة التعديل يجب أن يعمل بشكل صحيح');
      
      if (problematicArticles.length === 0) {
        console.log('   ✅ جميع أنواع البيانات متوافقة');
      } else {
        console.log('   ⚠️  بعض المقالات تحتاج تصحيح أنواع البيانات');
      }
    } else {
      console.log('   ❌ لا توجد كلمات مفتاحية في أي مقال');
      console.log('   💡 يُنصح بإضافة كلمات مفتاحية للمقالات الموجودة');
    }

    console.log('\n✅ انتهى الاختبار بنجاح!');
    
  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error.message);
    process.exit(1);
  }
}

// تشغيل الاختبار
testKeywordsLoading().catch(console.error); 