const { PrismaClient } = require('../lib/generated/prisma')
const prisma = new PrismaClient()

async function createSimpleTestArticles() {
  console.log('🔨 إنشاء مقالات تجريبية بسيطة...')
  
  try {
    // إنشاء مستخدم تجريبي أولاً
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'مستخدم تجريبي',
        role: 'author',
        isVerified: true
      }
    })
    
    console.log('✅ تم إنشاء المستخدم التجريبي')
    
    // إنشاء تصنيف تجريبي
    const testCategory = await prisma.category.upsert({
      where: { slug: 'test-category' },
      update: {},
      create: {
        name: 'أخبار تجريبية',
        slug: 'test-category',
        description: 'تصنيف للاختبار',
        displayOrder: 1,
        isActive: true
      }
    })
    
    console.log('✅ تم إنشاء التصنيف التجريبي')
    
    // إنشاء مقالات تجريبية
    const testArticles = [
      {
        title: 'أول مقال تجريبي في صحيفة سبق',
        slug: 'first-test-article',
        content: 'هذا هو محتوى أول مقال تجريبي في صحيفة سبق. يحتوي على معلومات مهمة ومفيدة للقراء.',
        excerpt: 'ملخص لأول مقال تجريبي في صحيفة سبق',
        authorId: testUser.id,
        categoryId: testCategory.id,
        status: 'published',
        publishedAt: new Date(),
        views: 150
      },
      {
        title: 'مقال تجريبي ثاني عن التكنولوجيا',
        slug: 'second-test-article-tech',
        content: 'مقال تجريبي عن التكنولوجيا الحديثة وتأثيرها على حياتنا اليومية.',
        excerpt: 'ملخص عن التكنولوجيا الحديثة',
        authorId: testUser.id,
        categoryId: testCategory.id,
        status: 'published',
        publishedAt: new Date(),
        views: 89
      },
      {
        title: 'مقال تجريبي ثالث عن الرياضة',
        slug: 'third-test-article-sports',
        content: 'مقال تجريبي عن الرياضة المحلية والإنجازات الرياضية الأخيرة.',
        excerpt: 'ملخص عن الرياضة المحلية',
        authorId: testUser.id,
        categoryId: testCategory.id,
        status: 'published',
        publishedAt: new Date(),
        views: 234
      }
    ]
    
    for (const articleData of testArticles) {
      await prisma.article.create({
        data: articleData
      })
    }
    
    console.log('✅ تم إنشاء 3 مقالات تجريبية منشورة')
    
    // التحقق من عدد المقالات المنشورة
    const publishedCount = await prisma.article.count({
      where: { status: 'published' }
    })
    
    console.log(`📊 إجمالي المقالات المنشورة: ${publishedCount}`)
    
  } catch (error) {
    console.error('❌ خطأ:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createSimpleTestArticles() 