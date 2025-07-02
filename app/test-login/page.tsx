'use client';

import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/cookies';

export default function TestLoginPage() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results: any = {};

    // 1. فحص الكوكيز
    try {
      const userCookie = getCookie('user');
      const authToken = getCookie('auth-token');
      results.cookies = {
        userExists: !!userCookie,
        authTokenExists: !!authToken,
        userValue: userCookie ? 'موجود' : 'غير موجود',
        authTokenValue: authToken ? 'موجود' : 'غير موجود'
      };
    } catch (e) {
      results.cookies = { error: e instanceof Error ? e.message : 'خطأ غير معروف' };
    }

    // 2. فحص localStorage
    try {
      const userStorage = localStorage.getItem('user');
      results.localStorage = {
        userExists: !!userStorage,
        userValue: userStorage ? JSON.parse(userStorage) : null
      };
    } catch (e) {
      results.localStorage = { error: e instanceof Error ? e.message : 'خطأ غير معروف' };
    }

    // 3. فحص API
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      const data = await response.json();
      results.api = {
        status: response.status,
        success: response.ok,
        data: data
      };
    } catch (e) {
      results.api = { error: e instanceof Error ? e.message : 'خطأ غير معروف' };
    }

    // 4. فحص البيئة
    results.environment = {
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      url: window.location.href,
      protocol: window.location.protocol
    };

    setDiagnostics(results);
    setLoading(false);
  };

  const clearAllData = () => {
    // مسح localStorage
    localStorage.clear();
    
    // مسح sessionStorage
    sessionStorage.clear();
    
    // مسح الكوكيز
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    alert('تم مسح جميع البيانات! سيتم إعادة تحميل الصفحة...');
    window.location.reload();
  };

  if (loading) {
    return <div className="p-8">جارٍ التشخيص...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">تشخيص نظام تسجيل الدخول</h1>
        
        <div className="space-y-6">
          {/* الكوكيز */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🍪 الكوكيز</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(diagnostics.cookies, null, 2)}
            </pre>
          </div>

          {/* localStorage */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">💾 localStorage</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(diagnostics.localStorage, null, 2)}
            </pre>
          </div>

          {/* API */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🌐 API Response</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(diagnostics.api, null, 2)}
            </pre>
          </div>

          {/* البيئة */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">⚙️ البيئة</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(diagnostics.environment, null, 2)}
            </pre>
          </div>

          {/* الأزرار */}
          <div className="flex gap-4">
            <button
              onClick={clearAllData}
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
            >
              مسح جميع البيانات
            </button>
            <button
              onClick={runDiagnostics}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              إعادة التشخيص
            </button>
            <a
              href="/login"
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 inline-block"
            >
              الذهاب لصفحة الدخول
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 