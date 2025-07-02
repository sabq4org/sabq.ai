'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './categories-fixes.css';
import { 
  Tag, Globe, Heart, Shield, Trophy, Building2, 
  Laptop, Leaf, TrendingUp, Activity, BookOpen, ArrowRight,
  Loader2, Grid, List, Search
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

// أيقونات افتراضية للتصنيفات
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

// ألوان افتراضية للتصنيفات
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'articles'>('articles');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      
      if (response.ok) {
        const data = await response.json();
        // فقط التصنيفات المفعلة
        const categoriesData = data.categories || data.data || [];
        const activeCategories = categoriesData.filter((cat: Category) => cat.is_active);
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // فلترة التصنيفات حسب البحث
  const filteredCategories = categories.filter(category =>
    category.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ترتيب التصنيفات
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name_ar.localeCompare(b.name_ar, 'ar');
    } else {
      return (b.articles_count || 0) - (a.articles_count || 0);
    }
  });

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
      'تقنية': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      'رياضة': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
      'اقتصاد': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      'سياسة': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=600&q=80',
      'صحة': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
      'بيئة': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
      'ثقافة': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      'default': 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=600&q=80'
    };
    return defaultImages[category.name_ar] || defaultImages['default'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">جاري تحميل التصنيفات...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                التصنيفات
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                تصفح مجموعة متنوعة من المواضيع والأقسام، واختر ما يناسب اهتماماتك
              </p>
            </div>
          </div>
        </section>

        {/* Controls Section */}
        <section className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="ابحث في التصنيفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-400 dark:focus:border-blue-500 transition-colors text-sm text-gray-900 dark:text-white"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'articles')}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-400 dark:focus:border-blue-500 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <option value="articles">الأكثر مقالات</option>
                  <option value="name">أبجدياً</option>
                </select>

                {/* View Mode */}
                <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <strong className="text-gray-900 dark:text-white">{sortedCategories.length}</strong> تصنيف
              </span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>
                <strong className="text-gray-900 dark:text-white">
                  {sortedCategories.reduce((acc, cat) => acc + (cat.articles_count || 0), 0)}
                </strong> مقال
              </span>
            </div>
          </div>
        </section>

        {/* Categories Grid/List */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          {sortedCategories.length === 0 ? (
            <div className="text-center py-20">
              <Tag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد تصنيفات تطابق البحث</p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedCategories.map((category) => {
                    const Icon = getIcon(category.name_ar);
                    const colorGradient = getColor(category.name_ar);
                    const categorySlug = category.slug || category.name_ar.toLowerCase().replace(/\s+/g, '-');
                    
                    return (
                      <Link
                        key={category.id}
                        href={`/categories/${categorySlug}`}
                        className="group"
                      >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-2xl dark:hover:shadow-gray-900/50 transition-all duration-300 overflow-hidden transform hover:scale-105">
                          {/* Cover Image */}
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={getCategoryImage(category)}
                              alt={category.name_ar}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            
                            {/* Icon Badge */}
                            <div className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-br ${colorGradient} rounded-xl flex items-center justify-center shadow-lg`}>
                              {category.icon ? (
                                <span className="text-2xl">{category.icon}</span>
                              ) : (
                                <Icon className="w-6 h-6 text-white" />
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {category.name_ar}
                            </h3>
                            
                            {category.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                {category.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <BookOpen className="w-4 h-4" />
                                <span>{category.articles_count || 0} مقال</span>
                              </div>
                              
                              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:gap-2 transition-all">
                                <span>استكشف</span>
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedCategories.map((category) => {
                    const Icon = getIcon(category.name_ar);
                    const colorGradient = getColor(category.name_ar);
                    const categorySlug = category.slug || category.name_ar.toLowerCase().replace(/\s+/g, '-');
                    
                    return (
                      <Link
                        key={category.id}
                        href={`/categories/${categorySlug}`}
                        className="block"
                      >
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all duration-300 p-6 flex items-center gap-6 group">
                          {/* Image */}
                          <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={getCategoryImage(category)}
                              alt={category.name_ar}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          </div>

                          {/* Icon */}
                          <div className={`w-16 h-16 bg-gradient-to-br ${colorGradient} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
                            {category.icon ? (
                              <span className="text-3xl">{category.icon}</span>
                            ) : (
                              <Icon className="w-8 h-8 text-white" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {category.name_ar}
                            </h3>
                            
                            {category.description && (
                              <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {category.description}
                              </p>
                            )}

                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <BookOpen className="w-4 h-4" />
                                <span>{category.articles_count || 0} مقال</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Activity className="w-4 h-4" />
                                <span>نشط</span>
                              </div>
                            </div>
                          </div>

                          {/* Arrow */}
                          <ArrowRight className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 py-16 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              لم تجد ما تبحث عنه؟
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              اقترح علينا تصنيفاً جديداً أو موضوعاً تود أن نغطيه
            </p>
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              <Shield className="w-5 h-5" />
              اقترح تصنيفاً
            </button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
} 