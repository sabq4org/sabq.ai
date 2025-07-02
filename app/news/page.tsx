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
        {/* Hero Section - تصميم ملون */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-16">
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center p-8 mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-xl opacity-70 animate-pulse" />
              <div className="relative bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full p-6 shadow-2xl">
                <Newspaper className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
            </div>
            <h1 className="text-5xl font-black text-white mb-6 drop-shadow-lg">
              أخبار سبق
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8">
              تابع آخر الأخبار والمستجدات المحلية والعالمية لحظة بلحظة
            </p>
            
            {/* Stats with Glass Effect */}
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 bg-black bg-opacity-20 backdrop-blur-md rounded-2xl px-6 sm:px-8 py-4 shadow-xl border border-white border-opacity-20">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">{articles.length}</div>
                <div className="text-xs sm:text-sm text-white">مقال منشور</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white bg-opacity-50"></div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">{categories.length}</div>
                <div className="text-xs sm:text-sm text-white">تصنيف متنوع</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white bg-opacity-50"></div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">24/7</div>
                <div className="text-xs sm:text-sm text-white">تغطية مستمرة</div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section - تصميم بسيط */}
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-10 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="relative w-full max-w-md mx-auto">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في الأخبار..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 focus:border-transparent transition-all text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          {loading && page === 1 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">جاري تحميل الأخبار...</p>
            </div>
          ) : filteredArticles.length > 0 ? (
            <>
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
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
        </section>
      </div>
      <Footer />
      
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
} 