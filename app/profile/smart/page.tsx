'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  BookOpen, 
  Target,
  Sparkles,
  ChevronLeft,
  Activity,
  Calendar,
  Award,
  Zap,
  BarChart3,
  PieChart,
  Users,
  Heart,
  Share2,
  MessageCircle,
  Bookmark,
  Search,
  MessageSquare,
  Compass
} from 'lucide-react';
import Header from '@/components/Header';
import { useReaderProfile } from '@/hooks/useReaderProfile';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const personalityConfig: Record<string, {
  gradient: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
}> = {
  'news_hunter': {
    gradient: 'from-blue-500 to-cyan-500',
    icon: Search,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-900'
  },
  'deep_analyst': {
    gradient: 'from-purple-500 to-pink-500',
    icon: Brain,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-900'
  },
  'opinion_seeker': {
    gradient: 'from-orange-500 to-red-500',
    icon: MessageSquare,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-900'
  },
  'knowledge_explorer': {
    gradient: 'from-indigo-500 to-purple-500',
    icon: Compass,
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-900'
  },
  'trend_follower': {
    gradient: 'from-green-500 to-emerald-500',
    icon: TrendingUp,
    bgColor: 'bg-green-50',
    textColor: 'text-green-900'
  },
  'balanced_reader': {
    gradient: 'from-gray-500 to-gray-600',
    icon: BookOpen,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-900'
  }
};

