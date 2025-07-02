'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Eye,
  Activity,
  Award,
  BarChart3,
  Brain,
  Clock,
  Edit,
  Trash2,
  Share2,
  Heart,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Target
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// أنواع البيانات
interface KPIData {
  publishedThisWeek: number;
  currentDrafts: number;
  mostActiveCategory: { name: string; count: number };
  mostActiveEditor: { name: string; count: number };
  dailyPublishingRate: number;
  editRateBeforePublish: number;
}

interface EditorActivity {
  id: string;
  name: string;
  articleCount: number;
  aiUsageCount: number;
  weeklyRate: number;
  avatar?: string;
}

interface CategoryStats {
  id: number;
  name: string;
  color: string;
  articleCount: number;
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
}

interface TimeSeriesData {
  date: string;
  published: number;
  edited: number;
  deleted: number;
  interactions: number;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  type: string;
  articleTitle?: string;
  timestamp: string;
}

export default function NewsInsightsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [editorsActivity, setEditorsActivity] = useState<EditorActivity[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year

  // استرجاع حالة الوضع الليلي
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // تحميل البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // جلب جميع البيانات بشكل متوازي
        const [kpiRes, editorsRes, categoriesRes, timeSeriesRes, logsRes] = await Promise.all([
          fetch('/api/analytics/kpi'),
          fetch('/api/analytics/editors'),
          fetch('/api/analytics/categories'),
          fetch(`/api/analytics/timeseries?period=${selectedPeriod}`),
          fetch('/api/analytics/activity-logs')
        ]);

        // معالجة الاستجابات
        if (kpiRes.ok) {
          const kpiData = await kpiRes.json();
          setKpiData(kpiData);
        }

        if (editorsRes.ok) {
          const editorsData = await editorsRes.json();
          setEditorsActivity(editorsData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategoryStats(categoriesData);
        }

        if (timeSeriesRes.ok) {
          const timeData = await timeSeriesRes.json();
          setTimeSeriesData(timeData);
        }

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setActivityLogs(logsData);
        }

      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        toast.error('فشل تحميل بعض البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  // مكون KPI Card
  const KPICard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend,
    bgColor,
    iconColor 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: { value: number; isUp: boolean };
    bgColor: string;
    iconColor: string;
  }) => (
    <div className={`rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-lg ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.isUp ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isUp ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {trend.value}%
          </div>
        )}
      </div>
      <div>
        <h3 className={`text-2xl font-bold mb-1 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>{value}</h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        {subtitle && (
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );

  // رسم بياني بسيط للتوزيع
  const SimplePieChart = ({ data }: { data: CategoryStats[] }) => {
    const total = data.reduce((sum, item) => sum + item.articleCount, 0);
    let currentAngle = 0;
    
    return (
      <div className="relative w-64 h-64 mx-auto">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.articleCount / total) * 100;
            const angle = (percentage / 100) * 360;
            const largeArc = angle > 180 ? 1 : 0;
            
            const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
            
            currentAngle += angle;
            
            const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
            
            return (
              <path
                key={index}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={item.color}
                stroke="white"
                strokeWidth="1"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {total}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              إجمالي المقالات
            </div>
          </div>
        </div>
      </div>
    );
  };

  // عرض حالة التحميل
  if (loading) {
    return (
      <div className={`p-8 ${darkMode ? 'bg-gray-900' : ''}`}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              جارٍ تحميل البيانات التحليلية...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''}`}>
      {/* الرأس */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            تحليلات الأخبار
          </h1>
          <p className={`transition-colors duration-300 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            نظرة شاملة على أداء المحتوى التحريري ونشاط المحررين
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* اختيار الفترة الزمنية */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
            <option value="year">آخر سنة</option>
          </select>
          
          <Link
            href="/dashboard/news"
            className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${
              darkMode 
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            العودة لإدارة الأخبار
          </Link>
        </div>
      </div>

      {/* مؤشرات الأداء الرئيسية KPIs */}
      <div className="grid grid-cols-6 gap-6 mb-8">
        <KPICard
          title="منشور هذا الأسبوع"
          value={kpiData?.publishedThisWeek || 0}
          subtitle="مقال جديد"
          icon={FileText}
          trend={{ value: 12, isUp: true }}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        
        <KPICard
          title="المسودات الحالية"
          value={kpiData?.currentDrafts || 0}
          subtitle="في انتظار النشر"
          icon={Edit}
          bgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        
        <KPICard
          title="أكثر تصنيف نشاطاً"
          value={kpiData?.mostActiveCategory?.name || '-'}
          subtitle={`${kpiData?.mostActiveCategory?.count || 0} مقال`}
          icon={Target}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        
        <KPICard
          title="أكثر محرر نشاطاً"
          value={kpiData?.mostActiveEditor?.name || '-'}
          subtitle={`${kpiData?.mostActiveEditor?.count || 0} مقال`}
          icon={Award}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        
        <KPICard
          title="معدل النشر اليومي"
          value={kpiData?.dailyPublishingRate?.toFixed(1) || '0'}
          subtitle="مقال/يوم"
          icon={TrendingUp}
          trend={{ value: 8, isUp: true }}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        
        <KPICard
          title="معدل التعديل قبل النشر"
          value={`${kpiData?.editRateBeforePublish?.toFixed(0) || 0}%`}
          subtitle="من المقالات"
          icon={CheckCircle}
          bgColor="bg-teal-100"
          iconColor="text-teal-600"
        />
      </div>

      {/* القسم الأول: المحررون الأكثر نشاطاً */}
      <div className={`rounded-2xl shadow-sm border p-6 mb-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold flex items-center gap-3 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <Users className="w-6 h-6 text-blue-600" />
            المحررون الأكثر نشاطاً
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-right py-3 px-4 text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>المحرر</th>
                <th className={`text-center py-3 px-4 text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>عدد المقالات</th>
                <th className={`text-center py-3 px-4 text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>استخدام الذكاء الاصطناعي</th>
                <th className={`text-center py-3 px-4 text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>معدل النشر/أسبوع</th>
              </tr>
            </thead>
            <tbody>
              {editorsActivity.map((editor, index) => (
                <tr key={editor.id} className={`border-b ${
                  darkMode ? 'border-gray-700' : 'border-gray-100'
                } hover:bg-opacity-50 transition-colors`}>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'][index % 4]
                      }`}>
                        {editor.name.charAt(0)}
                      </div>
                      <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {editor.name}
                      </span>
                    </div>
                  </td>
                  <td className={`text-center py-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {editor.articleCount}
                  </td>
                  <td className="text-center py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {editor.aiUsageCount} مرة
                      </span>
                    </div>
                  </td>
                  <td className={`text-center py-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {editor.weeklyRate.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* القسم الثاني: التوزيع حسب التصنيف */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* الرسم البياني الدائري */}
        <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <BarChart3 className="w-6 h-6 text-purple-600" />
            توزيع المقالات حسب التصنيف
          </h3>
          
          <SimplePieChart data={categoryStats} />
          
          {/* قائمة التصنيفات */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {categoryStats.slice(0, 6).map((category) => (
              <div key={category.id} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: category.color }}
                />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {category.name} ({category.articleCount})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* جدول التفاعل حسب التصنيف */}
        <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <Activity className="w-6 h-6 text-green-600" />
            التفاعل حسب التصنيف
          </h3>
          
          <div className="space-y-3">
            {categoryStats.map((category) => (
              <div key={category.id} className={`p-4 rounded-lg border ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {category.name}
                    </span>
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {category.articleCount} مقال
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Eye className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {category.viewsCount.toLocaleString()}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      مشاهدة
                    </div>
                  </div>
                  
                  <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Heart className="w-4 h-4 mx-auto mb-1 text-red-500" />
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {category.likesCount.toLocaleString()}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      إعجاب
                    </div>
                  </div>
                  
                  <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Share2 className="w-4 h-4 mx-auto mb-1 text-green-500" />
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {category.sharesCount.toLocaleString()}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      مشاركة
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* القسم الثالث: حركة الأخبار بمرور الوقت */}
      <div className={`rounded-2xl shadow-sm border p-6 mb-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>
          <TrendingUp className="w-6 h-6 text-orange-600" />
          حركة الأخبار بمرور الوقت
        </h3>
        
        {/* رسم بياني بسيط للخط الزمني */}
        <div className="h-64 relative">
          <div className="absolute inset-0 flex items-end justify-between px-4">
            {timeSeriesData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(data.published / 20) * 100}%`, minHeight: '4px' }}
                    title={`نشر: ${data.published}`}
                  />
                  <div 
                    className="w-full bg-yellow-500"
                    style={{ height: `${(data.edited / 20) * 100}%`, minHeight: '4px' }}
                    title={`تعديل: ${data.edited}`}
                  />
                  <div 
                    className="w-full bg-red-500 rounded-b"
                    style={{ height: `${(data.deleted / 20) * 100}%`, minHeight: '4px' }}
                    title={`حذف: ${data.deleted}`}
                  />
                </div>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {new Date(data.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* مفتاح الألوان */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>نشر</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>تعديل</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>حذف</span>
          </div>
        </div>
      </div>

      {/* القسم الرابع: سجل النشاط التحريري */}
      <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>
          <Clock className="w-6 h-6 text-teal-600" />
          سجل النشاط التحريري
        </h3>
        
        <div className="space-y-3">
          {activityLogs.map((log) => (
            <div key={log.id} className={`flex items-center justify-between p-4 rounded-lg border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  log.action === 'نشر' ? 'bg-green-100' :
                  log.action === 'تعديل' ? 'bg-yellow-100' :
                  log.action === 'حذف' ? 'bg-red-100' :
                  'bg-gray-100'
                }`}>
                  {log.action === 'نشر' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {log.action === 'تعديل' && <Edit className="w-5 h-5 text-yellow-600" />}
                  {log.action === 'حذف' && <Trash2 className="w-5 h-5 text-red-600" />}
                  {log.action === 'مشاركة' && <Share2 className="w-5 h-5 text-blue-600" />}
                </div>
                
                <div>
                  <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {log.user} - {log.action}
                  </div>
                  {log.articleTitle && (
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {log.articleTitle}
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date(log.timestamp).toLocaleString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short'
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 