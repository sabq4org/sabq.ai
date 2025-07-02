'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  Sparkles, 
  BookOpen,
  Zap,
  Activity,
  Eye,
  Pin,
  BarChart3,
  Shuffle,
  ChevronRight,
  X,
  Coffee,
  Sun,
  Moon,
  Sunrise
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface UserInsights {
  todayRecommendation?: {
    id: string;
    title: string;
    category: string;
    readingTime: number;
    reason: string;
  };
  knowledgeDiversity: {
    readCategories: number;
    totalCategories: number;
    topCategory: string;
    topCategoryPercentage: number;
    suggestedCategories: string[];
  };
  behaviorAnalysis: {
    preferredReadingTime: string;
    contentPreference: string;
    readingPattern: string;
  };
  weeklyActivity: {
    articlesRead: number;
    articlesSaved: number;
    interactions: number;
    streak: number;
  };
  similarReaders: {
    recommendations: Array<{
      id: string;
      title: string;
      reason: string;
    }>;
  };
}

// بيانات تجريبية للزوار
const demoInsights: UserInsights = {
  todayRecommendation: {
    id: 'demo-1',
    title: 'تطورات الذكاء الاصطناعي في 2024: ما يمكن توقعه',
    category: 'تقنية',
    readingTime: 8,
    reason: 'بناءً على اهتمامك بالتقنية والابتكار'
  },
  knowledgeDiversity: {
    readCategories: 3,
    totalCategories: 8,
    topCategory: 'تقنية',
    topCategoryPercentage: 45,
    suggestedCategories: ['اقتصاد', 'رياضة', 'ثقافة ومجتمع']
  },
  behaviorAnalysis: {
    preferredReadingTime: 'صباحاً (9-11 ص)',
    contentPreference: 'مقالات تحليلية متوسطة الطول',
    readingPattern: 'قارئ متوازن'
  },
  weeklyActivity: {
    articlesRead: 12,
    articlesSaved: 5,
    interactions: 8,
    streak: 4
  },
  similarReaders: {
    recommendations: [
      {
        id: 'demo-2',
        title: 'مستقبل العمل عن بُعد في العالم العربي',
        reason: 'قراء مثلك اهتموا بهذا الموضوع'
      },
      {
        id: 'demo-3',
        title: 'تأثير التكنولوجيا على التعليم العالي',
        reason: 'يتناسب مع اهتماماتك التقنية'
      }
    ]
  }
};

export default function FooterDashboard() {
  const { isLoggedIn, userId } = useAuth();
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // تحميل فوري للبيانات
    const loadData = async () => {
      if (isLoggedIn && userId) {
        await fetchUserInsights();
      } else {
        // استخدام البيانات التجريبية للزوار
        setInsights(demoInsights);
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn, userId]);

  const fetchUserInsights = async () => {
    try {
      const response = await fetch(`/api/user/insights?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      } else {
        // في حالة فشل API، استخدم البيانات التجريبية
        setInsights(demoInsights);
      }
    } catch (error) {
      console.error('Error fetching user insights:', error);
      // في حالة الخطأ، استخدم البيانات التجريبية
      setInsights(demoInsights);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('footerDashboardDismissed', new Date().toDateString());
  };

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return <Sunrise className="w-4 h-4" />;
    if (hour >= 12 && hour < 17) return <Sun className="w-4 h-4" />;
    if (hour >= 17 && hour < 20) return <Coffee className="w-4 h-4" />;
    return <Moon className="w-4 h-4" />;
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'صباح المعرفة';
    if (hour >= 12 && hour < 17) return 'ظهيرة مثمرة';
    if (hour >= 17 && hour < 20) return 'مساء القراءة';
    return 'ليلة هادئة';
  };

  // إخفاء إذا تم إغلاقه من قبل
  if (isDismissed) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 py-12 px-6 border-t border-blue-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-blue-200 dark:bg-gray-700 rounded w-1/3 mb-6 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-48 shadow-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 py-12 px-6 border-t border-blue-200 dark:border-gray-800 relative">
      {/* زر الإغلاق */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 left-4 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
        title="إخفاء لليوم"
      >
        <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>

      <div className="max-w-7xl mx-auto">
        {/* الترحيب الذكي */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            {getTimeIcon()}
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{getTimeGreeting()}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {isLoggedIn ? 'إليك نظرة على رحلتك المعرفية' : 'اكتشف ما يمكن أن تقدمه لك منصتنا الذكية'}
          </p>
          
          {/* رسالة للزوار */}
          {!isLoggedIn && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 rounded-xl max-w-2xl mx-auto">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                هذا عرض توضيحي لما ستحصل عليه عند تسجيل الدخول
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  إنشاء حساب مجاني
                </Link>
                <Link href="/login" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors">
                  تسجيل الدخول
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. بطاقة "ما يهمك اليوم" */}
          {insights?.todayRecommendation && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pin className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-lg">ما يهمك اليوم</h3>
                </div>
                <span className="text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  {insights.todayRecommendation.readingTime} دقيقة
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 font-medium">
                {insights.todayRecommendation.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                📌 {insights.todayRecommendation.reason}
              </p>
              <Link 
                href={`/article/${insights.todayRecommendation.id}`}
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>اقرأ الآن</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* 2. مؤشر التنوع المعرفي */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-lg">تنوعك المعرفي</h3>
            </div>
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                قرأت من {insights?.knowledgeDiversity.readCategories} من {insights?.knowledgeDiversity.totalCategories} تصنيفات
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${((insights?.knowledgeDiversity.readCategories || 0) / (insights?.knowledgeDiversity.totalCategories || 1)) * 100}%` 
                  }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                تخصصك يظهر في {insights?.knowledgeDiversity.topCategory} ({insights?.knowledgeDiversity.topCategoryPercentage}%)
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shuffle className="w-4 h-4 text-purple-400" />
              <span className="text-gray-600 dark:text-gray-400">جرّب: {insights?.knowledgeDiversity.suggestedCategories.join('، ')}</span>
            </div>
          </div>

          {/* 3. تحليل السلوك */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-lg">نمطك القرائي</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                  {insights?.behaviorAnalysis.preferredReadingTime}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-green-400" />
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                  {insights?.behaviorAnalysis.contentPreference}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                  {insights?.behaviorAnalysis.readingPattern}
                </span>
              </div>
            </div>
          </div>

          {/* 4. نشاطك الأسبوعي */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-lg">نشاطك هذا الأسبوع</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-400">{insights?.weeklyActivity.articlesRead}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">مقال مقروء</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{insights?.weeklyActivity.articlesSaved}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">محفوظ</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{insights?.weeklyActivity.interactions}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">تفاعل</div>
              </div>
            </div>
            {insights?.weeklyActivity.streak && insights.weeklyActivity.streak > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg py-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-700 dark:text-orange-300">سلسلة {insights.weeklyActivity.streak} أيام متتالية!</span>
              </div>
            )}
          </div>

          {/* 5. قراء مثلك */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <h3 className="font-bold text-lg">قراء مثلك اهتموا بـ</h3>
            </div>
            <div className="space-y-3">
              {insights?.similarReaders.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-1">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      💡 {rec.reason}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 