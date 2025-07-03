const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

// دالة بسيطة لاختبار الصور
function testImageUrl(url) {
  if (!url) return 'لا توجد صورة';
  if (url.startsWith('blob:') || url.startsWith('data:')) return 'صورة محلية';
  if (url.includes('res.cloudinary.com')) return 'صورة Cloudinary';
  if (url.includes('images.unsplash.com')) return 'صورة Unsplash';
  return 'صورة خارجية';
}

async function testImages() {
  try {
    console.log('🔍 اختبار عرض الصور في المقالات...\n');
    
    // جلب المقالات المنشورة مع الصور
    const articles = await prisma.article.findMany({
      where: {
        status: 'published',
        featuredImage: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        featuredImage: true,
        categoryId: true
      },
      take: 5
    });
    
    console.log(`✅ تم العثور على ${articles.length} مقال منشور مع صور:\n`);
    
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   الصورة: ${article.featuredImage}`);
      console.log(`   نوع الصورة: ${testImageUrl(article.featuredImage)}`);
      console.log(`   معرف التصنيف: ${article.categoryId}`);
      console.log('');
    });
    
    // اختبار الوصول للصور
    console.log('🌐 اختبار الوصول للصور...\n');
    
    for (const article of articles) {
      try {
        const response = await fetch(article.featuredImage, { method: 'HEAD' });
        console.log(`${article.title}: ${response.ok ? '✅ متاحة' : '❌ غير متاحة'} (${response.status})`);
      } catch (error) {
        console.log(`${article.title}: ❌ خطأ في الوصول (${error.message})`);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار الصور:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImages(); 