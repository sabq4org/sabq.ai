'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Clock, Eye, ChevronLeft, Sparkles } from 'lucide-react';

interface AlHilalArticle {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  publishedAt?: string;
  views?: number;
  isNew?: boolean;
}

interface AlHilalWorldCupBlockProps {
  articles?: AlHilalArticle[];
  className?: string;
  backgroundColor?: string;
  primaryColor?: string;
  textColor?: string;
  maxArticles?: number;
}

export function AlHilalWorldCupBlock({
  articles = [],
  className = '',
  backgroundColor = '#f0f7ff', // أزرق فاتح جداً
  primaryColor = '#005eb8', // الأزرق الملكي للهلال
  textColor = '#1a1a1a',
  maxArticles = 5
}: AlHilalWorldCupBlockProps) {
  
  // مقالات تجريبية إذا لم تكن هناك مقالات
  const defaultArticles: AlHilalArticle[] = [
    {
      id: 'demo-1',
      title: 'الهلال يستعد لمواجهة حاسمة في كأس العالم للأندية',
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      publishedAt: new Date().toISOString(),
      views: 1250,
      isNew: true,
      category: 'الهلال'
    },
    {
      id: 'demo-2',
      title: 'نيمار يقود الهلال لفوز كبير في البطولة',
      imageUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=800&q=80',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      views: 980,
      category: 'الهلال'
    },
    {
      id: 'demo-3',
      title: 'جماهير الهلال تستعد لدعم الفريق في المونديال',
      imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      views: 750,
      category: 'الهلال'
    }
  ];

  // استخدم المقالات المرسلة أو المقالات التجريبية
  const displayArticles = articles.length > 0 ? articles.slice(0, maxArticles) : defaultArticles;

  const formatDate = (date: string) => {
    const now = new Date();
    const articleDate = new Date(date);
    const diffMs = now.getTime() - articleDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 60) {
      return `منذ ${diffMinutes} دقيقة`;
    } else if (diffMinutes < 1440) { // أقل من 24 ساعة
      const hours = Math.floor(diffMinutes / 60);
      return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    }
    
    return articleDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      className={`smart-block-container ${className}`}
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* خلفية مزخرفة */}
      <div 
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-20%',
          width: '200px',
          height: '200px',
          background: `linear-gradient(135deg, ${primaryColor}10, transparent)`,
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-10%',
          width: '150px',
          height: '150px',
          background: `linear-gradient(135deg, ${primaryColor}08, transparent)`,
          borderRadius: '50%',
          filter: 'blur(30px)'
        }}
      />

      {/* رأس البلوك */}
      <div className="smart-block-header" style={{ borderBottomColor: `${primaryColor}20` }}>
        <div className="smart-block-header-content">
          <div className="smart-block-title-wrapper">
            <Trophy 
              className="smart-block-icon" 
              style={{ color: primaryColor }}
            />
            <h2 
              className="smart-block-title"
              style={{ color: textColor }}
            >
              الهلال في بطولة العالم
            </h2>
            <Sparkles 
              className="w-5 h-5" 
              style={{ color: primaryColor, opacity: 0.6 }}
            />
          </div>
        </div>
        <Link 
          href="/category/al-hilal-world-cup" 
          className="view-all-link"
          style={{ color: primaryColor }}
        >
          عرض الكل
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* محتوى البلوك - عرض شبكي للمقالات */}
      <div className={`mt-6 ${displayArticles.length === 1 ? '' : 'grid gap-4'} ${
        displayArticles.length === 2 ? 'md:grid-cols-2' : 
        displayArticles.length >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : ''
      }`}>
        {displayArticles.map((article, index) => (
          <Link
            key={article.id}
            href={`/article/${article.id}`}
            className="block"
          >
            <div 
              className="article-card group h-full"
              style={{
                backgroundColor: 'white',
                borderColor: `${primaryColor}20`,
                borderWidth: '1px',
                borderStyle: 'solid',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              {/* صورة المقال */}
              <div 
                className="article-card-image"
                style={{
                  height: '200px',
                  borderRadius: '12px 12px 0 0',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {article.imageUrl ? (
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`
                    }}
                  >
                    <Trophy 
                      className="w-12 h-12" 
                      style={{ color: primaryColor }}
                    />
                  </div>
                )}
                
                {/* شارة جديد للمقال الأول */}
                {index === 0 && article.isNew && (
                  <span 
                    className="absolute top-2 right-2 text-white text-xs px-3 py-1.5 rounded-full font-bold"
                    style={{ 
                      backgroundColor: '#ff4444',
                      boxShadow: '0 2px 8px rgba(255, 68, 68, 0.3)'
                    }}
                  >
                    جديد
                  </span>
                )}

                {/* وسم الهلال */}
                <span 
                  className="absolute bottom-2 right-2 text-white text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ 
                    backgroundColor: primaryColor,
                    boxShadow: `0 2px 8px ${primaryColor}40`
                  }}
                >
                  الهلال
                </span>
              </div>
              
              {/* محتوى المقال */}
              <div className="flex-1 p-4">
                <h3 
                  className="article-card-title font-bold mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors"
                  style={{ 
                    color: textColor,
                    fontSize: displayArticles.length === 1 ? '1.25rem' : '1rem',
                    lineHeight: '1.5'
                  }}
                >
                  {article.title}
                </h3>
                
                {/* معلومات المقال */}
                <div 
                  className="article-card-meta mt-auto"
                  style={{
                    borderTop: 'none',
                    paddingTop: '0',
                    gap: '1rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <span 
                    className="flex items-center gap-1.5"
                    style={{ color: '#64748b' }}
                  >
                    <Clock className="w-4 h-4" />
                    {article.publishedAt ? formatDate(article.publishedAt) : 'منذ قليل'}
                  </span>
                  <span 
                    className="flex items-center gap-1.5"
                    style={{ color: '#64748b' }}
                  >
                    <Eye className="w-4 h-4" />
                    {article.views || 0} مشاهدة
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* رسالة عندما لا توجد مقالات */}
      {displayArticles.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: primaryColor, opacity: 0.3 }} />
          <p className="text-lg" style={{ color: textColor, opacity: 0.7 }}>
            لا توجد أخبار متاحة حالياً عن الهلال في بطولة العالم
          </p>
        </div>
      )}

      {/* نسخة موبايل */}
      <style jsx>{`
        @media (max-width: 768px) {
          .article-card {
            margin-bottom: 1rem;
          }
          
          .article-card-title {
            font-size: 1rem !important;
          }
          
          .smart-block-container {
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
} 