'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { 
  Tag, ArrowRight, Calendar, Clock, Eye, Heart, 
  BookOpen, TrendingUp, Loader2, ChevronLeft,
  Trophy, Laptop, Building2, Leaf, Activity, Globe,
  Grid, List, SortDesc, Sparkles
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  cover_image?: string;
  articles_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  featured_image?: string;
  category_id: number;
  category_name?: string;
  author_name?: string;
  views_count: number;
  likes_count?: number;
  created_at: string;
  published_at?: string;
  reading_time?: number;
  is_featured?: boolean;
  is_breaking?: boolean;
}

// أيقونات التصنيفات
const categoryIcons: { [key: string]: any } = {
  'تقنية': Laptop,
  'رياضة': Trophy,
  'اقتصاد': TrendingUp,
  'سياسة': Building2,
  'صحة': Heart,
  'بيئة': Leaf,
  'ثقافة': BookOpen,
  'محلي': Globe,
  'دولي': Globe,
  'منوعات': Activity,
  'default': Tag
};

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
  'بيئة': 'from-teal-500 to-teal-600',
  'default': 'from-gray-500 to-gray-600'
};

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function CategoryDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'likes'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categorySlug, setCategorySlug] = useState<string>('');

  useEffect(() => {
    async function loadCategory() {
      const resolvedParams = await params;
      if (resolvedParams?.slug) {
        setCategorySlug(resolvedParams.slug);
        fetchCategoryData(resolvedParams.slug);
      }
    }
    loadCategory();
  }, []);

  useEffect(() => {
    // فلترة المقالات حسب البحث
    const filtered = articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // ترتيب المقالات
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return (b.views_count || 0) - (a.views_count || 0);
        case 'likes':
          return (b.likes_count || 0) - (a.likes_count || 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredArticles(sorted);
  }, [articles, sortBy, searchTerm]);

  const fetchCategoryData = async (slug: string) => {
    try {
      setLoading(true);
      
      // جلب بيانات التصنيف
      const categoriesResponse = await fetch('/api/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        const categories = categoriesData.categories || categoriesData.data || [];
        const foundCategory = categories.find((cat: Category) => 
          cat.slug === slug || cat.name_ar.toLowerCase().replace(/\s+/g, '-') === slug
        );
        
        if (!foundCategory) {
          console.error('التصنيف غير موجود');
          router.push('/categories');
          return;
        }
        
        setCategory(foundCategory);
        
        // جلب المقالات الخاصة بالتصنيف
        const articlesResponse = await fetch(`/api/articles?category_id=${foundCategory.id}`);
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json();
          setArticles(articlesData.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (categoryName: string) => {
    const IconComponent = categoryIcons[categoryName] || categoryIcons['default'];
    return IconComponent;
  };

  const getColor = (categoryName: string) => {
    return categoryColors[categoryName] || categoryColors['default'];
  };

  const getCategoryImage = (category: Category) => {
    if (category.cover_image) {
      return category.cover_image;
    }
    // صورة افتراضية بناءً على اسم التصنيف
    const defaultImages: { [key: string]: string } = {
      'تقنية': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      'رياضة': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
      'اقتصاد': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
      'سياسة': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80',
      'صحة': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
      'بيئة': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
      'ثقافة': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
      'default': 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=1200&q=80'
    };
    return defaultImages[category.name_ar] || defaultImages['default'];
  };

  const generatePlaceholderImage = (title: string) => {
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B'];
    const colorIndex = title.charCodeAt(0) % colors.length;
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors[colorIndex]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors[(colorIndex + 1) % colors.length]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="400" fill="url(#grad)"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
          ${title.substring(0, 30)}
        </text>
      </svg>
    `)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">جاري تحميل التصنيف...</p>
          </div>
        </div>
      </>
    );
  }

  if (!category) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">التصنيف غير موجود</h3>
            <p className="text-gray-500 mb-6">عذراً، لم نتمكن من العثور على التصنيف المطلوب</p>
            <Link 
              href="/categories" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              العودة إلى التصنيفات
            </Link>
          </div>
        </div>
      </>
    );
  }

  const Icon = getIcon(category.name_ar);
  const colorGradient = getColor(category.name_ar);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              الرئيسية
            </Link>
            <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
            <Link href="/categories" className="text-gray-500 hover:text-gray-700">
              التصنيفات
            </Link>
            <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
            <span className="text-gray-900 font-medium">{category.name_ar}</span>
          </div>
        </div>
      </div>

      {/* Hero Section with Cover Image */}
      <section className="relative h-96 overflow-hidden">
        <img
          src={getCategoryImage(category)}
          alt={category.name_ar}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-6 mb-6">
              <div className={`w-20 h-20 bg-gradient-to-br ${colorGradient} rounded-2xl flex items-center justify-center shadow-2xl`}>
                {category.icon ? (
                  <span className="text-4xl">{category.icon}</span>
                ) : (
                  <Icon className="w-10 h-10 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {category.name_ar}
                </h1>
                {category.description && (
                  <p className="text-xl text-white/90 max-w-3xl">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span className="font-bold text-lg">{articles.length}</span>
                <span>مقال</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span className="font-bold text-lg">
                  {articles.reduce((acc, article) => acc + (article.views_count || 0), 0)}
                </span>
                <span>مشاهدة</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span className="font-bold text-lg">
                  {articles.reduce((acc, article) => acc + (article.likes_count || 0), 0)}
                </span>
                <span>إعجاب</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Controls Section */}
      <section className="sticky top-16 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="ابحث في المقالات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-4 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <SortDesc className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'views' | 'likes')}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">الأحدث</option>
                  <option value="views">الأكثر مشاهدة</option>
                  <option value="likes">الأعلى تفاعلاً</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="عرض شبكي"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="عرض قائمة"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'لا توجد مقالات تطابق البحث' : 'لا توجد مقالات في هذا التصنيف بعد'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <Link key={article.id} href={`/article/${article.id}`}>
                    <article className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={article.featured_image || generatePlaceholderImage(article.title)}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {article.is_breaking && (
                          <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                            عاجل
                          </div>
                        )}
                        {article.is_featured && (
                          <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            مميز
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {article.title}
                        </h3>
                        
                        {article.excerpt && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(article.created_at)}
                            </span>
                            {article.reading_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {article.reading_time} د
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {article.views_count || 0}
                            </span>
                            {article.likes_count && article.likes_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {article.likes_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <Link key={article.id} href={`/article/${article.id}`}>
                    <article className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex gap-6">
                      {/* Image */}
                      <div className="relative w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={article.featured_image || generatePlaceholderImage(article.title)}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {article.is_breaking && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                            عاجل
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          {article.is_featured && (
                            <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1 flex-shrink-0 mr-3">
                              <Sparkles className="w-3 h-3" />
                              مميز
                            </div>
                          )}
                        </div>
                        
                        {article.excerpt && (
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            {article.author_name && (
                              <span>{article.author_name}</span>
                            )}
                            <span>{formatDate(article.created_at)}</span>
                            {article.reading_time && (
                              <span>{article.reading_time} دقائق قراءة</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {article.views_count || 0}
                            </span>
                            {article.likes_count && article.likes_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {article.likes_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
} 