'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Gift, Users, TrendingUp, Crown, Award, Eye, 
         Settings, Target, Share2, Heart, 
         RefreshCw, BookOpen, Bookmark } from 'lucide-react';
import { getMembershipLevel } from '@/lib/loyalty';

interface LoyaltyUser {
  user_id: string;
  name: string;
  email: string;
  avatar?: string;
  total_points: number;
  earned_points: number;
  redeemed_points: number;
  tier: string;
  role: string;
  email_verified: boolean;
  last_activity: string;
  interactions_count: number;
  status: 'active' | 'orphaned' | 'no_loyalty';
  profile_created_at: string;
  loyalty_created_at?: string;
}

interface LoyaltyStats {
  overview: {
    totalUsers: number;
    totalMembers?: number;
    activeUsers: number;
    totalPoints: number;
    averagePoints: number;
    newMembers: number;
    ambassadors: number;
  };
  topUsers: Array<{
    user_id: string;
    name?: string;
    email?: string;
    avatar?: string;
    total_points: number;
    tier: string;
    last_activity: string;
    interactions_count?: number;
    status?: string;
  }>;
  allUsers?: LoyaltyUser[];
  interactions: {
    total: number;
    breakdown: {
      read: number;
      like: number;
      share: number;
      save: number;
      view: number;
    };
    pointsByType: {
      read: number;
      like: number;
      share: number;
      save: number;
      view: number;
    };
  };
  dailyActivity: Array<{
    date: string;
    points: number;
    users: number;
    interactions: number;
  }>;
  tierDistribution: {
    bronze: number;
    silver: number;
    gold: number;
    ambassador: number;
  };
  accountStatuses?: {
    active: number;
    orphaned: number;
    no_loyalty: number;
  };
  metadata: {
    lastUpdated: string;
    totalInteractions: number;
    pointEarningInteractions: number;
    usersWithLoyalty?: number;
    membersWithoutLoyalty?: number;
    orphanedLoyaltyAccounts?: number;
  };
}

