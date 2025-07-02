'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, User, Award, Zap } from 'lucide-react';
import { formatDateOnly } from '@/lib/date-utils';
import { getValidImageUrl, generatePlaceholderImage } from '@/lib/cloudinary';

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
  const imageUrl = getValidImageUrl(article.featured_image, article.title, 'article');
  
  return (
    <Link href={`/article/${article.id}`}>
      <div className={`group h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/50 hover:shadow-2xl dark:hover:shadow-gray-900/70 transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-transparent transform hover:-translate-y-1 ${
        viewMode === 'list' ? 'flex gap-6' : 'flex flex-col'
      }`}>
        {/* صورة المقال */}
        <div className={`relative overflow-hidden ${
          viewMode === 'list' ? 'w-64 h-48' : 'w-full h-56'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
          
          {/* استخدام Next/Image لأداء أفضل */}
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            sizes={viewMode === 'list' ? '256px' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              // في حالة فشل تحميل الصورة، استخدم صورة افتراضية
              const target = e.target as HTMLImageElement;
              target.src = generatePlaceholderImage(article.title, 'article');
            }}
            priority={false}
            loading="lazy"
          />
          
          {/* شارات */}
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

          {/* التصنيف */}
          <div className="absolute bottom-4 right-4 z-20">
            <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full">
              {article.category_name || 'عام'}
            </span>
          </div>
        </div>

        {/* محتوى البطاقة */}
        <div className={`${viewMode === 'list' ? 'flex-1' : ''} p-6`}>
          {/* العنوان */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {article.title}
          </h3>

          {/* الوصف */}
          {article.summary && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {article.summary}
            </p>
          )}

          {/* معلومات إضافية */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
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

            {/* وقت القراءة */}
            {article.reading_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{article.reading_time} د</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 