'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Filter, Grid, List, ChevronDown, Sparkles, 
  TrendingUp, Calendar, User, Eye, Heart, Share2, 
  Volume2, Zap, BookOpen, Flame, Star, Award,
  SortAsc, SortDesc, Loader2, RefreshCw, Play
} from 'lucide-react';
import Link from 'next/link';
import { getArticleLink } from '@/lib/utils';
import { formatDateOnly } from '@/lib/date-utils';
import { generatePlaceholderImage, getValidImageUrl } from '@/lib/cloudinary';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  category_id?: number;
  category_name?: string;
  author_name?: string;
  author_id?: string;
  author_avatar?: string;
  author_specialization?: string;
  views_count: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  reading_time?: number;
  created_at: string;
  published_at?: string;
  updated_at?: string;
  is_breaking?: boolean;
  is_featured?: boolean;
  is_trending?: boolean;
  type?: string;
  ai_summary?: string;
  ai_keywords?: string[];
  engagement_score?: number;
  topic_tags?: string[];
}

interface Category {
  id: number;
  name: string;
  name_ar: string;
  name_en: string;
  slug: string;
  color?: string;
  articles_count?: number;
}

interface Author {
  id: string;
  name: string;
  avatar?: string;
  specialization?: string;
  articles_count?: number;
}

interface FilterOptions {
  category: string;
  author: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'latest' | 'popular' | 'trending' | 'engagement';
  type: 'all' | 'news' | 'opinion' | 'analysis';
}

