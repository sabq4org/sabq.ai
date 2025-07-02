'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Eye, User, TrendingUp, Clock } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  author?: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  views?: number;
  readTime?: number;
}

interface MagazineLayoutBlockProps {
  block: {
    id: string;
    name: string;
    theme: {
      primaryColor: string;
      backgroundColor: string;
      textColor: string;
    };
  };
  articles: Article[];
}

export const MagazineLayoutBlock: React.FC<MagazineLayoutBlockProps> = ({ block, articles }) => {
  if (articles.length === 0) return null;

  const mainArticle = articles[0];
  const secondaryArticles = articles.slice(1, 3);
  const listArticles = articles.slice(3, 8);

  return (
    <div 
      className="smart-block-container w-full"
      style={{ '--primary-color': block.theme.primaryColor, '--secondary-color': block.theme.backgroundColor } as React.CSSProperties}
    >
      {/* عنوان البلوك */}
      <div className="smart-block-header">
        <h2 className="smart-block-title" style={{ color: block.theme.textColor }}>
          {block.name}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المقال الرئيسي */}
        <div className="lg:col-span-2">
          {mainArticle && (
            <Link href={`/news/${mainArticle.slug}`} className="group block">
              <article className="relative h-full rounded-2xl overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 lg:aspect-h-10">
                  {mainArticle.imageUrl ? (
                    <img
                      src={mainArticle.imageUrl}
                      alt={mainArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                      <TrendingUp className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* تراكب التدرج */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* المحتوى */}
                  <div className="absolute inset-0 flex items-end p-6 lg:p-8">
                    <div className="w-full">
                      {mainArticle.category && (
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                          style={{ 
                            backgroundColor: block.theme.primaryColor,
                            color: 'white'
                          }}
                        >
                          {typeof mainArticle.category === 'string' ? mainArticle.category : ((mainArticle.category as any)?.name_ar || (mainArticle.category as any)?.name || 'عام')}
                        </span>
                      )}
                      
                      <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                        {mainArticle.title}
                      </h3>
                      
                      {mainArticle.excerpt && (
                        <p className="text-gray-200 mb-4 line-clamp-2">
                          {mainArticle.excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        {mainArticle.author && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{mainArticle.author.name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(mainArticle.publishedAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                        
                        {mainArticle.views && (
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{mainArticle.views.toLocaleString('ar-SA')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          )}
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* المقالات الثانوية */}
          {secondaryArticles.map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`} className="group block">
              <article className="article-card">
                <div className="article-card-image h-48">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TrendingUp className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  
                  {article.category && (
                    <div 
                      className="article-category-badge"
                      style={{ color: block.theme.primaryColor }}
                    >
                      {typeof article.category === 'string' ? article.category : ((article.category as any)?.name_ar || (article.category as any)?.name || 'عام')}
                    </div>
                  )}
                </div>
                
                <div className="article-card-content">
                  <h3 className="article-card-title text-base">
                    {article.title}
                  </h3>
                  
                  <div className="article-card-meta">
                    <div className="article-meta-item">
                      <Calendar />
                      <span>{new Date(article.publishedAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                    
                    {article.readTime && (
                      <div className="article-meta-item">
                        <Clock />
                        <span>{article.readTime} د</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>

      {/* قائمة المقالات السفلية */}
      {listArticles.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listArticles.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`} className="group">
                <article className="flex gap-3">
                  {/* رقم أو أيقونة */}
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ 
                      backgroundColor: `${block.theme.primaryColor}20`,
                      color: block.theme.primaryColor
                    }}
                  >
                    {listArticles.indexOf(article) + 4}
                  </div>
                  
                  {/* المحتوى */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 group-hover:text-opacity-80 transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {article.category && (
                        <span style={{ color: block.theme.primaryColor }}>
                          {typeof article.category === 'string' ? article.category : ((article.category as any)?.name_ar || (article.category as any)?.name || 'عام')}
                        </span>
                      )}
                      
                      <span>{new Date(article.publishedAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 