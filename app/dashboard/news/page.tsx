'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronDown, 
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  Calendar,
  Clock,
  Zap,
  Users,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  ArrowUp,
  Newspaper,
  PenTool,
  FileText,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

type NewsStatus = 'published' | 'draft' | 'pending' | 'deleted' | 'scheduled';
type NewsItem = {
  id: string;
  title: string;
  author: string;
  author_name?: string;
  category: string | number;
  category_name?: string;
  category_color?: string;
  publishTime: string;
  publishAt?: string; // إضافة تاريخ النشر المجدول
  viewCount: number;
  lastModified: string;
  lastModifiedBy: string;
  isPinned: boolean;
  isBreaking: boolean;
  status: NewsStatus;
  rating: number;
  slug?: string;
};



// دالة لتحديد لون النص بناءً على لون الخلفية
function getContrastColor(hexColor: string): string {
  // تحويل HEX إلى RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // حساب اللمعان
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // إرجاع أسود أو أبيض حسب اللمعان
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export default function NewsManagementPage() {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);
  const { darkMode } = useDarkModeContext();
  const router = useRouter();

  // جلب التصنيفات
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?status=active');
        if (response.ok) {
          const result = await response.json();
          setCategories(result.categories || result.data || []);
        }
      } catch (err) {
        console.error('خطأ في جلب التصنيفات:', err);
      }
    };
    fetchCategories();
  }, []);

  // استرجاع البيانات الحقيقية من API
  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 بدء جلب البيانات...');
        const startTime = Date.now();
        
        const response = await fetch('/api/articles?limit=50');
        if (!response.ok) {
          throw new Error('فشل في تحميل البيانات');
        }
        
        const data = await response.json();
        console.log(`✅ تم جلب البيانات في ${Date.now() - startTime}ms`);
        
        const mapped: NewsItem[] = (data.articles || []).map((a: any) => {
          // تحديد الحالة بناءً على التاريخ
          let status = a.status as NewsStatus;
          const publishAt = a.publish_at || a.published_at;
          
          if (status === 'published' && publishAt) {
            const publishDate = new Date(publishAt);
            const now = new Date();
            if (publishDate > now) {
              status = 'scheduled';
            }
          }
          
          return {
            id: a.id,
            title: a.title,
            author: a.author_id || '—',
            author_name: a.author?.name || a.author_name || 'كاتب غير معروف',
            category: a.category_id || 0,
            category_name: a.category?.name || a.category_name || 'غير مصنف',
            category_color: a.category?.color || a.category_color || '#6B7280',
            publishTime: a.published_at ? new Date(a.published_at).toLocaleString('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : '-',
            publishAt: publishAt,
            viewCount: a.views_count || 0,
            lastModified: new Date(a.updated_at || a.created_at).toLocaleString('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            lastModifiedBy: a.editor_id || a.author_id || '—',
            isPinned: a.is_pinned || false,
            isBreaking: a.is_breaking || false,
            status: status,
            rating: 0,
            slug: a.slug
          };
        });
        
        console.log(`📊 تم تحويل ${mapped.length} مقال`);
        setNewsData(mapped);
        
      } catch (err) {
        console.error('❌ خطأ في جلب البيانات:', err);
        setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsData();
  }, []);

  // دوال المساعدة للأزرار
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف المقال؟')) return;
    try {
      await fetch('/api/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      setNewsData(prev => prev.map(n => n.id === id ? { ...n, status: 'deleted' as NewsStatus } : n));
      toast.success('تم نقل المقال إلى المحذوفات');
    } catch (e) {
      toast.error('فشل حذف المقال');
      console.error(e);
    }
  };

  const handleCopy = (slugOrId: string) => {
    navigator.clipboard.writeText(`https://sabq.org/articles/${slugOrId}`)
      .then(() => toast.success('تم نسخ الرابط'))
      .catch(() => toast.error('لم يتم نسخ الرابط'));
  };

  const handleRestore = async (id: string) => {
    try {
      await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft', is_deleted: false })
      });
      setNewsData(prev => prev.map(n => n.id === id ? { ...n, status: 'draft' as NewsStatus } : n));
      toast.success('تم استعادة المقال إلى المسودات');
    } catch (e) {
      toast.error('فشل استعادة المقال');
      console.error(e);
    }
  };

  const statusTabs = [
    { 
      id: 'all', 
      name: 'جميع الأخبار', 
      count: newsData.filter(item => item.status !== 'deleted').length,
      icon: <FileText className="w-5 h-5" />
    },
    { 
      id: 'published', 
      name: 'منشور', 
      count: newsData.filter(item => item.status === 'published').length,
      icon: <Eye className="w-5 h-5" />
    },
    { 
      id: 'scheduled', 
      name: 'مجدولة', 
      count: newsData.filter(item => item.status === 'scheduled').length,
      icon: <Calendar className="w-5 h-5" />
    },
    { 
      id: 'draft', 
      name: 'مسودة', 
      count: newsData.filter(item => item.status === 'draft').length,
      icon: <Edit className="w-5 h-5" />
    },
    { 
      id: 'pending', 
      name: 'في الانتظار', 
      count: newsData.filter(item => item.status === 'pending').length,
      icon: <Clock className="w-5 h-5" />
    },
    { 
      id: 'breaking', 
      name: 'عاجل', 
      count: newsData.filter(item => item.isBreaking && item.status !== 'deleted').length,
      icon: <Zap className="w-5 h-5" />
    },
    { 
      id: 'deleted', 
      name: 'محذوفة', 
      count: newsData.filter(item => item.status === 'deleted').length,
      icon: <Trash2 className="w-5 h-5" />
    }
  ];

  const getStatusBadge = (status: NewsStatus) => {
    const statusConfig = {
      published: { color: 'bg-green-100 text-green-700', text: 'منشور' },
      draft: { color: 'bg-yellow-100 text-yellow-700', text: 'مسودة' },
      pending: { color: 'bg-blue-100 text-blue-700', text: 'في الانتظار' },
      deleted: { color: 'bg-gray-100 text-gray-700', text: 'محذوف' },
      scheduled: { color: 'bg-purple-100 text-purple-700', text: 'مجدول' }
    };
    
    return statusConfig[status] || statusConfig.draft;
  };

  // مكون بطاقة الإحصائية المحسّنة
  const EnhancedStatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    bgGradient,
    iconColor,
    trend,
    trendValue
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    bgGradient: string;
    iconColor: string;
    trend?: 'up' | 'down';
    trendValue?: string;
  }) => (
    <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 ${bgGradient} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-xs sm:text-sm mb-1 transition-colors duration-300 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{title}</p>
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className={`text-lg sm:text-2xl font-bold transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{loading ? '...' : value}</span>
            <span className={`text-xs sm:text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{subtitle}</span>
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-6 sm:mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>مركز إدارة المحتوى الإخباري</h1>
        <p className={`text-sm sm:text-base transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>منصة متكاملة لإدارة ونشر المحتوى الإخباري مع أدوات تحليل الأداء وتتبع التفاعل</p>
      </div>

      {/* قسم النظام التحريري */}
      <div className="mb-6 sm:mb-8">
        <div className={`rounded-2xl p-4 sm:p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-700' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Newspaper className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h2 className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>نظام إدارة المحتوى الصحفي</h2>
                <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>أدوات متقدمة لإنشاء ونشر ومتابعة المحتوى الإخباري بكفاءة عالية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link 
                href="/dashboard/news/insights"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">تحليلات متقدمة</span>
                <span className="sm:hidden">تحليلات</span>
              </Link>
              
              <Link 
                href="/dashboard/news/create"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg text-sm"
              >
                <PenTool className="w-4 h-4" />
                مقال جديد
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات المحسّنة */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <EnhancedStatsCard
          title="إجمالي المحتوى"
          value={newsData.filter(item => item.status !== 'deleted').length.toString()}
          subtitle="مقال"
          icon={FileText}
          bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
          iconColor="text-white"
          trend="up"
          trendValue="+12% هذا الشهر"
        />
        <EnhancedStatsCard
          title="المحتوى المنشور"
          value={newsData.filter(item => item.status === 'published').length.toString()}
          subtitle="متاح للقراء"
          icon={Eye}
          bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
          iconColor="text-white"
          trend="up"
          trendValue="+8% هذا الأسبوع"
        />
        <EnhancedStatsCard
          title="المحتوى المجدول"
          value={newsData.filter(item => item.status === 'scheduled').length.toString()}
          subtitle="بانتظار النشر"
          icon={Calendar}
          bgGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
          iconColor="text-white"
        />
        <EnhancedStatsCard
          title="المسودات"
          value={newsData.filter(item => item.status === 'draft').length.toString()}
          subtitle="قيد التحرير"
          icon={Edit}
          bgGradient="bg-gradient-to-br from-orange-500 to-amber-600"
          iconColor="text-white"
        />
        <EnhancedStatsCard
          title="الأخبار العاجلة"
          value={newsData.filter(item => item.isBreaking && item.status !== 'deleted').length.toString()}
          subtitle="خبر عاجل"
          icon={Zap}
          bgGradient="bg-gradient-to-br from-yellow-500 to-amber-600"
          iconColor="text-white"
        />
      </div>

      {/* أزرار التنقل المحسّنة */}
      <div className={`rounded-2xl p-2 shadow-sm border mb-6 sm:mb-8 w-full transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-w-[100px] sm:min-w-[120px] lg:w-44 flex flex-col items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : darkMode
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {/* خط سفلي للتاب النشط */}
                {isActive && (
                  <div className="absolute bottom-0 left-4 right-4 h-1 bg-white/30 rounded-full" />
                )}
                
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {React.cloneElement(tab.icon, { 
                    className: `w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : ''}` 
                  })}
                </div>
                <div className="text-center">
                  <div className={`whitespace-nowrap ${isActive ? 'font-semibold' : ''}`}>
                    {tab.name}
                  </div>
                </div>
                {tab.count > 0 && (
                  <span className={`absolute -top-1 -right-1 px-2 py-0.5 text-xs rounded-full font-bold ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-md'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 border border-gray-600'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* شريط البحث والفلاتر - خارج الجدول */}
      <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border mb-6 sm:mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96">
              <Search className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="البحث في المحتوى..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-11 text-sm rounded-lg border transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:bg-gray-600' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`flex-1 lg:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500' 
                  : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="all">جميع التصنيفات</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name_ar}
                </option>
              ))}
            </select>
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`flex-1 lg:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500' 
                  : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="all">جميع الحالات</option>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
              <option value="scheduled">مجدول</option>
              <option value="pending">في الانتظار</option>
            </select>
            
            <button className={`p-2.5 rounded-lg border transition-all duration-300 hover:shadow-md ${
              darkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <span className={`mr-4 text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            جارٍ تحميل المحتوى الإخباري...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={`rounded-2xl p-6 mb-8 border-2 ${
          darkMode 
            ? 'bg-red-900/20 border-red-700' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-red-400' : 'text-red-800'
              }`}>خطأ في تحميل البيانات</h3>
              <p className={`${darkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* جدول البيانات المحسّن */}
      {!loading && !error && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden transition-colors duration-300`}>
          <div className="px-6 py-4" style={{ borderBottom: darkMode ? '1px solid #374151' : '1px solid #f4f8fe' }}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} transition-colors duration-300`}>
                قائمة المحتوى الإخباري
              </h3>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {newsData.filter(item => {
                    if (activeTab === 'deleted') return item.status === 'deleted';
                    if (item.status === 'deleted') return false;
                    if (activeTab === 'all') return true;
                    if (activeTab === 'breaking') return item.isBreaking;
                    if (activeTab === 'scheduled') return item.status === 'scheduled';
                    return item.status === activeTab;
                  }).length} مقال
                </span>
              </div>
            </div>
          </div>
          
          {/* رأس الجدول المحسّن */}
          <div 
            style={{ 
              backgroundColor: darkMode ? '#1e3a5f' : '#f0f9ff',
              borderBottom: darkMode ? '2px solid #2563eb' : '2px solid #dde9fc'
            }}
          >
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className={`col-span-4 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}>العنوان</div>
              <div className={`col-span-1 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}>التصنيف</div>
              <div className={`col-span-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}>تاريخ النشر</div>
              <div className={`col-span-1 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}>المشاهدات</div>
              <div className={`col-span-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}>آخر تعديل</div>
              <div className={`col-span-1 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}>الحالة</div>
              <div className={`col-span-1 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}>الإجراءات</div>
            </div>
          </div>

          {/* بيانات الجدول */}
          <div style={{ borderColor: darkMode ? '#374151' : '#f4f8fe' }} className="divide-y">
            {newsData
              .filter(item => {
                if (activeTab === 'deleted') return item.status === 'deleted';
                if (item.status === 'deleted') return false;
                
                if (activeTab === 'all') return true;
                if (activeTab === 'breaking') return item.isBreaking;
                if (activeTab === 'scheduled') return item.status === 'scheduled';
                return item.status === activeTab;
              })
              .map((news, index) => (
                <div 
                  key={news.id} 
                  className={`grid grid-cols-12 gap-4 px-6 py-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-50'} transition-all duration-300 ${
                    news.isPinned ? 'border-r-4 border-blue-500' : ''
                  }`}
                  style={{ borderBottom: index < newsData.length - 1 ? (darkMode ? '1px solid #374151' : '1px solid #f4f8fe') : 'none' }}
                >
                  {/* العنوان */}
                  <div className="col-span-4">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <Link 
                          href={`/dashboard/news/${news.id}`}
                          className={`font-medium text-right leading-tight transition-colors duration-300 hover:underline ${
                            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          {news.title}
                        </Link>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Users className="w-3 h-3 inline-block ml-1" />
                          {news.author_name}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* التصنيف */}
                  <div className="col-span-1">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 shadow-sm"
                      style={{ 
                        backgroundColor: news.category_color || '#6B7280',
                        color: getContrastColor(news.category_color || '#6B7280')
                      }}
                    >
                      {news.category_name || 'غير مصنف'}
                    </span>
                  </div>

                  {/* تاريخ النشر */}
                  <div className="col-span-2">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {news.status === 'scheduled' && news.publishAt ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>مجدول للنشر</span>
                          </div>
                          <div className="text-xs">
                            {new Date(news.publishAt).toLocaleString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ) : news.publishTime && news.publishTime !== '-' ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {news.publishTime}
                        </div>
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>

                  {/* المشاهدات */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-1">
                      <Eye className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {news.status === 'draft' ? 0 : news.viewCount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* آخر تعديل */}
                  <div className={`col-span-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div>{news.lastModified}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Edit className="w-3 h-3 inline-block ml-1" />
                      {news.lastModifiedBy}
                    </div>
                  </div>

                  {/* الحالة */}
                  <div className="col-span-1">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 shadow-sm ${getStatusBadge(news.status).color}`}>
                      {getStatusBadge(news.status).text}
                    </span>
                  </div>

                  {/* الإجراءات */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-1">
                      <button 
                        title="تعديل" 
                        onClick={() => router.push(`/dashboard/article/edit/${news.id}`)} 
                        className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                          darkMode ? 'text-indigo-400 hover:bg-indigo-900/20' : 'text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {activeTab === 'deleted' ? (
                        <button
                          title="استعادة"
                          onClick={() => handleRestore(news.id)}
                          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                            darkMode ? 'text-green-400 hover:bg-green-900/20' : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          title="حذف" 
                          onClick={() => handleDelete(news.id)} 
                          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                            darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        title="نسخ الرابط" 
                        onClick={() => handleCopy(news.slug ?? news.id)} 
                        className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                          darkMode ? 'text-gray-400 hover:bg-gray-900/20' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            
            {newsData.filter(item => {
              if (activeTab === 'deleted') return item.status === 'deleted';
              if (item.status === 'deleted') return false;
              if (activeTab === 'all') return true;
              if (activeTab === 'breaking') return item.isBreaking;
              if (activeTab === 'scheduled') return item.status === 'scheduled';
              return item.status === activeTab;
            }).length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  لا يوجد محتوى في هذا القسم
                </p>
              </div>
            )}
          </div>
            
          {/* تذييل الجدول */}
          <div className={`border-t px-6 py-4 transition-colors duration-300 ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm font-medium transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  عرض {newsData.filter(item => {
                    if (activeTab === 'deleted') return item.status === 'deleted';
                    if (item.status === 'deleted') return false;
                    if (activeTab === 'all') return true;
                    if (activeTab === 'breaking') return item.isBreaking;
                    if (activeTab === 'scheduled') return item.status === 'scheduled';
                    return item.status === activeTab;
                  }).length} من {newsData.length} مقال
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  disabled
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 flex items-center gap-1 ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                  السابق
                </button>
                
                <div className="flex items-center gap-1">
                  <button className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-md">
                    1
                  </button>
                  <button className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 hover:shadow-md ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}>
                    2
                  </button>
                  <button className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 hover:shadow-md ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}>
                    3
                  </button>
                  <span className={`px-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>...</span>
                </div>
                
                <button className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 flex items-center gap-1 hover:shadow-md ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}>
                  التالي
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 