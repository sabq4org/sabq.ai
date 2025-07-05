const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreArticles() {
  try {
    console.log('🔄 بدء استعادة المقالات من النسخة الاحتياطية...');
    
    // قراءة ملف النسخة الاحتياطية
    const backupPath = path.join(__dirname, '../data/articles_backup_20250623_161538.json');
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // فلترة المقالات المنشورة فقط
    const publishedArticles = backupData.articles.filter(article => 
      article.status === 'published' && !article.is_deleted
    );
    
    console.log(`📊 تم العثور على ${publishedArticles.length} مقال منشور`);
    
    // إنشاء مستخدم افتراضي إذا لم يكن موجوداً
    const defaultUser = await prisma.user.upsert({
      where: { email: 'admin@sabq.org' },
      update: {},
      create: {
        email: 'admin@sabq.org',
        name: 'علي عبده',
        role: 'admin',
        isAdmin: true,
        isVerified: true,
        passwordHash: 'temp_hash' // يجب تغييرها لاحقاً
      }
    });
    
    console.log('👤 تم التحقق من وجود المستخدم الافتراضي');
    
    // إنشاء التصنيفات إذا لم تكن موجودة
    const categories = [
      { id: '1', name: 'أخبار', slug: 'news' },
      { id: '2', name: 'رياضة', slug: 'sports' },
      { id: '3', name: 'اقتصاد', slug: 'economy' },
      { id: '4', name: 'ثقافة', slug: 'culture' },
      { id: '5', name: 'سياحة', slug: 'tourism' }
    ];
    
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          name: cat.name,
          slug: cat.slug,
          isActive: true
        }
      });
    }
    
    console.log('📁 تم التحقق من وجود التصنيفات');
    
    // استعادة المقالات
    let restoredCount = 0;
    
    for (const article of publishedArticles) {
      try {
        // الحصول على معرف التصنيف
        const categorySlug = article.category_id === 2 ? 'sports' : 
                           article.category_id === 5 ? 'tourism' : 'news';
        
        const category = await prisma.category.findUnique({
          where: { slug: categorySlug }
        });
        
        if (!category) {
          console.log(`⚠️ لم يتم العثور على التصنيف للمقال: ${article.title}`);
          continue;
        }
        
        // إنشاء المقال
        await prisma.article.create({
          data: {
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.summary || article.content.substring(0, 200) + '...',
            authorId: defaultUser.id,
            categoryId: category.id,
            status: 'published',
            featured: article.is_featured || false,
            breaking: article.is_breaking || false,
            featuredImage: article.featured_image?.startsWith('http') ? article.featured_image : null,
            publishedAt: new Date(article.publish_at || article.created_at),
            views: article.views_count || 0,
            readingTime: article.reading_time || Math.ceil(article.content.split(' ').length / 200),
            seoTitle: article.seo_title,
            seoDescription: article.seo_description || article.summary,
            allowComments: true,
            metadata: {
              original_id: article.id,
              restored_at: new Date().toISOString()
            }
          }
        });
        
        restoredCount++;
        console.log(`✅ تم استعادة: ${article.title}`);
        
      } catch (error) {
        console.error(`❌ خطأ في استعادة المقال "${article.title}":`, error.message);
      }
    }
    
    console.log(`\n🎉 تمت استعادة ${restoredCount} مقال بنجاح!`);
    
  } catch (error) {
    console.error('❌ خطأ في عملية الاستعادة:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الاستعادة
restoreArticles(); 