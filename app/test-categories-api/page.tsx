'use client';

import { useState, useEffect } from 'react';

export default function TestCategoriesAPI() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('🔍 جاري جلب التصنيفات...');
        setLoading(true);
        
        const response = await fetch('/api/categories?is_active=true');
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        const data = await response.json();
        console.log('📦 البيانات المستلمة:', data);
        
        setApiResponse(data);
        
        if (data.success) {
          const categoriesList = data.categories || [];
          console.log(`✅ تم جلب ${categoriesList.length} تصنيف`);
          setCategories(categoriesList);
        } else {
          setError(data.error || 'فشل في جلب التصنيفات');
        }
      } catch (err) {
        console.error('❌ خطأ في جلب التصنيفات:', err);
        setError(err instanceof Error ? err.message : 'خطأ غير معروف');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">اختبار API التصنيفات</h1>
        
        {/* حالة التحميل */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-700">جاري تحميل التصنيفات...</p>
          </div>
        )}
        
        {/* رسالة الخطأ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-bold mb-2">خطأ:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {/* عرض الاستجابة الخام */}
        {apiResponse && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-bold mb-2">استجابة API:</h2>
            <pre className="text-sm overflow-auto bg-white p-3 rounded">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
        
        {/* عرض التصنيفات */}
        {!loading && categories.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">التصنيفات ({categories.length}):</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <div 
                  key={category.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  style={{ borderRightColor: category.color, borderRightWidth: '4px' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="text-lg font-bold">{category.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>ID: {category.id}</span>
                    <span>Slug: {category.slug}</span>
                    <span>Order: {category.order_index}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* لا توجد تصنيفات */}
        {!loading && !error && categories.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">لا توجد تصنيفات متاحة</p>
          </div>
        )}
      </div>
    </div>
  );
} 