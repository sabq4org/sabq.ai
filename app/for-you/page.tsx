'use client';

import React, { useState, useEffect } from 'react';
import { Filter, TrendingUp, Clock, Eye, 
  Heart, Sparkles, Brain, ChevronDown, Target, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import CategoryBadge from '@/app/components/CategoryBadge';
import { generatePlaceholderImage } from '@/lib/cloudinary';

interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  category_id: number;
  category_name?: string;
  author_name?: string;
  featured_image?: string;
  published_at: string;
  reading_time?: number;
  views_count?: number;
  likes_count?: number;
  shares_count?: number;
  comments_count?: number;
  interaction_count?: number;
  tags?: string[];
  score?: number;
  confidence?: number;
  is_personalized?: boolean;
}

export default function ForYouPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'relevant'>('relevant');
  const [showFilter, setShowFilter] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // التحقق من الوضع المظلم
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }

    // التحقق من تسجيل الدخول
    const storedUserId = localStorage.getItem('user_id');
    const userData = localStorage.getItem('user');
    
    if (storedUserId && storedUserId !== 'anonymous' && userData) {
      setIsLoggedIn(true);
      setUserId(storedUserId);
    } else {
      // إعادة التوجيه لتسجيل الدخول إذا لم يكن مسجل
      window.location.href = '/login?redirect=/for-you';
    }

    // جلب التصنيفات
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchPersonalizedContent();
    }
  }, [isLoggedIn, userId, selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      setCategories(result.categories || result.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPersonalizedContent = async () => {
    try {
      setLoading(true);
      
      let url = `/api/content/personalized?user_id=${userId}&limit=20`;
      
      // إضافة فلتر التصنيف
      if (selectedCategory) {
        url += `&category_id=${selectedCategory}`;
      }
      
      // إضافة طريقة الترتيب
      if (sortBy === 'newest') {
        url += '&sort=published_at&order=desc';
      } else if (sortBy === 'popular') {
        url += '&sort=views_count&order=desc';
      } else {
        url += '&sort=relevance&order=desc';
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setArticles(result.data.articles || []);
        } else {
          setArticles([]);
        }
      } else {
        console.error('Failed to fetch personalized content');
        setArticles([]);
      }
    } catch (error) {
      console.error('Error fetching personalized content:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPersonalizedContent();
  };



  // تنسيق الأرقام
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  محتوى مخصص لك
                </h1>
              </div>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                مقالات وتحليلات مختارة بعناية بناءً على اهتماماتك
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              className={`p-3 rounded-xl transition-all hover:scale-105 ${
                darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
              } shadow-lg`}
            >
              <RefreshCw className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            </button>
          </div>

          {/* Filters Section */}
          <div className={`rounded-xl p-4 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-sm`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ترتيب حسب:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy('relevant')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === 'relevant'
                          ? darkMode 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-purple-500 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        الأكثر صلة
                      </div>
                    </button>
                    <button
                      onClick={() => setSortBy('newest')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === 'newest'
                          ? darkMode 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-500 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        الأحدث
                      </div>
                    </button>
                    <button
                      onClick={() => setSortBy('popular')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === 'popular'
                          ? darkMode 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-orange-500 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        الأكثر قراءة
                      </div>
                    </button>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    {selectedCategory 
                      ? categories.find(c => c.id === selectedCategory)?.name_ar || 'التصنيف'
                      : 'جميع التصنيفات'
                    }
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showFilter && (
                    <div className={`absolute top-full mt-2 right-0 w-48 rounded-lg shadow-lg z-10 ${
                      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setShowFilter(false);
                        }}
                        className={`w-full text-right px-4 py-2 text-sm transition-colors ${
                          !selectedCategory
                            ? darkMode
                              ? 'bg-blue-900/30 text-blue-300'
                              : 'bg-blue-50 text-blue-700'
                            : darkMode
                              ? 'hover:bg-gray-700 text-gray-300'
                              : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        جميع التصنيفات
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setShowFilter(false);
                          }}
                          className={`w-full text-right px-4 py-2 text-sm transition-colors ${
                            selectedCategory === category.id
                              ? darkMode
                                ? 'bg-blue-900/30 text-blue-300'
                                : 'bg-blue-50 text-blue-700'
                              : darkMode
                                ? 'hover:bg-gray-700 text-gray-300'
                                : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {category.name_ar || category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {articles.length} مقال مخصص
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                جاري تحميل المحتوى المخصص لك...
              </p>
            </div>
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/article/${article.id}`} className="block h-full">
                <article className={`h-full min-h-[320px] flex flex-col group rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}>
                  {/* الصورة مع نسبة عرض ثابتة */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img 
                      src={article.featured_image || generatePlaceholderImage(article.title, 'article')} 
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* شارة التصنيف - أعلى اليسار */}
                    <div className="absolute top-3 left-3">
                      {(() => {
                        const categoryData = categories.find(cat => cat.id === article.category_id);
                        if (categoryData) {
                          return (
                            <CategoryBadge
                              category={categoryData}
                              size="sm"
                              variant="filled"
                              showIcon={true}
                              clickable={false}
                              className="text-xs backdrop-blur-sm"
                            />
                          );
                        }
                        return (
                          <span className="px-2 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs rounded-md font-medium">
                            {article.category_name || 'عام'}
                          </span>
                        );
                      })()}
                    </div>
                    
                    {/* نسبة المطابقة - أعلى اليمين (إذا كانت عالية) */}
                    {article.confidence && article.confidence > 70 && (
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/90 backdrop-blur-sm text-white text-xs rounded-full">
                          <Target className="w-3 h-3" />
                          <span className="font-medium">{Math.round(article.confidence)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* محتوى البطاقة */}
                  <div className="flex-1 flex flex-col p-5">
                    {/* العنوان */}
                    <h3 className={`text-lg font-semibold mb-2 line-clamp-2 transition-colors ${
                      darkMode ? 'text-white group-hover:text-purple-400' : 'text-gray-800 group-hover:text-purple-600'
                    }`}>
                      {article.title}
                    </h3>
                    
                    {/* الوصف المختصر */}
                    <p className={`text-sm mb-4 line-clamp-2 flex-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {article.summary}
                    </p>
                    
                    {/* المعلومات السفلية */}
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs">
                        {/* الوقت والكاتب */}
                        <div className="flex items-center gap-3">
                          {article.author_name && (
                            <span className={`${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {article.author_name}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {article.reading_time || 5} د
                          </span>
                        </div>
                        
                        {/* التفاعلات */}
                        <div className="flex items-center gap-3">
                          {article.views_count && article.views_count > 0 && (
                            <span className={`flex items-center gap-1 ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <Eye className="w-3 h-3" />
                              {formatNumber(article.views_count)}
                            </span>
                          )}
                          {article.likes_count && article.likes_count > 0 && (
                            <span className={`flex items-center gap-1 ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <Heart className="w-3 h-3" />
                              {formatNumber(article.likes_count)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">لا يوجد محتوى مخصص حالياً</p>
            <p className="text-sm">
              تفاعل مع المزيد من المقالات لتحسين التوصيات
            </p>
          </div>
        )}
      </main>
    </div>
  );
} 