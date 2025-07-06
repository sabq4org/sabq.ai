#!/usr/bin/env tsx

import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function testConnection() {
  console.log('🔌 اختبار الاتصال بقاعدة البيانات...\n')
  
  try {
    // اختبار الاتصال الأساسي
    console.log('1. اختبار الاتصال الأساسي...')
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const endTime = Date.now()
    console.log(`✅ الاتصال ناجح! الوقت: ${endTime - startTime}ms\n`)
    
    // اختبار قراءة البيانات
    console.log('2. اختبار قراءة البيانات...')
    const usersCount = await prisma.users.count()
    const articlesCount = await prisma.articles.count()
    const categoriesCount = await prisma.categories.count()
    
    console.log(`✅ المستخدمون: ${usersCount}`)
    console.log(`✅ المقالات: ${articlesCount}`)
    console.log(`✅ التصنيفات: ${categoriesCount}\n`)
    
    // اختبار البحث
    console.log('3. اختبار البحث...')
    const searchStart = Date.now()
    const searchResults = await prisma.articles.findMany({
      where: {
        OR: [
          { title: { contains: 'السعودية' } },
          { content: { contains: 'السعودية' } }
        ]
      },
      take: 5
    })
    const searchEnd = Date.now()
    
    console.log(`✅ نتائج البحث: ${searchResults.length} مقال`)
    console.log(`✅ وقت البحث: ${searchEnd - searchStart}ms\n`)
    
    // اختبار العلاقات
    console.log('4. اختبار العلاقات...')
    const relationStart = Date.now()
    const articlesWithRelations = await prisma.articles.findMany({
      include: {
        category: true
      },
      take: 3
    })
    const relationEnd = Date.now()
    
    console.log(`✅ المقالات مع العلاقات: ${articlesWithRelations.length}`)
    console.log(`✅ وقت العلاقات: ${relationEnd - relationStart}ms\n`)
    
    // اختبار الكتابة
    console.log('5. اختبار الكتابة...')
    const writeStart = Date.now()
    const testArticle = await prisma.articles.create({
      data: {
        id: `test-connection-${Date.now()}`,
        title: 'مقال اختبار الاتصال',
        content: 'محتوى اختبار الاتصال',
        slug: `test-connection-${Date.now()}`,
        author_id: 'test-author',
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    const writeEnd = Date.now()
    
    console.log(`✅ إنشاء مقال: ${testArticle.id}`)
    console.log(`✅ وقت الكتابة: ${writeEnd - writeStart}ms\n`)
    
    // حذف بيانات الاختبار
    console.log('6. تنظيف بيانات الاختبار...')
    await prisma.articles.delete({
      where: { id: testArticle.id }
    })
    console.log('✅ تم حذف بيانات الاختبار\n')
    
    // ملخص الأداء
    const totalTime = (endTime - startTime) + (searchEnd - searchStart) + (relationEnd - relationStart) + (writeEnd - writeStart)
    console.log('📊 ملخص الأداء:')
    console.log('================')
    console.log(`⏱️ إجمالي الوقت: ${totalTime}ms`)
    console.log(`📊 عدد العمليات: 5`)
    console.log(`⚡ متوسط الوقت: ${(totalTime / 5).toFixed(2)}ms`)
    
    if (totalTime < 1000) {
      console.log('🌟 ممتاز! الأداء سريع جداً')
    } else if (totalTime < 3000) {
      console.log('👍 جيد! الأداء مقبول')
    } else {
      console.log('⚠️ بطيء! قد يحتاج تحسين')
    }
    
    console.log('\n✅ جميع الاختبارات نجحت! قاعدة البيانات تعمل بشكل مثالي')
    
  } catch (error) {
    console.error('❌ فشل في اختبار الاتصال:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection().catch(console.error) 