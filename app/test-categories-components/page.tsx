'use client';

import { useState, useEffect } from 'react';
import { Tag, X, BookOpen, Calendar, Clock, Eye, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// أيقونات التصنيفات
const categoryIcons: any = {
  'تقنية': '💻',
  'رياضة': '⚽',
  'اقتصاد': '💰',
  'سياسة': '🏛️',
  'محليات': '🗺️',
  'ثقافة ومجتمع': '🎭',
  'مقالات رأي': '✍️',
  'منوعات': '🎉',
  'default': '📁'
};

export default function TestCategoriesComponents() {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | string | null>(null);
  const [categoryArticles, setCategoryArticles] = useState<any[]>([]);
  const [categoryArticlesLoading, setCategoryArticlesLoading] = useState<boolean>(false);
  const darkMode = false; // للاختبار

  // جلب التصنيفات
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        console.log('🔍 جلب التصنيفات...');
        
        const res = await fetch('/api/categories?is_active=true');
        console.log('📡 Response status:', res.status);
        
        const json = await res.json();
        console.log('📦 البيانات المستلمة:', json);
        
        const list = Array.isArray(json) ? json : (json.categories ?? []);
        console.log(`✅ عدد التصنيفات: ${list.length}`);
        
        setCategories(list);
      } catch (err) {
        console.error('❌ خطأ في جلب التصنيفات:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // دالة اختيار التصنيف
  const handleCategoryClick = async (categoryId: number | string) => {
    console.log('🔘 تم اختيار التصنيف:', categoryId);
    setSelectedCategory(categoryId);
    setCategoryArticlesLoading(true);
    
    try {
      const res = await fetch(`/api/articles?status=published&category_id=${categoryId}&limit=12`);
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.articles ?? []);
      setCategoryArticles(list);
    } catch (err) {
      console.error('خطأ في جلب مقالات التصنيف:', err);
    } finally {
      setCategoryArticlesLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">اختبار مكونات التصنيفات</h1>
        
        {/* معلومات التشخيص */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="font-bold mb-2">معلومات التشخيص:</h2>
          <ul className="space-y-1 text-sm">
            <li>• حالة التحميل: {categoriesLoading ? '⏳ جاري التحميل' : '✅ تم التحميل'}</li>
            <li>• عدد التصنيفات: {categories.length}</li>
            <li>• التصنيف المختار: {selectedCategory || 'لا يوجد'}</li>
            <li>• عدد مقالات التصنيف: {categoryArticles.length}</li>
          </ul>
        </div>

        {/* شريط التصنيفات */}
        <section className="mb-8">
          <div className="rounded-3xl p-6 bg-blue-50 border border-blue-200">
            <div className="text-center mb-6">
              <div className="mb-4">
                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-xl bg-gradient-to-br from-blue-500 to-blue-700">
                  <Tag className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-3 text-gray-800">
                استكشف بحسب التصنيفات
              </h2>
              
              <p className="text-sm text-gray-600">
                اختر التصنيف الذي يهمك لتصفح الأخبار المتخصصة
              </p>
            </div>

            {categoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : categories.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {categories.map((category: any) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className={`group px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 relative ${
                        selectedCategory === category.id 
                          ? 'bg-blue-500 text-white border-2 border-blue-400 shadow-lg' 
                          : 'bg-white hover:bg-white text-gray-700 hover:text-blue-600 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                          {category.icon || categoryIcons[category.name_ar] || categoryIcons['default']}
                        </span>
                        <span className="whitespace-nowrap">{category.name_ar || category.name}</span>
                        <span className={`text-xs ${
                          selectedCategory === category.id 
                            ? 'text-white/90' 
                            : 'text-gray-500 opacity-60'
                        }`}>
                          ({category.articles_count || 0})
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* عرض المقالات المرتبطة بالتصنيف المختار */}
                {selectedCategory && (
                  <div className="mt-8 p-6 rounded-3xl shadow-lg bg-white border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        مقالات {categories.find(c => c.id === selectedCategory)?.name_ar}
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setCategoryArticles([]);
                        }}
                        className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>

                    {categoryArticlesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    ) : categoryArticles.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryArticles.map((article: any) => (
                          <div key={article.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h4 className="font-bold text-sm mb-2 line-clamp-2">{article.title}</h4>
                            <p className="text-xs text-gray-500">
                              {new Date(article.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>لا توجد مقالات منشورة في هذا التصنيف حالياً</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">لا توجد تصنيفات متاحة حالياً</p>
              </div>
            )}
          </div>
        </section>

        {/* عرض البيانات الخام */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="font-bold mb-2">البيانات الخام للتصنيفات:</h3>
          <pre className="text-xs overflow-auto bg-white p-3 rounded">
            {JSON.stringify(categories, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 