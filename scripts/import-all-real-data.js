#!/usr/bin/env node

/**
 * سكربت استيراد جميع البيانات الحقيقية إلى PlanetScale
 * يستورد: المستخدمين، التصنيفات، المقالات، التفاعلات، نقاط الولاء، وجميع البيانات الأخرى
 */

const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

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

// دالة لطباعة الرسائل الملونة
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// دالة لقراءة ملف JSON
async function readJSONFile(filename) {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log(`⚠️  تحذير: لم يتم العثور على ملف ${filename}`, 'yellow');
    return null;
  }
}

// 1. استيراد المستخدمين
async function importUsers() {
  log('\n📥 بدء استيراد المستخدمين...', 'cyan');
  
  const usersData = await readJSONFile('users.json');
  if (!usersData || !usersData.users) {
    log('❌ لا توجد بيانات مستخدمين للاستيراد', 'red');
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const user of usersData.users) {
    try {
      // التحقق من وجود المستخدم
      const existing = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // تشفير كلمة المرور إذا لم تكن مشفرة
      let hashedPassword = user.password;
      if (!user.password.startsWith('$2')) {
        hashedPassword = await bcrypt.hash(user.password, 10);
      }

      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password: hashedPassword,
          name: user.name,
          role: user.role || 'USER',
          avatar: user.avatar,
          bio: user.bio,
          isActive: user.is_active !== false,
          isVerified: user.is_verified === true,
          membershipTier: user.membership_tier || 'BRONZE',
          points: user.points || 0,
          createdAt: new Date(user.created_at || Date.now()),
          updatedAt: new Date(user.updated_at || Date.now())
        }
      });
      
      imported++;
      log(`✅ تم استيراد المستخدم: ${user.name} (${user.email})`, 'green');
    } catch (error) {
      log(`❌ خطأ في استيراد المستخدم ${user.email}: ${error.message}`, 'red');
    }
  }

  log(`📊 تم استيراد ${imported} مستخدم، تم تخطي ${skipped} مستخدم موجود`, 'blue');
}

// 2. استيراد التصنيفات
async function importCategories() {
  log('\n📥 بدء استيراد التصنيفات...', 'cyan');
  
  const categoriesData = await readJSONFile('categories.json');
  if (!categoriesData || !categoriesData.categories) {
    log('❌ لا توجد بيانات تصنيفات للاستيراد', 'red');
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const category of categoriesData.categories) {
    try {
      // التحقق من وجود التصنيف
      const existing = await prisma.category.findUnique({
        where: { id: category.id }
      });

      if (existing) {
        // تحديث التصنيف الموجود
        await prisma.category.update({
          where: { id: category.id },
          data: {
            name: category.name,
            nameEn: category.name_en,
            slug: category.slug,
            description: category.description,
            color: category.color,
            icon: category.icon,
            isActive: category.is_active !== false,
            order: category.order || 0
          }
        });
        log(`🔄 تم تحديث التصنيف: ${category.name}`, 'yellow');
        skipped++;
      } else {
        await prisma.category.create({
          data: {
            id: category.id,
            name: category.name,
            nameEn: category.name_en,
            slug: category.slug,
            description: category.description,
            color: category.color,
            icon: category.icon,
            isActive: category.is_active !== false,
            order: category.order || 0,
            createdAt: new Date(category.created_at || Date.now()),
            updatedAt: new Date(category.updated_at || Date.now())
          }
        });
        imported++;
        log(`✅ تم استيراد التصنيف: ${category.name}`, 'green');
      }
    } catch (error) {
      log(`❌ خطأ في استيراد التصنيف ${category.name}: ${error.message}`, 'red');
    }
  }

  log(`📊 تم استيراد ${imported} تصنيف جديد، تم تحديث ${skipped} تصنيف موجود`, 'blue');
}

