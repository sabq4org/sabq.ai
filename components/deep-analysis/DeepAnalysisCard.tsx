'use client';

import React from 'react';
import Link from 'next/link';
import {
  Brain,
  Clock,
  Eye,
  BarChart3,
  Sparkles,
  Bookmark,
  Heart,
  Share2,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import AnalysisTypeIcon from './AnalysisTypeIcon';

interface DeepAnalysisCardProps {
  analysis: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    categories: string[];
    tags: string[];
    authorName: string;
    sourceType: string;
    analysisType?: 'manual' | 'ai' | 'mixed';
    readingTime: number;
    views: number;
    likes: number;
    qualityScore: number;
    status: string;
    createdAt: string;
    publishedAt: string;
    featuredImage?: string;
  };
  viewMode?: 'grid' | 'list';
}

export default function DeepAnalysisCard({ analysis, viewMode = 'grid' }: DeepAnalysisCardProps) {
  const { darkMode } = useDarkModeContext();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  const generatePlaceholderImage = (title: string) => {
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B'];
    const colorIndex = title.charCodeAt(0) % colors.length;
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors[colorIndex]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors[(colorIndex + 1) % colors.length]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#grad)"/>
        <g opacity="0.2">
          <circle cx="100" cy="100" r="40" fill="white"/>
          <circle cx="300" cy="200" r="60" fill="white"/>
          <circle cx="200" cy="250" r="30" fill="white"/>
        </g>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
          ${title.substring(0, 20)}
        </text>
      </svg>
    `)}`;
  };

  const handleInteraction = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`${action} clicked for analysis ${analysis.id}`);
  };

  return (
    <Link
      href={`/insights/deep/${analysis.slug || analysis.id}`}
      className={`block group ${viewMode === 'list' ? 'w-full' : ''}`}
    >
      <div className={`
        relative overflow-hidden rounded-2xl transition-all duration-300 
        hover:shadow-2xl hover:-translate-y-1 
        ${darkMode 
          ? 'bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50' 
          : 'bg-white shadow-lg border border-gray-100'
        } 
        ${viewMode === 'list' ? 'flex' : ''}
      `}>
        {/* صورة مميزة مع تحسينات */}
        <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-72 flex-shrink-0' : 'h-56'}`}>
          <img 
            src={analysis.featuredImage || generatePlaceholderImage(analysis.title)} 
            alt={analysis.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* تدرج محسن للنص */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* شارة التحليل العميق */}
          <div className="absolute top-4 right-4">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm">
              <Brain className="w-4 h-4" />
              تحليل عميق
              {analysis.analysisType && (
                <AnalysisTypeIcon type={analysis.analysisType} size="small" />
              )}
            </div>
          </div>

          {/* نسبة الجودة */}
          <div className="absolute bottom-4 left-4">
            <div className={`
              bg-gradient-to-r ${getQualityColor(analysis.qualityScore)} 
              text-white px-3 py-1.5 rounded-lg text-sm font-bold 
              flex items-center gap-1.5 shadow-lg backdrop-blur-sm
            `}>
              <BarChart3 className="w-4 h-4" />
              {analysis.qualityScore}%
            </div>
          </div>
        </div>

        {/* محتوى البطاقة */}
        <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''} space-y-4`}>
          {/* التصنيفات */}
          <div className="flex flex-wrap gap-2">
            {analysis.categories.slice(0, 3).map((category, index) => (
              <span 
                key={index}
                className={`
                  text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
                  ${darkMode 
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {typeof category === 'string' ? category : ((category as any).name_ar || (category as any).name || 'عام')}
              </span>
            ))}
            {analysis.categories.length > 3 && (
              <span className={`
                text-xs px-3 py-1.5 rounded-lg font-medium
                ${darkMode ? 'text-gray-400' : 'text-gray-500'}
              `}>
                +{analysis.categories.length - 3}
              </span>
            )}
          </div>

          {/* العنوان */}
          <h3 className={`
            text-xl font-bold line-clamp-2 group-hover:text-blue-500 
            transition-colors leading-tight
            ${darkMode ? 'text-white' : 'text-gray-900'}
          `}>
            {analysis.title}
          </h3>

          {/* معلومات إضافية */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4 text-sm">
              <span className={`flex items-center gap-1.5 font-medium ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                <Clock className="w-4 h-4" />
                {analysis.readingTime} د
              </span>
              <span className={`flex items-center gap-1.5 font-medium ${
                darkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                <Eye className="w-4 h-4" />
                {analysis.views.toLocaleString('ar-SA')}
              </span>
            </div>

            {/* أزرار التفاعل */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleInteraction(e, 'save')}
                className={`
                  p-2 rounded-lg transition-all hover:scale-110
                  ${darkMode 
                    ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }
                `}
                aria-label="حفظ"
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleInteraction(e, 'like')}
                className={`
                  p-2 rounded-lg transition-all hover:scale-110
                  ${darkMode 
                    ? 'hover:bg-gray-700/50 text-gray-400 hover:text-red-400' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'
                  }
                `}
                aria-label="إعجاب"
              >
                <Heart className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleInteraction(e, 'share')}
                className={`
                  p-2 rounded-lg transition-all hover:scale-110
                  ${darkMode 
                    ? 'hover:bg-gray-700/50 text-gray-400 hover:text-blue-400' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-blue-500'
                  }
                `}
                aria-label="مشاركة"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* معلومات النشر */}
          <div className={`
            flex items-center justify-between text-xs pt-3 border-t
            ${darkMode ? 'border-gray-700/50 text-gray-400' : 'border-gray-200 text-gray-500'}
          `}>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(analysis.publishedAt || analysis.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              {analysis.sourceType === 'gpt' && <Sparkles className="w-3.5 h-3.5" />}
              <span>{analysis.authorName}</span>
            </div>
          </div>

          {/* زر اقرأ المزيد للجوال */}
          <div className="flex items-center justify-center pt-2 sm:hidden">
            <span className={`
              flex items-center gap-2 text-sm font-medium
              ${darkMode ? 'text-blue-400' : 'text-blue-600'}
            `}>
              اقرأ التحليل كاملاً
              <ArrowLeft className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
} 