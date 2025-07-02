'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRight, Calendar, Clock, Eye, Heart, MessageCircle, TrendingUp, Filter, Grid, List,
  ChevronDown, Search, Loader2, Tag,
  Cpu, Trophy, Globe, BookOpen, MapPin, Sparkles, Award
} from 'lucide-react';

interface Category {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  cover_image?: string;
  icon: string;
  color_hex: string;
}

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  image_url?: string;
  category_id: number;
  category_name?: string;
  author_name?: string;
  views_count: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  reading_time?: number;
  created_at: string;
  published_at?: string;
  is_breaking?: boolean;
  is_featured?: boolean;
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function CategoryPage({ params }: PageProps) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // ألوان التصنيفات
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

  // أيقونات التصنيفات
  const categoryIcons: { [key: string]: React.ReactNode } = {
    'تقنية': <Cpu className="w-6 h-6" />,
    'اقتصاد': <TrendingUp className="w-6 h-6" />,
    'رياضة': <Trophy className="w-6 h-6" />,
    'سياسة': <Globe className="w-6 h-6" />,
    'ثقافة': <BookOpen className="w-6 h-6" />,
    'صحة': <Heart className="w-6 h-6" />,
    'محلي': <MapPin className="w-6 h-6" />,
    'دولي': <Globe className="w-6 h-6" />,
    'منوعات': <Sparkles className="w-6 h-6" />
  };

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params;
      if (resolvedParams?.slug) {
        await fetchCategory(resolvedParams.slug);
        await fetchArticles(resolvedParams.slug);
      }
    }
    loadData();
  }, []);

  const fetchCategory = async (slug: string) => {
    try {
      const response = await fetch(`/api/categories/${slug}`);
      
      if (!response.ok) {
        router.push('/news');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setCategory(data.data);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      router.push('/news');
    }
  };

  const fetchArticles = async (slug: string, loadMore = false) => {
    try {
      setLoadingArticles(true);
      
      // جلب جميع المقالات أولاً
      const response = await fetch('/api/articles?status=published');
      if (!response.ok) throw new Error('Failed to fetch articles');
      
      const data = await response.json();
      const allArticles = Array.isArray(data) ? data : data.articles || [];
      
      // فلترة المقالات حسب التصنيف
      const categoryArticles = allArticles.filter((article: Article) => {
        // مطابقة بناءً على category_id
        if (category && article.category_id === category.id) return true;
        
        // أو مطابقة بناءً على category_name
        const categoryNameMatch = article.category_name?.toLowerCase() === category?.name_ar.toLowerCase() ||
                                article.category_name?.toLowerCase() === category?.name_en.toLowerCase();
        
        return categoryNameMatch;
      });
      
      // ترتيب المقالات
      const sortedArticles = sortArticles(categoryArticles, sortBy);
      
      // فلترة البحث
      const filteredArticles = searchQuery 
        ? sortedArticles.filter(article => 
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : sortedArticles;
      
      // تطبيق التصفح
      const itemsPerPage = 12;
      const startIndex = loadMore ? articles.length : 0;
      const endIndex = startIndex + itemsPerPage;
      const paginatedArticles = filteredArticles.slice(0, endIndex);
      
      if (loadMore) {
        setArticles(paginatedArticles);
      } else {
        setArticles(paginatedArticles);
      }
      
      setHasMore(paginatedArticles.length < filteredArticles.length);
      
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoadingArticles(false);
      setLoading(false);
    }
  };

  const sortArticles = (articles: Article[], sortType: string) => {
    const sorted = [...articles];
    
    switch (sortType) {
      case 'latest':
        return sorted.sort((a, b) => 
          new Date(b.published_at || b.created_at).getTime() - 
          new Date(a.published_at || a.created_at).getTime()
        );
      case 'popular':
        return sorted.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
      case 'trending':
        return sorted.sort((a, b) => 
          ((b.views_count || 0) + (b.likes_count || 0) * 2 + (b.shares_count || 0) * 3) -
          ((a.views_count || 0) + (a.likes_count || 0) * 2 + (a.shares_count || 0) * 3)
        );
      default:
        return sorted;
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const loadMoreArticles = () => {
    if (category) {
      fetchArticles(category.slug, true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'منذ دقائق';
    } else if (diffInHours < 24) {
      return `منذ ${Math.floor(diffInHours)} ساعة`;
    } else if (diffInHours < 48) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const generatePlaceholderImage = (title: string) => {
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B'];
    const colorIndex = title.charCodeAt(0) % colors.length;
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="${colors[colorIndex]}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
          ${title.substring(0, 20)}
        </text>
      </svg>
    `)}`;
  };

  const getCategoryColor = (categoryName: string | undefined) => {
    return categoryColors[categoryName || 'default'] || categoryColors['default'];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل التصنيف...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">التصنيف غير موجود</h3>
          <p className="text-gray-500 mb-6">عذراً، لم نتمكن من العثور على التصنيف المطلوب</p>
          <Link 
            href="/news" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            العودة إلى الأخبار
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section مع تحسينات */}
      <div className={`relative bg-gradient-to-br ${getCategoryColor(category?.name_ar)} text-white overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              {categoryIcons[category?.name_ar] || <Tag className="w-6 h-6" />}
              <span className="text-lg font-medium">قسم {category?.name_ar}</span>
            </div>
            <h1 className="text-5xl font-bold mb-6">{category?.name_ar}</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              {category?.description_ar || `تابع أحدث الأخبار والمقالات في قسم ${category?.name_ar}`}
            </p>
            
            {/* إحصائيات التصنيف */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{articles.length}</div>
                <div className="text-sm text-white/80">مقال منشور</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  {articles.reduce((sum, article) => sum + (article.views_count || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-white/80">مشاهدة</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  {articles.filter(a => {
                    const date = new Date(a.published_at || a.created_at);
                    const today = new Date();
                    return date.toDateString() === today.toDateString();
                  }).length}
                </div>
                <div className="text-sm text-white/80">مقال اليوم</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`البحث في ${category.name_ar}...`}
                  className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>
            
            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="relative">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>ترتيب حسب</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block">
                  <button
                    onClick={() => handleSortChange('latest')}
                    className={`w-full text-right px-4 py-2 hover:bg-gray-50 ${sortBy === 'latest' ? 'text-blue-600 font-medium' : ''}`}
                  >
                    الأحدث
                  </button>
                  <button
                    onClick={() => handleSortChange('popular')}
                    className={`w-full text-right px-4 py-2 hover:bg-gray-50 ${sortBy === 'popular' ? 'text-blue-600 font-medium' : ''}`}
                  >
                    الأكثر قراءة
                  </button>
                  <button
                    onClick={() => handleSortChange('trending')}
                    className={`w-full text-right px-4 py-2 hover:bg-gray-50 ${sortBy === 'trending' ? 'text-blue-600 font-medium' : ''}`}
                  >
                    الأكثر تفاعلاً
                  </button>
                </div>
              </div>
              
              {/* View Mode */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  title="عرض شبكي"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  title="عرض قائمة"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loadingArticles && articles.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">لا توجد مقالات في هذا التصنيف حالياً</p>
          </div>
        ) : (
          <>
            {/* المقالات المميزة */}
            {articles.filter(a => a.is_featured).length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-500" />
                  المقالات المميزة
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {articles.filter(a => a.is_featured).slice(0, 2).map((article) => (
                    <Link key={article.id} href={`/article/${article.id}`}>
                      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-transparent transform hover:-translate-y-1">
                        <div className="relative h-64 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                          <img
                            src={article.featured_image || generatePlaceholderImage(article.title)}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute top-4 right-4 z-20">
                            <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              مميز
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                              {article.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(article.published_at || article.created_at)}</span>
                              </div>
                              {article.reading_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{article.reading_time} د</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{article.views_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* جميع المقالات */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {articles.map((article) => (
                <Link key={article.id} href={`/article/${article.id}`}>
                  <article className={`group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
                    viewMode === 'list' ? 'flex gap-6' : ''
                  }`}>
                    {/* Image */}
                    <div className={`relative overflow-hidden ${
                      viewMode === 'list' ? 'w-64 h-48' : 'h-48'
                    }`}>
                      <img
                        src={article.featured_image || article.image_url || generatePlaceholderImage(article.title)}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {article.is_breaking && (
                        <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          عاجل
                        </span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-5">
                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(article.published_at || article.created_at)}
                        </span>
                        {article.reading_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {article.reading_time} دقائق
                          </span>
                        )}
                      </div>
                      
                      {/* Title */}
                      <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 ${
                        viewMode === 'list' ? 'text-xl' : 'text-lg line-clamp-2'
                      }`}>
                        {article.title}
                      </h3>
                      
                      {/* Excerpt */}
                      {article.excerpt && (
                        <p className={`text-gray-600 mb-3 ${
                          viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-3'
                        }`}>
                          {article.excerpt}
                        </p>
                      )}
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {article.views_count || 0}
                        </span>
                        {article.likes_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" />
                            {article.likes_count}
                          </span>
                        )}
                        {article.comments_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {article.comments_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
            
            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMoreArticles}
                  disabled={loadingArticles}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loadingArticles ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      عرض المزيد
                      <ChevronDown className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 