// 3. استيراد المقالات الحقيقية
async function importArticles() {
  log('\n📥 بدء استيراد المقالات الحقيقية...', 'cyan');
  
  // قراءة ملفات المقالات المختلفة
  const articleFiles = ['articles_backup.json', 'articles.json', 'asir_articles.json'];
  let allArticles = [];

  for (const file of articleFiles) {
    const data = await readJSONFile(file);
    if (data && data.articles) {
      allArticles = allArticles.concat(data.articles);
    }
  }

  if (allArticles.length === 0) {
    log('❌ لا توجد مقالات للاستيراد', 'red');
    return;
  }

  // إزالة المقالات المكررة بناءً على العنوان
  const uniqueArticles = [];
  const seenTitles = new Set();
  
  for (const article of allArticles) {
    if (!seenTitles.has(article.title)) {
      seenTitles.add(article.title);
      uniqueArticles.push(article);
    }
  }

  log(`📋 تم العثور على ${uniqueArticles.length} مقال فريد من أصل ${allArticles.length}`, 'yellow');

  let imported = 0;
  let skipped = 0;

  for (const article of uniqueArticles) {
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

      // تحضير بيانات المقال
      const articleData = {
        title: article.title,
        slug: article.slug || generateSlug(article.title),
        content: article.content || '',
        excerpt: article.summary || article.excerpt || article.content?.substring(0, 200) || '',
        authorId: article.author_id || article.author || 'system',
        categoryId: article.category_id || '1',
        status: article.status || 'published',
        featuredImage: article.featured_image || null,
        featuredImageAlt: article.featured_image_alt || '',
        seoTitle: article.seo_title || article.title,
        seoDescription: article.seo_description || article.summary || '',
        seoKeywords: Array.isArray(article.seo_keywords) ? article.seo_keywords.join(',') : '',
        breaking: article.is_breaking === true,
        featured: article.is_featured === true,
        pinned: article.is_pinned === true,
        views: article.views_count || 0,
        readingTime: article.reading_time || calculateReadingTime(article.content),
        createdAt: new Date(article.created_at || Date.now()),
        updatedAt: new Date(article.updated_at || article.created_at || Date.now()),
        publishedAt: article.published_at ? new Date(article.published_at) : new Date()
      };

      // إضافة metadata إذا كانت موجودة
      if (article.content_blocks || article.stats || article.tags) {
        articleData.metadata = {
          content_blocks: article.content_blocks || [],
          stats: article.stats || {},
          tags: article.tags || []
        };
      }

      await prisma.article.create({ data: articleData });
      
      imported++;
      log(`✅ تم استيراد المقال: ${article.title}`, 'green');
    } catch (error) {
      log(`❌ خطأ في استيراد المقال "${article.title}": ${error.message}`, 'red');
    }
  }

  log(`📊 تم استيراد ${imported} مقال، تم تخطي ${skipped} مقال موجود`, 'blue');
}

// 4. استيراد التفاعلات
async function importInteractions() {
  log('\n📥 بدء استيراد التفاعلات...', 'cyan');
  
  const interactionsData = await readJSONFile('user_article_interactions.json');
  if (!interactionsData || !interactionsData.interactions) {
    log('⚠️  لا توجد بيانات تفاعلات للاستيراد', 'yellow');
    return;
  }

  let imported = 0;

  for (const interaction of interactionsData.interactions) {
    try {
      // التحقق من وجود المستخدم والمقال
      const user = await prisma.user.findUnique({ where: { id: interaction.user_id } });
      const article = await prisma.article.findUnique({ where: { id: interaction.article_id } });

      if (!user || !article) {
        continue;
      }

      // التحقق من وجود التفاعل
      const existing = await prisma.interaction.findFirst({
        where: {
          userId: interaction.user_id,
          articleId: interaction.article_id,
          type: interaction.interaction_type
        }
      });

      if (!existing) {
        await prisma.interaction.create({
          data: {
            userId: interaction.user_id,
            articleId: interaction.article_id,
            type: interaction.interaction_type,
            createdAt: new Date(interaction.timestamp)
          }
        });
        imported++;
      }
    } catch (error) {
      // تجاهل الأخطاء الصغيرة
    }
  }

  log(`📊 تم استيراد ${imported} تفاعل`, 'blue');
}

// 5. استيراد نقاط الولاء
async function importLoyaltyPoints() {
  log('\n📥 بدء استيراد نقاط الولاء...', 'cyan');
  
  const loyaltyData = await readJSONFile('user_loyalty_points.json');
  if (!loyaltyData || !loyaltyData.users) {
    log('⚠️  لا توجد بيانات نقاط ولاء للاستيراد', 'yellow');
    return;
  }

  let updated = 0;

  for (const userPoints of loyaltyData.users) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userPoints.user_id } });
      if (user) {
        await prisma.user.update({
          where: { id: userPoints.user_id },
          data: {
            points: userPoints.total_points,
            membershipTier: userPoints.tier || 'BRONZE'
          }
        });
        updated++;
      }
    } catch (error) {
      // تجاهل الأخطاء
    }
  }

  log(`📊 تم تحديث نقاط الولاء لـ ${updated} مستخدم`, 'blue');
}

// دالة مساعدة لتوليد slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// دالة مساعدة لحساب وقت القراءة
function calculateReadingTime(content) {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// الدالة الرئيسية
async function main() {
  log('\n🚀 بدء استيراد جميع البيانات الحقيقية إلى PlanetScale', 'bright');
  log('=' .repeat(60), 'cyan');

  try {
    // الاتصال بقاعدة البيانات
    await prisma.$connect();
    log('✅ تم الاتصال بقاعدة بيانات PlanetScale', 'green');

    // تنفيذ الاستيراد بالترتيب الصحيح
    await importUsers();
    await importCategories();
    await importArticles();
    await importInteractions();
    await importLoyaltyPoints();

    log('\n' + '=' .repeat(60), 'cyan');
    log('🎉 تم الانتهاء من استيراد جميع البيانات بنجاح!', 'bright');
    log('💡 يمكنك الآن التحقق من البيانات في لوحة تحكم PlanetScale', 'yellow');

  } catch (error) {
    log(`\n❌ خطأ عام: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكربت
main().catch(console.error); 