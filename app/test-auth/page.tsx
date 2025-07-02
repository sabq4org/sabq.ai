'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export default function TestAuthPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // جمع معلومات التشخيص
    const info: any = {
      isLoggedIn,
      isLoading,
      user: user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null,
      timestamp: new Date().toISOString()
    };

    // فحص الكوكيز
    if (typeof document !== 'undefined') {
      info.cookies = {
        user: document.cookie.includes('user='),
        authToken: document.cookie.includes('auth-token='),
        token: document.cookie.includes('token=')
      };
    }

    // فحص localStorage
    if (typeof window !== 'undefined') {
      info.localStorage = {
        user: !!localStorage.getItem('user'),
        userId: !!localStorage.getItem('user_id')
      };
    }

    setDebugInfo(info);
  }, [user, isLoggedIn, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جاري التحقق من حالة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
          اختبار حالة المصادقة
        </h1>

        {/* حالة تسجيل الدخول */}
        <div className={`p-6 rounded-lg mb-6 ${
          isLoggedIn 
            ? 'bg-green-100 border border-green-300 dark:bg-green-900/20 dark:border-green-700' 
            : 'bg-red-100 border border-red-300 dark:bg-red-900/20 dark:border-red-700'
        }`}>
          <h2 className="text-xl font-semibold mb-4">
            {isLoggedIn ? '✅ مسجل دخول' : '❌ غير مسجل دخول'}
          </h2>
          
          {isLoggedIn && user ? (
            <div className="space-y-2">
              <p><strong>الاسم:</strong> {user.name}</p>
              <p><strong>البريد الإلكتروني:</strong> {user.email}</p>
              <p><strong>المعرف:</strong> {user.id}</p>
              <p><strong>الدور:</strong> {user.role}</p>
            </div>
          ) : (
            <p>لا توجد معلومات مستخدم متاحة</p>
          )}
        </div>

        {/* معلومات التشخيص */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            معلومات التشخيص
          </h2>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto text-gray-800 dark:text-gray-200">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* أزرار الاختبار */}
        <div className="mt-6 space-x-4 rtl:space-x-reverse">
          {!isLoggedIn ? (
            <>
              <a 
                href="/login" 
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                تسجيل دخول
              </a>
              <a 
                href="/register" 
                className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                إنشاء حساب
              </a>
            </>
          ) : (
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              إعادة تحميل الصفحة
            </button>
          )}
        </div>

        {/* رابط العودة */}
        <div className="mt-8">
          <a 
            href="/" 
            className="text-blue-500 hover:text-blue-600 underline"
          >
            العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
} 