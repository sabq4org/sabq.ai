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
        relative overflow-hidden rounded-xl transition-all duration-300 
        ${darkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white shadow-sm border border-gray-200'
        } 
        ${viewMode === 'list' ? 'flex' : ''}
      `}>
        {/* صورة مميزة */}
        <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-72 flex-shrink-0' : 'h-48'}`}>
          <img 
            src={analysis.featuredImage || generatePlaceholderImage(analysis.title)} 
            alt={analysis.title}
            className="w-full h-full object-cover"
          />
          
          {/* شارة التحليل العميق */}
          <div className="absolute top-3 right-3">
            <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              تحليل عميق
            </div>
          </div>

          {/* نسبة الجودة */}
          <div className="absolute bottom-3 left-3">
            <div className={`
              ${analysis.qualityScore >= 80 ? 'bg-green-600' : analysis.qualityScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'}
              text-white px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1
            `}>
              <BarChart3 className="w-3.5 h-3.5" />
              {analysis.qualityScore}%
            </div>
          </div>
        </div>

        {/* محتوى البطاقة */}
        <div className={`p-5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
          {/* التصنيفات */}
          <div className="flex flex-wrap gap-2 mb-3">
            {analysis.categories.slice(0, 2).map((category, index) => (
              <span 
                key={index}
                className={`
                  text-xs px-2.5 py-1 rounded font-medium
                  ${darkMode 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-700'
                  }
                `}
              >
                {typeof category === 'string' ? category : ((category as any).name_ar || (category as any).name || 'عام')}
              </span>
            ))}
          </div>

          {/* العنوان */}
          <h3 className={`
            text-lg font-bold line-clamp-2 mb-3 group-hover:text-purple-600 transition-colors
            ${darkMode ? 'text-white' : 'text-gray-900'}
          `}>
            {analysis.title}
          </h3>

          {/* الملخص */}
          <p className={`
            text-sm line-clamp-2 mb-4
            ${darkMode ? 'text-gray-400' : 'text-gray-600'}
          `}>
            {analysis.summary}
          </p>

          {/* معلومات أسفل البطاقة */}
          <div className={`
            flex items-center justify-between text-xs pt-3 border-t
            ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}
          `}>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(analysis.publishedAt || analysis.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {analysis.readingTime} دقائق
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {analysis.views.toLocaleString('ar-SA')}
              </span>
              {analysis.likes > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  {analysis.likes}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 