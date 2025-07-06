#!/usr/bin/env tsx

import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

interface PerformanceTest {
  name: string
  query: () => Promise<any>
  expectedTime: number // بالمللي ثانية
}

class DatabasePerformanceTester {
  private tests: PerformanceTest[] = []

  constructor() {
    this.setupTests()
  }

  private setupTests() {
    this.tests = [
      {
        name: 'قراءة جميع المقالات',
        query: () => prisma.articles.findMany(),
        expectedTime: 100
      },
      {
        name: 'قراءة المقالات مع التصنيفات',
        query: () => prisma.articles.findMany({
          include: { category: true }
        }),
        expectedTime: 150
      },
      {
        name: 'البحث في المقالات',
        query: () => prisma.articles.findMany({
          where: {
            OR: [
              { title: { contains: 'السعودية' } },
              { content: { contains: 'السعودية' } }
            ]
          }
        }),
        expectedTime: 200
      },
      {
        name: 'عد المستخدمين',
        query: () => prisma.users.count(),
        expectedTime: 50
      },
      {
        name: 'قراءة سجلات الأنشطة',
        query: () => prisma.activity_logs.findMany({
          take: 100,
          orderBy: { created_at: 'desc' }
        }),
        expectedTime: 100
      },
      {
        name: 'إنشاء مقال جديد',
        query: async () => {
          const testArticle = {
            id: `test-${Date.now()}`,
            title: 'مقال اختبار الأداء',
            content: 'محتوى اختبار الأداء',
            author_id: 'test-author',
            status: 'draft',
            created_at: new Date(),
            updated_at: new Date()
          }
          return await prisma.articles.create({ data: testArticle })
        },
        expectedTime: 200
      }
    ]
  }

  async runAllTests() {
    console.log('🚀 بدء اختبارات الأداء...\n')
    
    const results = []
    
    for (const test of this.tests) {
      const result = await this.runSingleTest(test)
      results.push(result)
    }
    
    this.printSummary(results)
  }

  private async runSingleTest(test: PerformanceTest) {
    console.log(`📊 تشغيل: ${test.name}`)
    
    const startTime = Date.now()
    let success = false
    let error = null
    
    try {
      await test.query()
      success = true
    } catch (err) {
      error = err
    }
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    const status = success ? '✅' : '❌'
    const performance = duration <= test.expectedTime ? '🟢' : '🟡'
    
    console.log(`  ${status} ${performance} الوقت: ${duration}ms (متوقع: ${test.expectedTime}ms)`)
    
    if (error) {
      console.log(`  ❌ خطأ: ${error.message}`)
    }
    
    return {
      name: test.name,
      duration,
      expectedTime: test.expectedTime,
      success,
      error: error?.message
    }
  }

  private printSummary(results: any[]) {
    console.log('\n📈 ملخص النتائج:')
    console.log('================')
    
    const successfulTests = results.filter(r => r.success)
    const failedTests = results.filter(r => !r.success)
    
    console.log(`✅ الاختبارات الناجحة: ${successfulTests.length}/${results.length}`)
    console.log(`❌ الاختبارات الفاشلة: ${failedTests.length}/${results.length}`)
    
    if (successfulTests.length > 0) {
      const avgTime = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length
      console.log(`⏱️ متوسط الوقت: ${avgTime.toFixed(2)}ms`)
      
      const fastest = successfulTests.reduce((min, r) => r.duration < min.duration ? r : min)
      const slowest = successfulTests.reduce((max, r) => r.duration > max.duration ? r : max)
      
      console.log(`⚡ الأسرع: ${fastest.name} (${fastest.duration}ms)`)
      console.log(`🐌 الأبطأ: ${slowest.name} (${slowest.duration}ms)`)
    }
    
    if (failedTests.length > 0) {
      console.log('\n❌ الاختبارات الفاشلة:')
      failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`)
      })
    }
    
    // تقييم الأداء العام
    const performanceScore = this.calculatePerformanceScore(results)
    console.log(`\n🎯 تقييم الأداء: ${performanceScore}/100`)
    
    if (performanceScore >= 90) {
      console.log('🌟 ممتاز! قاعدة البيانات تعمل بشكل مثالي')
    } else if (performanceScore >= 70) {
      console.log('👍 جيد! الأداء مقبول')
    } else {
      console.log('⚠️ يحتاج تحسين! قد تكون هناك مشاكل في الأداء')
    }
  }

  private calculatePerformanceScore(results: any[]): number {
    if (results.length === 0) return 0
    
    const successfulTests = results.filter(r => r.success)
    if (successfulTests.length === 0) return 0
    
    // حساب النسبة المئوية للاختبارات الناجحة
    const successRate = (successfulTests.length / results.length) * 100
    
    // حساب نسبة الأداء (الوقت الفعلي مقابل المتوقع)
    const performanceRate = successfulTests.reduce((sum, r) => {
      const ratio = Math.min(r.expectedTime / r.duration, 1)
      return sum + ratio
    }, 0) / successfulTests.length * 100
    
    // الجمع بين النجاح والأداء
    return Math.round((successRate * 0.6) + (performanceRate * 0.4))
  }

  async testConnection() {
    console.log('🔌 اختبار الاتصال بقاعدة البيانات...')
    
    try {
      const startTime = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`✅ الاتصال ناجح! الوقت: ${duration}ms`)
      return true
    } catch (error) {
      console.log(`❌ فشل الاتصال: ${error.message}`)
      return false
    }
  }

  async cleanup() {
    try {
      // حذف بيانات الاختبار
      await prisma.articles.deleteMany({
        where: {
          id: { startsWith: 'test-' }
        }
      })
      console.log('🧹 تم تنظيف بيانات الاختبار')
    } catch (error) {
      console.log('⚠️ فشل في تنظيف بيانات الاختبار')
    }
  }
}

async function main() {
  const tester = new DatabasePerformanceTester()
  
  // اختبار الاتصال أولاً
  const connectionOk = await tester.testConnection()
  if (!connectionOk) {
    console.log('❌ لا يمكن إجراء اختبارات الأداء بدون اتصال')
    process.exit(1)
  }
  
  // تشغيل جميع الاختبارات
  await tester.runAllTests()
  
  // تنظيف
  await tester.cleanup()
  
  await prisma.$disconnect()
}

main().catch(console.error) 