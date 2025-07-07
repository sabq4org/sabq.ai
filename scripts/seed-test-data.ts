import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 بدء إضافة البيانات التجريبية...')

    // إنشاء مستخدم تجريبي
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'مستخدم تجريبي',
        passwordHash: 'password123', // في الإنتاج يجب تشفير كلمة المرور
        role: 'user',
        isVerified: true
      }
    })
    console.log('✅ تم إنشاء المستخدم التجريبي')

    // إنشاء فئات
    const categories = await Promise.all([
      prisma.categories.create({
        data: {
          name: 'أخبار',
          slug: 'news',
          description: 'آخر الأخبار المحلية والعالمية',
          isActive: true,
          displayOrder: 1,
          color: '#FF0000'
        }
      }),
      prisma.categories.create({
        data: {
          name: 'رياضة',
          slug: 'sports',
          description: 'أخبار الرياضة والمباريات',
          isActive: true,
          displayOrder: 2,
          color: '#00FF00'
        }
      }),
      prisma.categories.create({
        data: {
          name: 'تقنية',
          slug: 'tech',
          description: 'آخر أخبار التقنية والتكنولوجيا',
          isActive: true,
          displayOrder: 3,
          color: '#0000FF'
        }
      })
    ])
    console.log('✅ تم إنشاء الفئات')

    // إنشاء مقالات تجريبية
    const articles = await Promise.all([
      prisma.articles.create({
        data: {
          title: 'مقال تجريبي أول - أخبار اليوم',
          slug: 'test-article-1',
          content: 'هذا محتوى تجريبي للمقال الأول. يحتوي على معلومات مهمة وشيقة للقراء.',
          excerpt: 'ملخص المقال الأول',
          status: 'published',
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: categories[0].id,
          featured: true,
          views: 100,
          readingTime: 5
        }
      }),
      prisma.articles.create({
        data: {
          title: 'أخبار الرياضة - نتائج المباريات',
          slug: 'sports-news-1',
          content: 'تفاصيل مثيرة عن آخر المباريات ونتائج الفرق المحلية والعالمية.',
          excerpt: 'ملخص أخبار الرياضة',
          status: 'published',
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: categories[1].id,
          featured: false,
          views: 50,
          readingTime: 3
        }
      }),
      prisma.articles.create({
        data: {
          title: 'ثورة الذكاء الاصطناعي في 2024',
          slug: 'ai-revolution-2024',
          content: 'تطورات مذهلة في مجال الذكاء الاصطناعي وتأثيرها على حياتنا اليومية.',
          excerpt: 'الذكاء الاصطناعي يغير العالم',
          status: 'published',
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: categories[2].id,
          featured: true,
          breaking: true,
          views: 200,
          readingTime: 7
        }
      })
    ])
    console.log('✅ تم إنشاء المقالات التجريبية')

    // إنشاء بعض التفاعلات
    await Promise.all([
      prisma.interaction.create({
        data: {
          userId: testUser.id,
          articleId: articles[0].id,
          type: 'view'
        }
      }),
      prisma.interaction.create({
        data: {
          userId: testUser.id,
          articleId: articles[0].id,
          type: 'like'
        }
      })
    ])
    console.log('✅ تم إنشاء التفاعلات')

    console.log('🎉 تمت إضافة البيانات التجريبية بنجاح!')
  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  }) 