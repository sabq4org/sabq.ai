'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import DeepAnalysisWidget from '@/components/DeepAnalysisWidget';
import FooterDashboard from '@/components/FooterDashboard';
import { 
  Share2, 
  Eye, 
  Clock, 
  Calendar,
  TrendingUp,
  Brain,
  Award,
  Target,
  Users,
  MapPin,
  Play,
  Volume2,
  Star,
  Zap,
  Globe,
  Newspaper,
  BarChart3,
  Lightbulb,
  Sparkles,
  Crown,
  Trophy,
  Gift,
  Coins,
  Activity,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Filter,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  Signal,
  Battery,
  WifiOff,
  SignalHigh,
  SignalMedium,
  SignalLow,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Laptop,
  Building2,
  Leaf,
  BookOpen,
  Home,
  Beaker,
  Palette,
  Car,
  Plane,
  GraduationCap,
  Briefcase,
  CloudRain,
  Tag,
  Flame,
  AlertCircle,
  Compass,
  PlayCircle,
  Download,
  Globe2,
  X,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Heart,
  Bookmark,
  MessageSquare,
  MonitorSmartphone
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getCookie, setCookie } from '@/lib/cookies';
import { generatePlaceholderImage, getValidImageUrl } from '@/lib/cloudinary';

import CategoryBadge from './components/CategoryBadge';
import Header from '../components/Header';
import { SmartSlot } from '@/components/home/SmartSlot';

import ReaderProfileCard from '@/components/reader-profile/ReaderProfileCard';
import { useReaderProfile } from '@/hooks/useReaderProfile';
import SmartDigestBlock from '@/components/smart-blocks/SmartDigestBlock';
import SmartContextWidget from '@/components/home/SmartContextWidget';
import InteractiveArticle from '@/components/InteractiveArticle';

// 🚀 إضافة المكونات المحسنة للموبايل
import MobileLayout from '@/components/mobile/MobileLayout';
import MobileArticleCard from '@/components/mobile/MobileArticleCard';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

// دالة تشخيص المصادقة
function DebugAuth() {
  const { isLoggedIn, userId, user } = useAuth();

  useEffect(() => {
    console.log("====[تشخيص المصادقة]====");
    console.log("isLoggedIn:", isLoggedIn);
    console.log("userId:", userId);
    console.log("user:", user);
    console.log("localStorage.user_id:", localStorage.getItem("user_id"));
    console.log("localStorage.user:", localStorage.getItem("user"));
    console.log("كوكيز:", document.cookie);

    fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("/api/auth/me =>", data);
      })
      .catch((err) => {
        console.error("خطأ في /api/auth/me:", err);
      });
  }, [isLoggedIn, userId]);

  return null; // لا يعرض شيء في الواجهة
}

// أيقونات التصنيفات
const categoryIcons: { [key: string]: any } = {
  'تقنية': Laptop,
  'رياضة': Trophy,
  'اقتصاد': TrendingUp,
  'سياسة': Building2,
  'صحة': Activity,
  'بيئة': Leaf,
  'ثقافة': BookOpen,
  'محلي': Home,
  'دولي': Globe,
  'منوعات': Activity,
  'علوم': Beaker,
  'فن': Palette,
  'سيارات': Car,
  'سياحة': Plane,
  'تعليم': GraduationCap,
  'أعمال': Briefcase,
  'طقس': CloudRain,
  'default': Tag
};

// ===============================
// نظام ذكاء المستخدم والتخصيص
// ===============================

interface UserInteraction {
  user_id: string;
  article_id: string;
  interaction_type: 'view' | 'read' | 'share' | 'comment';
  category: string;
  read_duration_seconds?: number;
  scroll_percentage?: number;
  source?: string;
  device_type?: string;
  session_id?: string;
  timestamp: number;
}

interface UserPreferences {
  [category: string]: number;
}

