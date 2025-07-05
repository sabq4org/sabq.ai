const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreBasicData() {
  try {
    console.log('🔄 بدء استعادة البيانات الأساسية...');

    // استعادة التصنيفات
    console.log('📂 استعادة التصنيفات...');
    const categoriesData = JSON.parse(fs.readFileSync('data/categories.json', 'utf8'));
    // بناء خريطة بين أرقام التصنيفات (index أو رقم) ومعرّف التصنيف (uuid)
    const categoryMap = {};
    let idx = 1;
    for (const category of categoriesData.categories) {
      // ربط الرقم بالمعرّف
      categoryMap[idx] = category.id;
      idx++;
      try {
        await prisma.category.upsert({
          where: { id: category.id },
          update: {
            name: category.name,
            slug: category.slug,
            description: category.description,
            displayOrder: category.display_order || 0,
            isActive: category.is_active !== false,
            color: category.color,
            icon: category.icon,
            metadata: category.metadata || {},
            nameEn: category.name_en,
            parentId: category.parent_id,
          },
          create: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            displayOrder: category.display_order || 0,
            isActive: category.is_active !== false,
            color: category.color,
            icon: category.icon,
            metadata: category.metadata || {},
            nameEn: category.name_en,
            parentId: category.parent_id,
          },
        });
        console.log(`✅ تم استعادة التصنيف: ${category.name}`);
      } catch (error) {
        console.error(`❌ خطأ في استعادة التصنيف ${category.name}:`, error.message);
      }
    }

    // استعادة المستخدمين
    console.log('👥 استعادة المستخدمين...');
    const usersData = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
    
    for (const user of usersData.users) {
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role || 'user',
            isAdmin: user.is_admin || false,
            isVerified: user.is_verified || false,
            verificationToken: user.verification_token,
            resetToken: user.reset_token,
            resetTokenExpiry: user.reset_token_expiry ? new Date(user.reset_token_expiry) : null,
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role || 'user',
            isAdmin: user.is_admin || false,
            isVerified: user.is_verified || false,
            verificationToken: user.verification_token,
            resetToken: user.reset_token,
            resetTokenExpiry: user.reset_token_expiry ? new Date(user.reset_token_expiry) : null,
            passwordHash: user.password_hash || 'temp_hash',
          },
        });
        console.log(`✅ تم استعادة المستخدم: ${user.name}`);
      } catch (error) {
        console.error(`❌ خطأ في استعادة المستخدم ${user.name}:`, error.message);
      }
    }

    // استعادة المقالات (فقط المنشورة)
    console.log('📰 استعادة المقالات المنشورة...');
    const articlesData = JSON.parse(fs.readFileSync('data/articles_backup_20250623_161538.json', 'utf8'));
    
    let restoredCount = 0;
    for (const article of articlesData.articles) {
      try {
        // استعادة المقالات المنشورة فقط
        if (article.status === 'published' && !article.is_deleted) {
          // تحويل مسارات الصور المحلية إلى Cloudinary
          let featuredImage = article.featured_image;
          if (featuredImage && featuredImage.startsWith('/uploads/')) {
            featuredImage = 'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/defaults/default-article.jpg';
          }
          // تحويل categoryId الرقمي إلى uuid
          let categoryId = null;
          if (typeof article.category_id === 'number') {
            categoryId = categoryMap[article.category_id] || null;
          } else if (typeof article.category_id === 'string') {
            categoryId = article.category_id;
          }

          await prisma.article.upsert({
            where: { id: article.id },
            update: {
              title: article.title,
              slug: article.slug,
              content: article.content,
              excerpt: article.summary,
              authorId: article.author_id,
              categoryId: categoryId,
              status: 'published',
              featured: article.is_featured || false,
              breaking: article.is_breaking || false,
              featuredImage: featuredImage,
              publishedAt: article.published_at ? new Date(article.published_at) : new Date(),
              scheduledFor: article.publish_at ? new Date(article.publish_at) : null,
              views: article.views_count || 0,
              readingTime: article.reading_time || 1,
              seoTitle: article.seo_title,
              seoDescription: article.seo_description,
              seoKeywords: article.seo_keywords,
              allowComments: true,
              metadata: {
                content_blocks: article.content_blocks || [],
                stats: article.stats || {},
                is_deleted: false,
              },
            },
            create: {
              id: article.id,
              title: article.title,
              slug: article.slug,
              content: article.content,
              excerpt: article.summary,
              authorId: article.author_id,
              categoryId: categoryId,
              status: 'published',
              featured: article.is_featured || false,
              breaking: article.is_breaking || false,
              featuredImage: featuredImage,
              publishedAt: article.published_at ? new Date(article.published_at) : new Date(),
              scheduledFor: article.publish_at ? new Date(article.publish_at) : null,
              views: article.views_count || 0,
              readingTime: article.reading_time || 1,
              seoTitle: article.seo_title,
              seoDescription: article.seo_description,
              seoKeywords: article.seo_keywords,
              allowComments: true,
              metadata: {
                content_blocks: article.content_blocks || [],
                stats: article.stats || {},
                is_deleted: false,
              },
            },
          });
          console.log(`✅ تم استعادة المقال: ${article.title}`);
          restoredCount++;
        }
      } catch (error) {
        console.error(`❌ خطأ في استعادة المقال ${article.title}:`, error.message);
      }
    }

    console.log(`🎉 تم استعادة ${restoredCount} مقال منشور بنجاح!`);
    
    // عرض إحصائيات
    const categoriesCount = await prisma.category.count();
    const usersCount = await prisma.user.count();
    const articlesCount = await prisma.article.count();

    console.log('\n📊 إحصائيات قاعدة البيانات:');
    console.log(`- التصنيفات: ${categoriesCount}`);
    console.log(`- المستخدمين: ${usersCount}`);
    console.log(`- المقالات: ${articlesCount}`);

  } catch (error) {
    console.error('❌ خطأ في استعادة البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreBasicData(); 