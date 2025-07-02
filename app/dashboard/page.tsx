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
  UserCheck
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { TabsEnhanced } from '@/components/ui/tabs-enhanced';

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
    updates: 0
  });
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          updates: 0 // سيتم حسابه من سجل التحديثات
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

  return (
    <div className={`p-3 sm:p-4 lg:p-6 xl:p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>لوحة سبق</h1>
        <p className={`text-xs sm:text-sm lg:text-base transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>نظام إدارة المحتوى الذكي لصحيفة سبق - تحكم شامل في المحتوى والتفاعل</p>
      </div>

      {/* قسم النظام الذكي - محسّن للموبايل */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-700' 
            : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-lg lg:text-xl">🤖</span>
            </div>
            <div className="flex-1">
              <h2 className={`text-base sm:text-lg lg:text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>النظام الذكي</h2>
              <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>تحليل متقدم للمحتوى والتفاعل باستخدام الذكاء الاصطناعي</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-purple-600' 
                : 'bg-white border-purple-100'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-md sm:rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-medium truncate transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>تحليل المحتوى</p>
                  <p className={`text-[10px] sm:text-xs transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>متوقف</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-purple-600' 
                : 'bg-white border-purple-100'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-md sm:rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-medium truncate transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>توقع الاتجاهات</p>
                  <p className={`text-[10px] sm:text-xs transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>متوقف</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-purple-600' 
                : 'bg-white border-purple-100'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-md sm:rounded-lg flex items-center justify-center">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-medium truncate transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>تحليل الجمهور</p>
                  <p className={`text-[10px] sm:text-xs transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>متوقف</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-purple-600' 
                : 'bg-white border-purple-100'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-md sm:rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-medium truncate transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>تصنيف التعليقات</p>
                  <p className={`text-[10px] sm:text-xs transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>متوقف</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - محسّنة للموبايل */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 xl:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <CircularStatsCard
          title="إجمالي المستخدمين"
          value={stats.users}
          subtitle="مستخدم مسجل"
          icon={UserCheck}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <CircularStatsCard
          title="النقاط المكتسبة"
          value={stats.points}
          subtitle="نقطة ولاء"
          icon={Star}
          bgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <CircularStatsCard
          title="المقالات المنشورة"
          value={stats.articles}
          subtitle="مقال"
          icon={FileText}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <CircularStatsCard
          title="التفاعلات"
          value={stats.interactions}
          subtitle="تفاعل"
          icon={Activity}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <CircularStatsCard
          title="التصنيفات النشطة"
          value={stats.categories}
          subtitle="تصنيف"
          icon={BarChart3}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <CircularStatsCard
          title="المستخدمون النشطون"
          value={stats.activeUsers}
          subtitle="آخر 7 أيام"
          icon={Users}
          bgColor="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* أزرار التنقل */}
      <TabsEnhanced
        tabs={[
          { id: 'behavior', name: 'سلوك المستخدمين', icon: Users },
          { id: 'analysis', name: 'تحليل التفاعلات', icon: TrendingUp },
          { id: 'preferences', name: 'تطوير التفضيلات', icon: Activity },
          { id: 'insights', name: 'رؤى الآراء', icon: BarChart3 }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Data Table */}
      <DataTable />
    </div>
  );
} 