'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Pause, Clock, Eye, Image as ImageIcon } from 'lucide-react';

interface CarouselBlockProps {
  block: any;
  articles: any[];
}

export function CarouselBlock({ block, articles }: CarouselBlockProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const displayArticles = articles.slice(0, block.config?.itemsCount || 5);
  
  // استخراج الألوان من theme البلوك
  const theme = block.theme || {};
  const primaryColor = theme.primaryColor || '#f97316'; // اللون الافتراضي
  const backgroundColor = theme.backgroundColor || '#ffffff';
  const textColor = theme.textColor || '#1a1a1a';
  const secondaryColor = theme.secondaryColor || '#f8fafc';

  useEffect(() => {
    if (!isPlaying || displayArticles.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayArticles.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, displayArticles.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayArticles.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + displayArticles.length) % displayArticles.length);
  };

  if (displayArticles.length === 0) {
    return (
      <div 
        className="smart-block-container"
        style={{
          backgroundColor: backgroundColor,
          color: textColor
        }}
      >
        <div className="smart-block-header">
          <div className="smart-block-header-content">
            <div className="smart-block-title-wrapper">
              <ImageIcon 
                className="smart-block-icon" 
                style={{ color: primaryColor }}
              />
              <h2 
                className="smart-block-title"
                style={{ color: textColor }}
              >
                {block.name || 'معرض الصور'}
              </h2>
            </div>
            {block.keywords && block.keywords.length > 0 && (
              <div className="smart-block-keywords">
                {block.keywords.map((keyword: string, index: number) => (
                  <span 
                    key={index} 
                    className="keyword-badge"
                    style={{
                      backgroundColor: `${primaryColor}20`,
                      color: primaryColor,
                      borderColor: `${primaryColor}40`
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="empty-block-message">
          <div className="empty-icon">🎠</div>
          <p className="empty-text">لا توجد مقالات مرتبطة بهذه الكلمة المفتاحية حالياً</p>
          <p className="empty-subtext">سيتم تحديث البلوك تلقائياً عند توفر محتوى جديد</p>
        </div>
      </div>
    );
  }

  const currentArticle = displayArticles[currentIndex];

  return (
    <div 
      className="smart-block-container"
      style={{
        backgroundColor: backgroundColor,
        color: textColor
      }}
    >
      <div className="smart-block-header">
        <div className="smart-block-header-content">
          <div className="smart-block-title-wrapper">
            <ImageIcon 
              className="smart-block-icon" 
              style={{ color: primaryColor }}
            />
            <h2 
              className="smart-block-title"
              style={{ color: textColor }}
            >
              {block.name || 'معرض الصور'}
            </h2>
          </div>
          {block.keywords && block.keywords.length > 0 && (
            <div className="smart-block-keywords">
              {block.keywords.map((keyword: string, index: number) => (
                <span 
                  key={index} 
                  className="keyword-tag"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor,
                    borderColor: `${primaryColor}40`
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link 
          href="/news" 
          className="view-all-link"
          style={{ color: primaryColor }}
        >
          عرض الكل
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="carousel-container">
        <div className="carousel-content">
          <div className="carousel-image-section">
            {currentArticle.imageUrl ? (
              <Image
                src={currentArticle.imageUrl}
                alt={currentArticle.title}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`
                }}
              >
                <ImageIcon 
                  className="w-20 h-20" 
                  style={{ color: primaryColor }}
                />
              </div>
            )}
            
            <div className="carousel-overlay">
              <div className="carousel-controls">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="carousel-control-btn"
                  style={{ 
                    backgroundColor: primaryColor,
                    color: '#ffffff'
                  }}
                  aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div 
            className="carousel-info-section"
            style={{
              backgroundColor: secondaryColor || `${backgroundColor}f8`,
              borderColor: `${primaryColor}20`
            }}
          >
            <Link href={`/article/${currentArticle.id}`} className="carousel-article-link">
              <span 
                className="carousel-category"
                style={{
                  backgroundColor: primaryColor,
                  color: '#ffffff'
                }}
              >
                {currentArticle.category || 'أخبار'}
              </span>
              <h3 
                className="carousel-title"
                style={{ color: textColor }}
              >
                {currentArticle.title}
              </h3>
              {currentArticle.excerpt && (
                <p 
                  className="carousel-excerpt"
                  style={{ color: `${textColor}cc` }}
                >
                  {currentArticle.excerpt}
                </p>
              )}
              <div className="carousel-meta">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(currentArticle.published_at || currentArticle.created_at).toLocaleDateString('ar-SA')}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {currentArticle.views || 0} مشاهدة
                </span>
              </div>
            </Link>

            <div className="carousel-navigation">
              <button
                onClick={goToPrevious}
                className="carousel-nav-btn"
                style={{
                  backgroundColor: primaryColor,
                  color: '#ffffff'
                }}
                aria-label="السابق"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="carousel-indicators">
                {displayArticles.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                    style={{
                      backgroundColor: index === currentIndex ? primaryColor : `${primaryColor}40`
                    }}
                    aria-label={`الانتقال إلى الشريحة ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={goToNext}
                className="carousel-nav-btn"
                style={{
                  backgroundColor: primaryColor,
                  color: '#ffffff'
                }}
                aria-label="التالي"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 