'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* أيقونة الخطأ */}
        <div className="mb-8 relative inline-block">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
        </div>
        
        {/* عنوان الخطأ */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          عذراً، حدث خطأ!
        </h1>
        
        {/* وصف الخطأ */}
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          حدث خطأ غير متوقع في لوحة التحكم. لا تقلق، فريقنا يعمل على حل المشكلة.
        </p>
        
        {/* الأزرار */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-5 h-5" />
            إعادة المحاولة
          </button>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            <Home className="w-5 h-5" />
            الصفحة الرئيسية
          </Link>
        </div>
        
        {/* تفاصيل الخطأ في وضع التطوير */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8">
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
                تفاصيل تقنية (للمطورين)
              </summary>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all mb-2">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
                {error.digest && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            </details>
          </div>
        )}
        
        {/* نصيحة إضافية */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 نصيحة: إذا استمرت المشكلة، حاول تحديث الصفحة أو مسح ذاكرة التخزين المؤقت للمتصفح.
          </p>
        </div>
      </div>
    </div>
  )
} 