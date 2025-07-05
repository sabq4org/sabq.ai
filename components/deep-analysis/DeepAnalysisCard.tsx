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
  ArrowLeft,
  ExternalLink
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

  // تحديد الرابط الصحيح بالاعتماد على id فقط لضمان توافقه مع مسار الـ API
  const analysisUrl = `/insights/deep/${analysis.id}`;

  return (
    <div className={`
      relative overflow-hidden rounded-xl transition-all duration-300 group
      ${darkMode 
        ? 'bg-gray-800 border border-gray-700 hover:border-gray-600' 
        : 'bg-white shadow-sm border border-gray-200 hover:shadow-lg'
      } 
      ${viewMode === 'list' ? 'flex' : ''}
      hover:transform hover:scale-105
    `}>
      {/* صورة مميزة */}
      <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-72 flex-shrink-0' : 'h-48'}`}>
        <Link href={analysisUrl}>
          <img 
            src={analysis.featuredImage || generatePlaceholderImage(analysis.title)} 
            alt={analysis.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"
          />
        </Link>
        
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

        {/* زر عرض سريع */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link 
            href={analysisUrl}
            className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            عرض
          </Link>
        </div>
      </div>

      {/* محتوى البطاقة */}
      <div className={`p-4 sm:p-5 ${viewMode === 'list' ? 'flex-1' : ''} flex flex-col`}>
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
        <Link href={analysisUrl}>
          <h3 className={`
            text-lg font-bold line-clamp-3 mb-3 group-hover:text-purple-600 transition-colors cursor-pointer
            ${darkMode ? 'text-white' : 'text-gray-900'}
          `}>
            {analysis.title}
          </h3>
        </Link>

        {/* الملخص */}
        <p className={`
          text-sm line-clamp-2 mb-4 flex-grow
          ${darkMode ? 'text-gray-400' : 'text-gray-600'}
        `}>
          {analysis.summary}
        </p>

        {/* معلومات أسفل البطاقة */}
        <div className={`
          flex items-center justify-between text-xs pt-3 border-t mb-4
          ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}
        `}>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{formatDate(analysis.publishedAt || analysis.createdAt)}</span>
              <span className="sm:hidden">{new Date(analysis.publishedAt || analysis.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {analysis.readingTime} د
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{analysis.views.toLocaleString('ar-SA')}</span>
              <span className="sm:hidden">{analysis.views > 999 ? `${Math.floor(analysis.views / 1000)}k` : analysis.views}</span>
            </span>
            {analysis.likes > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {analysis.likes}
              </span>
            )}
          </div>
        </div>

        {/* زر عرض التفاصيل - محسن */}
        <div className="pt-2 pb-4 mt-auto">
          <Link 
            href={analysisUrl}
            className={`
              w-fit max-w-[180px] mx-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${darkMode 
                ? 'bg-slate-100 hover:bg-blue-100 text-gray-900 hover:text-blue-900' 
                : 'bg-slate-100 hover:bg-blue-100 text-gray-900 hover:text-blue-900'
              }
              hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-blue-200
            `}
          >
            <Brain className="w-4 h-4" />
            <span>عرض التحليل الكامل</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
} 