export default function ArticlesPage() {
  // الحالات الأساسية
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // إعدادات العرض والفلترة
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'magazine'>('magazine');
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    author: 'all',
    dateRange: 'all',
    sortBy: 'latest',
    type: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // التصفح والتحميل
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // ميزات AI والتفاعل
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  
  // المراجع
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // جلب البيانات الأولية
  useEffect(() => {
    fetchInitialData();
  }, []);

  // جلب المقالات عند تغيير الفلاتر
  useEffect(() => {
    setPage(1);
    fetchArticles(true);
  }, [filters, searchQuery]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreArticles();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // جلب المقالات والتصنيفات والكتاب بالتوازي
      const [articlesRes, categoriesRes, authorsRes, trendsRes] = await Promise.all([
        fetch('/api/articles?status=published&limit=20'),
        fetch('/api/categories'),
        fetch('/api/opinion-authors?isActive=true'),
        fetch('/api/analytics/trending-topics').catch(() => null)
      ]);

      // معالجة المقالات
      const articlesData = await articlesRes.json();
      const articlesList = Array.isArray(articlesData) ? articlesData : articlesData.articles || [];
      setArticles(articlesList);
      setTotalCount(articlesData.total || articlesList.length);

      // معالجة التصنيفات
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || []);
      }

      // معالجة الكتاب
      if (authorsRes.ok) {
        const authorsData = await authorsRes.json();
        setAuthors(Array.isArray(authorsData) ? authorsData : authorsData.authors || []);
      }

      // معالجة المواضيع الرائجة
      if (trendsRes?.ok) {
        const trendsData = await trendsRes.json();
        setTrendingTopics(trendsData.topics || []);
      }

      // جلب AI insights
      fetchAIInsights();

    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // بناء URL مع الفلاتر
      let url = `/api/articles?status=published&limit=20&page=${reset ? 1 : page + 1}`;
      
      if (filters.category !== 'all') url += `&category_id=${filters.category}`;
      if (filters.author !== 'all') url += `&author_id=${filters.author}`;
      if (filters.type !== 'all') url += `&type=${filters.type.toUpperCase()}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      // ترتيب النتائج
      switch (filters.sortBy) {
        case 'popular':
          url += '&sortBy=views_count&order=desc';
          break;
        case 'trending':
          url += '&sortBy=engagement_score&order=desc';
          break;
        case 'engagement':
          url += '&sortBy=interactions&order=desc';
          break;
        default:
          url += '&sortBy=published_at&order=desc';
      }

      // فلترة التاريخ
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        url += `&from_date=${startDate.toISOString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      const newArticles = Array.isArray(data) ? data : data.articles || [];

      if (reset) {
        setArticles(newArticles);
        setPage(1);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
        setPage(prev => prev + 1);
      }

      setHasMore(newArticles.length === 20);
      setTotalCount(data.total || (reset ? newArticles.length : totalCount + newArticles.length));

    } catch (error) {
      console.error('خطأ في جلب المقالات:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreArticles = () => {
    if (!loadingMore && hasMore) {
      fetchArticles(false);
    }
  };

  const fetchAIInsights = async () => {
    try {
      const response = await fetch('/api/ai/content-insights');
      if (response.ok) {
        const insights = await response.json();
        setAiInsights(insights);
      }
    } catch (error) {
      console.error('خطأ في جلب AI insights:', error);
    }
  };

  // البحث الذكي مع الاقتراحات
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (value.length > 2) {
      // اقتراحات البحث
      const suggestions = articles
        .filter(article => 
          article.title.toLowerCase().includes(value.toLowerCase()) ||
          article.ai_keywords?.some(keyword => keyword.toLowerCase().includes(value.toLowerCase()))
        )
        .slice(0, 5)
        .map(article => article.title);
      
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [articles]);

  // تشغيل الملخص الصوتي
  const handleTTSPlay = async (articleId: string, text: string) => {
    if (currentPlayingId === articleId) {
      setIsPlaying(false);
      setCurrentPlayingId(null);
      speechSynthesis.cancel();
      return;
    }

    setIsPlaying(true);
    setCurrentPlayingId(articleId);
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentPlayingId(null);
      };
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('خطأ في تشغيل الصوت:', error);
      setIsPlaying(false);
      setCurrentPlayingId(null);
    }
  };

  // تحديث الفلتر
  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // عرض البطاقات حسب النمط
  const renderArticleCard = (article: Article, index: number) => {
    const isLarge = viewMode === 'magazine' && index === 0;
    
    if (viewMode === 'list') {
      return (
        <div key={article.id} className="flex gap-6 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden">
            <img 
              src={getValidImageUrl(article.featured_image) || generatePlaceholderImage(article.title)}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {article.author_avatar && (
                  <img 
                    src={article.author_avatar} 
                    alt={article.author_name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {article.author_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateOnly(article.published_at || article.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {article.is_trending && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">🔥</span>
                )}
                {article.is_featured && (
                  <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">⭐</span>
                )}
              </div>
            </div>
            
            <Link href={getArticleLink(article)}>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 hover:text-blue-600 line-clamp-2">
                {article.title}
              </h3>
            </Link>
            
            {article.ai_summary && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                {article.ai_summary}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.views_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {article.likes_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {article.reading_time || 5} د
                </span>
              </div>
              
              <button 
                onClick={() => handleTTSPlay(article.id, article.ai_summary || article.excerpt || '')}
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {currentPlayingId === article.id ? (
                  <Volume2 className="w-4 h-4 animate-pulse" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span className="text-sm">استمع</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={article.id}
        className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden ${
          isLarge ? 'md:col-span-2 md:row-span-2' : ''
        }`}
      >
        {/* شارات المقال */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {article.is_trending && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3" />
              ترند
            </span>
          )}
          {article.is_featured && (
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" />
              مميز
            </span>
          )}
        </div>

        {/* صورة المقال */}
        <div className={`relative overflow-hidden ${isLarge ? 'h-64' : 'h-48'}`}>
          <img 
            src={getValidImageUrl(article.featured_image) || generatePlaceholderImage(article.title)}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* محتوى البطاقة */}
        <div className={`p-4 ${isLarge ? 'p-6' : ''}`}>
          {/* معلومات الكاتب */}
          <div className="flex items-center gap-3 mb-3">
            {article.author_avatar && (
              <img 
                src={article.author_avatar} 
                alt={article.author_name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {article.author_name}
              </p>
              <p className="text-xs text-gray-500">
                {formatDateOnly(article.published_at || article.created_at)}
              </p>
            </div>
          </div>

          {/* عنوان المقال */}
          <Link href={getArticleLink(article)}>
            <h3 className={`font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 transition-colors ${
              isLarge ? 'text-xl line-clamp-3' : 'text-base line-clamp-2'
            }`}>
              {article.title}
            </h3>
          </Link>

          {/* الملخص AI */}
          {article.ai_summary && (
            <p className={`text-gray-600 dark:text-gray-300 mb-4 ${
              isLarge ? 'line-clamp-3' : 'line-clamp-2'
            } text-sm`}>
              {article.ai_summary}
            </p>
          )}

          {/* إحصائيات وأزرار */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.views_count > 1000 ? `${(article.views_count / 1000).toFixed(1)}ك` : article.views_count}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {article.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {article.reading_time || 5}د
              </span>
            </div>
            
            <button 
              onClick={() => handleTTSPlay(article.id, article.ai_summary || article.excerpt || '')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                currentPlayingId === article.id
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {currentPlayingId === article.id ? (
                <Volume2 className="w-3 h-3 animate-pulse" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-blue-500" />
                مركز المقالات الذكي
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                اكتشف {totalCount.toLocaleString()} مقال مع فلترة ذكية وترشيحات مخصصة
              </p>
            </div>
            
            {/* زر التحديث */}
            <button 
              onClick={() => fetchArticles(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
          </div>

          {/* شريط البحث والفلاتر */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* البحث الذكي */}
            <div className="relative flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="ابحث في المقالات... (جرب: ذكاء اصطناعي، اقتصاد، رياضة)"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* اقتراحات البحث */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 shadow-lg z-10">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-right px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* أزرار العرض */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode('magazine')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'magazine' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                <Filter className="w-4 h-4" />
                فلترة
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* شريط الفلاتر */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* فلتر التصنيف */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    التصنيف
                  </label>
                  <select 
                    value={filters.category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    <option value="all">جميع التصنيفات</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                    ))}
                  </select>
                </div>

                {/* فلتر الكاتب */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الكاتب
                  </label>
                  <select 
                    value={filters.author}
                    onChange={(e) => updateFilter('author', e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    <option value="all">جميع الكتاب</option>
                    {authors.map(author => (
                      <option key={author.id} value={author.id}>{author.name}</option>
                    ))}
                  </select>
                </div>

                {/* فلتر النوع */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع المحتوى
                  </label>
                  <select 
                    value={filters.type}
                    onChange={(e) => updateFilter('type', e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    <option value="all">جميع الأنواع</option>
                    <option value="news">أخبار</option>
                    <option value="opinion">مقالات رأي</option>
                    <option value="analysis">تحليلات</option>
                  </select>
                </div>

                {/* فلتر التاريخ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    التاريخ
                  </label>
                  <select 
                    value={filters.dateRange}
                    onChange={(e) => updateFilter('dateRange', e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    <option value="all">كل الأوقات</option>
                    <option value="today">اليوم</option>
                    <option value="week">هذا الأسبوع</option>
                    <option value="month">هذا الشهر</option>
                    <option value="year">هذا العام</option>
                  </select>
                </div>

                {/* فلتر الترتيب */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ترتيب حسب
                  </label>
                  <select 
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    <option value="latest">الأحدث</option>
                    <option value="popular">الأكثر مشاهدة</option>
                    <option value="trending">الأكثر رواجاً</option>
                    <option value="engagement">الأكثر تفاعلاً</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* المواضيع الرائجة */}
      {trendingTopics.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                المواضيع الرائجة:
              </span>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.slice(0, 6).map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchChange(topic)}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">جاري تحميل المقالات...</p>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              لا توجد مقالات
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              جرب تعديل معايير البحث أو الفلترة
            </p>
          </div>
        ) : (
          <>
            {/* عرض النتائج */}
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                عرض {articles.length} من أصل {totalCount.toLocaleString()} مقال
                {searchQuery && (
                  <span className="mr-2 text-blue-600">
                    للبحث: "{searchQuery}"
                  </span>
                )}
              </p>
            </div>

            {/* المقالات */}
            <div className={
              viewMode === 'list' 
                ? 'space-y-6'
                : viewMode === 'magazine'
                  ? 'grid grid-cols-1 md:grid-cols-3 gap-6'
                  : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            }>
              {articles.map((article, index) => renderArticleCard(article, index))}
            </div>

            {/* زر تحميل المزيد */}
            <div ref={loadMoreRef} className="text-center mt-12">
              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="mr-3 text-gray-600 dark:text-gray-300">جاري تحميل المزيد...</span>
                </div>
              )}
              
              {!hasMore && articles.length > 0 && (
                <p className="text-gray-500 dark:text-gray-400 py-8">
                  تم عرض جميع المقالات المتاحة
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* AI Insights Panel */}
      {aiInsights && (
        <div className="fixed bottom-6 left-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm z-40">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900 dark:text-white">رؤى ذكية</h4>
          </div>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>📊 أكثر المواضيع قراءة: {aiInsights.topTopic}</p>
            <p>🔥 معدل التفاعل: +{aiInsights.engagementGrowth}%</p>
            <p>⏰ أفضل وقت للقراءة: {aiInsights.bestReadingTime}</p>
          </div>
        </div>
      )}
    </div>
  );
} 