// نظام تتبع ذكاء المستخدم
class UserIntelligenceTracker {
  private interactions: UserInteraction[] = [];
  private preferences: { [userId: string]: UserPreferences } = {};
  private sessionId: string;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  // تسجيل تفاعل جديد
  trackInteraction(articleId: string, type: UserInteraction['interaction_type'], category: string, additionalData: any = {}) {
    const interaction: UserInteraction = {
      user_id: this.userId,
      article_id: articleId,
      interaction_type: type,
      category,
      session_id: this.sessionId,
      device_type: this.getDeviceType(),
      timestamp: Date.now(),
      ...additionalData
    };

    this.interactions.push(interaction);
    this.updatePreferences(interaction);
    this.saveToStorage();
    
    // إرسال التفاعل إلى الخادم
    this.sendToServer(interaction);
  }

  // تحديث تفضيلات المستخدم
  private updatePreferences(interaction: UserInteraction) {
    if (!this.preferences[this.userId]) {
      this.preferences[this.userId] = {};
    }

    const points = this.calculatePoints(interaction);
    const currentPoints = this.preferences[this.userId][interaction.category] || 0;
    
    this.preferences[this.userId][interaction.category] = currentPoints + points;
    
    // تطبيق تدهور زمني للتفضيلات القديمة
    const decayFactor = 0.99;
    Object.keys(this.preferences[this.userId]).forEach(category => {
      if (category !== interaction.category) {
        this.preferences[this.userId][category] *= decayFactor;
      }
    });
  }

  // حساب النقاط للتفاعل
  private calculatePoints(interaction: UserInteraction): number {
    const basePoints = {
      'view': 1,
      'read': 3,
      'share': 5,
      'comment': 7
    };

    let points = basePoints[interaction.interaction_type] || 1;
    
    // إضافة نقاط للوقت المقضي في القراءة
    if (interaction.read_duration_seconds) {
      points += Math.min(interaction.read_duration_seconds / 30, 5);
    }

    return points;
  }

  // الحصول على تفضيلات المستخدم
  getPreferences(): UserPreferences {
    return this.preferences[this.userId] || {};
  }

  // حساب الثقة في التصنيف
  calculateConfidence(category: string): number {
    const preferences = this.getPreferences();
    const totalPoints = Object.values(preferences).reduce((sum, points) => sum + points, 0);
    return totalPoints > 0 ? (preferences[category] || 0) / totalPoints : 0;
  }

  // توليد معرف الجلسة
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // تحديد نوع الجهاز
  getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // حفظ في التخزين المحلي
  private saveToStorage() {
    localStorage.setItem('user_intelligence_tracker', JSON.stringify({
      interactions: this.interactions.slice(-100), // حفظ آخر 100 تفاعل فقط
      preferences: this.preferences
    }));
  }

  // تحميل من التخزين المحلي
  private loadFromStorage() {
    const stored = localStorage.getItem('user_intelligence_tracker');
    if (stored) {
      const data = JSON.parse(stored);
      this.interactions = data.interactions || [];
      this.preferences = data.preferences || {};
    }
  }

  // إرسال التفاعل إلى الخادم
  private async sendToServer(interaction: UserInteraction) {
    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interaction)
      });
    } catch (error) {
      console.error('خطأ في إرسال التفاعل:', error);
    }
  }
}

