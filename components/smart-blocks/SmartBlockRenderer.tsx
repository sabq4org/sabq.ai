'use client';

import React from 'react';
import { SmartBlock } from '@/types/smart-block';
import { CardGridBlock } from './CardGridBlock';
import { CarouselBlock } from './CarouselBlock';
import { AlHilalWorldCupBlock } from './AlHilalWorldCupBlock';
import { Activity, TrendingUp, Lightbulb, Target, Compass, Volume2, Star } from 'lucide-react';

interface SmartBlockRendererProps {
  block: SmartBlock;
  articles?: any[];
  darkMode?: boolean;
}

export function SmartBlockRenderer({ block, articles = [], darkMode = false }: SmartBlockRendererProps) {
  // تحديد الأيقونة والألوان بناءً على نوع البلوك
  const getBlockStyle = (type: string) => {
    switch (type) {
      case 'hero':
        return {
          icon: <Star className="w-5 h-5 text-blue-600" />,
          bgColor: darkMode ? 'bg-blue-600/30' : 'bg-blue-500',
          textColor: 'text-blue-600',
          lightBg: darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
        };
      case 'carousel':
        return {
          icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
          bgColor: darkMode ? 'bg-orange-900/30' : 'bg-orange-50',
          textColor: 'text-orange-600',
          lightBg: darkMode ? 'bg-orange-900/20' : 'bg-orange-50'
        };
      case 'grid':
        return {
          icon: <Compass className="w-5 h-5 text-purple-600" />,
          bgColor: darkMode ? 'bg-purple-900/30' : 'bg-purple-50',
          textColor: 'text-purple-600',
          lightBg: darkMode ? 'bg-purple-900/20' : 'bg-purple-50'
        };
      case 'list':
        return {
          icon: <Activity className="w-5 h-5 text-green-600" />,
          bgColor: darkMode ? 'bg-green-900/30' : 'bg-green-50',
          textColor: 'text-green-600',
          lightBg: darkMode ? 'bg-green-900/20' : 'bg-green-50'
        };
      case 'ticker':
        return {
          icon: <Volume2 className="w-5 h-5 text-pink-600" />,
          bgColor: darkMode ? 'bg-pink-900/30' : 'bg-pink-50',
          textColor: 'text-pink-600',
          lightBg: darkMode ? 'bg-pink-900/20' : 'bg-pink-50'
        };
      case 'trending':
        return {
          icon: <Lightbulb className="w-5 h-5 text-indigo-600" />,
          bgColor: darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50',
          textColor: 'text-indigo-600',
          lightBg: darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'
        };
      default:
        return {
          icon: <Target className="w-5 h-5 text-gray-600" />,
          bgColor: darkMode ? 'bg-gray-700/30' : 'bg-gray-100',
          textColor: 'text-gray-600',
          lightBg: darkMode ? 'bg-gray-700/20' : 'bg-gray-50'
        };
    }
  };

  const style = getBlockStyle(block.type);

  // التصميم الافتراضي الموحد مع دعم الألوان المخصصة
  const customStyle = block.theme ? {
    backgroundColor: block.theme.backgroundColor || (darkMode ? '#1f2937' : '#ffffff'),
    color: block.theme.textColor || (darkMode ? '#f3f4f6' : '#1f2937'),
    borderColor: block.theme.primaryColor ? `${block.theme.primaryColor}20` : (darkMode ? '#4b5563' : '#e5e7eb')
  } : {};

  // معالجة البلوكات المخصصة
  if (block.type === 'custom') {
    if (block.name === 'الهلال في بطولة العالم') {
      return <AlHilalWorldCupBlock articles={articles} />;
    }
    // يمكن إضافة بلوكات مخصصة أخرى هنا
  }

  // معالجة خاصة لبلوك يوم القهوة العالمي
  if (block.name === 'يوم القهوة العالمي') {
    return <CardGridBlock block={block as any} articles={articles} />;
  }

  // التصميم الافتراضي الموحد
  return (
    <div 
      className={`rounded-3xl p-6 shadow-xl dark:shadow-gray-900/50 border transition-all duration-300 hover:shadow-2xl ${
        !block.theme ? (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200') : ''
      }`}
      style={customStyle}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className={`w-10 h-10 rounded-xl flex items-center justify-center`}
            style={{ 
              backgroundColor: block.theme ? `${block.theme.primaryColor}20` : style.bgColor,
              color: block.theme ? block.theme.primaryColor : style.textColor
            }}
          >
            {React.cloneElement(style.icon, {
              className: `w-5 h-5`,
              style: { color: block.theme ? block.theme.primaryColor : '' }
            })}
          </div>
          <div>
            <h2 
              className={`text-lg font-bold`}
              style={{ color: customStyle.color }}
            >
              {block.name}
            </h2>
            {block.settings?.subtitle && (
              <p 
                className={`text-sm`}
                style={{ color: `${customStyle.color}B3` }} // 70% opacity
              >
                {block.settings.subtitle}
              </p>
            )}
          </div>
        </div>
        {articles.length > 0 && (
          <span 
            className={`px-3 py-1 rounded-full text-xs font-medium`}
            style={{
              backgroundColor: block.theme ? `${block.theme.primaryColor}20` : style.bgColor,
              color: block.theme ? block.theme.primaryColor : style.textColor
            }}
          >
            {articles.length} {articles.length === 1 ? 'مقال' : 'مقالات'}
          </span>
        )}
      </div>

      {/* محتوى البلوك حسب النوع */}
      <div className="block-content">
        {renderBlockContent()}
      </div>
    </div>
  );

  function renderBlockContent() {
    // للبلوكات الموجودة حالياً
    if (block.type === 'carousel' || block.displayType === 'carousel') {
      return <CarouselBlock block={block as any} articles={articles} />;
    }
    
    if (block.type === 'grid' || block.displayType === 'cards' || block.displayType === 'grid') {
      return <CardGridBlock block={block as any} articles={articles} />;
    }

    // البلوك الافتراضي - عرض قائمة بسيطة
    if (articles.length === 0) {
      return (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>لا توجد مقالات متاحة حالياً</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {articles.slice(0, block.articlesCount || 5).map((article: any, index: number) => (
          <div key={article.id || index} className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${
            darkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${index === 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div className="flex-1">
                <h4 className={`text-sm font-medium leading-relaxed mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {article.title}
                </h4>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {article.category || 'عام'}
                  </span>
                  {article.views && (
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {article.views} قراءة
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
} 