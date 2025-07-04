const { PrismaClient } = require('../lib/generated/prisma')
const prisma = new PrismaClient()

async function createTestArticles() {
  console.log('🔨 إنشاء مقالات تجريبية...')
  
  try {
    // التحقق من وجود تصنيفات
    let categories = await prisma.category.findMany({ take: 5 })
    
    if (categories.length === 0) {
      console.log('📁 إنشاء تصنيفات تجريبية...')
      // إنشاء تصنيفات تجريبية
      const testCategories = [
        { id: require('crypto').randomUUID(), name: 'أخبار محلية', slug: 'local-news', color: '#3B82F6' },
        { id: require('crypto').randomUUID(), name: 'اقتصاد', slug: 'economy', color: '#10B981' },
        { id: require('crypto').randomUUID(), name: 'رياضة', slug: 'sports', color: '#F59E0B' },
        { id: require('crypto').randomUUID(), name: 'تقنية', slug: 'technology', color: '#8B5CF6' },
        { id: require('crypto').randomUUID(), name: 'ثقافة', slug: 'culture', color: '#EC4899' }
      ]
      
      for (const cat of testCategories) {
        await prisma.category.create({ data: cat })
      }
      
      categories = await prisma.category.findMany({ take: 5 })
    }
    
    // إنشاء مقالات تجريبية
    const articles = [
      {
        id: require('crypto').randomUUID(),
        title: 'رؤية 2030: إنجازات جديدة في قطاع السياحة السعودية',
        slug: 'vision-2030-tourism-achievements-' + Date.now(),
        excerpt: 'حققت المملكة إنجازات كبيرة في قطاع السياحة ضمن رؤية 2030، مع ارتفاع عدد السياح وتطوير الوجهات السياحية',
        content: 'محتوى تفصيلي عن إنجازات السياحة السعودية...',
        categoryId: categories[0].id,
        status: 'published',
        publishedAt: new Date(),
        views: 1250,
        featured: true,
        featuredImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
      },
      {
        id: require('crypto').randomUUID(),
        title: 'نمو الاقتصاد السعودي يتجاوز التوقعات في الربع الأول',
        slug: 'saudi-economy-growth-q1-' + Date.now(),
        excerpt: 'سجل الاقتصاد السعودي نمواً قوياً في الربع الأول من العام، متجاوزاً توقعات المحللين',
        content: 'تفاصيل النمو الاقتصادي والقطاعات الرائدة...',
        categoryId: categories[1].id,
        status: 'published',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // قبل ساعتين
        views: 890,
        featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800'
      },
      {
        id: require('crypto').randomUUID(),
        title: 'الأخضر السعودي يحقق فوزاً مهماً في تصفيات كأس العالم',
        slug: 'saudi-team-world-cup-win-' + Date.now(),
        excerpt: 'حقق المنتخب السعودي فوزاً ثميناً في تصفيات كأس العالم، معززاً حظوظه في التأهل',
        content: 'تفاصيل المباراة والأهداف...',
        categoryId: categories[2].id,
        status: 'published',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // قبل 4 ساعات
        views: 2340,
        featured: true,
        featuredImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'
      },
      {
        id: require('crypto').randomUUID(),
        title: 'إطلاق أكبر مشروع للذكاء الاصطناعي في المنطقة',
        slug: 'ai-project-launch-region-' + Date.now(),
        excerpt: 'تم الإعلان عن إطلاق مشروع ضخم للذكاء الاصطناعي يهدف لتعزيز الابتكار التقني في المنطقة',
        content: 'تفاصيل المشروع وأهدافه...',
        categoryId: categories[3].id,
        status: 'published',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // قبل 6 ساعات
        views: 1567,
        featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'
      },
      {
        id: require('crypto').randomUUID(),
        title: 'مهرجان الرياض الثقافي يستقطب آلاف الزوار',
        slug: 'riyadh-cultural-festival-' + Date.now(),
        excerpt: 'شهد مهرجان الرياض الثقافي إقبالاً كبيراً من الزوار، مع فعاليات متنوعة تحتفي بالتراث والفنون',
        content: 'تغطية شاملة للمهرجان وفعالياته...',
        categoryId: categories[4].id,
        status: 'published',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // قبل 8 ساعات
        views: 987,
        featuredImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800'
      },
      {
        id: require('crypto').randomUUID(),
        title: 'توقيع اتفاقيات استثمارية بقيمة 50 مليار ريال',
        slug: 'investment-deals-50-billion-' + Date.now(),
        excerpt: 'وقعت المملكة اتفاقيات استثمارية ضخمة في قطاعات متعددة، تعزز من مكانتها الاقتصادية',
        content: 'تفاصيل الاتفاقيات والقطاعات المستفيدة...',
        categoryId: categories[1].id,
        status: 'published',
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // قبل 10 ساعات
        views: 3210,
        breaking: true,
        featuredImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800'
      }
    ]
    
    console.log(`📝 إنشاء ${articles.length} مقال تجريبي...`)
    
    for (const article of articles) {
      try {
        await prisma.article.create({ data: article })
        console.log(`✅ تم إنشاء: ${article.title}`)
      } catch (err) {
        console.log(`⚠️  تخطي: ${article.title} (قد يكون موجوداً)`)
      }
    }
    
    console.log('\n✅ اكتمل إنشاء المقالات التجريبية!')
    
  } catch (error) {
    console.error('❌ خطأ:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTestArticles() 