export default function LoyaltyPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // جلب إحصائيات الولاء من API
  useEffect(() => {
    fetchLoyaltyStats();
    
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(() => {
      fetchLoyaltyStats(true); // تحديث صامت
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refreshKey]);

  const fetchLoyaltyStats = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // إضافة timestamp لتجنب الكاش
      const response = await fetch(`/api/loyalty/stats?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setLoyaltyStats(result.data);
        setError(null);
        
        // عرض رسالة نجاح إذا كان التحديث يدوي
        if (!silent && loading === false) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      } else {
        setError(result.message || 'فشل في جلب البيانات');
      }
    } catch (err) {
      console.error('Error fetching loyalty stats:', err);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // دالة تحديث قوية
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchLoyaltyStats();
  };

  const formatUserName = (userId: string) => {
    if (userId.startsWith('user-')) {
      return `مستخدم ${userId.slice(-8)}`;
    }
    return userId === 'test-user' ? 'مستخدم تجريبي' : userId;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'ambassador': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierName = (tier: string) => {
    // إذا كان tier رقمًا (نقاط) نحسب المستوى
    if (!isNaN(Number(tier))) {
      const level = getMembershipLevel(Number(tier));
      return level.name;
    }
    
    // للتوافق مع البيانات القديمة
    switch (tier) {
      case 'bronze': return 'برونزي';
      case 'silver': return 'فضي';
      case 'gold': return 'ذهبي';
      case 'ambassador': return 'سفير';
      default: return 'غير محدد';
    }
  };

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
            }`}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
            <span className={`text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const NavigationTabs = () => {
    const tabs = [
      { id: 'overview', name: 'نظرة عامة', icon: Trophy },
      { id: 'users', name: 'المستخدمون', icon: Users },
      { id: 'rewards', name: 'المكافآت', icon: Gift, href: '/dashboard/loyalty/rewards' },
      { id: 'campaigns', name: 'الحملات', icon: Target, href: '/dashboard/loyalty/campaigns' },
      { id: 'settings', name: 'الإعدادات', icon: Settings }
    ];

    return (
      <div className={`tabs-container rounded-2xl p-2 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex gap-2 justify-start">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            
            if (tab.href) {
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`tab-button w-32 flex flex-col items-center justify-center gap-2 py-4 pb-3 px-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-700 border-b-4 border-transparent hover:border-gray-600'
                      : 'text-gray-600 hover:bg-gray-50 border-b-4 border-transparent hover:border-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-center leading-tight">{tab.name}</span>
                </Link>
              );
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button w-32 flex flex-col items-center justify-center gap-2 py-4 pb-3 px-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'active bg-blue-500 text-white shadow-md border-b-4 border-blue-600'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700 border-b-4 border-transparent hover:border-gray-600'
                      : 'text-gray-600 hover:bg-gray-50 border-b-4 border-transparent hover:border-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-center leading-tight">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className={`rounded-2xl p-12 border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              جارٍ تحميل البيانات...
            </p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              يرجى الانتظار بينما نجلب إحصائيات الولاء
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`rounded-2xl p-12 border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-red-600" />
            </div>
            <p className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              خطأ في تحميل البيانات
            </p>
            <p className={`text-sm mb-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {error}
            </p>
            <button
              onClick={forceRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }

    if (!loyaltyStats) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-6 gap-6 mb-8">
              <CircularStatsCard
                title="إجمالي الأعضاء"
                value={loyaltyStats.overview.totalMembers || loyaltyStats.overview.totalUsers}
                subtitle="عضو"
                icon={Users}
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <CircularStatsCard
                title="مستخدمو الولاء"
                value={loyaltyStats.overview.totalUsers}
                subtitle="لديهم نقاط"
                icon={TrendingUp}
                bgColor="bg-green-100"
                iconColor="text-green-600"
              />
              <CircularStatsCard
                title="النقاط الموزعة"
                value={loyaltyStats.overview.totalPoints}
                subtitle="نقطة"
                icon={Trophy}
                bgColor="bg-yellow-100"
                iconColor="text-yellow-600"
              />
              <CircularStatsCard
                title="متوسط النقاط"
                value={loyaltyStats.overview.averagePoints}
                subtitle="لكل مستخدم نشط"
                icon={Award}
                bgColor="bg-purple-100"
                iconColor="text-purple-600"
              />
              <CircularStatsCard
                title="أعضاء جدد"
                value={loyaltyStats.overview.newMembers}
                subtitle="هذا الشهر"
                icon={Users}
                bgColor="bg-orange-100"
                iconColor="text-orange-600"
              />
              <CircularStatsCard
                title="سفراء سبق"
                value={loyaltyStats.overview.ambassadors}
                subtitle="سفير"
                icon={Crown}
                bgColor="bg-red-100"
                iconColor="text-red-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>🏆 أعلى المستخدمين</h3>
                  <button 
                    onClick={forceRefresh}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-3">
                  {loyaltyStats.topUsers.length > 0 ? (
                    loyaltyStats.topUsers.slice(0, 5).map((user, index) => (
                      <div key={user.user_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {user.name || formatUserName(user.user_id)}
                            </p>
                            {user.email && (
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {user.email}
                              </p>
                            )}
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              (() => {
                                const level = getMembershipLevel(user.total_points);
                                return level.bgColor + ' ' + (level.color ? `text-[${level.color}]` : '');
                              })()
                            }`}>
                              {getMembershipLevel(user.total_points).name}
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-blue-600">{user.total_points.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">نقطة</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>لا توجد بيانات حالياً</p>
                  </div>
                  )}
                </div>
              </div>

              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>📊 إحصائيات التفاعل</h3>
                <div className="space-y-3">
                  {[
                    { key: 'read', icon: BookOpen, label: 'قراءة', count: loyaltyStats.interactions.breakdown.read, points: loyaltyStats.interactions.pointsByType.read, color: 'text-blue-600' },
                    { key: 'like', icon: Heart, label: 'إعجاب', count: loyaltyStats.interactions.breakdown.like, points: loyaltyStats.interactions.pointsByType.like, color: 'text-red-600' },
                    { key: 'share', icon: Share2, label: 'مشاركة', count: loyaltyStats.interactions.breakdown.share, points: loyaltyStats.interactions.pointsByType.share, color: 'text-green-600' },
                    { key: 'save', icon: Bookmark, label: 'حفظ', count: loyaltyStats.interactions.breakdown.save, points: loyaltyStats.interactions.pointsByType.save, color: 'text-purple-600' },
                    { key: 'view', icon: Eye, label: 'مشاهدة', count: loyaltyStats.interactions.breakdown.view, points: loyaltyStats.interactions.pointsByType.view, color: 'text-indigo-600' }
                  ].map((interaction) => {
                    const Icon = interaction.icon;
                    return (
                      <div key={interaction.key} className="flex justify-between items-center">
                        <span className={`text-sm flex items-center gap-2 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <Icon className="w-4 h-4" />
                          {interaction.label} ({interaction.count})
                        </span>
                        <span className={`font-bold ${interaction.color}`}>+{interaction.points}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>🎯 توزيع المستويات</h3>
                <div className="space-y-3">
                  {[
                    { key: 'bronze', color: 'bg-orange-500', textColor: 'text-orange-600', label: 'برونزي (0-100)', value: loyaltyStats.tierDistribution.bronze },
                    { key: 'silver', color: 'bg-gray-400', textColor: 'text-gray-600', label: 'فضي (101-500)', value: loyaltyStats.tierDistribution.silver },
                    { key: 'gold', color: 'bg-yellow-500', textColor: 'text-yellow-600', label: 'ذهبي (501-2000)', value: loyaltyStats.tierDistribution.gold },
                    { key: 'ambassador', color: 'bg-purple-500', textColor: 'text-purple-600', label: 'سفير (2001+)', value: loyaltyStats.tierDistribution.ambassador }
                  ].map((tier) => (
                    <div key={tier.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${tier.color} rounded-full`}></div>
                        <span className={`text-sm transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{tier.label}</span>
                      </div>
                      <span className={`font-bold ${tier.textColor}`}>{tier.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            {/* إحصائيات سريعة للمستخدمين */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {loyaltyStats.accountStatuses?.active || 0}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      مستخدمون نشطون
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {loyaltyStats.accountStatuses?.no_loyalty || 0}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      بدون نقاط ولاء
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {loyaltyStats.accountStatuses?.orphaned || 0}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      حسابات معزولة
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {loyaltyStats.overview.ambassadors}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      سفراء سبق
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* قائمة المستخدمين المحسنة */}
          <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
                }`}>مستخدمو برنامج الولاء والعضويات</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                    placeholder="البحث بالاسم أو البريد..."
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                  <button 
                    onClick={forceRefresh}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
                {loyaltyStats.allUsers && loyaltyStats.allUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>المستخدم</th>
                          <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>النقاط</th>
                          <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>المستوى</th>
                          <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>الحالة</th>
                          <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>آخر نشاط</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loyaltyStats.allUsers.slice(0, 10).map((user) => (
                          <tr key={user.user_id} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  {user.avatar ? (
                                    <img 
                                      src={user.avatar} 
                                      alt={user.name}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                      <span className="text-white font-semibold text-sm">
                                        {user.name.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                  {user.email_verified && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs">✓</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {user.name}
                                  </div>
                                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-blue-600">{user.total_points.toLocaleString()}</div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {user.interactions_count} تفاعل
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                (() => {
                                  const level = getMembershipLevel(user.total_points);
                                  return level.bgColor + ' ' + (level.color ? `text-[${level.color}]` : '');
                                })()
                              }`}>
                                {getMembershipLevel(user.total_points).name}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' :
                                user.status === 'orphaned' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {user.status === 'active' ? 'نشط' :
                                 user.status === 'orphaned' ? 'معزول' :
                                 'بدون ولاء'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(user.last_activity).toLocaleDateString('ar-SA')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : loyaltyStats.topUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>المستخدم</th>
                          <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>النقاط</th>
                          <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>المستوى</th>
                          <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>آخر نشاط</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loyaltyStats.topUsers.map((user) => (
                          <tr key={user.user_id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {user.avatar ? (
                                  <img 
                                    src={user.avatar} 
                                    alt={user.name || formatUserName(user.user_id)}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                      {(user.name || formatUserName(user.user_id)).charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {user.name || formatUserName(user.user_id)}
                                  </div>
                                  {user.email && (
                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {user.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-blue-600">{user.total_points.toLocaleString()}</div>
                              {user.interactions_count && (
                                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {user.interactions_count} تفاعل
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                (() => {
                                  const level = getMembershipLevel(user.total_points);
                                  return level.bgColor + ' ' + (level.color ? `text-[${level.color}]` : '');
                                })()
                              }`}>
                                {getMembershipLevel(user.total_points).name}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(user.last_activity).toLocaleDateString('ar-SA')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
              <div className={`text-center py-8 transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <p>لا توجد مستخدمين حالياً</p>
                  </div>
                )}
              </div>
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
      {/* رسالة النجاح */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>تم تحديث البيانات بنجاح!</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>برنامج الولاء الذكي 🏆</h1>
          <p className={`transition-colors duration-300 mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>إدارة نظام المكافآت والنقاط لتعزيز تفاعل القراء مع محتوى صحيفة سبق</p>
          {loyaltyStats && (
            <div className={`text-sm flex items-center gap-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span>آخر تحديث: {new Date(loyaltyStats.metadata.lastUpdated).toLocaleString('ar-SA')}</span>
              <span>•</span>
              <span>إجمالي التفاعلات: {loyaltyStats.metadata.totalInteractions.toLocaleString()}</span>
              <span>•</span>
              <span>التفاعلات المكافأة: {loyaltyStats.metadata.pointEarningInteractions.toLocaleString()}</span>
              <span className="text-green-500">• تحديث تلقائي كل 30 ثانية</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={forceRefresh}
            disabled={loading}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'جارٍ التحديث...' : 'تحديث البيانات'}
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
            <Target className="w-4 h-4" />
            حملة جديدة
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
            <Gift className="w-4 h-4" />
            مكافأة جديدة
          </button>
        </div>
      </div>

      <NavigationTabs />
      {renderTabContent()}
    </div>
  );
}
