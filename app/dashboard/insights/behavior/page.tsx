'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Award, BookOpen, 
  Eye, Heart, Share2, MessageSquare, 
  Bookmark, Activity, PieChart,
  BarChart3, Calendar, Target, Zap,
  RefreshCw, Download,
  Database, Search
} from 'lucide-react';

interface BehaviorInsights {
  overview: {
    total_interactions: number;
    total_points_awarded: number;
    active_users: number;
    average_interactions_per_user: number;
    published_articles: number;
  };
  interaction_summary: {
    total_reads: number;
    total_likes: number;
    total_shares: number;
    total_comments: number;
    total_bookmarks: number;
  };
  top_users: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    interactions: number;
    points: number;
    level: string;
    favorite_category: string;
    last_activity: string;
  }>;
  top_categories: Array<{
    id: string;
    name: string;
    interaction_count: number;
  }>;
  time_period: {
    start: string;
    end: string;
    days: number;
  };
}

export default function BehaviorInsightsPage() {
  const [insights, setInsights] = useState<BehaviorInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filterUser, setFilterUser] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // استرجاع حالة الوضع الليلي من localStorage
  useEffect(() => {
    // التحقق من أن الكود يعمل في المتصفح فقط
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
    }
  }, []);

  // جلب البيانات
  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/insights/behavior');
      
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setInsights(data.data);
        setError(null);
        setLastUpdate(new Date());
      } else {
        throw new Error(data.error || 'خطأ في البيانات');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    
    // تحديث تلقائي كل 5 دقائق
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // حساب النسب المئوية
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // الحصول على الأيقونة حسب نوع التفاعل
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'reads': return <Eye className="w-4 h-4" />;
      case 'likes': return <Heart className="w-4 h-4" />;
      case 'shares': return <Share2 className="w-4 h-4" />;
      case 'comments': return <MessageSquare className="w-4 h-4" />;
      case 'bookmarks': return <Bookmark className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // الحصول على لون المستوى
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'platinum': return 'bg-purple-500';
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      case 'bronze': return 'bg-orange-600';
      default: return 'bg-blue-500';
    }
  };

  // مكون بطاقة الإحصائية
  const StatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    bgColor,
    iconColor
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    bgColor: string;
    iconColor: string;
  }) => (
    <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 hover:shadow-md ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-sm mb-1 transition-colors duration-300 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{loading ? '...' : value}</span>
            <span className={`text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // مكون أزرار التنقل
  const NavigationTabs = () => {
    const tabs = [
      { id: 'all', name: 'جميع التفاعلات', icon: Database, count: insights?.overview.total_interactions || 0 },
      { id: 'users', name: 'المستخدمون النشطون', icon: Users, count: insights?.overview.active_users || 0 },
      { id: 'categories', name: 'التصنيفات', icon: BarChart3, count: insights?.top_categories.length || 0 },
      { id: 'points', name: 'نقاط الولاء', icon: Award, count: insights?.overview.total_points_awarded || 0 }
    ];

    return (
      <div className={`rounded-2xl p-2 shadow-sm border mb-8 w-full transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex gap-2 justify-start pr-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-48 flex flex-col items-center justify-center gap-2 py-4 pb-3 px-3 rounded-xl font-medium text-sm transition-all duration-300 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : darkMode
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {/* خط سفلي للتاب النشط */}
                {isActive && (
                  <div className="absolute bottom-0 left-6 right-6 h-1 bg-white/30 rounded-full" />
                )}
                
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span className={isActive ? 'font-semibold' : ''}>{tab.name}</span>
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
    );
  };

  const exportToCSV = () => {
    if (!insights) return;
    
    // التحقق من أن الكود يعمل في المتصفح فقط
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn("Export CSV is only available in browser environment");
      return;
    }
    
    const headers = ['المستخدم', 'البريد الإلكتروني', 'التفاعلات', 'النقاط', 'المستوى', 'التصنيف المفضل', 'آخر نشاط'];
    const csvContent = [
      headers.join(','),
      ...insights.top_users.map(user => [
        user.name,
        user.email,
        user.interactions,
        user.points,
        user.level,
        user.favorite_category,
        new Date(user.last_activity).toLocaleString('ar-SA')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `behavior_insights_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              جارٍ تحميل التحليلات...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <Activity className="w-full h-full" />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            خطأ في تحميل البيانات
          </h3>
          <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {error || 'حدث خطأ غير متوقع'}
          </p>
          <button
            onClick={fetchInsights}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const totalInteractions = insights.interaction_summary.total_reads +
    insights.interaction_summary.total_likes +
    insights.interaction_summary.total_shares +
    insights.interaction_summary.total_comments +
    insights.interaction_summary.total_bookmarks;

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>تحليلات التفاعل وسلوك المستخدمين</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>رصد التفاعل وتحديث التفضيلات تلقائيًا لتعزيز تجربة التوصيات</p>
      </div>

      {/* قسم نظام التحليل الذكي */}
      <div className="mb-8">
        <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700' 
            : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>نظام التحليل الذكي</h2>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>تحليل شامل لسلوك المستخدمين وتفضيلاتهم لتحسين تجربة المحتوى</p>
            </div>
            <div className="mr-auto flex items-center gap-3">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                آخر تحديث: {lastUpdate.toLocaleTimeString('ar')}
              </span>
              <button
                onClick={fetchInsights}
                className={`p-2 rounded-lg shadow-sm transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-5 gap-6 mb-8">
        <StatsCard
          title="المستخدمون النشطون"
          value={insights.overview.active_users}
          subtitle="مستخدم نشط"
          icon={Users}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="إجمالي التفاعلات"
          value={totalInteractions}
          subtitle="تفاعل"
          icon={Activity}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="النقاط الممنوحة"
          value={insights.overview.total_points_awarded}
          subtitle="نقطة ولاء"
          icon={Award}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="متوسط التفاعل"
          value={insights.overview.average_interactions_per_user}
          subtitle="لكل مستخدم"
          icon={Target}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatsCard
          title="المقالات المنشورة"
          value={insights.overview.published_articles}
          subtitle="مقال"
          icon={BookOpen}
          bgColor="bg-pink-100"
          iconColor="text-pink-600"
        />
      </div>

      {/* أزرار التنقل */}
      <NavigationTabs />

      {/* أدوات الفلترة والتصدير */}
      <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="بحث بالمستخدم..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200' 
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <option value="">جميع التصنيفات</option>
            {insights.top_categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* المحتوى الرئيسي حسب التبويب النشط */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* تفصيل التفاعلات */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden transition-colors duration-300`}>
            <div className="px-6 py-4" style={{ borderBottom: darkMode ? '1px solid #374151' : '1px solid #f4f8fe' }}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                <PieChart className="w-5 h-5 text-blue-600" />
                تفصيل التفاعلات
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {Object.entries({
                reads: insights.interaction_summary.total_reads,
                likes: insights.interaction_summary.total_likes,
                shares: insights.interaction_summary.total_shares,
                comments: insights.interaction_summary.total_comments,
                bookmarks: insights.interaction_summary.total_bookmarks
              }).map(([type, count]) => (
                <div key={type} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {getInteractionIcon(type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {type === 'reads' && 'القراءات'}
                        {type === 'likes' && 'الإعجابات'}
                        {type === 'shares' && 'المشاركات'}
                        {type === 'comments' && 'التعليقات'}
                        {type === 'bookmarks' && 'المحفوظات'}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{count}</span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getPercentage(count, totalInteractions)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* التصنيفات النشطة */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden transition-colors duration-300`}>
            <div className="px-6 py-4" style={{ borderBottom: darkMode ? '1px solid #374151' : '1px solid #f4f8fe' }}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                <BarChart3 className="w-5 h-5 text-purple-600" />
                التصنيفات النشطة
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {insights.top_categories.map((category, index) => (
                <div
                  key={category.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    darkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                  }`}>
                    <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{category.name}</h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {category.interaction_count} تفاعل
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* جدول المستخدمين النشطين */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden transition-colors duration-300`}>
        <div className="px-6 py-4" style={{ borderBottom: darkMode ? '1px solid #374151' : '1px solid #f4f8fe' }}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
            <Zap className="w-5 h-5 text-orange-600" />
            المستخدمون الأكثر تفاعلاً
          </h3>
        </div>
        
        {/* رأس الجدول */}
        <div 
          style={{ 
            backgroundColor: darkMode ? '#1e3a5f' : '#f0fdff',
            borderBottom: darkMode ? '2px solid #2563eb' : '2px solid #dde9fc'
          }}
        >
          <div className="grid grid-cols-6 gap-4 px-6 py-4">
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>المستخدم</div>
            <div className={`text-sm font-medium text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>التفاعلات</div>
            <div className={`text-sm font-medium text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>النقاط</div>
            <div className={`text-sm font-medium text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>المستوى</div>
            <div className={`text-sm font-medium text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>التصنيف المفضل</div>
            <div className={`text-sm font-medium text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>آخر نشاط</div>
          </div>
        </div>

        {/* بيانات الجدول */}
        <div style={{ borderColor: darkMode ? '#374151' : '#f4f8fe' }} className="divide-y">
          {insights.top_users.length === 0 ? (
            <div className="text-center py-12">
              <Users className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                لا يوجد مستخدمون نشطون حالياً
              </p>
            </div>
          ) : (
            insights.top_users
              .filter(user => filterUser === '' || user.name.toLowerCase().includes(filterUser.toLowerCase()) || user.email.toLowerCase().includes(filterUser.toLowerCase()))
              .filter(user => filterCategory === '' || user.favorite_category === filterCategory)
              .map((user, index) => (
                <div 
                  key={user.id} 
                  className={`grid grid-cols-6 gap-4 px-6 py-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-50'} transition-colors duration-300`}
                  style={{ borderBottom: index < insights.top_users.length - 1 ? (darkMode ? '1px solid #374151' : '1px solid #f4f8fe') : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.interactions}</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.points}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getLevelColor(user.level)}`}>
                      {user.level}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.favorite_category}</span>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(user.last_activity).toLocaleDateString('ar')}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* معلومات الفترة الزمنية */}
      <div className={`mt-8 rounded-xl p-4 flex items-center gap-3 ${
        darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
      }`}>
        <Calendar className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
          هذه البيانات للفترة من {new Date(insights.time_period.start).toLocaleDateString('ar')} 
          {' '}إلى {new Date(insights.time_period.end).toLocaleDateString('ar')} 
          {' '}({insights.time_period.days} أيام)
        </p>
      </div>
    </div>
  );
} 