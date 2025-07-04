const { PrismaClient } = require('../lib/generated/prisma')
const prisma = new PrismaClient()

async function testGenerateAPI() {
  console.log('🧪 اختبار API التوليد')
  console.log('='.repeat(50))
  
  try {
    // 1. التحقق من وجود مقالات
    const articlesCount = await prisma.article.count({
      where: { status: 'published' }
    })
    console.log(`📰 عدد المقالات المنشورة: ${articlesCount}`)
    
    if (articlesCount === 0) {
      console.log('❌ لا توجد مقالات منشورة!')
      return
    }
    
    // 2. جلب عينة من المقالات
    const articles = await prisma.article.findMany({
      where: { status: 'published' },
      take: 5,
      include: {
        category: true
      }
    })
    
    console.log('\n📋 عينة من المقالات:')
    articles.forEach(a => {
      console.log(`   - ${a.title} (${a.category?.name || 'بدون تصنيف'})`)
    })
    
    // 3. التحقق من وجود جرعة للتاريخ
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingDose = await prisma.dailyDose.findFirst({
      where: {
        date: today,
        period: 'morning'
      }
    })
    
    if (existingDose) {
      console.log('\n⚠️  توجد جرعة صباحية لليوم بالفعل')
      console.log(`   ID: ${existingDose.id}`)
      console.log(`   العنوان: ${existingDose.title}`)
    } else {
      console.log('\n✅ لا توجد جرعة صباحية لليوم')
    }
    
    // 4. محاولة استدعاء API
    console.log('\n🚀 استدعاء API التوليد...')
    const response = await fetch('http://localhost:3000/api/daily-doses/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        period: 'afternoon' // استخدام فترة مختلفة
      })
    })
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('✅ نجح التوليد!')
      console.log(`   ID الجرعة: ${result.dose.id}`)
      console.log(`   العنوان: ${result.dose.title}`)
      console.log(`   عدد المحتويات: ${result.dose.contents?.length || 0}`)
    } else {
      console.log('❌ فشل التوليد:')
      console.log(`   الحالة: ${response.status}`)
      console.log(`   الخطأ: ${result.error || 'غير محدد'}`)
      console.log(`   التفاصيل:`, result)
    }
    
  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error.message)
    console.error('تفاصيل الخطأ:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testGenerateAPI() 