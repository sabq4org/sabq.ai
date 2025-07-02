const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function regenerateArticlesJson() {
  try {
    console.log('🔄 جلب المقالات من قاعدة البيانات...');
    
    // جلب جميع المقالات المنشورة
    const articles = await prisma.articles.findMany({
      where: {
        status: {
          not: 'draft'
        }
      },
      include: {
        category: true,
        author: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log(`✅ تم جلب ${articles.length} مقالة`);
    
    // تحويل البيانات إلى التنسيق المطلوب
    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      author_id: article.author_id,
      category_id: article.category_id,
      status: article.status,
      featured_image: article.featured_image,
      seo_title: article.seo_title,
      seo_description: article.seo_description,
      is_breaking: article.breaking,
      is_featured: article.featured,
      is_pinned: false,
      publish_at: article.published_at,
      published_at: article.published_at,
      views_count: article.views || 0,
      reading_time: article.reading_time || 1,
      content_blocks: [
        {
          id: `default_block_0`,
          type: "paragraph",
          data: {
            paragraph: {
              text: article.content
            }
          },
          order: 0
        }
      ],
      created_at: article.created_at,
      updated_at: article.updated_at,
      is_deleted: false,
      author: article.author?.name || 'محرر',
      stats: {
        views: article.views || 0,
        likes: 0,
        shares: 0,
        comments: 0,
        saves: 0,
        read_time_avg: 0
      },
      featured_image_alt: article.featured_image ? `صورة تعبيرية للمقال: ${article.title}` : "",
      seo_keywords: article.seo_keywords ? 
        (Array.isArray(article.seo_keywords) ? article.seo_keywords : [article.seo_keywords]) : 
        [],
      author_name: article.author?.name || 'محرر',
      author_avatar: article.author?.avatar || null,
      category_name: article.category?.name_ar || article.category?.name || 'عام'
    }));
    
    // إنشاء كائن JSON
    const jsonData = {
      articles: formattedArticles,
      total: formattedArticles.length,
      generated_at: new Date().toISOString()
    };
    
    // حفظ الملف
    const filePath = path.join(__dirname, '..', 'data', 'articles.json');
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    
    console.log('✅ تم إنشاء ملف articles.json جديد');
    console.log(`📊 إحصائيات: ${formattedArticles.length} مقالة`);
    
    // التحقق من صحة JSON
    try {
      JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log('✅ JSON صحيح');
    } catch (error) {
      console.error('❌ خطأ في JSON:', error.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ في إعادة توليد الملف:', error);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateArticlesJson(); 