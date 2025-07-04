#!/usr/bin/env node

/**
 * سكربت استعادة البيانات من النسخة الاحتياطية
 * يستعيد المقالات والتصنيفات من ملفات JSON المحلية
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

// التصنيفات الافتراضية
const defaultCategories = [
  { id: 'cat-1', name: 'محليات', slug: 'local', order: 1 },
  { id: 'cat-2', name: 'رياضة', slug: 'sports', order: 2 },
  { id: 'cat-3', name: 'اقتصاد', slug: 'economy', order: 3 },
  { id: 'cat-4', name: 'سياسة', slug: 'politics', order: 4 },
  { id: 'cat-5', name: 'ثقافة', slug: 'culture', order: 5 },
  { id: 'cat-6', name: 'تقنية', slug: 'technology', order: 6 },
  { id: 'cat-7', name: 'صحة', slug: 'health', order: 7 },
  { id: 'cat-8', name: 'تعليم', slug: 'education', order: 8 },
  { id: 'cat-9', name: 'ترفيه', slug: 'entertainment', order: 9 },
  { id: 'cat-10', name: 'دولي', slug: 'international', order: 10 }
];

async function restoreCategories() {
  log('\n📁 استعادة التصنيفات...', 'cyan');
  
  let created = 0;
  let updated = 0;
  
  for (const cat of defaultCategories) {
    try {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {
          name: cat.name,
          slug: cat.slug,
          displayOrder: cat.order,
          isActive: true
        },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          displayOrder: cat.order,
          isActive: true
        }
      });
      created++;
      log(`   ✅ ${cat.name}`, 'green');
    } catch (error) {
      log(`   ❌ خطأ في ${cat.name}: ${error.message}`, 'red');
    }
  }
  
  log(`📊 تم إنشاء/تحديث ${created} تصنيف`, 'blue');
}

async function restoreArticles() {
  log('\n📰 استعادة المقالات...', 'cyan');
  
  try {
    // قراءة أكبر ملف نسخة احتياطية
    const backupPath = path.join(__dirname, '..', 'data', 'articles_backup_20250623_161538.json');
    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
    
    if (!backupData.articles || !Array.isArray(backupData.articles)) {
      log('❌ لا توجد مقالات في النسخة الاحتياطية', 'red');
      return;
    }
    
    const articles = backupData.articles;
    log(`📋 تم العثور على ${articles.length} مقال في النسخة الاحتياطية`, 'yellow');
    
    let restored = 0;
    let skipped = 0;
    let errors = 0;
    
    // التأكد من وجود مستخدم افتراضي
    const defaultUser = await prisma.user.upsert({
      where: { id: 'system' },
      update: {},
      create: {
        id: 'system',
        email: 'system@sabq.org',
        name: 'النظام',
        role: 'ADMIN',
        isVerified: true,
        passwordHash: 'NO_LOGIN' // لا يمكن تسجيل الدخول بهذا الحساب
      }
    });
    
    for (const article of articles) {
      try {
        // تحويل categoryId من رقم إلى معرف نصي
        let categoryId = `cat-${article.category_id || 1}`;
        
        // التحقق من وجود التصنيف
        const categoryExists = await prisma.category.findUnique({
          where: { id: categoryId }
        });
        
        if (!categoryExists) {
          categoryId = 'cat-1'; // التصنيف الافتراضي
        }
        
        // التحقق من وجود المقال
        const existingArticle = await prisma.article.findFirst({
          where: {
            OR: [
              { title: article.title },
              { slug: article.slug }
            ]
          }
        });
        
        if (existingArticle) {
          skipped++;
          continue;
        }
        
        // إنشاء المقال
        await prisma.article.create({
          data: {
            title: article.title || 'مقال بدون عنوان',
            slug: article.slug || generateSlug(article.title || 'article'),
            content: article.content || '',
            excerpt: article.summary || article.excerpt || '',
            authorId: article.author_id || 'system',
            categoryId: categoryId,
            status: article.status || 'published',
            featuredImage: article.featured_image || null,
            breaking: article.is_breaking === true,
            featured: article.is_featured === true,
            views: article.views_count || article.views || 0,
            readingTime: article.reading_time || calculateReadingTime(article.content),
            seoTitle: article.seo_title || article.title,
            seoDescription: article.seo_description || article.summary || '',
            seoKeywords: article.seo_keywords ? 
              (Array.isArray(article.seo_keywords) ? article.seo_keywords.join(',') : article.seo_keywords) : '',
            publishedAt: article.published_at ? new Date(article.published_at) : new Date(),
            createdAt: article.created_at ? new Date(article.created_at) : new Date(),
            updatedAt: article.updated_at ? new Date(article.updated_at) : new Date(),
            metadata: article.metadata || {
              content_blocks: article.content_blocks || [],
              stats: article.stats || {},
              tags: article.tags || []
            }
          }
        });
        
        restored++;
        log(`   ✅ [${restored}] ${article.title.substring(0, 50)}...`, 'green');
        
      } catch (error) {
        errors++;
        log(`   ❌ خطأ: ${error.message}`, 'red');
        if (error.message.includes('authorId')) {
          log(`      معرف المؤلف: ${article.author_id}`, 'yellow');
        }
      }
    }
    
    log(`\n📊 النتائج:`, 'blue');
    log(`   ✅ تم استعادة: ${restored} مقال`, 'green');
    log(`   ⏭️  تم تخطي: ${skipped} مقال موجود`, 'yellow');
    log(`   ❌ أخطاء: ${errors}`, 'red');
    
  } catch (error) {
    log(`❌ خطأ في قراءة النسخة الاحتياطية: ${error.message}`, 'red');
  }
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
    .trim();
}

function calculateReadingTime(content) {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

async function main() {
  log('\n🚀 بدء استعادة البيانات من النسخة الاحتياطية', 'bright');
  log('=' .repeat(60), 'cyan');
  
  try {
    await prisma.$connect();
    log('✅ تم الاتصال بقاعدة بيانات PlanetScale', 'green');
    
    // عرض الوضع الحالي
    const currentArticles = await prisma.article.count();
    const currentCategories = await prisma.category.count();
    
    log(`\n📊 الوضع الحالي:`, 'yellow');
    log(`   - المقالات: ${currentArticles}`, 'yellow');
    log(`   - التصنيفات: ${currentCategories}`, 'yellow');
    
    // استعادة البيانات
    await restoreCategories();
    await restoreArticles();
    
    // عرض الوضع النهائي
    const finalArticles = await prisma.article.count();
    const finalCategories = await prisma.category.count();
    
    log(`\n📊 الوضع النهائي:`, 'green');
    log(`   - المقالات: ${finalArticles}`, 'green');
    log(`   - التصنيفات: ${finalCategories}`, 'green');
    
    log('\n' + '=' .repeat(60), 'cyan');
    log('🎉 تمت استعادة البيانات بنجاح!', 'bright');
    log('💡 يمكنك الآن تشغيل المشروع وستجد المقالات المستعادة', 'cyan');
    
  } catch (error) {
    log(`\n❌ خطأ عام: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكربت
main().catch(console.error); 