// 🎯 مكون الصفحة الرئيسية المحسن للموبايل
function NewspaperHomePage(): React.ReactElement {
  const { isLoggedIn, userId, user } = useAuth();
  const { darkMode } = useDarkModeContext();
  const [isMobile, setIsMobile] = useState(false);

  // فحص نوع الجهاز
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // بقية الكود الحالي...
  // ... existing code ...

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{
        direction: 'rtl'
      }}
    >
      {/* دالة تشخيص المصادقة - تظهر معلومات في Console فقط */}
      <DebugAuth />
      
      {/* Header */}
      <Header />

      {/* عرض جميع البلوكات الذكية */}
      {getOrderedBlocks().some(block => blocksConfig[block.key]?.enabled) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {getOrderedBlocks().map(block => (
            <div key={block.key} className="mb-6">
              {block.component}
            </div>
          ))}
        </div>
      )}

      {/* Smart Blocks - Below Header - أول بلوك أسفل الهيدر مباشرة */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SmartSlot position="below_header" />
      </div>

      {/* Smart Blocks - Top Banner (للتوافق مع النظام القديم) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SmartSlot position="topBanner" />
      </div>

      {/* بلوك الجرعات الذكي - ثاني بلوك */}
      <SmartDigestBlock />
      
      {/* Deep Analysis Widget - ثالث بلوك */}
      {!deepInsightsLoading && deepInsights.length > 0 && (
        <DeepAnalysisWidget insights={deepInsights} />
      )}

      {/* Smart Blocks - Below Deep Analysis */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SmartSlot position="below_deep_analysis" />
      </div>

      {/* Smart Blocks - After Highlights - مخفي للنسخة المطورة */}
      {/* <SmartSlot position="afterHighlights" /> */}

      {/* Elegant Separator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 mt-6">
        <div className="flex items-center justify-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <div className={`px-6 py-2 rounded-full ${darkMode ? 'bg-gray-800 text-gray-400 dark:text-gray-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">المحتوى الذكي</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>
      </div>

      {/* شريط التنقل بالتصنيفات */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className={`rounded-3xl p-4 sm:p-6 lg:p-8 transition-all duration-500 shadow-lg dark:shadow-gray-900/50 ${darkMode ? 'bg-blue-900/10 border border-blue-800/30' : 'bg-blue-50 dark:bg-blue-900/20/50 border border-blue-200/50'}`} style={{ 
          backdropFilter: 'blur(10px)',
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(30, 64, 175, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(191, 219, 254, 0.3) 100%)'
        }}>
          <div className="text-center mb-6 sm:mb-8">
            {/* أيقونة كبيرة وواضحة */}
            <div className="mb-4">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center shadow-xl ${
                darkMode 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-800' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-700'
              }`}>
                <Tag className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            
            {/* العنوان */}
            <h2 className={`text-xl sm:text-2xl font-bold mb-3 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'
            }`}>
              {isLoggedIn ? 'استكشف بحسب اهتماماتك' : 'استكشف بحسب التصنيفات'}
            </h2>
            
            {/* الوصف */}
            <p className={`text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {isLoggedIn 
                ? 'التصنيفات المختارة لك بناءً على تفضيلاتك وتفاعلاتك'
                : 'اختر التصنيف الذي يهمك لتصفح الأخبار المتخصصة'
              }
            </p>
            <div className={`text-xs mt-2 transition-colors duration-300 ${
              darkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              {isLoggedIn ? (
                <div className="flex items-center gap-1 justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="opacity-75">مخصص لك بناءً على تفضيلاتك</span>
                </div>
              ) : (
                <span className="opacity-75">التصنيفات مرتبطة بنظام إدارة المحتوى</span>
              )}
            </div>
          </div>

          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {categories.map((category: any) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`group px-3 py-2 sm:px-4 md:px-6 sm:py-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 relative ${ selectedCategory === category.id ? darkMode ? 'bg-blue-600 text-white border-2 border-blue-500 shadow-lg dark:shadow-gray-900/50' : 'bg-blue-500 text-white border-2 border-blue-400 shadow-lg dark:shadow-gray-900/50' : darkMode ? 'bg-blue-800/20 hover:bg-blue-700/30 text-blue-100 hover:text-blue-50 border border-blue-700/30 hover:border-blue-600/50' : 'bg-white dark:bg-gray-800/80 hover:bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-blue-600 border border-blue-200/50 hover:border-blue-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-lg dark:shadow-gray-900/50 backdrop-blur-sm' }`}
                  >
                    {/* شارة "مخصص" للتصنيفات المخصصة */}
                    {isLoggedIn && category.is_personalized && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                    )}
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                      {(() => {
                        const IconComponent = categoryIcons[category.name_ar] || categoryIcons['default'];
                        return category.icon ? (
                          <span className="text-sm sm:text-lg group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
                        ) : (
                          <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-300" />
                        );
                      })()}
                      <span className="whitespace-nowrap">{category.name_ar || category.name}</span>
                      <span className={`text-xs ${ selectedCategory === category.id ? 'text-white/90' : darkMode ? 'text-blue-200 opacity-60' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 opacity-60' }`}>
                        ({category.articles_count || 0})
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* عرض المقالات المرتبطة بالتصنيف المختار */}
              {selectedCategory && (
                <div className={`mt-8 p-6 rounded-3xl shadow-lg dark:shadow-gray-900/50 ${darkMode ? 'bg-gray-800/50' : 'bg-white dark:bg-gray-800/70'} backdrop-blur-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                      مقالات {categories.find(c => c.id === selectedCategory)?.name_ar}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setCategoryArticles([]);
                      }}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800'}`}
                    >
                      <X className={`w-5 h-5 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`} />
                    </button>
                  </div>

                  {categoryArticlesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : categoryArticles.length > 0 ? (
                    <>
                      {/* Grid Layout for Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {categoryArticles.map((article: any) => (
                          <Link key={article.id} href={`/article/${article.id}`} className="group">
                            <article className={`h-full rounded-3xl overflow-hidden shadow-xl dark:shadow-gray-900/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}>
                              {/* صورة المقال */}
                              <div className="relative h-40 sm:h-48 overflow-hidden">
                                {article.featured_image ? (
                                  <img
                                    src={article.featured_image}
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    <BookOpen className={`w-12 h-12 sm:w-16 sm:h-16 ${darkMode ? 'text-gray-600 dark:text-gray-400 dark:text-gray-500' : 'text-gray-300'}`} />
                                  </div>
                                )}
                                
                                {/* تأثير التدرج على الصورة */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                {/* Category Badge */}
                                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-blue-900/80 text-blue-200 backdrop-blur-sm' : 'bg-blue-500/90 text-white backdrop-blur-sm'}`}>
                                    <Tag className="w-2 h-2 sm:w-3 sm:h-3" />
                                    {categories.find(c => c.id === selectedCategory)?.name_ar}
                                  </span>
                                </div>
                              </div>

                              {/* محتوى البطاقة */}
                              <div className="p-4 sm:p-5">
                                {/* العنوان */}
                                <h4 className={`font-bold text-base sm:text-lg mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                  {article.title}
                                </h4>

                                {/* الملخص */}
                                {article.summary && (
                                  <p className={`text-sm mb-4 line-clamp-2 transition-colors duration-300 text-gray-600 dark:text-gray-400 dark:text-gray-500`}>
                                    {article.summary}
                                  </p>
                                )}

                                {/* التفاصيل السفلية */}
                                <div className={`flex items-center justify-between pt-3 sm:pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100 dark:border-gray-700'}`}>
                                  {/* المعلومات */}
                                  <div className="flex flex-col gap-1">
                                    {/* التاريخ والوقت */}
                                    <div className="flex items-center gap-2 sm:gap-3 text-xs">
                                      <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                                        <Calendar className="w-3 h-3" />
                                        {new Date(article.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                      </span>
                                      {article.reading_time && (
                                        <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                                          <Clock className="w-3 h-3" />
                                          {article.reading_time} د
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* الكاتب والمشاهدات */}
                                    <div className="flex items-center gap-2 sm:gap-3 text-xs">
                                      {article.author_name && (
                                        <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                                          <User className="w-3 h-3" />
                                          {article.author_name}
                                        </span>
                                      )}
                                      <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                                        <Eye className="w-3 h-3" />
                                        {article.views_count || 0}
                                      </span>
                                    </div>
                                  </div>

                                  {/* زر القراءة */}
                                  <div className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-blue-900/20 group-hover:bg-blue-800/30' : 'bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100'}`}>
                                    <ArrowLeft className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                  </div>
                                </div>
                              </div>
                            </article>
                          </Link>
                        ))}
                      </div>
                      
                      {/* زر عرض جميع المقالات */}
                      <div className="text-center mt-8">
                        <Link 
                          href={`/categories/${categories.find(c => c.id === selectedCategory)?.slug || categories.find(c => c.id === selectedCategory)?.name_ar?.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 transform hover:scale-105 shadow-lg dark:shadow-gray-900/50 hover:shadow-xl dark:shadow-gray-900/50 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'}`}>
                          <span>عرض جميع مقالات {categories.find(c => c.id === selectedCategory)?.name_ar}</span>
                          <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </>
                    
                  ) : (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد مقالات منشورة في هذا التصنيف حالياً</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
              <p className="text-sm">لا توجد تصنيفات متاحة حالياً</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Enhanced News Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            {isCheckingAuth ? (
              // عرض حالة تحميل أثناء التحقق من تسجيل الدخول
              <div className="animate-pulse">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700 mb-6">
                  <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-32 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="w-96 h-10 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-4"></div>
                <div className="w-full max-w-2xl h-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                {/* رأس القسم مع شرط حالة تسجيل الدخول */}
                {!isCheckingAuth && (
                  isLoggedIn ? (
                    // للمستخدم المسجل
                    <>
                      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-6">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          نسخة مطورة بالذكاء الاصطناعي
                        </span>
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      </div>
                      <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        🎯 محتوى ذكي مخصص لاهتماماتك
                      </h2>
                      <p className={`text-xl max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        نقدم لك أفضل المقالات المختارة خصيصاً بناءً على اهتماماتك المحددة
                      </p>
                    </>
                  ) : (
                    // للزائر غير المسجل
                    <>
                      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 mb-6 dark:bg-gray-800/40 dark:border-gray-700">
                        <Newspaper className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          أحدث المقالات
                        </span>
                      </div>
                      <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        📰 آخر الأخبار
                      </h2>
                      <p className={`text-xl max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        تابع أحدث المقالات المنشورة من جميع التصنيفات
                      </p>
                    </>
                  )
                )}
              </>
            )}
          </div>

          {/* Enhanced Show All Link */}
          <div className="flex items-center justify-end mb-8">
            <Link 
              href="/for-you"
              className="group inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg dark:shadow-gray-900/50 hover:shadow-xl dark:shadow-gray-900/50 hover:scale-105">
              <span>عرض الكل</span>
              <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Enhanced News Grid - مع دعم المحتوى المخصص */}
          {articlesLoading || personalizedLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>جاري تحميل المقالات...</p>
              </div>
            </div>
          ) : (
            <>
              {/* رسالة للمستخدمين المسجلين مع اهتمامات */}
              {isLoggedIn && userInterests.length > 0 && showPersonalized && (
                <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
                  darkMode 
                    ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/30' 
                    : 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <Sparkles className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      يتم عرض المحتوى بناءً على اهتماماتك: {userInterests.map(interestId => {
                        // البحث عن اسم الفئة من قائمة الفئات المحملة
                        const category = categories.find(cat => cat.id === interestId);
                        return category ? (category.name_ar || category.name) : '';
                      }).filter(name => name).join(' • ')}
                    </p>
                  </div>
                  <Link 
                    href="/welcome/preferences"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      darkMode 
                        ? 'bg-purple-800/30 hover:bg-purple-700/40 text-purple-300' 
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                    }`}
                  >
                    <Settings className="w-3 h-3" />
                    تعديل
                  </Link>
                </div>
              )}
              
              {/* رسالة للمستخدمين غير المسجلين */}
              {!isLoggedIn && (
                <div className={`mb-6 p-4 rounded-xl text-center ${
                  darkMode 
                    ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                }`}>
                  <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    🎯 سجل دخولك للحصول على محتوى مخصص حسب اهتماماتك
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link 
                      href="/register"
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                    >
                      إنشاء حساب
                    </Link>
                    <Link 
                      href="/login"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                        darkMode 
                          ? 'border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-800' 
                          : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      تسجيل دخول
                    </Link>
                  </div>
                </div>
              )}
              
              {/* عرض المقالات */}
              {(showPersonalized && personalizedArticles.length > 0) ? (
                // عرض المقالات المخصصة للمستخدمين المسجلين
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {personalizedArticles.slice(0, 12).map((news) => (
                    <div key={news.id} className="relative">
                      {/* شارة "مخصص لك" */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                          darkMode 
                            ? 'bg-purple-900/80 text-purple-200' 
                            : 'bg-purple-500/90 text-white'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          مخصص
                        </span>
                      </div>
                      <NewsCard news={news} />
                    </div>
                  ))}
                </div>
              ) : articles.length > 0 ? (
                // عرض آخر المقالات للزوار أو المستخدمين بدون تفضيلات
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {articles.slice(0, 12).map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              ) : (
                // لا توجد مقالات
                <div className={`text-center py-20 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                  <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">لا توجد مقالات منشورة حالياً</p>
                  <p className="text-sm">تحقق لاحقاً للحصول على آخر الأخبار والمقالات</p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Smart Blocks - After Cards - مخفي للنسخة المطورة */}
        {/* <SmartSlot position="afterCards" /> */}

        {/* Smart Blocks - Before Personalization */}
        <SmartSlot position="beforePersonalization" />

        {/* Enhanced Smart Blocks Section - مخفي للنسخة المطورة */}
        {/* <section className="mb-16">
          ... البلوكات الذكية مخفية للتركيز على المحتوى المخصص ...
        </section> */}

        {/* السياق الذكي */}
        <section className="mb-16">
          <SmartContextWidget />
        </section>

        {/* المقالات التفاعلية - التصميم الجديد */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 mb-6">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  تفاعل مباشر
                </span>
                <Zap className="w-5 h-5 text-pink-600" />
              </div>
              <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                🎯 شارك رأيك وتفاعل مع المحتوى
              </h2>
              <p className={`text-lg max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                مقالات مميزة تتيح لك التصويت والمشاركة في استطلاعات الرأي والنقاش المباشر مع القراء
              </p>
            </div>

            {/* التصميم الجديد - Mix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* بطاقة التصويت السريع */}
              <div className={`group relative rounded-3xl overflow-hidden shadow-2xl dark:shadow-gray-900/50 hover:shadow-3xl transition-all duration-500 transform hover:scale-105 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* شارة النوع */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                    تصويت سريع
                  </span>
                </div>
                
                {/* الصورة */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80" 
                    alt="الذكاء الاصطناعي في التعليم"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* عداد المشاركين */}
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
                      <Users className="w-4 h-4" />
                      <span>2.3K مشارك</span>
                    </div>
                  </div>
                </div>
                
                {/* المحتوى */}
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    هل يجب تدريس الذكاء الاصطناعي في المدارس؟
                  </h3>
                  <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    شارك برأيك في أهمية إدخال مناهج الذكاء الاصطناعي في التعليم الأساسي
                  </p>
                  
                  {/* أزرار التصويت */}
                  <div className="space-y-3 mb-6">
                    <button className={`w-full p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      darkMode 
                        ? 'border-gray-600 hover:border-green-500 bg-gray-800 hover:bg-green-900/20' 
                        : 'border-gray-200 hover:border-green-500 bg-white hover:bg-green-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>نعم، ضروري</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>68%</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{width: '68%'}}></div>
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    <button className={`w-full p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      darkMode 
                        ? 'border-gray-600 hover:border-red-500 bg-gray-800 hover:bg-red-900/20' 
                        : 'border-gray-200 hover:border-red-500 bg-white hover:bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>لا، مبكر جداً</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>32%</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{width: '32%'}}></div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  {/* زر المشاركة */}
                  <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                    صوت الآن
                  </button>
                </div>
              </div>

              {/* بطاقة الاستطلاع المتعدد */}
              <div className={`group relative rounded-3xl overflow-hidden shadow-2xl dark:shadow-gray-900/50 hover:shadow-3xl transition-all duration-500 transform hover:scale-105 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* شارة النوع */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                    استطلاع متعدد
                  </span>
                </div>
                
                {/* الصورة */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=80" 
                    alt="كأس آسيا"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* مؤقت */}
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
                      <Clock className="w-4 h-4" />
                      <span>ينتهي خلال 4 ساعات</span>
                    </div>
                  </div>
                </div>
                
                {/* المحتوى */}
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    من سيفوز بكأس آسيا هذا العام؟
                  </h3>
                  <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    توقع الفريق الفائز وشارك في النقاش مع المشجعين
                  </p>
                  
                  {/* خيارات الاستطلاع */}
                  <div className="space-y-3 mb-6">
                    {[
                      {name: 'السعودية', votes: 45, color: 'green'},
                      {name: 'اليابان', votes: 25, color: 'blue'},
                      {name: 'كوريا الجنوبية', votes: 20, color: 'red'},
                      {name: 'أستراليا', votes: 10, color: 'yellow'}
                    ].map((option, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-purple-300 transition-all cursor-pointer">
                        <div className={`w-4 h-4 rounded-full bg-${option.color}-500`}></div>
                        <span className={`flex-1 font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{option.name}</span>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{option.votes}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full bg-${option.color}-500 rounded-full`} style={{width: `${option.votes}%`}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* زر المشاركة */}
                  <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                    شارك توقعك
                  </button>
                </div>
              </div>

              {/* بطاقة النقاش المفتوح */}
              <div className={`group relative rounded-3xl overflow-hidden shadow-2xl dark:shadow-gray-900/50 hover:shadow-3xl transition-all duration-500 transform hover:scale-105 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* شارة النوع */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                    نقاش مفتوح
                  </span>
                </div>
                
                {/* الصورة */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80" 
                    alt="رؤية 2030"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* عدد التعليقات */}
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
                      <MessageSquare className="w-4 h-4" />
                      <span>134 تعليق</span>
                    </div>
                  </div>
                </div>
                
                {/* المحتوى */}
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    تأثير رؤية 2030 على الاقتصاد المحلي
                  </h3>
                  <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    ناقش التحولات الاقتصادية وشارك تجربتك الشخصية مع القراء
                  </p>
                  
                  {/* آخر التعليقات */}
                  <div className="space-y-3 mb-6">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">أ</div>
                        <div className="flex-1">
                          <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            "شهدت تحسناً كبيراً في فرص العمل..."
                          </p>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>أحمد محمد - منذ ساعة</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">س</div>
                        <div className="flex-1">
                          <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            "الاستثمارات الأجنبية زادت بشكل ملحوظ"
                          </p>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>سارة أحمد - منذ 3 ساعات</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* زر المشاركة */}
                  <Link href="/article/interactive/vision-2030-impact" className="block">
                    <button className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                      انضم للنقاش
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* شريط الإحصائيات */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <div className={`text-center p-4 md:p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <div className="text-2xl md:text-3xl font-bold text-orange-500 mb-2">15K+</div>
                <div className={`text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>تصويت اليوم</div>
              </div>
              <div className={`text-center p-4 md:p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <div className="text-2xl md:text-3xl font-bold text-purple-500 mb-2">8.2K</div>
                <div className={`text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>مشارك نشط</div>
              </div>
              <div className={`text-center p-4 md:p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <div className="text-2xl md:text-3xl font-bold text-green-500 mb-2">2.1K</div>
                <div className={`text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>تعليق جديد</div>
              </div>
              <div className={`text-center p-4 md:p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <div className="text-2xl md:text-3xl font-bold text-blue-500 mb-2">94%</div>
                <div className={`text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>معدل التفاعل</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Smart Blocks - Below Personalized Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <SmartSlot position="below_personalized" />
      </div>

      {/* Smart Blocks - Above Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SmartSlot position="above_footer" />
      </div>

      {/* Footer Section */}
      <footer className={`mt-20 py-12 border-t ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Logo Section */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                <span className="text-white font-bold text-xl">س</span>
              </div>
              <div className="text-left">
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                  سبق
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                  صحيفة المستقبل الذكية
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-8">
            <div className={`text-center px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">1.2M+</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>قارئ نشط</div>
            </div>
            <div className={`text-center px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">50K+</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>مقال يومياً</div>
            </div>
            <div className={`text-center px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">AI</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>ذكاء اصطناعي</div>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <a href="#" className={`text-sm hover:text-blue-500 transition-colors ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
              سياسة الخصوصية
            </a>
            <a href="#" className={`text-sm hover:text-blue-500 transition-colors ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
              شروط الاستخدام
            </a>
            <a href="#" className={`text-sm hover:text-blue-500 transition-colors ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
              تواصل معنا
            </a>
            <a href="#" className={`text-sm hover:text-blue-500 transition-colors ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
              عن سبق
            </a>
          </div>

          {/* Copyright */}
          <div className="flex items-center justify-center gap-2">
            <p className={`text-sm ${darkMode ? 'text-gray-500 dark:text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
              © 2025 صحيفة سبق – جميع الحقوق محفوظة
            </p>
            <div className="flex items-center gap-1">
              <span className="text-red-500">❤️</span>
              <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                صُنع بحب في المملكة العربية السعودية
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Export with client-side wrapper to ensure ThemeProvider is available
export default function Page() {
  return (
    <MobileLayout showHeader={false} showFooter={false}>
      <NewspaperHomePage />
    </MobileLayout>
  );
} 