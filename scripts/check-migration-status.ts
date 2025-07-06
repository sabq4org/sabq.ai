import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function checkMigrationStatus() {
  console.log('🔍 التحقق من حالة الترحيل...\n')
  
  try {
    // عد السجلات في كل جدول
    const counts = {
      users: await prisma.users.count(),
      articles: await prisma.articles.count(),
      categories: await prisma.categories.count(),
      interactions: await prisma.interactions.count(),
      activityLogs: await prisma.activity_logs.count(),
      keywords: await prisma.keywords.count(),
      loyaltyPoints: await prisma.loyalty_points.count(),
      userPreferences: await prisma.user_preferences.count(),
      messages: await prisma.messages.count(),
      roles: await prisma.roles.count(),
      deepAnalyses: await prisma.deep_analyses.count(),
      // الجداول الجديدة
      teamMembers: await prisma.team_members.count(),
      templates: await prisma.templates.count(),
      smartBlocks: await prisma.smart_blocks.count(),
    }
    
    console.log('📊 إحصائيات قاعدة البيانات:')
    console.log('================================')
    
    Object.entries(counts).forEach(([table, count]) => {
      const emoji = count > 0 ? '✅' : '⚠️ '
      console.log(`${emoji} ${table}: ${count} سجل`)
    })
    
    console.log('\n📈 ملخص الترحيل:')
    console.log('================================')
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0)
    console.log(`إجمالي السجلات: ${totalRecords}`)
    
    // عرض بعض البيانات النموذجية
    console.log('\n📝 عينات من البيانات:')
    console.log('================================')
    
    // عينة من المستخدمين
    const sampleUsers = await prisma.users.findMany({ take: 3 })
    console.log('\nالمستخدمون:')
    sampleUsers.forEach(user => {
      console.log(`- ${user.name || 'بدون اسم'} (${user.email})`)
    })
    
    // عينة من المقالات
    const sampleArticles = await prisma.articles.findMany({ 
      take: 3,
      orderBy: { created_at: 'desc' }
    })
    console.log('\nأحدث المقالات:')
    sampleArticles.forEach(article => {
      console.log(`- ${article.title} (${article.status})`)
    })
    
    // عينة من التصنيفات
    const sampleCategories = await prisma.categories.findMany({ take: 5 })
    console.log('\nالتصنيفات:')
    sampleCategories.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`)
    })
    
  } catch (error) {
    console.error('❌ خطأ في التحقق من قاعدة البيانات:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMigrationStatus().catch(console.error) 