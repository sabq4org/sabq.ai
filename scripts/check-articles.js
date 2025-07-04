const { PrismaClient } = require('../lib/generated/prisma')
const prisma = new PrismaClient()

async function checkArticles() {
  try {
    console.log('🔍 فحص المقالات المتاحة...\n')
    
    // إجمالي المقالات
    const totalCount = await prisma.article.count()
    console.log(`📊 إجمالي المقالات: ${totalCount}`)
    
    // المقالات المنشورة
    const publishedCount = await prisma.article.count({
      where: { status: 'published' }
    })
    console.log(`✅ المقالات المنشورة: ${publishedCount}`)
    
    // المقالات في آخر 24 ساعة
    const since24h = new Date()
    since24h.setHours(since24h.getHours() - 24)
    
    const recent24h = await prisma.article.count({
      where: {
        status: 'published',
        publishedAt: {
          gte: since24h
        }
      }
    })
    console.log(`⏰ المقالات في آخر 24 ساعة: ${recent24h}`)
    
    // آخر 5 مقالات منشورة
    console.log('\n📰 آخر 5 مقالات منشورة:')
    const latestArticles = await prisma.article.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        category: {
          select: { name: true }
        }
      }
    })
    
    latestArticles.forEach((article, index) => {
      const date = article.publishedAt ? new Date(article.publishedAt).toLocaleString('ar-SA') : 'غير محدد'
      console.log(`${index + 1}. ${article.title}`)
      console.log(`   - التصنيف: ${article.category?.name || 'غير مصنف'}`)
      console.log(`   - التاريخ: ${date}`)
    })
    
    // إذا لم توجد مقالات منشورة، أنشئ بعض المقالات التجريبية
    if (publishedCount === 0) {
      console.log('\n⚠️  لا توجد مقالات منشورة!')
      console.log('🔨 إنشاء مقالات تجريبية...')
      
      // إنشاء مقالات تجريبية
      const testArticles = [
        {
          title: 'أخبار الاقتصاد: نمو الناتج المحلي بنسبة 5%',
          slug: 'economy-growth-5-percent',
          excerpt: 'شهد الاقتصاد المحلي نمواً ملحوظاً في الربع الأول',
          content: 'محتوى تفصيلي عن النمو الاقتصادي...',
          status: 'published',
          publishedAt: new Date(),
          views: 150,
          categoryId: '1' // افتراض وجود تصنيف
        },
        {
          title: 'التقنية: إطلاق تطبيق جديد للخدمات الحكومية',
          slug: 'new-government-app-launch',
          excerpt: 'تسهيل الخدمات الحكومية عبر تطبيق موحد',
          content: 'تفاصيل عن التطبيق الجديد...',
          status: 'published',
          publishedAt: new Date(),
          views: 200,
          categoryId: '2'
        },
        {
          title: 'الرياضة: الفريق الوطني يحقق فوزاً مهماً',
          slug: 'national-team-important-win',
          excerpt: 'فوز مستحق للمنتخب الوطني في المباراة الحاسمة',
          content: 'تفاصيل المباراة والأهداف...',
          status: 'published',
          publishedAt: new Date(),
          views: 300,
          categoryId: '3'
        }
      ]
      
      for (const article of testArticles) {
        try {
          await prisma.article.create({ data: article })
          console.log(`✅ تم إنشاء: ${article.title}`)
        } catch (err) {
          console.log(`⚠️  تخطي: ${article.title} (قد يكون موجوداً)`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkArticles() 