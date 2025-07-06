'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, User, Award, Zap, Heart, Bookmark, Share2 } from 'lucide-react';
import { formatDateOnly } from '@/lib/date-utils';
import { getValidImageUrl, generatePlaceholderImage } from '@/lib/cloudinary';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface Article {
  id: string;
  title: string;
  summary?: string;
  featured_image?: string;
  category_id: number;
  category_name?: string;
  author_name?: string;
  views_count: number;
  created_at: string;
  published_at?: string;
  reading_time?: number;
  is_breaking?: boolean;
  is_featured?: boolean;
  excerpt?: string;
  slug: string;
  category?: {
    name: string;
    slug: string;
    color?: string;
  };
  author?: {
    name: string;
    avatar?: string;
  };
}

interface MobileArticleCardProps {
  article: Article;
  viewMode?: 'compact' | 'detailed' | 'featured';
  showActions?: boolean;
}

export default function MobileArticleCard({ 
  article, 
  viewMode = 'detailed',
  showActions = true 
}: MobileArticleCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    // جلب معرف المستخدم
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId && storedUserId !== 'anonymous') {
      setUserId(storedUserId);
    }
  }, []);

  // دالة معالجة الإعجاب
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userId) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          articleId: article.id,
          type: 'like',
          action: isLiked ? 'remove' : 'add'
        })
      });

      if (response.ok) {
        setIsLiked(!isLiked);
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  // دالة معالجة الحفظ
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userId) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          itemId: article.id,
          itemType: 'article'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.action === 'added');
      }
    } catch (error) {
      console.error('Error handling save:', error);
    }
  };

  // دالة مشاركة المقال
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || article.title,
          url: `/article/${article.id}`
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // نسخ الرابط للحافظة
      navigator.clipboard.writeText(`${window.location.origin}/article/${article.id}`);
    }
  };

  const imageUrl = getValidImageUrl(article.featured_image, article.title, 'article');

  // الوضع المضغوط
  if (viewMode === 'compact') {
    return (
      <Link href={`/article/${article.id}`}>
        <div className="mobile-article-card-compact bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex gap-3 p-3">
            {/* صورة مصغرة */}
            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={article.title}
                fill
                sizes="64px"
                className="object-cover"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = generatePlaceholderImage(article.title, 'article');
                }}
                loading="lazy"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              )}
            </div>

            {/* المحتوى */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-1">
                {article.title}
              </h3>
              
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatDateOnly(article.created_at)}</span>
                {article.views_count > 0 && (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>{article.views_count}</span>
                  </>
                )}
              </div>
            </div>

            {/* شارات */}
            <div className="flex flex-col gap-1">
              {article.is_breaking && (
                <div className="px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
                  عاجل
                </div>
              )}
              {article.is_featured && (
                <div className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                  مميز
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // الوضع المفصل
  return (
    <Link href={`/article/${article.id}`}>
      <div className="mobile-article-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* صورة المقال */}
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = generatePlaceholderImage(article.title, 'article');
            }}
            priority={viewMode === 'featured'}
            loading={viewMode === 'featured' ? 'eager' : 'lazy'}
          />
          
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}

          {/* التدرج العلوي */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* شارات */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {article.is_breaking && (
              <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-1">
                <Zap className="w-3 h-3" />
                عاجل
              </div>
            )}
            {article.is_featured && (
              <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" />
                مميز
              </div>
            )}
          </div>

          {/* التصنيف */}
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full">
              {article.category_name || 'عام'}
            </span>
          </div>

          {/* أزرار التفاعل */}
          {showActions && (
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <button 
                onClick={handleLike}
                className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all ${
                  isLiked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={handleSave}
                className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all ${
                  isSaved 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={handleShare}
                className="w-10 h-10 rounded-full shadow-md flex items-center justify-center bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-green-500 hover:text-white transition-all"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* محتوى البطاقة */}
        <div className="p-4">
          {/* العنوان */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg line-clamp-2 mb-3">
            {article.title}
          </h3>

          {/* الوصف */}
          {viewMode === 'detailed' && article.summary && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
              {article.summary}
            </p>
          )}

          {/* معلومات المقال */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDateOnly(article.created_at)}</span>
              </div>
              
              {article.reading_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{article.reading_time} دقيقة</span>
                </div>
              )}
              
              {article.views_count > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{article.views_count}</span>
                </div>
              )}
            </div>

            {article.author_name && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{article.author_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// مكون قائمة البطاقات المتنقلة
export function MobileArticleList({ articles, viewMode = 'detailed' }: { 
  articles: Article[];
  viewMode?: 'compact' | 'detailed' | 'featured';
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!isMobile) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <MobileArticleCard
            key={article.id}
            article={article}
            viewMode={index === 0 ? 'featured' : viewMode}
            showActions={index === 0}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full -mx-4">
      {articles.map((article) => (
        <MobileArticleCard
          key={article.id}
          article={article}
          viewMode="detailed"
          showActions={true}
        />
      ))}
    </div>
  );
}

// مكون شبكة البطاقات المتنقلة
export function MobileArticleGrid({ articles }: { articles: Article[] }) {
  return (
    <div className="mobile-article-grid grid grid-cols-1 gap-4">
      {articles.map((article) => (
        <MobileArticleCard
          key={article.id}
          article={article}
          viewMode="detailed"
          showActions={true}
        />
      ))}
    </div>
  );
} 