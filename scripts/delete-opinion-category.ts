import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteOpinionArticlesAndCategory() {
  // 1. جلب تصنيف "رأي"
  const opinionCategory = await prisma.categories.findFirst({
    where: {
      OR: [
        { slug: 'opinion' },
        { name: 'رأي' }
      ]
    }
  });

  if (!opinionCategory) {
    console.log('❌ تصنيف "رأي" غير موجود.');
    return;
  }

  // 2. حذف جميع المقالات المرتبطة بهذا التصنيف
  const deleteArticles = await prisma.articles.deleteMany({
    where: { category_id: opinionCategory.id }
  });
  console.log(`🗑️ تم حذف ${deleteArticles.count} مقال يحمل تصنيف "رأي".`);

  // 3. حذف التصنيف نفسه
  await prisma.categories.delete({
    where: { id: opinionCategory.id }
  });
  console.log('✅ تم حذف تصنيف "رأي" بنجاح.');
}

deleteOpinionArticlesAndCategory()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 