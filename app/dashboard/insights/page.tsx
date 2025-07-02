'use client';

import React, { useState, useEffect } from 'react';
import { Users, Eye, FileText, Heart, MessageSquare,
  Share2, Clock, Activity,
  ArrowUp, ArrowDown, Minus, BarChart3, PieChart,
  LineChart, Trophy
} from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface QuickStat {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  color: string;
}

export default function InsightsPage() {
  const { darkMode } = useDarkMode();
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // محاكاة تحميل البيانات
    setTimeout(() => setLoading(false), 1000);
  }, [timeRange]);

  const quickStats: QuickStat[] = [
    {
      title: 'إجمالي المقالات',
      value: 156,
      change: 12.5,
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'المستخدمون النشطون',
      value: '2,890',
      change: 8.3,
      icon: Users,
      color: 'green'
    },
    {
      title: 'إجمالي المشاهدات',
      value: '125.6K',
      change: 15.2,
      icon: Eye,
      color: 'purple'
    },
    {
      title: 'معدل التفاعل',
      value: '9.2%',
      change: 3.8,
      icon: Heart,
      color: 'pink'
    }
  ];

  const engagementStats = [
    { label: 'الإعجابات', value: '8,900', icon: Heart, color: 'red' },
    { label: 'التعليقات', value: '2,340', icon: MessageSquare, color: 'blue' },
    { label: 'المشاركات', value: '4,560', icon: Share2, color: 'green' },
    { label: 'متوسط القراءة', value: '4.5 د', icon: Clock, color: 'purple' }
  ];

  const topArticles = [
    { title: 'تطورات مهمة في قطاع التقنية', views: '15.6K', engagement: 92 },
    { title: 'الاقتصاد السعودي ينمو بنسبة قياسية', views: '12.3K', engagement: 88 },
    { title: 'إنجازات رياضية جديدة للمنتخب', views: '10.8K', engagement: 85 },
    { title: 'معرض الكتاب يحقق أرقاماً قياسية', views: '9.2K', engagement: 82 },
    { title: 'ابتكارات صحية تغير المستقبل', views: '8.5K', engagement: 79 }
  ];

  const topCategories = [
    { name: 'تقنية', articles: 45, views: '38.9K', percentage: 31 },
    { name: 'اقتصاد', articles: 38, views: '32.1K', percentage: 25 },
    { name: 'رياضة', articles: 32, views: '28.7K', percentage: 23 },
    { name: 'ثقافة', articles: 28, views: '21.3K', percentage: 17 },
    { name: 'صحة', articles: 13, views: '4.6K', percentage: 4 }
  ];

  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border' = 'bg') => {
    const colors = {
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500'
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-500'
      },
      purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500'
      },
      pink: {
        bg: 'bg-pink-100 dark:bg-pink-900/30',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-500'
      },
      red: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500'
      }
    };
    return colors[color as keyof typeof colors]?.[type] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''}`}>
      {/* الهيدر */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>
              <BarChart3 className="w-8 h-8" />
              لوحة الإحصائيات الشاملة
            </h1>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              تحليل شامل لأداء المنصة والمحتوى
            </p>
          </div>
          
          {/* فلتر الفترة الزمنية */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="year">هذه السنة</option>
          </select>
        </div>
      </div>

      {/* البطاقات الإحصائية الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`p-6 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {stat.title}
                  </p>
                  <h3 className={`text-2xl font-bold mt-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString('ar-SA') : stat.value}
                  </h3>
                  {stat.change !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${
                      stat.change > 0 ? 'text-green-500' : 
                      stat.change < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {stat.change > 0 ? <ArrowUp className="w-4 h-4" /> : 
                       stat.change < 0 ? <ArrowDown className="w-4 h-4" /> : 
                       <Minus className="w-4 h-4" />}
                      <span>{Math.abs(stat.change)}%</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${getColorClasses(stat.color, 'bg')}`}>
                  <Icon className={`w-6 h-6 ${getColorClasses(stat.color, 'text')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* الرسم البياني المبسط للأداء */}
      <div className={`p-6 rounded-2xl shadow-sm mb-8 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <LineChart className="w-5 h-5" />
          أداء الأسبوع
        </h3>
        
        <div className="space-y-4">
          {/* مؤشرات بسيطة للأداء */}
          <div className="grid grid-cols-7 gap-2">
            {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day, index) => {
              const height = Math.random() * 60 + 40; // ارتفاع عشوائي للتوضيح
              return (
                <div key={day} className="text-center">
                  <div className="relative h-32 flex items-end justify-center mb-2">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${height}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {day}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* إحصائيات التفاعل */}
      <div className={`p-6 rounded-2xl shadow-sm mb-8 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Activity className="w-5 h-5" />
          إحصائيات التفاعل
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {engagementStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className={`p-3 ${getColorClasses(stat.color, 'bg')} rounded-full`}>
                    <Icon className={`w-6 h-6 ${getColorClasses(stat.color, 'text')}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* شبكة من البطاقات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أفضل المقالات */}
        <div className={`p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Trophy className="w-5 h-5 text-yellow-500" />
            أفضل المقالات أداءً
          </h3>
          <div className="space-y-4">
            {topArticles.map((article, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium line-clamp-1 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {article.title}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {article.views} مشاهدة
                    </p>
                  </div>
                </div>
                <div className={`text-sm px-3 py-1 rounded-full ${
                  article.engagement > 90 ? 'bg-green-100 text-green-700' :
                  article.engagement > 80 ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {article.engagement}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* أفضل التصنيفات */}
        <div className={`p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <PieChart className="w-5 h-5 text-purple-500" />
            التصنيفات الأكثر نشاطاً
          </h3>
          <div className="space-y-4">
            {topCategories.map((category, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {category.name}
                    </span>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ({category.articles} مقال)
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {category.views}
                  </span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 right-0 h-full bg-gradient-to-l from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 