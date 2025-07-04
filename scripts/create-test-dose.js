const { PrismaClient } = require('../lib/generated/prisma')
const prisma = new PrismaClient()

async function createTestDose() {
  try {
    console.log('🔨 إنشاء جرعة تجريبية...')
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // حذف أي جرعة موجودة لنفس اليوم والفترة
    await prisma.dailyDose.deleteMany({
      where: {
        date: today,
        period: 'evening'
      }
    })
    
    // إنشاء جرعة جديدة
    const doseId = require('crypto').randomUUID()
    const dose = await prisma.dailyDose.create({
      data: {
        id: doseId,
        period: 'evening',
        title: 'مساؤك يبدأ بالوعي',
        subtitle: 'تقارير وتحليلات قبل ازدحام الأحداث المسائية',
        date: today,
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    // إنشاء المحتويات منفصلة
    const contents = await Promise.all([
      prisma.doseContent.create({
        data: {
          id: require('crypto').randomUUID(),
          doseId: doseId,
          contentType: 'article',
          title: 'خبر عاجل: تطورات مهمة في المنطقة',
          summary: 'شهدت المنطقة تطورات مهمة اليوم تتطلب متابعة دقيقة للأحداث',
          imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
          displayOrder: 0
        }
      }),
      prisma.doseContent.create({
        data: {
          id: require('crypto').randomUUID(),
          doseId: doseId,
          contentType: 'analysis',
          title: 'تحليل: الاقتصاد المحلي في 2024',
          summary: 'نظرة تحليلية على أداء الاقتصاد المحلي والتوقعات المستقبلية',
          imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
          displayOrder: 1
        }
      }),
      prisma.doseContent.create({
        data: {
          id: require('crypto').randomUUID(),
          doseId: doseId,
          contentType: 'tip',
          title: 'نصيحة مسائية',
          summary: 'خذ قسطاً من الراحة واستعد ليوم جديد مليء بالإنجازات',
          displayOrder: 2
        }
      })
    ])
    
    console.log('✅ تم إنشاء الجرعة بنجاح!')
    console.log(`   - ID: ${dose.id}`)
    console.log(`   - العنوان: ${dose.title}`)
    console.log(`   - عدد المحتويات: ${contents.length}`)
    
  } catch (error) {
    console.error('❌ خطأ:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTestDose() 