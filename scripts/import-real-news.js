#!/usr/bin/env node

/**
 * سكربت استيراد الأخبار الحقيقية إلى PlanetScale
 * مع إصلاح مشكلة تحويل categoryId من رقم إلى نص
 */

require('dotenv').config();
const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// ألوان للـ console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// خريطة التصنيفات - تحويل من رقم إلى معرف نصي
const categoryMapping = {
  1: 'cat-1', // محليات
  2: 'cat-2', // رياضة  
  3: 'cat-3', // اقتصاد
  4: 'cat-4', // سياسة
  5: 'cat-5', // ثقافة
  6: 'cat-6', // تقنية
  7: 'cat-7', // صحة
  8: 'cat-8', // تعليم
  9: 'cat-9', // ترفيه
  10: 'cat-10' // دولي
};

async function importRealArticles() {
  log('\n📥 بدء استيراد الأخبار الحقيقية...', 'cyan');
  
  try {
    // قراءة ملف الأخبار الحقيقية
    const articlesPath = path.join(__dirname, '..', '..', 'sabq-ai-cms', 'data', 'articles_backup.json');
    const articlesData = JSON.parse(await fs.readFile(articlesPath, 'utf8'));
    
    if (!articlesData || !articlesData.articles) {
      log('❌ لا توجد أخبار في الملف', 'red');
      return;
    }

    const articles = articlesData.articles;
    log(`📋 تم العثور على ${articles.length} خبر`, 'yellow');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        // تخطي المقالات التجريبية
        if (article.title.includes('تجريبي') || article.title.includes('اختبار') || 
            article.title.includes('Test') || article.title.includes('Demo')) {
          continue;
        }

        // التحقق من وجود المقال
        const existing = await prisma.article.findFirst({
          where: { 
            OR: [
              { title: article.title },
              { slug: article.slug }
            ]
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // تحويل categoryId من رقم إلى نص
        let categoryId = article.category_id;
        if (typeof categoryId === 'number') {
          categoryId = categoryMapping[categoryId] || 'cat-1';
        } else if (!categoryId) {
          categoryId = 'cat-1';
        }

        // إنشاء المقال
        await prisma.article.create({
          data: {
            title: article.title,
            slug: article.slug || generateSlug(article.title),
            content: article.content || '',
            excerpt: article.summary || article.excerpt || '',
            authorId: 'system', // معرف افتراضي للنظام
            categoryId: categoryId,
            status: article.status || 'published',
            featuredImage: article.featured_image || null,
            breaking: article.is_breaking === true,
            featured: article.is_featured === true,
            views: article.views_count || 0,
            readingTime: article.reading_time || calculateReadingTime(article.content),
            seoTitle: article.seo_title || article.title,
            seoDescription: article.seo_description || article.summary || '',
            seoKeywords: Array.isArray(article.seo_keywords) ? article.seo_keywords.join(',') : '',
            publishedAt: article.published_at ? new Date(article.published_at) : new Date(),
            createdAt: new Date(article.created_at || Date.now()),
            updatedAt: new Date(article.updated_at || article.created_at || Date.now()),
            metadata: {
              content_blocks: article.content_blocks || [],
              stats: article.stats || {},
              tags: article.tags || []
            }
          }
        });
        
        imported++;
        log(`✅ [${imported}] تم استيراد: ${article.title}`, 'green');
        
      } catch (error) {
        errors++;
        log(`❌ خطأ في استيراد "${article.title}": ${error.message}`, 'red');
      }
    }

    log(`\n📊 النتائج النهائية:`, 'blue');
    log(`   ✅ تم استيراد: ${imported} خبر`, 'green');
    log(`   ⏭️  تم تخطي: ${skipped} خبر موجود`, 'yellow');
    log(`   ❌ أخطاء: ${errors}`, 'red');

  } catch (error) {
    log(`❌ خطأ عام: ${error.message}`, 'red');
    console.error(error);
  }
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function calculateReadingTime(content) {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

async function main() {
  log('\n🚀 بدء استيراد الأخبار الحقيقية إلى PlanetScale', 'bright');
  log('=' .repeat(60), 'cyan');

  try {
    await prisma.$connect();
    log('✅ تم الاتصال بقاعدة بيانات PlanetScale', 'green');

    // أولاً: التأكد من وجود التصنيفات
    log('\n📂 إنشاء التصنيفات الافتراضية...', 'cyan');
    const categories = [
      { id: 'cat-1', name: 'محليات', slug: 'local' },
      { id: 'cat-2', name: 'رياضة', slug: 'sports' },
      { id: 'cat-3', name: 'اقتصاد', slug: 'economy' },
      { id: 'cat-4', name: 'سياسة', slug: 'politics' },
      { id: 'cat-5', name: 'ثقافة', slug: 'culture' },
      { id: 'cat-6', name: 'تقنية', slug: 'technology' },
      { id: 'cat-7', name: 'صحة', slug: 'health' },
      { id: 'cat-8', name: 'تعليم', slug: 'education' },
      { id: 'cat-9', name: 'ترفيه', slug: 'entertainment' },
      { id: 'cat-10', name: 'دولي', slug: 'international' }
    ];

    for (const cat of categories) {
      try {
        await prisma.category.upsert({
          where: { id: cat.id },
          update: { name: cat.name },
          create: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            isActive: true
          }
        });
        log(`   ✅ تصنيف: ${cat.name}`, 'green');
      } catch (e) {
        // تجاهل أخطاء التصنيفات الموجودة
      }
    }

    // ثانياً: إنشاء مستخدم النظام
    try {
      await prisma.user.upsert({
        where: { id: 'system' },
        update: {},
        create: {
          id: 'system',
          email: 'system@sabq.org',
          name: 'النظام',
          role: 'SYSTEM',
          isVerified: true
        }
      });
      log('\n👤 تم إنشاء مستخدم النظام', 'green');
    } catch (e) {
      // تجاهل إذا كان موجوداً
    }

    // ثالثاً: استيراد الأخبار
    await importRealArticles();

    log('\n' + '=' .repeat(60), 'cyan');
    log('🎉 تم الانتهاء من الاستيراد!', 'bright');

  } catch (error) {
    log(`\n❌ خطأ: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 