'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, ChevronRight, Award, Flame, Volume2, 
  Eye, Heart, MessageCircle, TrendingUp, TrendingDown,
  Mic, Calendar, User, ExternalLink, X, Check
} from 'lucide-react';
import { generatePlaceholderImage } from '@/lib/cloudinary';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  specialization?: string;
  followers_count?: number;
  articles_count?: number;
  total_views?: number;
  rating?: number;
  badge?: 'gold' | 'silver' | 'bronze' | 'platinum' | null;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  is_featured?: boolean;
  is_online?: boolean;
  latest_article?: any;
  new_articles_count?: number;
  weekly_trend?: 'up' | 'down' | 'same';
  weekly_rank_change?: number;
  is_guest?: boolean;
  is_verified?: boolean;
  has_new_podcast?: boolean;
}

interface AuthorCarouselProps {
  authors: Author[];
  onAuthorSelect?: (authorId: string) => void;
}

export default function AuthorCarousel({ authors, onAuthorSelect }: AuthorCarouselProps) {
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // تحديث أسهم التنقل
  useEffect(() => {
    const checkScrollButtons = () => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    const carousel = carouselRef.current;
    carousel?.addEventListener('scroll', checkScrollButtons);
    checkScrollButtons();

    return () => {
      carousel?.removeEventListener('scroll', checkScrollButtons);
    };
  }, [authors]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleAuthorClick = (author: Author) => {
    setSelectedAuthor(author);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedAuthor(null);
  };

  const getBadgeColor = (badge?: string | null) => {
    if (!badge) return 'bg-gray-500';
    switch (badge) {
      case 'platinum': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'gold': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'silver': return 'bg-gradient-to-r from-gray-300 to-gray-400';
      case 'bronze': return 'bg-gradient-to-r from-orange-400 to-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend?: string, change?: number) => {
    if (!trend || trend === 'same') return null;
    return trend === 'up' ? (
      <div className="flex items-center text-green-500 text-xs">
        <TrendingUp className="w-3 h-3" />
        <span className="mr-1">+{change}</span>
      </div>
    ) : (
      <div className="flex items-center text-red-500 text-xs">
        <TrendingDown className="w-3 h-3" />
        <span className="mr-1">-{change}</span>
      </div>
    );
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  أبرز الكتّاب
                </h2>
                <p className="text-sm text-gray-500">
                  {authors.length} كاتب نشط • تحديث لحظي
                </p>
              </div>
            </div>
            
            {/* كاروسيل الكتاب */}
            <div className="relative flex-1">
              {showLeftArrow && (
                <button
                  onClick={() => scrollCarousel('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-14 authors-carousel"
              >
                {authors.map((author) => (
                  <div
                    key={author.id}
                    className="flex-shrink-0 cursor-pointer author-card"
                    onClick={() => handleAuthorClick(author)}
                  >
                    <div className="group relative">
                      {/* صورة الكاتب */}
                      <div className="relative">
                        <img
                          src={author.avatar || generatePlaceholderImage(author.name)}
                          alt={author.name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg group-hover:scale-110 transition-transform author-avatar"
                        />
                        
                        {/* شارة الحالة */}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 ${
                          author.is_online ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {author.is_verified && (
                            <Check className="w-3 h-3 text-white m-0.5" />
                          )}
                        </div>

                        {/* شارة التميز */}
                        {author.badge && (
                          <div className={`absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center ${getBadgeColor(author.badge)}`}>
                            <Award className="w-3 h-3 text-white" />
                          </div>
                        )}

                        {/* مؤشر المقالات الجديدة */}
                        {(author.new_articles_count || 0) > 0 && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-xs font-bold">
                              {author.new_articles_count}
                            </span>
                          </div>
                        )}

                        {/* مؤشر بودكاست جديد */}
                        {author.has_new_podcast && (
                          <div className="absolute top-0 left-0 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
                            <Mic className="w-3 h-3 text-white" />
                          </div>
                        )}

                        {/* شارة ضيف الأسبوع */}
                        {author.is_guest && (
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs rounded-full">
                            ضيف
                          </div>
                        )}
                      </div>

                      {/* معلومات الكاتب */}
                      <div className="text-center mt-3">
                        <p className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                          {author.name}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-xs text-gray-500">
                            {author.articles_count || 0} مقال
                          </span>
                          {getTrendIcon(author.weekly_trend, author.weekly_rank_change)}
                        </div>
                        {author.specialization && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {author.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {showRightArrow && (
                <button
                  onClick={() => scrollCarousel('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* مؤشر النشاط العام */}
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Flame className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {authors.filter(a => a.is_online).length} متصل الآن
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Popup معلومات الكاتب */}
      {showPopup && selectedAuthor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="relative">
              <div className={`h-32 bg-gradient-to-br ${getBadgeColor(selectedAuthor.badge)} rounded-t-2xl`}>
                <button
                  onClick={closePopup}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {/* صورة الكاتب */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <img
                  src={selectedAuthor.avatar || generatePlaceholderImage(selectedAuthor.name)}
                  alt={selectedAuthor.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                />
                {selectedAuthor.is_verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="pt-16 px-6 pb-6">
              {/* اسم الكاتب ومعلوماته */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {selectedAuthor.name}
                </h3>
                {selectedAuthor.specialization && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {selectedAuthor.specialization}
                  </p>
                )}
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <span>{selectedAuthor.followers_count?.toLocaleString() || 0} متابع</span>
                  <span>•</span>
                  <span>{selectedAuthor.articles_count || 0} مقال</span>
                </div>
              </div>

              {/* الحالة */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  selectedAuthor.is_online 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${selectedAuthor.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {selectedAuthor.is_online ? 'متصل الآن' : 'غير متصل'}
                </div>
                
                {selectedAuthor.weekly_trend && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon(selectedAuthor.weekly_trend, selectedAuthor.weekly_rank_change)}
                  </div>
                )}
              </div>

              {/* النبذة */}
              {selectedAuthor.bio && (
                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {selectedAuthor.bio}
                  </p>
                </div>
              )}

              {/* الإحصائيات */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <Eye className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedAuthor.total_views ? `${(selectedAuthor.total_views / 1000).toFixed(1)}k` : '0'}
                  </p>
                  <p className="text-xs text-gray-500">مشاهدة</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <Heart className="w-5 h-5 mx-auto mb-1 text-red-600" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedAuthor.rating ? `${selectedAuthor.rating}/5` : '0'}
                  </p>
                  <p className="text-xs text-gray-500">تقييم</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <MessageCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedAuthor.articles_count || 0}
                  </p>
                  <p className="text-xs text-gray-500">مقال</p>
                </div>
              </div>

              {/* آخر مقال */}
              {selectedAuthor.latest_article && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    آخر مقال
                  </h4>
                  <Link 
                    href={`/article/${selectedAuthor.latest_article.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm line-clamp-2"
                  >
                    {selectedAuthor.latest_article.title}
                  </Link>
                </div>
              )}

              {/* أزرار الإجراءات */}
              <div className="flex gap-3">
                <Link
                  href={`/author/${selectedAuthor.id}`}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-medium text-center hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  onClick={closePopup}
                >
                  <User className="w-4 h-4" />
                  عرض الملف
                </Link>
                
                {selectedAuthor.social_links?.twitter && (
                  <a
                    href={selectedAuthor.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 