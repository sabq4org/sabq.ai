'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Eye, Calendar, TrendingUp, ArrowLeft, BookOpen, Zap, Crown, Leaf } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  summary?: string;
  slug: string;
  publishedAt: string;
  published_at?: string;
  created_at?: string;
  readTime?: number;
  views?: number;
  category?: {
    id?: string;
    name: string;
    name_ar?: string;
    slug: string;
  };
  author?: {
    name: string;
  };
  image?: string;
  featured_image?: string;
  breaking?: boolean;
  importanceScore?: number;
  relevanceScore?: number;
  engagementScore?: number;
}

type TimeIntent = 'morning' | 'afternoon' | 'evening';

export default function SmartDigestBlock() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIntent, setCurrentIntent] = useState<TimeIntent>('morning');

  // تحديد النية حسب الوقت
  const getTimeIntent = (): TimeIntent => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  };

  // الحصول على العنوان والوصف حسب الوقت
  const getTimeBasedContent = () => {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return {
        title: 'ابدأ صباحك بالمفيد والهادئ',
        subtitle: 'كل شيء بوضوح قبل أن تبدأ يومك'
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        title: 'متابعات الظهيرة… اللحظة الآن بين يديك',
        subtitle: 'استراحة معرفية وسط يومك المتسارع'
      };
    } else {
      return {
        title: 'ختام يومك… باختصار تستحقه',
        subtitle: 'ملخص ذكي قبل أن تنهي يومك'
      };
    }
  };

  // جلب المقالات الذكية
  const fetchSmartDigest = async () => {
    try {
      setLoading(true);
      const intent = getTimeIntent();
      setCurrentIntent(intent);

      const response = await fetch(`/api/smart-digest?intent=${intent}`);
      if (!response.ok) throw new Error('Failed to fetch digest');
      
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching smart digest:', error);
      // جلب مقالات عادية كبديل
      try {
        const fallbackResponse = await fetch('/api/articles?limit=3&orderBy=publishedAt');
        const fallbackData = await fallbackResponse.json();
        setArticles(fallbackData.articles || []);
      } catch (fallbackError) {
        console.error('Error fetching fallback articles:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartDigest();
    
    // تحديث كل ساعة
    const interval = setInterval(fetchSmartDigest, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const { title, subtitle } = getTimeBasedContent();

  return (
    <section className={`w-full py-20 relative overflow-hidden transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-[#0f52ba] to-[#3783ff]'} shadow-2xl`}>
      <div className={`absolute inset-0 opacity-40 ${darkMode ? 'bg-gradient-to-br from-blue-900/20 via-transparent to-indigo-900/20' : 'bg-gradient-to-br from-[#1f3f75] via-transparent to-[#5fa9ff]'}`}></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center relative">
          {/* Main Title */}
          <div className="mb-16 relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white leading-tight drop-shadow-lg dark:shadow-gray-900/50">
              {title}
            </h1>
            <p className={`text-xl sm:text-2xl mb-4 drop-shadow ${darkMode ? 'text-gray-200' : 'text-white/95'}`}>
              {subtitle}
            </p>
          </div>
          
          {/* Enhanced News Cards */}
          <div className={`grid gap-6 mb-16 relative z-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}>
            {/* أثناء التحميل: 3 سبينرات */}
            {loading && [0,1,2].map(i => (
              <div key={i} className={`backdrop-blur-md rounded-3xl shadow-xl dark:shadow-gray-900/50 min-h-[320px] flex items-center justify-center ${darkMode ? 'bg-gray-800/95' : 'bg-white/95'}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ))}

            {/* بعد التحميل: عرض المقالات المتاحة + Placeholder */}
            {!loading && [0,1,2].map(i => {
              if (articles[i]) {
                return (
                  <Link key={articles[i].id} href={`/article/${articles[i].slug || articles[i].id}`} className="block">
                    <div className={`group backdrop-blur-md rounded-3xl shadow-xl dark:shadow-gray-900/50 min-h-[320px] flex flex-col overflow-hidden ${darkMode ? 'bg-gray-800/95' : 'bg-white/95'}`}>
                      {/* Card Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={articles[i].featured_image || articles[i].image || (i===0 ? "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80" : i===1 ? "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80" : "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80")}
                          alt={articles[i].title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // إذا فشل تحميل الصورة، استخدم الصورة الافتراضية حسب البطاقة
                            const defaultImages = [
                              "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80",
                              "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
                              "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
                            ];
                            e.currentTarget.src = defaultImages[i] || defaultImages[0];
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {/* شارة التصنيف أو عاجل حسب البطاقة */}
                        {i === 0 && articles[0].breaking && (
                          <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1.5 bg-red-600/90 text-white text-xs font-bold rounded-full backdrop-blur-sm shadow-lg dark:shadow-gray-900/50">
                            <Zap className="w-3 h-3" /> عاجل
                          </span>
                        )}
                        {i === 1 && articles[1].category && (
                          <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600/90 text-white text-xs font-bold rounded-full backdrop-blur-sm shadow-lg dark:shadow-gray-900/50">
                            <Crown className="w-3 h-3" />
                            {articles[1].category.name_ar || articles[1].category.name}
                          </span>
                        )}
                        {i === 2 && articles[2]?.category && (
                          <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600/90 text-white text-xs font-bold rounded-full backdrop-blur-sm shadow-lg dark:shadow-gray-900/50">
                            <Leaf className="w-3 h-3" />
                            {articles[2].category.name_ar || articles[2].category.name}
                          </span>
                        )}
                      </div>
                      
                      {/* Card Content */}
                      <div className="flex-1 p-5 flex flex-col">
                        <h3 className={`text-right font-bold mb-2 text-lg leading-relaxed line-clamp-2 transition-colors ${darkMode ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-700'}`}>
                          {articles[i].title}
                        </h3>
                        <p className={`text-right text-sm mb-4 leading-relaxed line-clamp-3 flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {articles[i].excerpt || articles[i].summary || ''}
                        </p>
                        <div className={`flex items-center justify-between mt-auto pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(articles[i].publishedAt || articles[i].published_at || articles[i].created_at || Date.now()).toLocaleDateString('ar-SA')}
                          </span>
                          <span className={`flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            اقرأ المزيد
                            <ArrowLeft className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              } else {
                // Placeholder أنيق
                return (
                  <div key={i} className={`backdrop-blur-md rounded-3xl shadow-xl dark:shadow-gray-900/50 min-h-[320px] flex flex-col items-center justify-center ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <BookOpen className="w-12 h-12 mb-4 text-gray-400 opacity-60" />
                    <span className={`text-lg font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>قريبًا</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>سيتم إضافة مقالات جديدة هنا</span>
                  </div>
                );
              }
            })}
          </div>
          
          {/* زر قراءة الجرعة الكاملة */}
          <div className="mt-8 text-center">
            <Link 
              href="/daily-dose" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl dark:shadow-gray-900/50 hover:shadow-2xl"
            >
              <BookOpen className="w-5 h-5 animate-pulse" />
              <span>قراءة الجرعة الكاملة</span>
              <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 