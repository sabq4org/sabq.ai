const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs');

const prisma = new PrismaClient();

// تعريف التصنيفات الصحيحة
const categories = [
  {
    id: 'category-tech',
    name: 'تقنية',
    slug: 'technology',
    description: 'أخبار وتطورات التقنية والذكاء الاصطناعي',
    displayOrder: 1,
    isActive: true,
    color: '#8B5CF6',
    icon: '💻',
    nameEn: 'Technology'
  },
  {
    id: 'category-sports',
    name: 'رياضة',
    slug: 'sports',
    description: 'أخبار رياضية محلية وعالمية',
    displayOrder: 2,
    isActive: true,
    color: '#F59E0B',
    icon: '⚽',
    nameEn: 'Sports'
  },
  {
    id: 'category-economy',
    name: 'اقتصاد',
    slug: 'economy',
    description: 'تقارير السوق والمال والأعمال والطاقة',
    displayOrder: 3,
    isActive: true,
    color: '#10B981',
    icon: '💰',
    nameEn: 'Economy'
  },
  {
    id: 'category-politics',
    name: 'سياسة',
    slug: 'politics',
    description: 'مستجدات السياسة المحلية والدولية وتحليلاتها',
    displayOrder: 4,
    isActive: true,
    color: '#EF4444',
    icon: '🏛️',
    nameEn: 'Politics'
  },
  {
    id: 'category-local',
    name: 'محليات',
    slug: 'local',
    description: 'أخبار المناطق والمدن السعودية',
    displayOrder: 5,
    isActive: true,
    color: '#3B82F6',
    icon: '🗺️',
    nameEn: 'Local'
  },
  {
    id: 'category-culture',
    name: 'ثقافة ومجتمع',
    slug: 'culture',
    description: 'فعاليات ثقافية، مناسبات، قضايا اجتماعية',
    displayOrder: 6,
    isActive: true,
    color: '#EC4899',
    icon: '🎭',
    nameEn: 'Culture'
  },
  {
    id: 'category-opinion',
    name: 'مقالات رأي',
    slug: 'opinion',
    description: 'تحليلات ووجهات نظر كتاب الرأي',
    displayOrder: 7,
    isActive: true,
    color: '#7C3AED',
    icon: '✍️',
    nameEn: 'Opinion'
  },
  {
    id: 'category-misc',
    name: 'منوعات',
    slug: 'misc',
    description: 'أخبار خفيفة، لقطات، طرائف وأحداث غير تقليدية',
    displayOrder: 8,
    isActive: true,
    color: '#6B7280',
    icon: '🎉',
    nameEn: 'Misc'
  }
];

async function restoreCategoriesAndArticles() {
  try {
    console.log('🔄 بدء استعادة التصنيفات والمقالات...');

    // حذف التصنيفات الموجودة
    console.log('🗑️ حذف التصنيفات الموجودة...');
    await prisma.category.deleteMany({});

    // إضافة التصنيفات الجديدة
    console.log('📂 إضافة التصنيفات الجديدة...');
    for (const category of categories) {
      await prisma.category.create({
        data: category
      });
      console.log(`✅ تم إضافة التصنيف: ${category.name} (${category.slug})`);
    }

    // بناء خريطة الربط بين الرقم والـ uuid
    const categoryMap = {};
    categories.forEach((cat, index) => {
      categoryMap[index + 1] = cat.id; // 1 -> category-tech, 2 -> category-sports, etc.
    });

    console.log('🗺️ خريطة الربط:', categoryMap);

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
            console.log(`🔗 ربط المقال "${article.title}" بالتصنيف رقم ${article.category_id} -> ${categoryId}`);
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

restoreCategoriesAndArticles(); 