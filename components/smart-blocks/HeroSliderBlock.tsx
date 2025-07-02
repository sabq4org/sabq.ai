'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Eye, User, Clock } from 'lucide-react';

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

interface HeroSliderBlockProps {
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

export const HeroSliderBlock: React.FC<HeroSliderBlockProps> = ({ block, articles }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const handlePrevious = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setActiveIndex((prev) => (prev === 0 ? articles.length - 1 : prev - 1));
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };

  const handleNext = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setActiveIndex((prev) => (prev === articles.length - 1 ? 0 : prev + 1));
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };

  const goToSlide = (index: number) => {
    if (!isTransitioning && index !== activeIndex) {
      setIsTransitioning(true);
      setActiveIndex(index);
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };

  if (articles.length === 0) return null;

  const activeArticle = articles[activeIndex];

  return (
    <div 
      className="smart-block-container hero-slider-block w-full"
      style={{ '--primary-color': block.theme.primaryColor, '--secondary-color': block.theme.backgroundColor } as React.CSSProperties}
    >
      <div className="relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden">
        {/* خلفية الصور */}
        <div className="absolute inset-0">
          {articles.map((article, index) => (
            <div
              key={article.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === activeIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              )}
              {/* تراكب التدرج */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>
          ))}
        </div>

        {/* المحتوى */}
        <div className="relative h-full flex items-end">
          <div className="w-full p-8 lg:p-12">
            <div className="max-w-4xl">
              {/* التصنيف */}
              {activeArticle.category && (
                <div 
                  className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4"
                  style={{ 
                    backgroundColor: block.theme.primaryColor,
                    color: 'white'
                  }}
                >
                  {activeArticle.category}
                </div>
              )}

              {/* العنوان */}
              <Link href={`/news/${activeArticle.slug}`}>
                <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 hover:text-gray-200 transition-colors line-clamp-2">
                  {activeArticle.title}
                </h1>
              </Link>

              {/* المقتطف */}
              {activeArticle.excerpt && (
                <p className="text-lg text-gray-200 mb-6 line-clamp-2 max-w-3xl">
                  {activeArticle.excerpt}
                </p>
              )}

              {/* معلومات المقال */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
                {activeArticle.author && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{activeArticle.author.name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(activeArticle.publishedAt).toLocaleDateString('ar-SA')}</span>
                </div>

                {activeArticle.views && (
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{activeArticle.views.toLocaleString('ar-SA')} مشاهدة</span>
                  </div>
                )}

                {activeArticle.readTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{activeArticle.readTime} دقيقة قراءة</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* أزرار التنقل */}
        <button
          onClick={handlePrevious}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="السابق"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
        
        <button
          onClick={handleNext}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="التالي"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        {/* مؤشرات الشرائح */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {articles.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'w-8 bg-white' 
                  : 'w-4 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`الانتقال إلى الشريحة ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* معاينة الشرائح */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.slice(0, 4).map((article, index) => (
          <button
            key={article.id}
            onClick={() => goToSlide(index)}
            className={`group relative rounded-lg overflow-hidden h-24 transition-all ${
              index === activeIndex 
                ? 'ring-2 ring-offset-2' 
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{ 
              '--tw-ring-color': index === activeIndex ? block.theme.primaryColor : 'transparent' 
            } as React.CSSProperties}
          >
            {article.imageUrl && (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-xs text-white font-medium line-clamp-2">
                {article.title}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 