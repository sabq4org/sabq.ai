import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 اختبار الاتصال بقاعدة البيانات...')
    
    // عد المقالات
    const articlesCount = await prisma.article.count()
    console.log(`📊 عدد المقالات: ${articlesCount}`)
    
    // جلب أول مقال
    const firstArticle = await prisma.article.findFirst({
      include: {
        author: true,
        category: true
      }
    })
    
    if (firstArticle) {
      console.log('📄 أول مقال:')
      console.log(`  - العنوان: ${firstArticle.title}`)
      console.log(`  - المؤلف: ${firstArticle.author?.name || 'غير محدد'}`)
      console.log(`  - التصنيف: ${firstArticle.category?.name || 'غير مصنف'}`)
    } else {
      console.log('❌ لا توجد مقالات في قاعدة البيانات')
    }
    
    // عد المستخدمين
    const usersCount = await prisma.user.count()
    console.log(`👥 عدد المستخدمين: ${usersCount}`)
    
    // عد التصنيفات
    const categoriesCount = await prisma.category.count()
    console.log(`📁 عدد التصنيفات: ${categoriesCount}`)
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase() 