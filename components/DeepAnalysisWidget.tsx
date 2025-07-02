'use client';

import { Clock3, Brain, Share2 } from "lucide-react";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AnalysisTypeIcon from './deep-analysis/AnalysisTypeIcon';

interface DeepInsight {
  id: string;
  title: string;
  summary: string;
  author: string;
  createdAt: string;
  readTime: number;
  views: number;
  aiConfidence: number;
  tags: string[];
  type: 'AI' | 'تحرير بشري';
  analysisType?: 'manual' | 'ai' | 'mixed';
  url: string;
  isNew?: boolean;
  qualityScore?: number;
  category?: string;
}

interface DeepAnalysisWidgetProps {
  insights: DeepInsight[];
}

export default function DeepAnalysisWidget({ insights }: DeepAnalysisWidgetProps) {
  const [readItems, setReadItems] = useState<string[]>([]);

  useEffect(() => {
    // قراءة العناصر المقروءة من localStorage
    const read = localStorage.getItem('readAnalysis');
    if (read) {
      setReadItems(JSON.parse(read));
    }
  }, []);

  const handleShare = (item: DeepInsight) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.summary,
        url: window.location.origin + item.url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin + item.url);
      toast.success('تم نسخ الرابط');
    }
  };

  const markAsRead = (id: string) => {
    const newReadItems = [...readItems, id];
    setReadItems(newReadItems);
    localStorage.setItem('readAnalysis', JSON.stringify(newReadItems));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    }
  };

  // تحديد ما إذا كان التحليل جديد (خلال آخر 24 ساعة)
  const isNewInsight = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    return diffInHours < 24;
  };

  // اختيار الأيقونة بناءً على نوع التحليل
  const getInsightIcon = (category?: string) => {
    switch(category?.toLowerCase()) {
      case 'research':
      case 'أبحاث':
        return '🧠';
      case 'report':
      case 'تقارير':
        return '📊';
      case 'global':
      case 'عالمي':
        return '🌍';
      case 'tech':
      case 'تقنية':
        return '💻';
      case 'economy':
      case 'اقتصاد':
        return '💰';
      default:
        return '📈';
    }
  };

  return (
    <div id="deep-analysis-highlight" className="pb-6 md:pb-8 relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* العنوان والوصف */}
        <div className="text-center mb-12 max-w-4xl mx-auto pt-8">
          <div className="flex flex-col items-center gap-3">
            <Brain className="w-12 h-12 text-blue-300" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              التحليل العميق من سبق
            </h2>
          </div>
          <p className="text-lg text-gray-100/90 mt-3">
            رؤى استراتيجية ودراسات معمقة بالذكاء الاصطناعي والخبرة البشرية
          </p>
        </div>

        {/* البطاقات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {insights.map((item) => {
            const isUnread = !readItems.includes(item.id);
            const isAI = item.type === 'AI';
            const isNew = isNewInsight(item.createdAt);
            
            return (
              <div 
                key={item.id} 
                className="relative rounded-2xl overflow-hidden group bg-white backdrop-blur-lg border border-gray-200 shadow-lg"
              >
                <div className="p-6">
                  {/* مؤشر جديد - نقطة حمراء صغيرة */}
                  {isNew && (
                    <div className="absolute top-4 left-4">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                  )}

                  {/* الشريط العلوي مع الأيقونة الدلالية */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      {/* أيقونة دلالية */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-gradient-to-br from-blue-100 to-purple-100 shadow-sm">
                        {getInsightIcon(item.category)}
                      </div>
                      
                      {/* بادج تحليل عميق - محدث بتدرج ناعم */}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-300 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm gap-1">
                        تحليل عميق
                        {item.analysisType && (
                          <AnalysisTypeIcon type={item.analysisType} size="small" />
                        )}
                      </span>
                      
                      {isAI && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm">
                          AI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* العنوان */}
                  <h3 className="font-bold text-xl leading-tight mb-3 line-clamp-2 text-gray-900">
                    {item.title}
                  </h3>

                  {/* الوسوم */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* الإحصائيات - مبسطة */}
                  <div className="flex items-center justify-between text-sm mb-5 text-gray-600">
                    <span className="flex items-center gap-2">
                      <Clock3 className="w-4 h-4 text-gray-500" /> 
                      {item.readTime} دقيقة • {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {/* زر القراءة وزر المشاركة */}
                  <div className="flex items-center justify-between gap-3">
                    {/* زر المشاركة */}
                    <button
                      onClick={() => handleShare(item)}
                      className="p-1.5 rounded-lg transition-all duration-300 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-200"
                      title="مشاركة"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* زر القراءة */}
                    <a href={item.url} onClick={() => markAsRead(item.id)} className="flex-shrink-0">
                      <button className="py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md">
                        <span>اقرأ التحليل</span>
                        <Brain className="w-3.5 h-3.5" />
                      </button>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* زر استكشاف المزيد */}
        <div className="text-center">
          <a href="/insights/deep" className="inline-block">
            <button className="px-8 py-3 rounded-xl font-medium text-base transition-all duration-300 transform hover:scale-105 flex items-center gap-2 bg-gradient-to-r from-blue-600/70 to-purple-600/70 hover:from-blue-600 hover:to-purple-700 text-white border border-transparent hover:border-white/40 shadow-xl hover:shadow-2xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              استكشف جميع التحليلات العميقة
            </button>
          </a>
        </div>
        
        {/* نص إضافي */}
        <div className="text-center mt-6">
          <p className="text-sm text-blue-200/60">
            • يتم تحديث تحليلات جديدة يومياً
          </p>
        </div>
      </div>
    </div>
  );
} 