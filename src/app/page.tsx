'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching articles:', err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* شريط التنقل البسيط */}
      <nav className="bg-white shadow-lg sticky top-0 z-50" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">س</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">سبق الذكية</h1>
                  <p className="text-xs text-gray-500">نظام إدارة المحتوى</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link href="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                إنشاء حساب
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto py-8 px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">مرحباً بك في سبق الذكية</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">جاري تحميل المقالات...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.length > 0 ? (
              articles.map((article) => (
                <div key={article.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{article.title}</h3>
                  <p className="text-gray-600 mb-4">{article.content?.substring(0, 100)}...</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>✍️ {article.author}</span>
                    <span>📂 {article.category}</span>
                  </div>
                  <div className="mt-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      article.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {article.status === 'published' ? 'منشور' : 'مسودة'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">لا توجد مقالات حالياً</p>
              </div>
            )}
          </div>
        )}

        {/* روابط سريعة */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">استكشف المزيد</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/api/articles" className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-900">API المقالات</h4>
              <p className="text-sm text-gray-600 mt-1">استعرض واجهة برمجة التطبيقات</p>
            </Link>
            <Link href="http://localhost:8000/docs" className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div className="text-3xl mb-2">🤖</div>
              <h4 className="font-semibold text-gray-900">خدمة ML</h4>
              <p className="text-sm text-gray-600 mt-1">وثائق الذكاء الاصطناعي</p>
            </Link>
            <Link href="/health" className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div className="text-3xl mb-2">❤️</div>
              <h4 className="font-semibold text-gray-900">حالة النظام</h4>
              <p className="text-sm text-gray-600 mt-1">تحقق من صحة الخدمات</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
