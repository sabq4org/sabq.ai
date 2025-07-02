'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Heart, 
  Share2, 
  Eye,
  Flame,
  BookOpen,
  TrendingUp,
  User,
  Sparkles,
  AlertCircle,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { AlHilalWorldCupBlock } from '@/components/smart-blocks/AlHilalWorldCupBlock';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_breaking_news: boolean;
  ai_generated: boolean;
  views?: number;
  likes?: number;
  shares?: number;
  score?: number;
}

interface PersonalizedContent {
  success: boolean;
  user_id: string;
  dose: string;
  preferences_count: number;
  articles: Article[];
  metadata: {
    total_available: number;
    returned: number;
    personalization_active: boolean;
  };
}

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent | null>(null);
  const [breakingNews, setBreakingNews] = useState<Article[]>([]);
  const [readLater, setReadLater] = useState<Article[]>([]);
  const [recommendedArticles, setRecommendedArticles] = useState<Article[]>([]);
  const [userId] = useState(() => {
    // في التطبيق الحقيقي، سيأتي من نظام المصادقة
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('user_id');
      return storedUserId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return '';
  });

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
    
    // حفظ معرف المستخدم
    if (userId) {
      localStorage.setItem('user_id', userId);
    }
  }, [userId]);

  // جلب المحتوى المخصص
  useEffect(() => {
    const fetchPersonalizedContent = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // جلب جميع المقالات المخصصة
        const [allContent, breaking, later, recommended] = await Promise.all([
          fetch(`/api/content/personalized?user_id=${userId}&limit=20&type=all`).then(res => res.json()),
          fetch(`/api/content/personalized?user_id=${userId}&limit=5&type=breaking`).then(res => res.json()),
          fetch(`/api/content/personalized?user_id=${userId}&limit=5&type=read-later`).then(res => res.json()),
          fetch(`/api/content/personalized?user_id=${userId}&limit=10&type=recommended`).then(res => res.json())
        ]);

        setPersonalizedContent(allContent);
        setBreakingNews(breaking.articles || []);
        setReadLater(later.articles || []);
        setRecommendedArticles(recommended.articles || []);
        
      } catch (error) {
        console.error('Error fetching personalized content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalizedContent();
  }, [userId]);

  // تتبع التفاعل
  const trackInteraction = async (articleId: string, action: string, duration?: number) => {
    try {
      await fetch('/api/interactions/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          article_id: articleId,
          action,
          duration,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  // مكون بطاقة المقال
  const ArticleCard = ({ article, variant = 'default' }: { article: Article; variant?: 'default' | 'compact' | 'featured' }) => {
    const [readTime, setReadTime] = useState(0);
    const [startTime] = useState(Date.now());

    const handleClick = () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      trackInteraction(article.id, 'read', duration);
    };

    const handleLike = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await trackInteraction(article.id, 'like');
      // تحديث واجهة المستخدم
    };

    const handleShare = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await trackInteraction(article.id, 'share');
      // فتح نافذة المشاركة
    };

    if (variant === 'featured') {
      return (
        <div className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="p-6">
            {article.is_breaking_news && (
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="text-red-500 font-bold text-sm">عاجل</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{article.category_icon}</span>
              <span className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>{article.category_name}</span>
            </div>

            <h2 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>{article.title}</h2>
            
            <p className={`text-base mb-4 line-clamp-3 transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>{article.summary}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className={`flex items-center gap-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Eye className="w-4 h-4" />
                  {article.views || 0}
                </span>
                <button onClick={handleLike} className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Heart className="w-4 h-4" />
                  {article.likes || 0}
                </button>
                <button onClick={handleShare} className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Share2 className="w-4 h-4" />
                  {article.shares || 0}
                </button>
              </div>

              <Link 
                href={`/article/${article.id}`}
                onClick={handleClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                اقرأ المزيد
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (variant === 'compact') {
      return (
        <div className={`rounded-lg p-4 transition-all duration-300 hover:shadow-md ${
          darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{article.category_icon}</span>
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 line-clamp-2 transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{article.title}</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(article.created_at).toLocaleDateString('ar-SA')}
                </span>
                <span className={`flex items-center gap-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Eye className="w-3 h-3" />
                  {article.views || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{article.category_icon}</span>
            <span className={`text-sm font-medium ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>{article.category_name}</span>
          </div>

          <h3 className={`text-lg font-bold mb-2 line-clamp-2 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>{article.title}</h3>
          
          <p className={`text-sm mb-3 line-clamp-2 transition-colors duration-300 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>{article.summary}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {article.author}
              </span>
              <span className={`flex items-center gap-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Clock className="w-3 h-3" />
                {new Date(article.created_at).toLocaleDateString('ar-SA')}
              </span>
            </div>

            <Link 
              href={`/article/${article.id}`}
              onClick={handleClick}
              className={`text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors`}
            >
              اقرأ المزيد ←
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // رسالة الترحيب المخصصة
  const WelcomeSection = () => {
    const getDoseMessage = () => {
      if (!personalizedContent) return '';
      
      switch (personalizedContent.dose) {
        case 'morning':
          return 'صباح الخير! إليك جرعتك الصباحية من الأخبار المختارة خصيصاً لك ☀️';
        case 'afternoon':
          return 'مساء الخير! حان وقت التحديث مع آخر الأخبار المناسبة لاهتماماتك 🌤️';
        case 'evening':
          return 'مساء الخير! إليك ملخص الأخبار المسائية المختارة لك 🌙';
        default:
          return 'مرحباً بك! إليك آخر الأخبار المختارة خصيصاً لك';
      }
    };

    return (
      <div className={`rounded-2xl p-6 mb-8 ${
        darkMode 
          ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700' 
          : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>{getDoseMessage()}</h1>
            <p className={`text-lg transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {personalizedContent?.metadata.personalization_active 
                ? `لديك ${personalizedContent.preferences_count} تفضيلات نشطة تساعدنا في اختيار المحتوى المناسب لك`
                : 'تفاعل مع المقالات لنتعرف على اهتماماتك ونقدم لك محتوى مخصص'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                <span className={`text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>ID: {userId.slice(-8)}</span>
              </div>
            </div>
            
            <Link href="/dashboard/preferences" className="p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            جارٍ تحميل المحتوى المخصص لك...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <WelcomeSection />

        {/* الأخبار العاجلة المخصصة */}
        {breakingNews.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Flame className="w-6 h-6 text-red-500 animate-pulse" />
              <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>عاجل من اهتماماتك</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {breakingNews.slice(0, 2).map((article) => (
                <ArticleCard key={article.id} article={article} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* الأخبار المخصصة لك */}
        {personalizedContent && personalizedContent.articles.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>مختارة خصيصاً لك</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalizedContent.articles.slice(0, 6).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* اقرأ لاحقاً */}
        {readLater.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-green-500" />
              <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>أكمل القراءة</h2>
              <span className={`text-sm px-2 py-1 rounded-full ${
                darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
              }`}>
                {readLater.length} مقالات
              </span>
            </div>
            
            <div className="space-y-4">
              {readLater.map((article) => (
                <ArticleCard key={article.id} article={article} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* توصيات مبنية على اهتماماتك */}
        {recommendedArticles.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>قد يعجبك أيضاً</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedArticles.slice(0, 8).map((article) => (
                <ArticleCard key={article.id} article={article} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* إذا لم يكن هناك محتوى مخصص بعد */}
        {(!personalizedContent || personalizedContent.articles.length === 0) && (
          <div className={`text-center py-16 rounded-2xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className={`text-xl font-bold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>لم نتعرف على اهتماماتك بعد</h3>
            <p className={`text-lg mb-6 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              ابدأ بقراءة المقالات والتفاعل معها لنتمكن من تخصيص المحتوى لك
            </p>
            <Link href="/newspaper" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-block">
              استكشف جميع الأخبار
            </Link>
          </div>
        )}

        {/* بلوك الهلال في بطولة العالم */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <AlHilalWorldCupBlock />
        </div>
      </div>
    </div>
  );
} 