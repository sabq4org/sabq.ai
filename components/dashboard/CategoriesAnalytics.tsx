import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Eye, Clock, Users } from 'lucide-react';
import { Category } from '@/types/category';

interface CategoriesAnalyticsProps {
  categories: Category[];
  darkMode?: boolean;
}

export default function CategoriesAnalytics({ categories, darkMode = false }: CategoriesAnalyticsProps) {
  // حساب الإحصائيات
  const totalCategories = categories.length;
  const activeCategories = categories.filter(cat => cat.is_active).length;
  const totalArticles = categories.reduce((sum, cat) => sum + (cat.articles_count || cat.article_count || 0), 0);
  const avgArticlesPerCategory = totalCategories > 0 ? Math.round(totalArticles / totalCategories) : 0;

  // أكثر التصنيفات نشاطاً
  const topCategories = [...categories]
    .sort((a, b) => (b.articles_count || b.article_count || 0) - (a.articles_count || a.article_count || 0))
    .slice(0, 10)
    .map(cat => ({
      name: cat.name_ar || cat.name,
      articles: cat.articles_count || cat.article_count || 0,
      color: cat.color || cat.color_hex || '#3B82F6'
    }));

  // توزيع المقالات حسب التصنيف (للرسم الدائري)
  const pieData = categories
    .filter(cat => (cat.articles_count || cat.article_count || 0) > 0)
    .map(cat => ({
      name: cat.name_ar || cat.name,
      value: cat.articles_count || cat.article_count || 0,
      color: cat.color || cat.color_hex || '#3B82F6'
    }));

  // بطاقة الإحصائية
  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend 
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down';
  }) => (
    <div className={`p-6 rounded-xl border ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${
          darkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <Icon className={`w-6 h-6 ${
            darkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {change}
          </div>
        )}
      </div>
      <h3 className={`text-2xl font-bold ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>{value}</h3>
      <p className={`text-sm mt-1 ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>{title}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي التصنيفات"
          value={totalCategories}
          icon={Activity}
        />
        <StatCard
          title="التصنيفات النشطة"
          value={activeCategories}
          icon={Eye}
          change={`${Math.round((activeCategories / totalCategories) * 100)}%`}
          trend="up"
        />
        <StatCard
          title="إجمالي المقالات"
          value={totalArticles}
          icon={Users}
        />
        <StatCard
          title="متوسط المقالات"
          value={avgArticlesPerCategory}
          icon={Clock}
        />
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* رسم بياني شريطي - أكثر التصنيفات نشاطاً */}
        <div className={`p-6 rounded-xl border ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>أكثر التصنيفات نشاطاً</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCategories}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
              />
              <YAxis tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px'
                }}
                labelStyle={{ color: darkMode ? '#F3F4F6' : '#111827' }}
              />
              <Bar 
                dataKey="articles" 
                fill="#3B82F6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* رسم دائري - توزيع المقالات */}
        <div className={`p-6 rounded-xl border ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>توزيع المقالات حسب التصنيف</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* جدول التصنيفات التفصيلي */}
      <div className={`rounded-xl border overflow-hidden ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className={`p-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>تفاصيل جميع التصنيفات</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-right text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>التصنيف</th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>المقالات</th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>الحالة</th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>آخر تحديث</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              darkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {categories.map((category) => (
                <tr key={category.id} className={
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ 
                          backgroundColor: category.color || category.color_hex || '#3B82F6',
                          color: '#fff'
                        }}
                      >
                        {category.icon || '📁'}
                      </div>
                      <div>
                        <div className={`font-medium ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>{category.name_ar || category.name}</div>
                        <div className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>/{category.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-center ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {category.articles_count || category.article_count || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      category.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.is_active ? 'نشط' : 'مخفي'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-center text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {new Date(category.updated_at || new Date()).toLocaleDateString('ar-SA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 