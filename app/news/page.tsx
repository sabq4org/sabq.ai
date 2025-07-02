'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './news-styles.css';
import { 
  Newspaper, Search, Loader2,
  Grid, List, ChevronRight
} from 'lucide-react';
import { formatDateOnly } from '@/lib/date-utils';
import ArticleCard from '@/components/ArticleCard';

interface Article {
  id: string;
  title: string;
  summary?: string;
  featured_image?: string;
  category_id: number;
  category_name?: string;
  author_name?: string;
  author_id?: string;
  views_count: number;
  created_at: string;
  published_at?: string;
  reading_time?: number;
  is_breaking?: boolean;
  is_featured?: boolean;
  status?: string;
}

interface Category {
  id: number;
  name?: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  icon?: string;
  color_hex?: string;
  articles_count?: number;
  is_active?: boolean;
}

// ألوان التصنيفات الافتراضية
const categoryColors: { [key: string]: string } = {
  'تقنية': 'from-purple-500 to-purple-600',
  'اقتصاد': 'from-green-500 to-green-600',
  'رياضة': 'from-blue-500 to-blue-600',
  'سياسة': 'from-red-500 to-red-600',
  'ثقافة': 'from-yellow-500 to-yellow-600',
  'صحة': 'from-pink-500 to-pink-600',
  'محلي': 'from-indigo-500 to-indigo-600',
  'دولي': 'from-cyan-500 to-cyan-600',
  'منوعات': 'from-orange-500 to-orange-600',
  'default': 'from-gray-500 to-gray-600'
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // جلب التصنيفات
  useEffect(() => {
    fetchCategories();
  }, []);

  // جلب المقالات
  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, sortBy, page]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      // التأكد من أن البيانات مصفوفة
      let categoriesArray: Category[] = [];
      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (data.categories && Array.isArray(data.categories)) {
        categoriesArray = data.categories;
      } else if (data.data && Array.isArray(data.data)) {
        categoriesArray = data.data;
      }
      
      setCategories(categoriesArray);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // تعيين مصفوفة فارغة في حالة الخطأ
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      let url = '/api/articles?status=published&limit=20';
      
      if (selectedCategory) {
        url += `&category_id=${selectedCategory}`;
      }
      
      if (sortBy === 'popular') {
        url += '&sort=views_count&order=desc';
      } else if (sortBy === 'trending') {
        url += '&sort=interactions_count&order=desc';
      } else {
        url += '&sort=created_at&order=desc';
      }
      
      if (page > 1) {
        url += `&page=${page}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      
      // التأكد من أن البيانات مصفوفة
      let articlesArray: Article[] = [];
      
      // API يُرجع البيانات في حقل data
      if (data && data.data && Array.isArray(data.data)) {
        articlesArray = data.data;
      } else if (data && data.articles && Array.isArray(data.articles)) {
        articlesArray = data.articles;
      } else if (Array.isArray(data)) {
        articlesArray = data;
      }
      
      // فلترة المقالات المنشورة فقط
      articlesArray = articlesArray.filter(article => 
        !article.status || article.status === 'published'
      );
      
      if (page === 1) {
        setArticles(articlesArray);
      } else {
        setArticles(prev => [...prev, ...articlesArray]);
      }
      
      setHasMore(articlesArray.length === 20);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => 
    searchQuery === '' || 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name_ar || category?.name_en || 'عام';
  };

  const getCategoryColor = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (category?.color_hex) {
      return `from-[${category.color_hex}] to-[${category.color_hex}]`;
    }
    const categoryName = category?.name_ar || category?.name_en || '';
    return categoryColors[categoryName] || categoryColors['default'];
  };

  // استخدام دالة التاريخ الميلادي الموحدة
  const formatDate = formatDateOnly;

  const generatePlaceholderImage = (title: string) => {
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B'];
    const colorIndex = title.charCodeAt(0) % colors.length;
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors[colorIndex]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors[(colorIndex + 1) % colors.length]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#grad)"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
          ${title.substring(0, 20)}
        </text>
      </svg>
    `)}`;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section - تصميم بسيط وأنيق */}
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">جميع الأخبار</h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                تابع أحدث ما نُشر في صحيفة سبق من أخبار محلية وعالمية
              </p>
              
              {/* إحصائيات - تصميم بسيط */}
              <div className="flex items-center justify-center gap-8 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{articles.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">مقال منشور</div>
                </div>
                <div className="w-px h-10 bg-gray-300 dark:bg-gray-600" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">تصنيف</div>
                </div>
                <div className="w-px h-10 bg-gray-300 dark:bg-gray-600" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">تغطية مستمرة</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section - تصميم بسيط وأنيق */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-40 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search - تصميم بسيط */}
              <div className="relative w-full lg:w-96">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="ابحث في الأخبار..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 transition-colors text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Filters - تصميم بسيط */}
              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <option value="latest">الأحدث</option>
                  <option value="popular">الأكثر مشاهدة</option>
                  <option value="trending">الأكثر تفاعلاً</option>
                </select>

                {/* View Mode - تصميم بسيط */}
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Categories - تصميم بسيط */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                جميع الأخبار
              </button>
              
              {Array.isArray(categories) && categories.length > 0 && categories
                .filter(category => category.is_active !== false)
                .map((category) => {
                  const isSelected = selectedCategory === category.id;
                  const categoryColor = category.color_hex || '#6B7280';
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        isSelected
                          ? 'text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={{
                        backgroundColor: isSelected ? categoryColor : undefined
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        {category.icon && <span>{category.icon}</span>}
                        {category.name_ar || category.name_en || category.name}
                        {category.articles_count !== undefined && category.articles_count > 0 && (
                          <span className="text-xs opacity-80">
                            ({category.articles_count})
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {loading && page === 1 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">جاري تحميل الأخبار...</p>
            </div>
          ) : filteredArticles.length > 0 ? (
            <>
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
                  : 'space-y-6'
              }`}>
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} viewMode={viewMode} />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-16">
                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={loading}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-xl dark:shadow-gray-900/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري التحميل...
                      </>
                    ) : (
                      <>
                        عرض المزيد
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-transparent">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                <Newspaper className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد أخبار متاحة</h3>
              <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على أي مقالات منشورة حالياً</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
} 