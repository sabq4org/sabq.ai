"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";

interface AnalyticsData {
  summary: {
    totalViews: number;
    uniqueViews: number;
    avgReadingTime: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    bounceRate: number;
  };
  topArticles: Array<{
    content_id: string;
    title: string;
    views: number;
    unique_views: number;
    avg_time: number;
    bounce_rate: number;
  }>;
  deviceStats: Array<{
    device_type: string;
    _count: { _all: number };
  }>;
  eventTypeStats: Array<{
    event_type: string;
    _count: { _all: number };
  }>;
  categoryStats: Array<{
    name: string;
    id: string;
    views: number;
  }>;
  viewTrend: Array<{
    date: string;
    views: number;
  }>;
  period: {
    from: string;
    to: string;
    period: string;
  };
}

interface AnalyticsDashboardProps {
  initialPeriod?: string;
  categoryId?: string;
  showExportOptions?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsDashboard({ 
  initialPeriod = '30d', 
  categoryId,
  showExportOptions = true 
}: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(initialPeriod);
  const [selectedTab, setSelectedTab] = useState('overview');

  // جلب البيانات
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        period,
        ...(categoryId && { category_id: categoryId })
      });
      
      const response = await fetch(`/api/analytics/summary?${params}`);
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات');
      }
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('خطأ في جلب التحليلات:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, categoryId]);

  // تصدير البيانات
  const handleExport = async (format: 'csv' | 'json', type: 'articles' | 'users' | 'events' | 'summary') => {
    try {
      const params = new URLSearchParams({
        period,
        format,
        type,
        ...(categoryId && { category_id: categoryId })
      });
      
      const response = await fetch(`/api/analytics/export?${params}`);
      if (!response.ok) {
        throw new Error('فشل في تصدير البيانات');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${type}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      alert('حدث خطأ في تصدير البيانات');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">جاري تحميل التحليلات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <h3 className="text-red-800 font-medium">خطأ في تحميل البيانات</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحليلات الذكية</h1>
          <p className="text-gray-600 mt-1">
            البيانات من {new Date(data.period.from).toLocaleDateString('ar-SA')} إلى{' '}
            {new Date(data.period.to).toLocaleDateString('ar-SA')}
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* فلتر الفترة الزمنية */}
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="24h">آخر 24 ساعة</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
            <option value="all">جميع البيانات</option>
          </select>

          {/* أزرار التصدير */}
          {showExportOptions && (
            <div className="relative group">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                تصدير البيانات
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button 
                  onClick={() => handleExport('csv', 'summary')}
                  className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  ملخص (CSV)
                </button>
                <button 
                  onClick={() => handleExport('json', 'articles')}
                  className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  المقالات (JSON)
                </button>
                <button 
                  onClick={() => handleExport('csv', 'events')}
                  className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  الأحداث (CSV)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          {[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'articles', label: 'المقالات' },
            { id: 'behavior', label: 'السلوك' },
            { id: 'devices', label: 'الأجهزة' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* نظرة عامة */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* الإحصائيات السريعة */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="إجمالي المشاهدات"
              value={data.summary.totalViews.toLocaleString('ar-SA')}
              icon="👁️"
              color="blue"
            />
            <StatCard
              title="المشاهدات الفريدة"
              value={data.summary.uniqueViews.toLocaleString('ar-SA')}
              icon="👥"
              color="green"
            />
            <StatCard
              title="متوسط وقت القراءة"
              value={`${data.summary.avgReadingTime} ث`}
              icon="⏱️"
              color="yellow"
            />
            <StatCard
              title="معدل الارتداد"
              value={`${data.summary.bounceRate}%`}
              icon="↩️"
              color="red"
            />
          </div>

          {/* اتجاه المشاهدات */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">اتجاه المشاهدات</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.viewTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ar-SA', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                                 <Tooltip 
                   labelFormatter={(value: any) => new Date(value).toLocaleDateString('ar-SA')}
                   formatter={(value: any) => [`${value} مشاهدة`, 'المشاهدات']}
                 />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* المقالات */}
      {selectedTab === 'articles' && (
        <div className="space-y-6">
          {/* أكثر المقالات مشاهدة */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">أكثر المقالات مشاهدة</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.topArticles.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="title" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'views') return [`${value} مشاهدة`, 'المشاهدات'];
                    if (name === 'unique_views') return [`${value} مشاهدة فريدة`, 'المشاهدات الفريدة'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="views" fill="#3b82f6" name="views" />
                <Bar dataKey="unique_views" fill="#10b981" name="unique_views" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* إحصائيات التصنيفات */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">المشاهدات حسب التصنيف</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categoryStats.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                                     label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="views"
                >
                  {data.categoryStats.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} مشاهدة`, 'المشاهدات']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* السلوك */}
      {selectedTab === 'behavior' && (
        <div className="space-y-6">
          {/* إحصائيات التفاعل */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="إجمالي الإعجابات"
              value={data.summary.totalLikes.toLocaleString('ar-SA')}
              icon="❤️"
              color="red"
            />
            <StatCard
              title="إجمالي المشاركات"
              value={data.summary.totalShares.toLocaleString('ar-SA')}
              icon="📤"
              color="blue"
            />
            <StatCard
              title="إجمالي التعليقات"
              value={data.summary.totalComments.toLocaleString('ar-SA')}
              icon="💬"
              color="green"
            />
          </div>

          {/* أنواع الأحداث */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">توزيع الأحداث</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.eventTypeStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event_type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} حدث`, 'عدد الأحداث']} />
                <Bar dataKey="_count._all" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* الأجهزة */}
      {selectedTab === 'devices' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">توزيع الأجهزة</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.deviceStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                                     label={({ device_type, percent }: any) => `${device_type} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="_count._all"
                >
                  {data.deviceStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} مستخدم`, 'عدد المستخدمين']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// مكون الإحصائيات السريعة
function StatCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string; 
  icon: string; 
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
} 