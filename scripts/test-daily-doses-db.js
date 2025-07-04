const { PrismaClient } = require('../lib/generated/prisma')

const prisma = new PrismaClient()

async function testDailyDosesDB() {
  console.log('🧪 اختبار جداول الجرعات اليومية في قاعدة البيانات')
  console.log('='.repeat(50))
  
  try {
    // 1. التحقق من وجود الجداول
    console.log('\n1️⃣ التحقق من الجداول:')
    
    // عد الجرعات
    const dosesCount = await prisma.dailyDose.count()
    console.log(`   - عدد الجرعات: ${dosesCount}`)
    
    // عد المحتويات
    const contentsCount = await prisma.doseContent.count()
    console.log(`   - عدد المحتويات: ${contentsCount}`)
    
    // 2. جلب آخر جرعة
    console.log('\n2️⃣ آخر جرعة مسجلة:')
    const latestDose = await prisma.dailyDose.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        contents: {
          include: {
            article: {
              include: {
                category: true,
                author: true
              }
            }
          }
        }
      }
    })
    
    if (latestDose) {
      console.log(`   - ID: ${latestDose.id}`)
      console.log(`   - الفترة: ${latestDose.period}`)
      console.log(`   - التاريخ: ${latestDose.date.toLocaleDateString('ar-SA')}`)
      console.log(`   - العنوان: ${latestDose.greetingMain}`)
      console.log(`   - عدد المحتويات: ${latestDose.contents.length}`)
      console.log(`   - المشاهدات: ${latestDose.views}`)
    } else {
      console.log('   ❌ لا توجد جرعات مسجلة')
    }
    
    // 3. إحصائيات الفترات
    console.log('\n3️⃣ إحصائيات الفترات:')
    const periodStats = await prisma.dailyDose.groupBy({
      by: ['period'],
      _count: true
    })
    
    periodStats.forEach(stat => {
      console.log(`   - ${stat.period}: ${stat._count} جرعة`)
    })
    
    // 4. أنواع المحتوى
    console.log('\n4️⃣ أنواع المحتوى المستخدمة:')
    const contentTypes = await prisma.doseContent.groupBy({
      by: ['contentType'],
      _count: true
    })
    
    contentTypes.forEach(type => {
      console.log(`   - ${type.contentType}: ${type._count} محتوى`)
    })
    
    console.log('\n✅ اكتمل الاختبار بنجاح')
    
  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testDailyDosesDB() 