const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function checkArticlesWithoutAuthor() {
  try {
    // التحقق من المقالات بدون مؤلف
    const articlesWithoutAuthor = await prisma.article.findMany({
      where: {
        authorId: null
      },
      select: {
        id: true,
        title: true,
        authorId: true,
        createdAt: true
      }
    });

    console.log(`عدد المقالات بدون مؤلف: ${articlesWithoutAuthor.length}`);
    
    if (articlesWithoutAuthor.length > 0) {
      console.log('المقالات بدون مؤلف:');
      articlesWithoutAuthor.forEach(article => {
        console.log(`- ${article.title} (ID: ${article.id})`);
      });
    }

    // التحقق من إجمالي المقالات
    const totalArticles = await prisma.article.count();
    console.log(`\nإجمالي المقالات: ${totalArticles}`);

  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticlesWithoutAuthor(); 