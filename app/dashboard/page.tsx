'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Activity,
  BarChart3,
  Star,
  UserCheck,
  Calendar,
  Eye,
  Menu,
  X
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { TabsEnhanced } from '@/components/ui/tabs-enhanced';
import Link from 'next/link';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('behavior');
  const { darkMode } = useDarkModeContext();
  const [stats, setStats] = useState({
    users: 0,
    points: 0,
    articles: 0,
    interactions: 0,
    categories: 0,
    activeUsers: 0,
    comments: 0,
    accuracy: 0,
    updates: 0,
    views: 0
  });
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // جلب البيانات الحقيقية
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);

        // جلب بيانات المستخدمين
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        const usersArray = usersData.users || usersData.data || usersData || [];
        const totalUsers = Array.isArray(usersArray) ? usersArray.length : 0;

        // جلب بيانات المقالات
        const articlesRes = await fetch('/api/articles');
        const articlesData = await articlesRes.json();
        const articlesArray = articlesData.articles || articlesData.data || articlesData || [];
        const totalArticles = Array.isArray(articlesArray) ? articlesArray.length : 0;

        // جلب بيانات التصنيفات
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        // التعامل مع الهيكل الصحيح للبيانات المُرجعة من API
        const categoriesArray = categoriesData.data || categoriesData || [];
        const activeCategories = Array.isArray(categoriesArray) 
          ? categoriesArray.filter((cat: any) => cat.is_active).length 
          : 0;

        // جلب بيانات التفاعلات (إن وجدت)
        let totalInteractions = 0;
        let totalPoints = 0;
        try {
          const interactionsRes = await fetch('/api/interactions/all');
          if (interactionsRes.ok) {
            const interactionsData = await interactionsRes.json();
            totalInteractions = interactionsData.data?.length || 0;
          }
        } catch (error) {
          console.log('تفاعلات غير متوفرة');
        }

        // جلب بيانات النقاط (إن وجدت)
        try {
          const pointsRes = await fetch('/api/loyalty/stats');
          if (pointsRes.ok) {
            const pointsData = await pointsRes.json();
            totalPoints = pointsData.data?.totalPoints || 0;
          }
        } catch (error) {
          console.log('نقاط الولاء غير متوفرة');
        }

        // تحديث الإحصائيات بالبيانات الحقيقية
        setStats({
          users: totalUsers,
          points: totalPoints,
          articles: totalArticles,
          interactions: totalInteractions,
          categories: activeCategories,
          activeUsers: 0, // سيتم حسابه من بيانات التفاعل الحقيقية
          comments: 0, // سيتم ربطه بنظام التعليقات الحقيقي
          accuracy: 0, // سيتم حسابه من التحليلات الحقيقية
          updates: 0, // سيتم حسابه من سجل التحديثات
          views: 0
        });

        // تصفير بيانات الجدول (سيتم ملؤها بالبيانات الحقيقية لاحقاً)
        setTableData([]);

      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  // مكون بطاقة الإحصائية الدائرية
  const CircularStatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    bgColor,
    iconColor,
    textColor = 'text-gray-700'
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    bgColor: string;
    iconColor: string;
    textColor?: string;
  }) => (
    <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-sm border transition-colors duration-300 hover:shadow-md ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm mb-0.5 sm:mb-1 truncate transition-colors duration-300 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{title}</p>
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className={`text-base sm:text-lg lg:text-2xl font-bold transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{loading ? '...' : value}</span>
            <span className={`text-xs hidden sm:inline transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // مكون الجدول - محسّن للموبايل
  const DataTable = () => {
    // ألوان الجدول حسب الوضع
    const tableColors = {
      headerBg: darkMode ? '#1e3a5f' : '#f0fdff',
      headerBorder: darkMode ? '#2563eb' : '#dde9fc',
      cellBorder: darkMode ? '#374151' : '#f4f8fe',
      containerBg: darkMode ? 'bg-gray-800' : 'bg-white',
      containerBorder: darkMode ? 'border-gray-700' : 'border-gray-100',
      titleText: darkMode ? 'text-white' : 'text-gray-800',
      headerText: darkMode ? 'text-gray-200' : 'text-gray-700',
      bodyText: darkMode ? 'text-gray-300' : 'text-gray-900',
      subText: darkMode ? 'text-gray-400' : 'text-gray-600',
      hoverBg: darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-50'
    };

    // عرض بطاقات للموبايل بدلاً من الجدول
    const MobileCard = ({ row }: { row: any }) => (
      <div className={`${tableColors.containerBg} rounded-lg p-4 border ${tableColors.containerBorder} mb-3`}>
        <div className="flex justify-between items-start mb-2">
          <h4 className={`font-medium ${tableColors.bodyText}`}>{row.user}</h4>
          <span className="text-xs font-semibold text-green-500">{row.accuracy}</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className={tableColors.subText}>التصنيف:</span>
            <span className={tableColors.bodyText}>{row.classification}</span>
          </div>
          <div className="flex justify-between">
            <span className={tableColors.subText}>الفئة المفضلة:</span>
            <span className={tableColors.bodyText}>{row.category}</span>
          </div>
          <div className="flex justify-between">
            <span className={tableColors.subText}>التفاعلات:</span>
            <span className="font-medium text-blue-500">{row.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={tableColors.subText}>نقاط التفاعل:</span>
            <div className="flex items-center gap-2">
              <div className={`w-16 rounded-full h-1.5 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${row.engagement}%` }}
                ></div>
              </div>
              <span className={`text-xs ${tableColors.subText}`}>{row.engagement}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className={tableColors.subText}>آخر نشاط:</span>
            <span className={tableColors.subText}>{row.activity}</span>
          </div>
        </div>
      </div>
    );

    return (
      <>
        {/* عرض الجدول للشاشات الكبيرة */}
        <div className={`hidden md:block ${tableColors.containerBg} rounded-2xl shadow-sm border ${tableColors.containerBorder} overflow-hidden transition-colors duration-300`}>
          <div className="px-4 sm:px-6 py-4" style={{ borderBottom: `1px solid ${tableColors.cellBorder}` }}>
            <h3 className={`text-base sm:text-lg font-semibold ${tableColors.titleText} transition-colors duration-300`}>
              سلوك المستخدمين الأكثر نشاطاً
            </h3>
          </div>
          
          {/* جدول متجاوب */}
          <div className="overflow-x-auto">
            {/* رأس الجدول */}
            <div 
              style={{ 
                backgroundColor: tableColors.headerBg,
                borderBottom: `2px solid ${tableColors.headerBorder}`
              }}
              className="min-w-[800px]"
            >
              <div className="grid grid-cols-7 gap-4 px-4 sm:px-6 py-4">
                <div className={`text-xs sm:text-sm font-medium ${tableColors.headerText} transition-colors duration-300`}>الفئات المفضلة</div>
                <div className={`text-xs sm:text-sm font-medium ${tableColors.headerText} transition-colors duration-300`}>دقة التفضيلات</div>
                <div className={`text-xs sm:text-sm font-medium ${tableColors.headerText} transition-colors duration-300`}>آخر نشاط</div>
                <div className={`text-xs sm:text-sm font-medium ${tableColors.headerText} transition-colors duration-300`}>نقاط التفاعل</div>
                <div className={`text-xs sm:text-sm font-medium ${tableColors.headerText} transition-colors duration-300`}>إجمالي التفاعلات</div>
                <div className={`text-xs sm:text-sm font-medium ${tableColors.headerText} transition-colors duration-300`}>المستخدم</div>
                <div className={`text-xs sm:text-sm font-medium ${tableColors.headerText} transition-colors duration-300`}>تصنيف العميق</div>
              </div>
            </div>

            {/* بيانات الجدول */}
            <div style={{ borderColor: tableColors.cellBorder }} className="divide-y min-w-[800px]">
              {loading ? (
                <div className="text-center py-8">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    جارٍ تحميل البيانات...
                  </p>
                </div>
              ) : tableData.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    لا توجد بيانات متاحة حالياً
                  </p>
                </div>
              ) : (
                tableData.map((row, index) => (
                  <div 
                    key={index} 
                    className={`grid grid-cols-7 gap-4 px-4 sm:px-6 py-4 ${tableColors.hoverBg} transition-colors duration-300`}
                    style={{ borderBottom: index < tableData.length - 1 ? `1px solid ${tableColors.cellBorder}` : 'none' }}
                  >
                    <div className={`text-xs sm:text-sm font-medium ${tableColors.bodyText} transition-colors duration-300`}>{row.category}</div>
                    <div className="text-xs sm:text-sm font-semibold text-green-500">{row.accuracy}</div>
                    <div className={`text-xs sm:text-sm ${tableColors.subText} transition-colors duration-300`}>{row.activity}</div>
                    <div className="flex items-center">
                      <div className={`w-12 sm:w-16 rounded-full h-2 mr-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${row.engagement}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs ${tableColors.subText} transition-colors duration-300`}>{row.engagement}</span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-blue-500">{row.total}</div>
                    <div className={`text-xs sm:text-sm font-medium ${tableColors.bodyText} transition-colors duration-300`}>{row.user}</div>
                    <div className={`text-xs sm:text-sm ${tableColors.subText} transition-colors duration-300`}>{row.classification}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* عرض البطاقات للموبايل */}
        <div className={`md:hidden ${tableColors.containerBg} rounded-xl p-4 border ${tableColors.containerBorder}`}>
          <h3 className={`text-base font-semibold ${tableColors.titleText} mb-4`}>
            سلوك المستخدمين الأكثر نشاطاً
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                جارٍ تحميل البيانات...
              </p>
            </div>
          ) : tableData.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                لا توجد بيانات متاحة حالياً
              </p>
            </div>
          ) : (
            tableData.map((row, index) => <MobileCard key={index} row={row} />)
          )}
        </div>
      </>
    );
  };

  const menuItems = [
    { href: '/dashboard/news', icon: FileText, label: 'المقالات' },
    { href: '/dashboard/categories', icon: BarChart3, label: 'التصنيفات' },
    { href: '/dashboard/users', icon: Users, label: 'المستخدمين' },
    { href: '/dashboard/analytics', icon: TrendingUp, label: 'التحليلات' },
    { href: '/dashboard/comments', icon: MessageSquare, label: 'التعليقات' },
    { href: '/dashboard/settings', icon: Calendar, label: 'الإعدادات' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header للموبايل */}
      {isMobile && (
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-lg font-bold">لوحة التحكم</h1>
            <Link href="/" className="text-sm text-primary hover:underline">
              العودة للموقع
            </Link>
          </div>
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${isMobile ? 'fixed inset-y-0 right-0 z-50' : 'relative'}
          ${isMobile && !sidebarOpen ? 'translate-x-full' : 'translate-x-0'}
          w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700
          transition-transform duration-300
        `}>
          {!isMobile && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold">لوحة التحكم</h1>
            </div>
          )}
          
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Overlay للموبايل */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* الإحصائيات */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <CircularStatsCard
                title="المقالات"
                value={stats.articles}
                subtitle="مقال"
                icon={FileText}
                bgColor="bg-green-100"
                iconColor="text-green-600"
              />
              <CircularStatsCard
                title="المستخدمين"
                value={stats.users}
                subtitle="مستخدم مسجل"
                icon={Users}
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <CircularStatsCard
                title="المشاهدات"
                value={stats.views}
                subtitle="مشاهدة"
                icon={Eye}
                bgColor="bg-purple-100"
                iconColor="text-purple-600"
              />
              <CircularStatsCard
                title="التعليقات"
                value={stats.comments}
                subtitle="تعليق"
                icon={MessageSquare}
                bgColor="bg-orange-100"
                iconColor="text-orange-600"
              />
            </div>

            {/* الرسوم البيانية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">نشاط المستخدمين</h3>
                <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">الرسم البياني هنا</span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">المقالات الأكثر قراءة</h3>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">مقال تجريبي رقم {i}</h4>
                        <p className="text-sm text-gray-500">1,234 مشاهدة</p>
                      </div>
                      <Link href="#" className="text-primary text-sm hover:underline">
                        عرض
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* الأنشطة الأخيرة */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">الأنشطة الأخيرة</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">مستخدم جديد</span> قام بالتسجيل
                      </p>
                      <p className="text-xs text-gray-500 mt-1">منذ {i} ساعات</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 