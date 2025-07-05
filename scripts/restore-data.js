const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreData() {
  try {
    console.log('🔄 بدء استعادة البيانات...');

    // استعادة التصنيفات
    console.log('📂 استعادة التصنيفات...');
    const categoriesData = JSON.parse(fs.readFileSync('data/categories.json', 'utf8'));
    
    for (const category of categoriesData.categories) {
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

    // استعادة المقالات
    console.log('📰 استعادة المقالات...');
    const articlesData = JSON.parse(fs.readFileSync('data/articles_backup_20250623_161538.json', 'utf8'));
    
    for (const article of articlesData.articles) {
      try {
        // تحويل مسارات الصور المحلية إلى Cloudinary
        let featuredImage = article.featured_image;
        if (featuredImage && featuredImage.startsWith('/uploads/')) {
          // استخدام صورة افتراضية من Cloudinary
          featuredImage = 'https://res.cloudinary.com/dybhezmvb/image/upload/v1/sabq-cms/defaults/default-article.jpg';
        }

        await prisma.article.upsert({
          where: { id: article.id },
          update: {
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.summary,
            authorId: article.author_id,
            categoryId: article.category_id,
            status: article.status === 'deleted' ? 'draft' : article.status,
            featured: article.is_featured || false,
            breaking: article.is_breaking || false,
            featuredImage: featuredImage,
            publishedAt: article.published_at ? new Date(article.published_at) : null,
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
              is_deleted: article.is_deleted || false,
            },
          },
          create: {
            id: article.id,
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.summary,
            authorId: article.author_id,
            categoryId: article.category_id,
            status: article.status === 'deleted' ? 'draft' : article.status,
            featured: article.is_featured || false,
            breaking: article.is_breaking || false,
            featuredImage: featuredImage,
            publishedAt: article.published_at ? new Date(article.published_at) : null,
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
              is_deleted: article.is_deleted || false,
            },
          },
        });
        console.log(`✅ تم استعادة المقال: ${article.title}`);
      } catch (error) {
        console.error(`❌ خطأ في استعادة المقال ${article.title}:`, error.message);
      }
    }

    // استعادة التفاعلات
    console.log('❤️ استعادة التفاعلات...');
    const interactionsData = JSON.parse(fs.readFileSync('data/user_article_interactions.json', 'utf8'));
    
    for (const interaction of interactionsData.interactions) {
      try {
        await prisma.interaction.upsert({
          where: { 
            userId_articleId_type: {
              userId: interaction.user_id,
              articleId: interaction.article_id,
              type: interaction.type,
            }
          },
          update: {
            createdAt: new Date(interaction.created_at),
          },
          create: {
            userId: interaction.user_id,
            articleId: interaction.article_id,
            type: interaction.type,
            createdAt: new Date(interaction.created_at),
          },
        });
      } catch (error) {
        console.error(`❌ خطأ في استعادة التفاعل:`, error.message);
      }
    }

    // استعادة نقاط الولاء
    console.log('🏆 استعادة نقاط الولاء...');
    const loyaltyData = JSON.parse(fs.readFileSync('data/user_loyalty_points.json', 'utf8'));
    
    for (const loyalty of loyaltyData.loyalty_points) {
      try {
        await prisma.loyaltyPoint.upsert({
          where: { id: loyalty.id },
          update: {
            points: loyalty.points,
            action: loyalty.action,
            referenceId: loyalty.reference_id,
            referenceType: loyalty.reference_type,
            metadata: loyalty.metadata || {},
            createdAt: new Date(loyalty.created_at),
          },
          create: {
            id: loyalty.id,
            userId: loyalty.user_id,
            points: loyalty.points,
            action: loyalty.action,
            referenceId: loyalty.reference_id,
            referenceType: loyalty.reference_type,
            metadata: loyalty.metadata || {},
            createdAt: new Date(loyalty.created_at),
          },
        });
      } catch (error) {
        console.error(`❌ خطأ في استعادة نقاط الولاء:`, error.message);
      }
    }

    console.log('🎉 تم استعادة جميع البيانات بنجاح!');
    
    // عرض إحصائيات
    const categoriesCount = await prisma.category.count();
    const usersCount = await prisma.user.count();
    const articlesCount = await prisma.article.count();
    const interactionsCount = await prisma.interaction.count();
    const loyaltyCount = await prisma.loyaltyPoint.count();

    console.log('\n📊 إحصائيات قاعدة البيانات:');
    console.log(`- التصنيفات: ${categoriesCount}`);
    console.log(`- المستخدمين: ${usersCount}`);
    console.log(`- المقالات: ${articlesCount}`);
    console.log(`- التفاعلات: ${interactionsCount}`);
    console.log(`- نقاط الولاء: ${loyaltyCount}`);

  } catch (error) {
    console.error('❌ خطأ في استعادة البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData(); 