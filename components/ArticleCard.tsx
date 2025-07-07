'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, User, Award, Zap, Heart, Bookmark } from 'lucide-react';
import { formatDateOnly } from '@/lib/date-utils';
import { getValidImageUrl, generatePlaceholderImage } from '@/lib/cloudinary';
import { getArticleLink } from '@/lib/utils';

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
}

interface ArticleCardProps {
  article: Article;
  viewMode?: 'grid' | 'list';
}

export default function ArticleCard({ article, viewMode = 'grid' }: ArticleCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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
      // إذا لم يكن المستخدم مسجل، توجيه إلى صفحة تسجيل الدخول
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
      // إذا لم يكن المستخدم مسجل، توجيه إلى صفحة تسجيل الدخول
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

  const imageUrl = getValidImageUrl(article.featured_image, article.title, 'article');
  
  return (
    <Link href={getArticleLink(article)}>
      <div className={`group h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 ${
        viewMode === 'list' ? 'flex gap-4 p-4' : 'flex flex-col'
      }`}>
        {/* صورة المقال */}
        <div className={`relative overflow-hidden rounded-lg ${
          viewMode === 'list' ? 'w-16 h-16 flex-shrink-0' : 'w-full h-56'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
          
          {/* استخدام Next/Image لأداء أفضل - بدون تأثير المرور */}
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            sizes={viewMode === 'list' ? '256px' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
            className="object-cover"
            onError={(e) => {
              // في حالة فشل تحميل الصورة، استخدم صورة افتراضية
              const target = e.target as HTMLImageElement;
              target.src = generatePlaceholderImage(article.title, 'article');
            }}
            priority={false}
            loading="lazy"
          />
          
          {/* شارات - فقط في وضع الشبكة */}
          {viewMode === 'grid' && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
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
          )}

          {/* التصنيف - فقط في وضع الشبكة */}
          {viewMode === 'grid' && (
            <div className="absolute bottom-4 right-4 z-20">
              <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full">
                {article.category_name || 'عام'}
              </span>
            </div>
          )}

          {/* أزرار التفاعل - فقط في وضع الشبكة */}
          {viewMode === 'grid' && (
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleLike}
                className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all ${
                  isLiked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={handleSave}
                className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all ${
                  isSaved 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* محتوى البطاقة */}
        <div className={`${viewMode === 'list' ? 'flex-1 min-w-0' : ''} ${viewMode === 'grid' ? 'p-6' : ''}`}>
          {/* العنوان */}
          <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
            viewMode === 'list' ? 'text-lg line-clamp-2' : 'text-lg line-clamp-2'
          }`}>
            {article.title}
          </h3>

          {/* الوصف - فقط في وضع الشبكة */}
          {viewMode === 'grid' && article.summary && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {article.summary}
            </p>
          )}

          {/* معلومات إضافية */}
          <div className={`flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 ${
            viewMode === 'list' ? 'mt-1' : ''
          }`}>
            {/* الكاتب */}
            {article.author_name && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{article.author_name}</span>
              </div>
            )}

            {/* التاريخ */}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDateOnly(article.published_at || article.created_at)}</span>
            </div>

            {/* المشاهدات */}
            {article.views_count > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{article.views_count.toLocaleString('ar-SA')}</span>
              </div>
            )}

            {/* التصنيف للوضع القائمة */}
            {viewMode === 'list' && (
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                  {article.category_name || 'عام'}
                </span>
              </div>
            )}

            {/* الشارات للوضع القائمة */}
            {viewMode === 'list' && (article.is_breaking || article.is_featured) && (
              <div className="flex items-center gap-1">
                {article.is_breaking && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    عاجل
                  </span>
                )}
                {article.is_featured && (
                  <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    مميز
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* أزرار التفاعل للوضع القائمة */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button 
              onClick={handleLike}
              className={`w-6 h-6 rounded-full shadow-md flex items-center justify-center transition-all ${
                isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white'
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={handleSave}
              className={`w-6 h-6 rounded-full shadow-md flex items-center justify-center transition-all ${
                isSaved 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white'
              }`}
            >
              <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </Link>
  );
} 