import { PrismaClient } from '../lib/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...')

  // 1. إنشاء مستخدم أول (Admin)
  let admin = await prisma.user.findFirst({
    where: { email: 'admin@sabq.ai' }
  })
  
  if (!admin) {
    const adminPassword = await bcrypt.hash('admin123', 10)
    admin = await prisma.user.create({
      data: {
        email: 'admin@sabq.ai',
        passwordHash: adminPassword,
        name: 'مدير النظام',
        role: 'admin',
        isAdmin: true,
        isVerified: true
      }
    })
    console.log('✅ تم إنشاء المستخدم الأساسي')
  } else {
    console.log('⚠️  المستخدم الأساسي موجود بالفعل')
  }

  // 2. إنشاء الفئات
  const categoriesData = [
    { name: 'أخبار محلية', slug: 'local-news', description: 'آخر الأخبار المحلية والأحداث', displayOrder: 1 },
    { name: 'رياضة', slug: 'sports', description: 'أخبار الرياضة والمباريات', displayOrder: 2 },
    { name: 'تقنية', slug: 'technology', description: 'آخر أخبار التقنية والابتكار', displayOrder: 3 },
    { name: 'اقتصاد', slug: 'economy', description: 'أخبار الاقتصاد والأعمال', displayOrder: 4 }
  ]
  
  const categories: any[] = []
  for (const catData of categoriesData) {
    let category = await prisma.category.findFirst({
      where: { slug: catData.slug }
    })
    if (!category) {
      category = await prisma.category.create({ data: catData })
    }
    categories.push(category)
  }
  console.log('✅ تم التحقق من الفئات')

  // 3. إنشاء مقالات تجريبية
  const articles = await Promise.all([
    prisma.article.create({
      data: {
        title: 'إطلاق منصة سبق الإخبارية الجديدة بتقنيات الذكاء الاصطناعي',
        slug: 'sabq-ai-launch',
        content: `<p>أعلنت منصة سبق الإخبارية عن إطلاق نسختها الجديدة المدعومة بتقنيات الذكاء الاصطناعي...</p>`,
        excerpt: 'منصة سبق تطلق نسخة جديدة مدعومة بالذكاء الاصطناعي',
        status: 'published',
        featured: true,
        publishedAt: new Date(),
        authorId: admin.id,
        categoryId: categories[2].id,
        views: 1250,
        metadata: {
          tags: ['ذكاء اصطناعي', 'تقنية', 'أخبار']
        }
      }
    }),
    prisma.article.create({
      data: {
        title: 'الهلال يحقق فوزاً كبيراً في دوري أبطال آسيا',
        slug: 'alhilal-champions-league',
        content: `<p>حقق نادي الهلال السعودي فوزاً مستحقاً في مباراته الأخيرة...</p>`,
        excerpt: 'الهلال يواصل انتصاراته في البطولة الآسيوية',
        status: 'published',
        breaking: true,
        publishedAt: new Date(),
        authorId: admin.id,
        categoryId: categories[1].id,
        views: 3500
      }
    }),
    prisma.article.create({
      data: {
        title: 'نمو الاقتصاد السعودي يتجاوز التوقعات',
        slug: 'saudi-economy-growth',
        content: `<p>أظهرت البيانات الاقتصادية الأخيرة نمواً قوياً للاقتصاد السعودي...</p>`,
        excerpt: 'الاقتصاد السعودي يحقق أرقاماً قياسية',
        status: 'published',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        authorId: admin.id,
        categoryId: categories[3].id,
        views: 890
      }
    })
  ])
  console.log('✅ تم إنشاء المقالات التجريبية')

  // 4. إضافة نقاط ولاء للمستخدم
  await prisma.loyaltyPoint.create({
    data: {
      userId: admin.id,
      points: 100,
      action: 'welcome_bonus',
      metadata: {
        message: 'مكافأة الترحيب'
      }
    }
  })
  console.log('✅ تم إضافة نقاط الولاء')

  // 5. إضافة أدوار
  await prisma.role.create({
    data: {
      name: 'editor',
      displayName: 'محرر',
      description: 'يمكنه إنشاء وتحرير المقالات',
      permissions: {
        articles: ['create', 'edit', 'delete'],
        categories: ['view']
      }
    }
  })
  console.log('✅ تم إنشاء الأدوار')

  console.log('🎉 تمت إضافة جميع البيانات التجريبية بنجاح!')
  console.log('📧 بيانات الدخول: admin@sabq.ai / admin123')
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 