'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Eye, AlertCircle, ChevronLeft, ListOrdered } from 'lucide-react';

interface HeadlineListBlockProps {
  block: any;
  articles: any[];
}

export function HeadlineListBlock({ block, articles }: HeadlineListBlockProps) {
  const displayArticles = articles.slice(0, block.config?.itemsCount || 10);
  
  // استخراج الألوان من theme البلوك
  const theme = block.theme || {};
  const primaryColor = theme.primaryColor || '#f97316'; // اللون الافتراضي
  const backgroundColor = theme.backgroundColor || '#ffffff';
  const textColor = theme.textColor || '#1a1a1a';
  const secondaryColor = theme.secondaryColor || '#f8fafc';

  // إذا لم تكن هناك مقالات، عرض رسالة
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
              <ListOrdered 
                className="smart-block-icon" 
                style={{ color: primaryColor }}
              />
              <h2 
                className="smart-block-title"
                style={{ color: textColor }}
              >
                {block.name || 'أهم العناوين'}
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
          <div className="empty-icon">📋</div>
          <p className="empty-text">لا توجد مقالات مرتبطة بهذه الكلمة المفتاحية حالياً</p>
          <p className="empty-subtext">سيتم تحديث البلوك تلقائياً عند توفر محتوى جديد</p>
        </div>
      </div>
    );
  }

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
            <ListOrdered 
              className="smart-block-icon" 
              style={{ color: primaryColor }}
            />
            <h2 
              className="smart-block-title"
              style={{ color: textColor }}
            >
              {block.name || 'أهم العناوين'}
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

      <div 
        className="headline-list"
        style={{
          backgroundColor: secondaryColor || `${backgroundColor}f0`,
          borderColor: `${primaryColor}20`
        }}
      >
        {displayArticles.map((article, index) => (
          <Link
            key={article.id}
            href={`/article/${article.id}`}
            className="headline-item group"
          >
            <div 
              className="headline-number"
              style={{
                backgroundColor: index < 3 ? primaryColor : `${primaryColor}80`,
                color: '#ffffff'
              }}
            >
              {index < 3 ? (
                <span className="number-circle">{index + 1}</span>
              ) : (
                <span className="number-text">{index + 1}</span>
              )}
            </div>
            
            <div className="headline-content">
              <h3 
                className="headline-title"
                style={{ color: textColor }}
              >
                {article.breaking && (
                  <span 
                    className="breaking-badge"
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#dc2626'
                    }}
                  >
                    <AlertCircle className="w-3 h-3" />
                    عاجل
                  </span>
                )}
                {article.title}
              </h3>
              
              <div className="headline-meta">
                <span className="meta-item">
                  <Clock className="w-3 h-3" />
                  {new Date(article.published_at || article.created_at).toLocaleDateString('ar-SA')}
                </span>
                <span className="meta-item">
                  <Eye className="w-3 h-3" />
                  {article.views || 0}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 