export default function SmartProfilePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const { profile, isLoading, error } = useReaderProfile();
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements'>('overview');

  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`} style={{ direction: 'rtl' }}>
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>جاري تحميل ملفك الذكي...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`} style={{ direction: 'rtl' }}>
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className={`text-center p-12 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <Brain className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              لم نتمكن من تحميل ملفك الذكي
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {error || 'يرجى تسجيل الدخول لعرض ملفك الذكي'}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  const config = personalityConfig[profile.personality.type] || personalityConfig['balanced_reader'];
  const PersonalityIcon = config.icon;

  // نصائح افتراضية لكل شخصية
  const personalityTips: Record<string, string[]> = {
    'news_hunter': [
      'تابع قسم الأخبار العاجلة للحصول على آخر التحديثات',
      'فعّل التنبيهات للأخبار المهمة',
      'استخدم خاصية البحث المتقدم للعثور على أخبار محددة'
    ],
    'deep_analyst': [
      'اطلع على قسم التحليلات العميقة للمقالات',
      'احفظ المقالات المهمة للرجوع إليها لاحقاً',
      'شارك في النقاشات لتعميق فهمك'
    ],
    'opinion_seeker': [
      'تابع كتّاب الرأي المفضلين لديك',
      'اقرأ التعليقات لفهم وجهات النظر المختلفة',
      'شارك رأيك في المقالات التي تهمك'
    ],
    'knowledge_explorer': [
      'استكشف تصنيفات جديدة لتوسيع معرفتك',
      'احفظ المقالات التعليمية في مكتبتك',
      'تابع السلاسل التعليمية والمقالات المترابطة'
    ],
    'trend_follower': [
      'تابع قسم الأكثر قراءة يومياً',
      'شارك المحتوى الرائج مع أصدقائك',
      'فعّل التنبيهات للمواضيع الشائعة'
    ],
    'balanced_reader': [
      'حافظ على تنوع قراءاتك',
      'خصص وقتاً لكل تصنيف من اهتماماتك',
      'جرب قراءة مواضيع جديدة بانتظام'
    ]
  };

  const tips = personalityTips[profile.personality.type] || personalityTips['balanced_reader'];

  return (
    <div 
      className={`smart-profile-page min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{ direction: 'rtl' }}
    >
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-20",
          config.gradient
        )} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className={cn(
              "flex items-center gap-2 mb-6 px-4 py-2 rounded-lg transition-colors",
              darkMode 
                ? "hover:bg-gray-800 text-gray-300" 
                : "hover:bg-gray-100 text-gray-700"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>رجوع</span>
          </button>

          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            <div className={cn(
              "p-6 rounded-2xl bg-gradient-to-br shadow-xl flex-shrink-0",
              config.gradient
            )}>
              <PersonalityIcon className="w-12 h-12 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {profile.personality.type === 'balanced_reader' 
                  ? '🧠 قارئ متزن'
                  : profile.personality.type === 'news_hunter'
                  ? '🔍 صياد الأخبار'
                  : profile.personality.type === 'deep_analyst'
                  ? '🎯 محلل عميق'
                  : profile.personality.type === 'opinion_seeker'
                  ? '💬 باحث عن الآراء'
                  : profile.personality.type === 'knowledge_explorer'
                  ? '🧭 مستكشف المعرفة'
                  : '📈 متابع الترندات'
                }
              </h1>
              <p className={`text-base sm:text-lg mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {profile.personality.type === 'balanced_reader' 
                  ? 'تختار بعناية وتستمتع بالتنوّع المعرفي'
                  : profile.personality.type === 'news_hunter'
                  ? 'دائماً في المقدمة، تطارد الأخبار العاجلة'
                  : profile.personality.type === 'deep_analyst'
                  ? 'تغوص في التفاصيل وتكشف المعاني الخفية'
                  : profile.personality.type === 'opinion_seeker'
                  ? 'تثري معرفتك بوجهات النظر المتنوعة'
                  : profile.personality.type === 'knowledge_explorer'
                  ? 'رحلتك المعرفية لا تنتهي، دائماً تستكشف'
                  : 'تركب موجة الترندات وتتابع كل جديد'
                }
              </p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 sm:gap-6">
                <div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    معدل القراءة اليومي
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.dailyReadingAverage > 0 ? (
                      `${profile.stats.dailyReadingAverage} مقال`
                    ) : (
                      <span className="text-base">لم تبدأ رحلتك بعد</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    سلسلة النشاط
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.streakDays > 0 ? (
                      `${profile.stats.streakDays} يوم`
                    ) : (
                      <span className="text-base">ابدأ اليوم!</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    إجمالي القراءة
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.totalArticlesRead > 0 ? (
                      `${profile.stats.totalArticlesRead} مقال`
                    ) : (
                      <span className="text-base">اقرأ أول مقال!</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 sm:gap-4 mb-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap",
                activeTab === 'overview'
                  ? darkMode 
                    ? "bg-gray-800 text-white shadow-lg" 
                    : "bg-white text-gray-800 shadow-lg"
                  : darkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-800"
              )}
            >
              نظرة عامة
            </button>
            <button
              onClick={() => profile.stats.totalArticlesRead > 0 ? setActiveTab('stats') : null}
              disabled={profile.stats.totalArticlesRead === 0}
              title={profile.stats.totalArticlesRead === 0 ? "ابدأ القراءة لتظهر الإحصائيات" : ""}
              className={cn(
                "px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap relative",
                activeTab === 'stats'
                  ? darkMode 
                    ? "bg-gray-800 text-white shadow-lg" 
                    : "bg-white text-gray-800 shadow-lg"
                  : profile.stats.totalArticlesRead === 0
                    ? darkMode
                      ? "text-gray-600 cursor-not-allowed opacity-50"
                      : "text-gray-400 cursor-not-allowed opacity-50"
                    : darkMode
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-600 hover:text-gray-800"
              )}
            >
              الإحصائيات
              {profile.stats.totalArticlesRead === 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => profile.stats.totalArticlesRead > 0 ? setActiveTab('achievements') : null}
              disabled={profile.stats.totalArticlesRead === 0}
              title={profile.stats.totalArticlesRead === 0 ? "ابدأ القراءة لتفتح الإنجازات" : ""}
              className={cn(
                "px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap relative",
                activeTab === 'achievements'
                  ? darkMode 
                    ? "bg-gray-800 text-white shadow-lg" 
                    : "bg-white text-gray-800 shadow-lg"
                  : profile.stats.totalArticlesRead === 0
                    ? darkMode
                      ? "text-gray-600 cursor-not-allowed opacity-50"
                      : "text-gray-400 cursor-not-allowed opacity-50"
                    : darkMode
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-600 hover:text-gray-800"
              )}
            >
              الإنجازات
              {profile.stats.totalArticlesRead === 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interests */}
            <div className={cn(
              "p-6 rounded-2xl shadow-lg",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                اهتماماتك الرئيسية
              </h3>
              {profile.stats.favoriteCategories.length > 0 ? (
                <div className="space-y-3">
                  {profile.stats.favoriteCategories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Compass className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    لم تحدد اهتماماتك بعد. اخترها الآن لتصلك وجبتك المعرفية.
                  </p>
                  <button
                    onClick={() => router.push('/profile/preferences')}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Target className="w-4 h-4" />
                    <span>تخصيص الاهتمامات</span>
                  </button>
                </div>
              )}
            </div>

            {/* Traits */}
            <div className={cn(
              "p-6 rounded-2xl shadow-lg",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                سماتك كقارئ
              </h3>
              {profile.traits && profile.traits.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {profile.traits.map((trait) => (
                    <div
                      key={trait.id}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg",
                        darkMode ? "bg-gray-700" : "bg-gray-100"
                      )}
                    >
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {trait.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {profile.personality.type === 'balanced_reader' 
                      ? 'تقرأ بانضباط وتحب تنوّع المواضيع'
                      : profile.personality.type === 'news_hunter'
                      ? 'تبحث عن الأخبار العاجلة والحصرية'
                      : profile.personality.type === 'deep_analyst'
                      ? 'تحلل بعمق وتبحث عن المعاني الخفية'
                      : profile.personality.type === 'opinion_seeker'
                      ? 'تستمتع بوجهات النظر المختلفة'
                      : profile.personality.type === 'knowledge_explorer'
                      ? 'تستكشف المعرفة من كل الاتجاهات'
                      : 'تتابع الترندات والمواضيع الساخنة'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className={cn(
              "p-6 rounded-2xl shadow-lg",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                نصائح لك
              </h3>
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"
                    )}>
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reading Stats */}
            <div className={cn(
              "p-6 rounded-2xl shadow-lg",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  إحصائيات القراءة
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    إجمالي المقالات المقروءة
                  </span>
                  <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.totalArticlesRead}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    إجمالي التفاعلات
                  </span>
                  <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.totalInteractions}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    معدل القراءة اليومي
                  </span>
                  <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.dailyReadingAverage} مقال
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    نقاط الولاء
                  </span>
                  <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.loyaltyPoints} نقطة
                  </span>
                </div>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className={cn(
              "p-6 rounded-2xl shadow-lg",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <div className="flex items-center gap-3 mb-6">
                <Activity className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  التفاعل
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      الإعجابات
                    </span>
                  </div>
                  <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.interactionBreakdown.likes}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-500" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      المشاركات
                    </span>
                  </div>
                  <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.interactionBreakdown.shares}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      التعليقات
                    </span>
                  </div>
                  <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.interactionBreakdown.comments}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-yellow-500" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      المحفوظات
                    </span>
                  </div>
                  <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {profile.stats.interactionBreakdown.saves}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    معدل التفاعل
                  </span>
                  <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {Math.round((profile.stats.totalInteractions / profile.stats.totalArticlesRead) * 100) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((profile.stats.totalInteractions / profile.stats.totalArticlesRead) * 100) || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Achievement Cards */}
            <div className={cn(
              "p-6 rounded-2xl shadow-lg text-center",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                قارئ نشط
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                قرأت أكثر من {profile.stats.totalArticlesRead} مقال
              </p>
            </div>

            <div className={cn(
              "p-6 rounded-2xl shadow-lg text-center",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                سلسلة مذهلة
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {profile.stats.streakDays} يوم متتالي من القراءة
              </p>
            </div>

            <div className={cn(
              "p-6 rounded-2xl shadow-lg text-center",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                مؤثر
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                شاركت أكثر من {profile.stats.interactionBreakdown.shares} مقال
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 