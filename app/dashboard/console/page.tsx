'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity,
  Users,
  Eye,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Heart,
  Share2,
  Layers,
  Award
} from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
  type: 'create' | 'edit' | 'delete' | 'publish' | 'login' | 'ai' | 'system';
  status: 'success' | 'warning' | 'error';
  ip?: string;
  location?: string;
}

interface Interaction {
  id: string;
  user_id: string;
  article_id: string;
  category_id: string;
  action: string;
  duration?: number;
  timestamp: string;
  points_awarded: number;
}

interface CategoryStats {
  id: string;
  name: string;
  icon: string;
  interactions: number;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  avgDuration: number;
  growth: number;
}

interface UserStats {
  user_id: string;
  total_interactions: number;
  total_points: number;
  categories: Record<string, number>;
  last_active: string;
}

export default function ConsolePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [stats, setStats] = useState({
    totalInteractions: 0,
    activeUsers: 0,
    totalPoints: 0,
    mostActiveCategory: '',
    avgReadingTime: 0,
    growthRate: 0
  });

  // استرجاع حالة الوضع الليلي
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // جلب البيانات الحقيقية
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);

        // جلب التفاعلات
        const interactionsRes = await fetch('/api/interactions/all');
        if (interactionsRes.ok) {
          const interactionsData = await interactionsRes.json();
          setInteractions(interactionsData.interactions || []);
          
          // حساب إحصائيات التصنيفات
          const categoryMap = new Map<string, CategoryStats>();
          const userMap = new Map<string, UserStats>();
          
          interactionsData.interactions.forEach((interaction: Interaction) => {
            // إحصائيات التصنيفات
            if (!categoryMap.has(interaction.category_id)) {
              categoryMap.set(interaction.category_id, {
                id: interaction.category_id,
                name: interaction.category_id,
                icon: '📄',
                interactions: 0,
                views: 0,
                likes: 0,
                shares: 0,
                comments: 0,
                avgDuration: 0,
                growth: 0
              });
            }
            
            const catStats = categoryMap.get(interaction.category_id)!;
            catStats.interactions++;
            
            switch (interaction.action) {
              case 'read':
                catStats.views++;
                if (interaction.duration) {
                  catStats.avgDuration = (catStats.avgDuration + interaction.duration) / 2;
                }
                break;
              case 'like':
                catStats.likes++;
                break;
              case 'share':
                catStats.shares++;
                break;
              case 'comment':
                catStats.comments++;
                break;
            }
            
            // إحصائيات المستخدمين
            if (!userMap.has(interaction.user_id)) {
              userMap.set(interaction.user_id, {
                user_id: interaction.user_id,
                total_interactions: 0,
                total_points: 0,
                categories: {},
                last_active: interaction.timestamp
              });
            }
            
            const userStat = userMap.get(interaction.user_id)!;
            userStat.total_interactions++;
            userStat.total_points += interaction.points_awarded;
            userStat.categories[interaction.category_id] = (userStat.categories[interaction.category_id] || 0) + 1;
            userStat.last_active = interaction.timestamp;
          });
          
          // تحويل Maps إلى Arrays
          setCategoryStats(Array.from(categoryMap.values()).sort((a, b) => b.interactions - a.interactions));
          setUserStats(Array.from(userMap.values()).sort((a, b) => b.total_interactions - a.total_interactions));
          
          // حساب الإحصائيات العامة
          const totalInteractions = interactionsData.interactions.length;
          const activeUsers = userMap.size;
          const totalPoints = Array.from(userMap.values()).reduce((sum, user) => sum + user.total_points, 0);
          const mostActiveCategory = categoryStats[0]?.name || 'لا يوجد';
          const avgReadingTime = Math.round(
            interactionsData.interactions
              .filter((i: Interaction) => i.action === 'read' && i.duration)
              .reduce((sum: number, i: Interaction) => sum + (i.duration || 0), 0) / 
            interactionsData.interactions.filter((i: Interaction) => i.action === 'read').length
          ) || 0;
          
          setStats({
            totalInteractions,
            activeUsers,
            totalPoints,
            mostActiveCategory,
            avgReadingTime,
            growthRate: 0 // سيتم حسابه من البيانات التاريخية
          });
        }

      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

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
      { id: 'dashboard', name: 'لوحة القيادة', icon: BarChart3 },
      { id: 'categories', name: 'تحليل التصنيفات', icon: Layers },
      { id: 'users', name: 'سلوك المستخدمين', icon: Users },
      { id: 'realtime', name: 'التفاعل اللحظي', icon: Activity },
      { id: 'growth', name: 'النمو والاتجاهات', icon: TrendingUp }
    ];

    return (
      <div className={`rounded-2xl p-2 shadow-sm border mb-8 w-full transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex gap-2 justify-start overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-2 py-4 pb-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md border-b-4 border-blue-600'
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

  // مكون محتوى التبويبات
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              جارٍ تحميل البيانات الحقيقية...
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* إحصائيات رئيسية */}
            <div className="grid grid-cols-3 gap-6">
              <StatsCard
                title="إجمالي التفاعلات"
                value={stats.totalInteractions}
                subtitle="تفاعل"
                icon={Activity}
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <StatsCard
                title="المستخدمون النشطون"
                value={stats.activeUsers}
                subtitle="مستخدم"
                icon={Users}
                bgColor="bg-green-100"
                iconColor="text-green-600"
              />
              <StatsCard
                title="النقاط الممنوحة"
                value={stats.totalPoints}
                subtitle="نقطة"
                icon={Award}
                bgColor="bg-purple-100"
                iconColor="text-purple-600"
              />
            </div>

            {/* أكثر التصنيفات تفاعلاً */}
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className="px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  🔥 أكثر التصنيفات تفاعلاً
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {categoryStats.slice(0, 5).map((category, index) => (
                    <div key={category.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-xl">{category.icon}</span>
                        <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm text-center">
                          <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {category.interactions}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            تفاعل
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-blue-500" />
                            {category.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            {category.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="w-4 h-4 text-green-500" />
                            {category.shares}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* أكثر المستخدمين نشاطاً */}
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className="px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  👥 أكثر المستخدمين نشاطاً
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>المستخدم</th>
                      <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>التفاعلات</th>
                      <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>النقاط</th>
                      <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>أكثر تصنيف تفاعلاً</th>
                      <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>آخر نشاط</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {userStats.slice(0, 10).map((user) => {
                      const topCategory = Object.entries(user.categories)
                        .sort(([,a], [,b]) => b - a)[0];
                      return (
                        <tr key={user.user_id}>
                          <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {user.user_id.slice(-8)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {user.total_interactions}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            <span className="text-yellow-600 font-medium">{user.total_points}</span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {topCategory ? topCategory[0] : 'لا يوجد'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(user.last_active).toLocaleDateString('ar-SA')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryStats.map((category) => (
                <div key={category.id} className={`rounded-2xl p-6 border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {category.name}
                      </h3>
                    </div>
                    <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {category.interactions}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        متوسط وقت القراءة
                      </span>
                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {Math.round(category.avgDuration)} ثانية
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
                      <div className="text-center">
                        <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {category.views}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          مشاهدة
                        </p>
                      </div>
                      <div className="text-center">
                        <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {category.likes}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          إعجاب
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'realtime':
        return (
          <div className={`rounded-2xl shadow-sm border overflow-hidden ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <div className="px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}">
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                ⚡ التفاعلات اللحظية
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {interactions.slice(-20).reverse().map((interaction) => (
                  <div key={interaction.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        interaction.action === 'read' ? 'bg-blue-100' :
                        interaction.action === 'like' ? 'bg-red-100' :
                        interaction.action === 'share' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        {interaction.action === 'read' ? <Eye className="w-5 h-5 text-blue-600" /> :
                         interaction.action === 'like' ? <Heart className="w-5 h-5 text-red-600" /> :
                         interaction.action === 'share' ? <Share2 className="w-5 h-5 text-green-600" /> :
                         <MessageSquare className="w-5 h-5 text-purple-600" />}
                      </div>
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {interaction.user_id.slice(-8)}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {interaction.action === 'read' ? 'قرأ' :
                           interaction.action === 'like' ? 'أعجب بـ' :
                           interaction.action === 'share' ? 'شارك' :
                           'علق على'} مقال في {interaction.category_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        +{interaction.points_awarded} نقطة
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(interaction.timestamp).toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={`rounded-2xl shadow-sm border p-8 text-center ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              هذه الميزة قيد التطوير
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>لوحة التحكم الذكية 🤖</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>تحليل السلوك والتفاعل في الوقت الفعلي</p>
      </div>

      {/* قسم الإحصائيات السريعة */}
      <div className="mb-8">
        <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700' 
            : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100'
        }`}>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {loading ? '...' : stats.totalInteractions}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                إجمالي التفاعلات
              </p>
            </div>
            <div className="text-center border-r border-l ${darkMode ? 'border-purple-600' : 'border-purple-200'}">
              <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {loading ? '...' : stats.avgReadingTime}s
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                متوسط وقت القراءة
              </p>
            </div>
            <div className="text-center border-l ${darkMode ? 'border-purple-600' : 'border-purple-200'}">
              <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {loading ? '...' : stats.mostActiveCategory}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                أكثر تصنيف تفاعلاً
              </p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold mb-1 text-green-500`}>
                {loading ? '...' : `+${stats.growthRate}%`}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                نمو أسبوعي
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <NavigationTabs />

      {/* Content */}
      {renderTabContent()}
    </div>
  );
} 