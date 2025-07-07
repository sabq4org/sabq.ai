'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Filter, X, Brain, Zap, TrendingUp, Calendar,
  User, Flame, Clock, ChevronDown, Sparkles, SlidersHorizontal
} from 'lucide-react';

interface FilterOptions {
  author: string;
  mood: 'all' | 'optimistic' | 'critical' | 'analytical' | 'controversial';
  topic: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  format: 'all' | 'article' | 'podcast' | 'video';
  sortBy: 'latest' | 'popular' | 'trending' | 'controversial';
}

interface Author {
  id: string;
  name: string;
  avatar?: string;
  articles_count?: number;
}

interface SearchSuggestion {
  type: 'article' | 'author' | 'topic';
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
}

interface InstantSearchProps {
  authors: Author[];
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
  popularTopics?: string[];
}

export default function InstantSearch({
  authors,
  onSearch,
  onFilterChange,
  initialFilters,
  popularTopics = []
}: InstantSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // البحث اللحظي
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length > 0) {
        setIsSearching(true);
        generateSuggestions(searchQuery);
        onSearch(searchQuery);
        setIsSearching(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

  // إغلاق الاقتراحات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateSuggestions = useCallback((query: string) => {
    const newSuggestions: SearchSuggestion[] = [];

    // اقتراحات المؤلفين
    const matchingAuthors = authors.filter(author =>
      author.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);
    
    matchingAuthors.forEach(author => {
      newSuggestions.push({
        type: 'author',
        id: author.id,
        title: author.name,
        subtitle: `${author.articles_count || 0} مقال`,
        avatar: author.avatar
      });
    });

    // اقتراحات المواضيع
    const matchingTopics = popularTopics.filter(topic =>
      topic.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);
    
    matchingTopics.forEach(topic => {
      newSuggestions.push({
        type: 'topic',
        id: topic,
        title: `#${topic}`,
        subtitle: 'موضوع رائج'
      });
    });

    // مقالات وهمية للاقتراح
    if (query.length > 2) {
      const sampleArticles = [
        'رؤية 2030 والتحول الرقمي',
        'مستقبل الذكاء الاصطناعي',
        'الاقتصاد الأخضر والاستدامة',
        'التعليم في العصر الرقمي'
      ];

      const matchingArticles = sampleArticles.filter(article =>
        article.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 2);

      matchingArticles.forEach(article => {
        newSuggestions.push({
          type: 'article',
          id: article,
          title: article,
          subtitle: 'مقال رأي'
        });
      });
    }

    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
  }, [authors, popularTopics]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'author') {
      setFilters(prev => ({ ...prev, author: suggestion.id }));
      onFilterChange({ ...filters, author: suggestion.id });
    } else if (suggestion.type === 'topic') {
      setFilters(prev => ({ ...prev, topic: suggestion.id }));
      onFilterChange({ ...filters, topic: suggestion.id });
    } else {
      setSearchQuery(suggestion.title);
    }
    setShowSuggestions(false);
  };

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    onSearch('');
  };

  const clearAllFilters = () => {
    const defaultFilters: FilterOptions = {
      author: 'all',
      mood: 'all',
      topic: 'all',
      dateRange: 'all',
      format: 'all',
      sortBy: 'latest'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== 'all' && value !== 'latest').length;
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'optimistic': return '😊';
      case 'critical': return '🤔';
      case 'analytical': return '📊';
      case 'controversial': return '🔥';
      default: return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* شريط البحث الرئيسي */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* مربع البحث */}
          <div className="relative flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="ابحث عن مقالات، كتّاب، أو مواضيع..."
                className="w-full pl-12 pr-16 py-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all outline-none text-gray-900 dark:text-white"
                onFocus={() => searchQuery && setShowSuggestions(suggestions.length > 0)}
              />
              
              {/* مؤشرات البحث الذكي */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSearching && (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                )}
                <div className="flex items-center gap-1 text-purple-600">
                  <Brain className="w-4 h-4 animate-pulse" />
                  <span className="text-xs font-medium hidden sm:inline">بحث ذكي</span>
                </div>
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-full h-full" />
                  </button>
                )}
              </div>
            </div>

            {/* اقتراحات البحث */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 z-50 max-h-80 overflow-y-auto"
              >
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
                    <Sparkles className="w-4 h-4" />
                    <span>اقتراحات ذكية</span>
                  </div>
                  
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.id}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-right"
                    >
                      {/* أيقونة حسب النوع */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        {suggestion.type === 'author' ? (
                          suggestion.avatar ? (
                            <img src={suggestion.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )
                        ) : suggestion.type === 'topic' ? (
                          <Flame className="w-4 h-4 text-white" />
                        ) : (
                          <Search className="w-4 h-4 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                          {suggestion.title}
                        </p>
                        {suggestion.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {suggestion.subtitle}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {suggestion.type === 'author' && '👤'}
                        {suggestion.type === 'topic' && '🏷️'}
                        {suggestion.type === 'article' && '📄'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* زر الفلترة */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-4 rounded-xl font-medium transition-all ${
                getActiveFiltersCount() > 0
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">فلترة متقدمة</span>
              {getActiveFiltersCount() > 0 && (
                <span className="w-6 h-6 bg-white text-blue-600 rounded-full text-xs font-bold flex items-center justify-center">
                  {getActiveFiltersCount()}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-4 text-gray-500 hover:text-red-600 transition-colors"
                title="مسح جميع الفلاتر"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* المواضيع الرائجة السريعة */}
      {!showFilters && popularTopics.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              رائج الآن:
            </span>
            {popularTopics.slice(0, 5).map((topic, index) => (
              <button
                key={index}
                onClick={() => updateFilter('topic', topic)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  filters.topic === topic
                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                }`}
              >
                #{topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* خيارات الفلترة المتقدمة */}
      {showFilters && (
        <div className="p-6 bg-gray-50 dark:bg-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* فلتر الكاتب */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الكاتب
              </label>
              <select
                value={filters.author}
                onChange={(e) => updateFilter('author', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">جميع الكتّاب</option>
                {authors.map(author => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>

            {/* فلتر الحالة المزاجية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نبرة المقال
              </label>
              <select
                value={filters.mood}
                onChange={(e) => updateFilter('mood', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">جميع الأنواع</option>
                <option value="optimistic">{getMoodEmoji('optimistic')} متفائل</option>
                <option value="critical">{getMoodEmoji('critical')} نقدي</option>
                <option value="analytical">{getMoodEmoji('analytical')} تحليلي</option>
                <option value="controversial">{getMoodEmoji('controversial')} جدلي</option>
              </select>
            </div>

            {/* فلتر التاريخ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الفترة الزمنية
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilter('dateRange', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">كل الأوقات</option>
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
              </select>
            </div>

            {/* فلتر النوع */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع المحتوى
              </label>
              <select
                value={filters.format}
                onChange={(e) => updateFilter('format', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">الكل</option>
                <option value="article">📝 مقال</option>
                <option value="podcast">🎙️ بودكاست</option>
                <option value="video">📹 فيديو</option>
              </select>
            </div>

            {/* فلتر الموضوع */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الموضوع
              </label>
              <select
                value={filters.topic}
                onChange={(e) => updateFilter('topic', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">جميع المواضيع</option>
                {popularTopics.map(topic => (
                  <option key={topic} value={topic}>
                    #{topic}
                  </option>
                ))}
              </select>
            </div>

            {/* فلتر الترتيب */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الترتيب حسب
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="latest">🕒 الأحدث</option>
                <option value="popular">👁️ الأكثر قراءة</option>
                <option value="trending">📈 الأكثر تداولاً</option>
                <option value="controversial">🔥 الأكثر جدلاً</option>
              </select>
            </div>
          </div>

          {/* مؤشر النتائج */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>
                {getActiveFiltersCount() > 0 
                  ? `${getActiveFiltersCount()} فلتر نشط`
                  : 'لا توجد فلاتر مطبقة'
                }
              </span>
            </div>
            
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                مسح جميع الفلاتر
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 