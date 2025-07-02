import { PrismaClient } from '../lib/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 إضافة مستخدمين تجريبيين...')

  const users = [
    {
      email: 'editor@sabq.ai',
      name: 'محرر المحتوى',
      password: 'editor123',
      role: 'editor',
      isVerified: true
    },
    {
      email: 'writer@sabq.ai',
      name: 'كاتب المقالات',
      password: 'writer123',
      role: 'user',
      isVerified: true
    },
    {
      email: 'test@sabq.ai',
      name: 'مستخدم تجريبي',
      password: 'test123',
      role: 'user',
      isVerified: false
    }
  ]

  for (const userData of users) {
    // التحقق من عدم وجود المستخدم
    const existing = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existing) {
      console.log(`⚠️  المستخدم ${userData.email} موجود بالفعل`)
      continue
    }

    // إنشاء المستخدم
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: hashedPassword,
        name: userData.name,
        role: userData.role,
        isAdmin: userData.role === 'admin',
        isVerified: userData.isVerified,
        verificationToken: userData.isVerified ? null : Math.random().toString(36).substr(2)
      }
    })

    // إضافة نقاط ترحيبية
    await prisma.loyaltyPoint.create({
      data: {
        userId: user.id,
        points: 100,
        action: 'welcome_bonus',
        metadata: {
          message: 'مكافأة التسجيل'
        }
      }
    })

    // إنشاء بعض المقالات للمحرر
    if (userData.role === 'editor') {
      const categories = await prisma.category.findMany()
      
      for (let i = 1; i <= 3; i++) {
        await prisma.article.create({
          data: {
            title: `مقال تجريبي رقم ${i} من المحرر`,
            slug: `editor-article-${i}`,
            content: `<p>هذا محتوى تجريبي للمقال رقم ${i} من المحرر...</p>`,
            excerpt: `ملخص المقال التجريبي رقم ${i}`,
            status: 'published',
            publishedAt: new Date(),
            authorId: user.id,
            categoryId: categories[i % categories.length].id,
            views: Math.floor(Math.random() * 1000)
          }
        })
      }
    }

    console.log(`✅ تم إنشاء المستخدم: ${userData.email} / ${userData.password}`)
  }

  // إضافة بعض التفاعلات التجريبية
  const allUsers = await prisma.user.findMany()
  const allArticles = await prisma.article.findMany({ take: 5 })

  for (const user of allUsers) {
    for (const article of allArticles) {
      // تفاعل عشوائي
      if (Math.random() > 0.5) {
        await prisma.interaction.upsert({
          where: {
            userId_articleId_type: {
              userId: user.id,
              articleId: article.id,
              type: 'like'
            }
          },
          create: {
            userId: user.id,
            articleId: article.id,
            type: 'like'
          },
          update: {}
        })

        // نقاط الإعجاب
        await prisma.loyaltyPoint.create({
          data: {
            userId: user.id,
            points: 5,
            action: 'like',
            referenceId: article.id,
            referenceType: 'article'
          }
        })
      }
    }
  }

  console.log('🎉 تمت إضافة المستخدمين والتفاعلات التجريبية!')
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 