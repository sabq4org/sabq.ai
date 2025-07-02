'use client';

import React, { useState, useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { TabsEnhanced, TabItem } from '@/components/ui/tabs-enhanced';
import { 
  Brain, Users, TrendingUp, Eye, BarChart3, Settings, Target, 
  Heart, Share2, MessageSquare, Clock, Zap, Filter, TrendingDown, Activity
} from 'lucide-react';

export default function PreferencesPage() {
  const { darkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeInteractions: 0,
    avgReadingTime: 0,
    updatedPreferences: 0,
    personalizationAccuracy: 0,
    aiModels: 0,
    dailyReads: 0,
    dailyLikes: 0,
    dailyShares: 0,
    dailyComments: 0
  });

  // جلب البيانات الحقيقية
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);

        // جلب بيانات التصنيفات النشطة
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        // التحقق من أن البيانات مصفوفة
        const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData.categories || []);
        const activeCategories = categories.filter((cat: any) => cat.is_active).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          users: 0, // سيتم حسابه من تفضيلات المستخدمين الحقيقية
          engagement: 0, // سيتم حسابه من التفاعلات الحقيقية
          growth: 0, // سيتم حسابه من البيانات التاريخية
          color: 'bg-gray-100 text-gray-700',
          iconColor: 'text-gray-600'
        }));
        setCategoryData(activeCategories);

        // جلب تفضيلات المستخدمين الحقيقية (إن وجدت)
        try {
          const prefsRes = await fetch('/api/user-preferences');
          if (prefsRes.ok) {
            const prefsData = await prefsRes.json();
            setUserPreferences(prefsData || []);
          }
        } catch (error) {
          // في حالة عدم وجود API
        }

        // تحديث الإحصائيات بالقيم الصفرية أو الحقيقية
        let totalUsers = 0;
        try {
          const usersRes = await fetch('/api/users');
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            totalUsers = usersData.users?.length || 0;
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات المستخدمين:', error);
        }
        
        setStats({
          totalUsers,
          activeInteractions: 0,
          avgReadingTime: 0,
          updatedPreferences: 0,
          personalizationAccuracy: 0,
          aiModels: 0,
          dailyReads: 0,
          dailyLikes: 0,
          dailyShares: 0,
          dailyComments: 0
        });

      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  const CircularStatsCard = ({ title, value, subtitle, icon: Icon, bgColor, iconColor }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    bgColor: string;
    iconColor: string;
  }) => (
    <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 hover:shadow-md ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
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
            }`}>{loading ? '...' : value.toLocaleString()}</span>
            <span className={`text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs: TabItem[] = [
    { id: 'overview', name: 'نظرة عامة', icon: Brain },
    { id: 'categories', name: 'تحليل الاهتمامات', icon: BarChart3 },
    { id: 'behavior', name: 'تتبع السلوك', icon: Activity },
    { id: 'settings', name: 'الإعدادات', icon: Settings }
  ];

  const CategoryCard = ({ category }: { category: any }) => (
    <div className={`rounded-2xl p-6 border transition-colors duration-300 hover:shadow-md ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${category.color.split(' ')[0]}`}>
            <Filter className={`w-5 h-5 ${category.iconColor}`} />
          </div>
          <div>
            <h3 className={`font-bold transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{category.name}</h3>
            <p className={`text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{category.users.toLocaleString()} مستخدم</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {category.growth > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${
            category.growth > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {category.growth}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className={`transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>مستوى التفاعل</span>
            <span className={`font-medium transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{category.engagement}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${category.iconColor.replace('text', 'bg')}`}
              style={{ width: `${category.engagement}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              جارٍ تحميل البيانات...
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-6 gap-6 mb-8">
              <CircularStatsCard
                title="إجمالي المستخدمين"
                value={stats.totalUsers}
                subtitle="مستخدم"
                icon={Users}
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <CircularStatsCard
                title="التفاعل النشط"
                value={stats.activeInteractions}
                subtitle="هذا الأسبوع"
                icon={Activity}
                bgColor="bg-green-100"
                iconColor="text-green-600"
              />
              <CircularStatsCard
                title="متوسط وقت القراءة"
                value={stats.avgReadingTime}
                subtitle="دقيقة/جلسة"
                icon={Clock}
                bgColor="bg-purple-100"
                iconColor="text-purple-600"
              />
              <CircularStatsCard
                title="التفضيلات المحدثة"
                value={stats.updatedPreferences}
                subtitle="هذا الشهر"
                icon={Brain}
                bgColor="bg-yellow-100"
                iconColor="text-yellow-600"
              />
              <CircularStatsCard
                title="دقة التخصيص"
                value={stats.personalizationAccuracy}
                subtitle="نسبة مئوية"
                icon={Target}
                bgColor="bg-pink-100"
                iconColor="text-pink-600"
              />
              <CircularStatsCard
                title="تحليلات AI"
                value={stats.aiModels}
                subtitle="نموذج نشط"
                icon={BarChart3}
                bgColor="bg-indigo-100"
                iconColor="text-indigo-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className={`col-span-2 rounded-2xl p-6 border transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>📊 أكثر الاهتمامات شيوعاً</h3>
                {categoryData.length === 0 ? (
                  <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    لا توجد بيانات متاحة حالياً
                  </p>
                ) : (
                  <div className="space-y-4">
                    {categoryData.slice(0, 5).map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${category.color.split(' ')[0]} rounded-full flex items-center justify-center text-sm font-bold`}>
                            {index + 1}
                          </div>
                          <span className={`font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>{category.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{category.users.toLocaleString()}</span>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              {category.growth}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>🔥 الأنشطة اليومية</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{stats.dailyReads} قراءة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{stats.dailyLikes} إعجاب</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-green-600" />
                    <span className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{stats.dailyShares} مشاركة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{stats.dailyComments} تعليق</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>تحليل اهتمامات القراء</h3>
            </div>
            {categoryData.length === 0 ? (
              <div className={`rounded-2xl p-8 border text-center ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  لا توجد تصنيفات نشطة حالياً
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {categoryData.map((category, index) => (
                  <CategoryCard key={index} category={category} />
                ))}
              </div>
            )}
          </div>
        );

      case 'behavior':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>تتبع سلوك المستخدمين</h3>
            </div>
            <div className={`rounded-2xl p-8 border text-center ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                لا توجد بيانات سلوك مسجلة حالياً
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>🚧 قيد التطوير</h3>
            <p className={`text-center py-8 transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              هذا القسم قيد التطوير وسيكون متاحاً قريباً
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>نظام التفضيلات الذكي 🧠</h1>
          <p className={`transition-colors duration-300 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>تحليل اهتمامات القراء وتتبع سلوكهم لتقديم تجربة قراءة مخصصة</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
            <Brain className="w-4 h-4" />
            تحليل AI جديد
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
            <Zap className="w-4 h-4" />
            تحديث النماذج
          </button>
        </div>
      </div>

      <TabsEnhanced
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {renderTabContent()}
    </div>
  );
} 