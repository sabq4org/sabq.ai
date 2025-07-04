'use client'

import { useState } from 'react'
import { Calendar, Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface TestResult {
  success: boolean
  data?: any
  error?: string
  status?: number
}

interface TestResults {
  fetch?: TestResult
  generate?: TestResult
  manual?: TestResult
}

export default function TestDailyDosesPage() {
  const [testResults, setTestResults] = useState<TestResults>({})
  const [loading, setLoading] = useState<string | null>(null)

  // اختبار جلب الجرعة الحالية
  const testFetchDose = async () => {
    setLoading('fetch')
    try {
      const response = await fetch('/api/daily-doses')
      const data = await response.json()
      
      setTestResults((prev: any) => ({
        ...prev,
        fetch: {
          success: response.ok,
          data: data,
          status: response.status
        }
      }))
    } catch (error: any) {
      setTestResults((prev: any) => ({
        ...prev,
        fetch: {
          success: false,
          error: error.message
        }
      }))
    }
    setLoading(null)
  }

  // اختبار توليد جرعة بالذكاء الاصطناعي
  const testGenerateDose = async () => {
    setLoading('generate')
    try {
      const now = new Date()
      const hour = now.getHours()
      let period = 'morning'
      
      if (hour >= 11 && hour < 16) {
        period = 'afternoon'
      } else if (hour >= 16 && hour < 19) {
        period = 'evening'
      } else if (hour >= 19 || hour < 6) {
        period = 'night'
      }
      
      const response = await fetch('/api/daily-doses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: now.toISOString().split('T')[0],
          period: period
        })
      })
      
      const data = await response.json()
      
      setTestResults(prev => ({
        ...prev,
        generate: {
          success: response.ok && data.success,
          data: data,
          status: response.status
        }
      }))
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        generate: {
          success: false,
          error: error.message
        }
      }))
    }
    setLoading(null)
  }

  // اختبار إنشاء جرعة يدوية
  const testCreateManualDose = async () => {
    setLoading('manual')
    try {
      const response = await fetch('/api/daily-doses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          period: 'evening',
          title: 'جرعة تجريبية',
          subtitle: 'هذه جرعة تجريبية للاختبار',
          date: new Date().toISOString().split('T')[0],
          contents: [
            {
              contentType: 'article',
              title: 'خبر تجريبي',
              summary: 'ملخص الخبر التجريبي',
              displayOrder: 0
            }
          ]
        })
      })
      
      const data = await response.json()
      
      setTestResults(prev => ({
        ...prev,
        manual: {
          success: response.ok,
          data: data,
          status: response.status
        }
      }))
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        manual: {
          success: false,
          error: error.message
        }
      }))
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          🧪 اختبار نظام الجرعات اليومية
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* اختبار جلب الجرعة */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              جلب الجرعة الحالية
            </h2>
            
            <button
              onClick={testFetchDose}
              disabled={loading === 'fetch'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading === 'fetch' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الاختبار...
                </>
              ) : (
                'اختبار الجلب'
              )}
            </button>

            {testResults.fetch && (
              <div className="mt-4">
                {testResults.fetch.success ? (
                  <div className="text-green-600">
                    <CheckCircle className="w-5 h-5 inline ml-1" />
                    نجح الاختبار
                    {testResults.fetch.data && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>الفترة: {testResults.fetch.data.period}</p>
                        <p>العنوان: {testResults.fetch.data.title}</p>
                        <p>المحتويات: {testResults.fetch.data.contents?.length || 0}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600">
                    <AlertCircle className="w-5 h-5 inline ml-1" />
                    فشل الاختبار
                    <p className="text-sm">{testResults.fetch.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* اختبار التوليد بالذكاء الاصطناعي */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              توليد بالذكاء الاصطناعي
            </h2>
            
            <button
              onClick={testGenerateDose}
              disabled={loading === 'generate'}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading === 'generate' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                'توليد جرعة جديدة'
              )}
            </button>

            {testResults.generate && (
              <div className="mt-4">
                {testResults.generate.success ? (
                  <div className="text-green-600">
                    <CheckCircle className="w-5 h-5 inline ml-1" />
                    تم التوليد بنجاح
                    {testResults.generate.data?.dose && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>ID: {testResults.generate.data.dose.id}</p>
                        <p>الفترة: {testResults.generate.data.dose.period}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600">
                    <AlertCircle className="w-5 h-5 inline ml-1" />
                    فشل التوليد
                    <p className="text-sm">{testResults.generate.error || testResults.generate.data?.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* اختبار الإنشاء اليدوي */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              إنشاء جرعة يدوية
            </h2>
            
            <button
              onClick={testCreateManualDose}
              disabled={loading === 'manual'}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading === 'manual' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء جرعة تجريبية'
              )}
            </button>

            {testResults.manual && (
              <div className="mt-4">
                {testResults.manual.success ? (
                  <div className="text-green-600">
                    <CheckCircle className="w-5 h-5 inline ml-1" />
                    تم الإنشاء بنجاح
                  </div>
                ) : (
                  <div className="text-red-600">
                    <AlertCircle className="w-5 h-5 inline ml-1" />
                    فشل الإنشاء
                    <p className="text-sm">{testResults.manual.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* روابط مفيدة */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">🔗 روابط مفيدة</h2>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <a href="/" className="text-blue-600 hover:underline">
              🏠 الصفحة الرئيسية
            </a>
            <a href="/test-time-slots" className="text-blue-600 hover:underline">
              ⏰ اختبار الفترات الزمنية
            </a>
            <a href="/daily-dose" className="text-blue-600 hover:underline">
              📖 صفحة الجرعة الكاملة
            </a>
            <a href="/dashboard/daily-doses" className="text-blue-600 hover:underline">
              ⚙️ لوحة تحكم الجرعات
            </a>
          </div>
        </div>

        {/* معلومات النظام */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="font-bold mb-2">📌 ملاحظات مهمة:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>تأكد من وجود OPENAI_API_KEY في ملف .env.local للتوليد بالذكاء الاصطناعي</li>
            <li>يجب وجود مقالات منشورة في قاعدة البيانات للتوليد التلقائي</li>
            <li>الفترات الزمنية: صباح (6-11)، ظهر (11-16)، مساء (16-19)، ليل (19-6)</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 