'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Eye, FileText, TrendingUp, Calendar, Tag, BarChart3, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { Category } from '@/types/category';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CategoryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { darkMode } = useDarkModeContext();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (params?.id) {
      fetchCategoryDetails();
      fetchCategoryArticles();
      fetchCategoryAnalytics();
    }
  }, [params?.id]);

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/categories/${params?.id}`);
      const data = await response.json();
      if (data.success) {
        setCategory(data.category);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryArticles = async () => {
    try {
      const response = await fetch(`/api/articles?category_id=${params?.id}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const fetchCategoryAnalytics = async () => {
    // محاكاة بيانات التحليلات
    setAnalytics({
      views: [
        { date: '1 يناير', views: 1200 },
        { date: '2 يناير', views: 1500 },
        { date: '3 يناير', views: 1800 },
        { date: '4 يناير', views: 2100 },
        { date: '5 يناير', views: 1900 },
        { date: '6 يناير', views: 2400 },
        { date: '7 يناير', views: 2200 }
      ],
      engagement: [
        { type: 'مشاهدات', value: 15420 },
        { type: 'تعليقات', value: 342 },
        { type: 'مشاركات', value: 128 },
        { type: 'إعجابات', value: 567 }
      ]
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-8 text-center">
        <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>التصنيف غير موجود</p>
        <Button onClick={() => router.push('/dashboard/categories')} className="mt-4">
          العودة للتصنيفات
        </Button>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className={`p-8 ${darkMode ? 'bg-gray-900' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/categories')}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: category.color_hex }}
            >
              {category.icon}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {category.name_ar}
              </h1>
              {category.name_en && (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {category.name_en}
                </p>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/categories?edit=${category.id}`)}>
          <Edit3 className="ml-2 h-4 w-4" />
          تعديل التصنيف
        </Button>
      </div>

      {/* معلومات أساسية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                عدد المقالات
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {category.articles_count || 0}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                المشاهدات الشهرية
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                15.4K
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                معدل النمو
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                +23%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                الحالة
              </p>
              <p className={`text-lg font-semibold ${category.is_active ? 'text-green-500' : 'text-red-500'}`}>
                {category.is_active ? 'نشط' : 'غير نشط'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${category.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* مخطط المشاهدات */}
        <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            المشاهدات خلال الأسبوع الماضي
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analytics?.views || []}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="date" tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
              <YAxis tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px'
                }}
              />
              <Area type="monotone" dataKey="views" stroke="#3B82F6" fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* مخطط التفاعل */}
        <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            توزيع التفاعل
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics?.engagement || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({type, value}) => `${type} (${value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(analytics?.engagement || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* آخر المقالات */}
      <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          آخر المقالات في هذا التصنيف
        </h3>
        <div className="space-y-3">
          {articles.length > 0 ? (
            articles.map((article: any) => (
              <div key={article.id} className={`p-4 rounded-lg border ${
                darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
              } transition-colors cursor-pointer`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Users className="w-4 h-4 inline ml-1" />
                        {article.author?.name || 'غير محدد'}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Calendar className="w-4 h-4 inline ml-1" />
                        {new Date(article.created_at).toLocaleDateString('ar-SA')}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Eye className="w-4 h-4 inline ml-1" />
                        {article.views || 0} مشاهدة
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                  >
                    عرض
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              لا توجد مقالات في هذا التصنيف بعد
            </p>
          )}
        </div>
        {articles.length > 0 && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => router.push(`/dashboard/articles?category=${category.id}`)}
          >
            عرض جميع المقالات ({category.articles_count || 0})
          </Button>
        )}
      </div>

      {/* معلومات SEO */}
      {(category.meta_title || category.meta_description) && (
        <div className={`rounded-xl p-6 mt-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            معلومات SEO
          </h3>
          <div className="space-y-3">
            {category.meta_title && (
              <div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  عنوان SEO
                </p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {category.meta_title}
                </p>
              </div>
            )}
            {category.meta_description && (
              <div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  وصف SEO
                </p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {category.meta_description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 