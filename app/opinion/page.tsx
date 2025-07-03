'use client';

import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  User, 
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Share2,
  TrendingUp,
  ChevronRight,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import Header from '@/components/Header';
import Image from 'next/image';

interface OpinionArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featuredImage?: string;
  views: number;
  publishedAt: string;
  readingTime: number;
  author: {
    name: string;
    avatar?: string;
  };
  opinionAuthor?: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    title?: string;
    bio?: string;
  };
  interactions: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface OpinionAuthor {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  title?: string;
  bio?: string;
  articlesCount: number;
}

export default function OpinionPage() {
  const { darkMode } = useDarkModeContext();
  const [articles, setArticles] = useState<OpinionArticle[]>([]);
  const [authors, setAuthors] = useState<OpinionAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  useEffect(() => {
    fetchOpinionArticles();
    fetchOpinionAuthors();
  }, [selectedAuthor, sortBy]);

  const fetchOpinionArticles = async () => {
    try {
      const params = new URLSearchParams({
        type: 'OPINION',
        status: 'published',
        sortBy: sortBy,
        ...(selectedAuthor !== 'all' && { authorId: selectedAuthor })
      });

      const response = await fetch(`/api/articles?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // تحويل البيانات لتتوافق مع interface OpinionArticle
        const formattedArticles = data.articles.map((article: any) => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.summary || article.excerpt || '',
          content: article.content,
          featuredImage: article.featured_image,
          views: article.views_count || 0,
          publishedAt: article.published_at || article.created_at,
          readingTime: article.reading_time || 5,
          author: article.author || {
            name: 'غير محدد',
            avatar: null
          },
          opinionAuthor: article.opinionAuthor,
          interactions: {
            likes: 0,
            comments: article.comments_count || 0,
            shares: 0
          }
        }));
        setArticles(formattedArticles);
      }
    } catch (error) {
      console.error('Error fetching opinion articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpinionAuthors = async () => {
    try {
      const response = await fetch('/api/opinion-authors?isActive=true');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // إذا كانت البيانات مصفوفة مباشرة
        const formattedAuthors = data.map((author: any) => ({
          id: author.id,
          name: author.name,
          slug: author.slug,
          avatar: author.avatar,
          title: author.title,
          bio: author.bio,
          articlesCount: author._count?.articles || 0
        }));
        setAuthors(formattedAuthors);
      } else if (data.success) {
        // إذا كانت البيانات في شكل كائن مع خاصية success
        setAuthors(data.authors);
      }
    } catch (error) {
      console.error('Error fetching opinion authors:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header />

      {/* Hero Section */}
      <div className={`relative overflow-hidden ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
      }`}>
        {/* خلفية متحركة */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-1/2 -right-1/2 w-96 h-96 rounded-full ${
            darkMode ? 'bg-indigo-900/20' : 'bg-indigo-200/30'
          } blur-3xl animate-pulse`}></div>
          <div className={`absolute -bottom-1/2 -left-1/2 w-96 h-96 rounded-full ${
            darkMode ? 'bg-purple-900/20' : 'bg-purple-200/30'
          } blur-3xl animate-pulse delay-1000`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className={`p-4 rounded-2xl ${
                darkMode 
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              } shadow-xl`}>
                <PenTool className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className={`text-5xl font-bold mb-4 ${
              darkMode 
                ? 'text-white' 
                : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
            }`}>
              مقالات الرأي
            </h1>
            <p className={`text-xl max-w-3xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              آراء وتحليلات معمقة من نخبة من الكتّاب والمحللين حول أهم القضايا والأحداث
            </p>
          </div>
        </div>
      </div>

      {/* كتّاب الرأي المميزون */}
      {authors.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} py-8 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              كتّاب الرأي
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {/* زر الكل */}
              <button
                onClick={() => setSelectedAuthor('all')}
                className={`flex-shrink-0 text-center transition-all ${
                  selectedAuthor === 'all'
                    ? 'transform scale-105'
                    : ''
                }`}
              >
                <div className={`w-20 h-20 rounded-full mb-2 flex items-center justify-center ${
                  selectedAuthor === 'all'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg'
                    : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                } transition-all`}>
                  <span className={`text-2xl font-bold ${
                    selectedAuthor === 'all' ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    الكل
                  </span>
                </div>
                <p className={`text-sm ${
                  selectedAuthor === 'all'
                    ? darkMode ? 'text-indigo-400 font-semibold' : 'text-indigo-600 font-semibold'
                    : darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  جميع الكتّاب
                </p>
              </button>

              {/* قائمة الكتّاب */}
              {authors.map(author => (
                <button
                  key={author.id}
                  onClick={() => setSelectedAuthor(author.id)}
                  className={`flex-shrink-0 text-center transition-all ${
                    selectedAuthor === author.id
                      ? 'transform scale-105'
                      : ''
                  }`}
                >
                  <div className={`w-20 h-20 rounded-full mb-2 overflow-hidden ${
                    selectedAuthor === author.id
                      ? 'ring-4 ring-indigo-500 ring-offset-2'
                      : ''
                  } transition-all`}>
                    {author.avatar ? (
                      <img
                        src={author.avatar}
                        alt={author.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <User className={`w-10 h-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                    )}
                  </div>
                  <p className={`text-sm font-medium ${
                    selectedAuthor === author.id
                      ? darkMode ? 'text-indigo-400' : 'text-indigo-600'
                      : darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {author.name}
                  </p>
                  {author.title && (
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {author.title}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className={`sticky top-16 z-30 ${
        darkMode ? 'bg-gray-900/95' : 'bg-gray-50/95'
      } backdrop-blur-sm border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === 'latest'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                }`}
              >
                الأحدث
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === 'popular'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline ml-1" />
                الأكثر قراءة
              </button>
            </div>
            
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {articles.length} مقال
            </div>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            لا توجد مقالات رأي منشورة حالياً
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(article => (
              <article
                key={article.id}
                className={`group ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1`}
              >
                {/* صورة المقال */}
                {article.featuredImage && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                )}

                <div className="p-6">
                  {/* معلومات الكاتب */}
                  {article.opinionAuthor && (
                    <div className="flex items-center gap-3 mb-4">
                      {article.opinionAuthor.avatar ? (
                        <img
                          src={article.opinionAuthor.avatar}
                          alt={article.opinionAuthor.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <User className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/opinion/author/${article.opinionAuthor.slug}`}
                          className={`font-semibold hover:text-indigo-600 transition-colors ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {article.opinionAuthor.name}
                        </Link>
                        {article.opinionAuthor.title && (
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {article.opinionAuthor.title}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* عنوان المقال */}
                  <h3 className={`text-xl font-bold mb-3 line-clamp-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Link
                      href={`/opinion/${article.slug}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </h3>

                  {/* مقتطف */}
                  <p className={`text-sm mb-4 line-clamp-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {article.excerpt}
                  </p>

                  {/* معلومات إضافية */}
                  <div className="flex items-center justify-between text-sm">
                    <div className={`flex items-center gap-3 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(article.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {article.readingTime} دقيقة
                      </span>
                    </div>
                    
                    <Link
                      href={`/opinion/${article.slug}`}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
                    >
                      اقرأ المقال
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* التفاعلات */}
                  <div className={`flex items-center gap-4 mt-4 pt-4 border-t ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <span className={`flex items-center gap-1 text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <Eye className="w-4 h-4" />
                      {article.views}
                    </span>
                    <span className={`flex items-center gap-1 text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <MessageCircle className="w-4 h-4" />
                      {article.interactions?.comments || 0}
                    </span>
                    <span className={`flex items-center gap-1 text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <Share2 className="w-4 h-4" />
                      {article.interactions?.shares || 0}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 