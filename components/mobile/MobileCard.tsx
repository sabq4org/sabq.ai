'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Share2, Bookmark, MessageSquare } from 'lucide-react';

interface MobileCardProps {
  article: {
    id: string;
    title: string;
    excerpt?: string;
    featured_image?: string;
    category?: {
      name: string;
      slug: string;
      color?: string;
    };
    author?: {
      name: string;
      avatar?: string;
    };
    published_at?: string;
    reading_time?: number;
    views?: number;
    comments_count?: number;
  };
  variant?: 'default' | 'compact' | 'featured';
  showImage?: boolean;
  showExcerpt?: boolean;
  onShare?: (article: any) => void;
  onBookmark?: (article: any) => void;
}

export default function MobileCard({ 
  article, 
  variant = 'default',
  showImage = true,
  showExcerpt = true,
  onShare,
  onBookmark
}: MobileCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'منذ دقائق';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    if (diffInHours < 48) return 'أمس';
    return date.toLocaleDateString('ar-SA', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getImageUrl = (url?: string) => {
    if (!url) return '/images/placeholder-article.jpg';
    if (url.startsWith('http')) return url;
    return `https://res.cloudinary.com/your-cloud/image/fetch/w_400,h_200,c_fill,f_auto,q_auto/${encodeURIComponent(url)}`;
  };

  if (variant === 'compact') {
    return (
      <div className="mobile-card bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden tap-highlight">
        <Link href={`/article/${article.id}`} className="block">
          <div className="flex gap-3 p-4">
            {showImage && article.featured_image && (
              <div className="flex-shrink-0">
                <Image
                  src={getImageUrl(article.featured_image)}
                  alt={article.title}
                  width={80}
                  height={80}
                  className="thumbnail object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {article.category && (
                <div className="mb-2">
                  <span 
                    className="inline-block px-2 py-1 text-xs font-medium rounded-full"
                    style={{ 
                      backgroundColor: article.category.color + '20' || '#3b82f620',
                      color: article.category.color || '#3b82f6'
                    }}
                  >
                    {article.category.name}
                  </span>
                </div>
              )}
              
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-clamp-2 mb-2">
                {article.title}
              </h3>
              
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(article.published_at)}
                </span>
                
                {article.reading_time && (
                  <span>{article.reading_time} دقيقة</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="mobile-card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 overflow-hidden tap-highlight">
        <Link href={`/article/${article.id}`} className="block">
          {showImage && article.featured_image && (
            <div className="relative">
              <Image
                src={getImageUrl(article.featured_image)}
                alt={article.title}
                width={400}
                height={200}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              
              {article.category && (
                <div className="absolute top-3 right-3">
                  <span 
                    className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-white/90 backdrop-blur-sm"
                    style={{ color: article.category.color || '#3b82f6' }}
                  >
                    {article.category.name}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white text-clamp-3 mb-3">
              {article.title}
            </h2>
            
            {showExcerpt && article.excerpt && (
              <p className="text-sm text-gray-600 dark:text-gray-300 text-clamp-2 mb-3">
                {article.excerpt}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(article.published_at)}
                </span>
                
                {article.reading_time && (
                  <span>{article.reading_time} دقيقة</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {article.views && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Eye className="w-3 h-3" />
                    {article.views}
                  </span>
                )}
                
                {article.comments_count && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-3 h-3" />
                    {article.comments_count}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
        
        {/* أزرار التفاعل */}
        <div className="flex items-center justify-end gap-2 px-4 pb-4">
          {onBookmark && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onBookmark(article);
              }}
              className="icon-button bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="حفظ المقال"
            >
              <Bookmark className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          )}
          
          {onShare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onShare(article);
              }}
              className="icon-button bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="مشاركة المقال"
            >
              <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="mobile-card bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden tap-highlight">
      <Link href={`/article/${article.id}`} className="block">
        {showImage && article.featured_image && (
          <div className="relative">
            <Image
              src={getImageUrl(article.featured_image)}
              alt={article.title}
              width={400}
              height={150}
              className="card-image object-cover"
              loading="lazy"
            />
            
            {article.category && (
              <div className="absolute top-2 right-2">
                <span 
                  className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-white/90 backdrop-blur-sm"
                  style={{ color: article.category.color || '#3b82f6' }}
                >
                  {article.category.name}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="p-4">
          {!showImage && article.category && (
            <div className="mb-2">
              <span 
                className="inline-block px-2 py-1 text-xs font-medium rounded-full"
                style={{ 
                  backgroundColor: article.category.color + '20' || '#3b82f620',
                  color: article.category.color || '#3b82f6'
                }}
              >
                {article.category.name}
              </span>
            </div>
          )}
          
          <h3 className="text-base font-semibold text-gray-900 dark:text-white text-clamp-2 mb-2">
            {article.title}
          </h3>
          
          {showExcerpt && article.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-300 text-clamp-2 mb-3">
              {article.excerpt}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(article.published_at)}
              </span>
              
              {article.reading_time && (
                <span>{article.reading_time} دقيقة</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {article.views && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Eye className="w-3 h-3" />
                  {article.views}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
} 