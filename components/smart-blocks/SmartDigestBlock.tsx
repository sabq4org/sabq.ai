'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Clock, TrendingUp, ArrowLeft, BookOpen, Zap, Crown, Leaf, Sun, Cloud, Moon, Star, Sparkles, Volume2, Headphones, Coffee, Sunrise, Sunset, Pause, Play, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

interface DoseContent {
  id: string;
  contentType: 'article' | 'weather' | 'quote' | 'tip' | 'audio' | 'analysis';
  title: string;
  summary: string;
  imageUrl?: string;
  audioUrl?: string;
  displayOrder: number;
  article?: {
    id: string;
    slug: string;
    category?: {
      name: string;
      name_ar?: string;
      slug: string;
    };
    author?: {
      name: string;
    };
  };
}

interface DailyDose {
  id: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  title: string;
  subtitle: string;
  date: string;
  status: string;
  views: number;
  contents: DoseContent[];
  mock?: boolean;
}

interface SmartDigestBlockProps {
  forceTimeSlot?: 'morning' | 'noon' | 'evening' | 'night';
}

export default function SmartDigestBlock({ forceTimeSlot }: SmartDigestBlockProps = {}) {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [dose, setDose] = useState<DailyDose | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // جلب الجرعة الحالية
  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      // تأخير بسيط لمنع التحديث السريع جداً
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!mounted) return;
      
      try {
        const url = forceTimeSlot 
          ? `/api/daily-doses?period=${forceTimeSlot}`
          : '/api/daily-doses';
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!mounted) return;
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!mounted) return;
        
        setDose(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching daily dose:', error);
        
        if (!mounted) return;
        
        // في حالة الخطأ، عرض بيانات افتراضية
        setDose({
          id: 'fallback-dose',
          period: 'evening',
          title: 'جرعتك اليومية',
          subtitle: 'محتوى مختار بعناية لك',  
          date: new Date().toISOString(),
          status: 'published',
          views: 0,
          contents: [
            {
              id: '1',
              contentType: 'article',
              title: 'أخبار اليوم',
              summary: 'تابع آخر الأخبار والمستجدات',
              imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
              displayOrder: 0
            },
            {
              id: '2',
              contentType: 'analysis',
              title: 'تحليل الأحداث',
              summary: 'نظرة معمقة على أهم الأحداث',
              imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
              displayOrder: 1
            },
            {
              id: '3',
              contentType: 'tip',
              title: 'نصيحة اليوم',
              summary: 'استفد من نصائحنا اليومية',
              displayOrder: 2
            }
          ]
        });
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [forceTimeSlot]);

  // الحصول على الأيقونة حسب الفترة
  const getPeriodIcon = useCallback(() => {
    if (!dose) return <Sun className="w-8 h-8" />;
    
    switch (dose.period) {
      case 'morning': return <Sunrise className="w-8 h-8" />;
      case 'afternoon': return <Sun className="w-8 h-8" />;
      case 'evening': return <Sunset className="w-8 h-8" />;
      case 'night': return <Moon className="w-8 h-8" />;
      default: return <Sun className="w-8 h-8" />;
    }
  }, [dose?.period]);

  // الحصول على الألوان حسب الفترة
  const colors = useMemo(() => {
    if (!dose) return { bg: 'from-blue-600 to-purple-600', accent: 'blue' };
    
    switch (dose.period) {
      case 'morning': 
        return { 
          bg: darkMode ? 'from-blue-900 to-indigo-900' : 'from-blue-500 to-cyan-500',
          accent: 'blue',
          card: darkMode ? 'bg-blue-900/20' : 'bg-blue-50',
          icon: 'text-blue-500'
        };
      case 'afternoon': 
        return { 
          bg: darkMode ? 'from-orange-900 to-amber-900' : 'from-orange-500 to-yellow-500',
          accent: 'orange',
          card: darkMode ? 'bg-orange-900/20' : 'bg-orange-50',
          icon: 'text-orange-500'
        };
      case 'evening': 
        return { 
          bg: darkMode ? 'from-purple-900 to-pink-900' : 'from-purple-600 to-pink-600',
          accent: 'purple',
          card: darkMode ? 'bg-purple-900/20' : 'bg-purple-50',
          icon: 'text-purple-500'
        };
      case 'night': 
        return { 
          bg: darkMode ? 'from-gray-900 to-blue-900' : 'from-indigo-700 to-blue-800',
          accent: 'indigo',
          card: darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50',
          icon: 'text-indigo-500'
        };
      default: 
        return { 
          bg: 'from-blue-600 to-purple-600',
          accent: 'blue',
          card: 'bg-blue-50',
          icon: 'text-blue-500'
        };
    }
  }, [dose?.period, darkMode]);

  // الحصول على أيقونة نوع المحتوى
  const getContentIcon = useCallback((type: string) => {
    switch (type) {
      case 'weather': return <Cloud className="w-6 h-6" />;
      case 'quote': return <Sparkles className="w-6 h-6" />;
      case 'tip': return <Sparkles className="w-6 h-6" />;
      case 'audio': return <Headphones className="w-6 h-6" />;
      case 'analysis': return <TrendingUp className="w-6 h-6" />;
      default: return <BookOpen className="w-6 h-6" />;
    }
  }, []);

  // الحصول على تسمية نوع المحتوى
  const getContentTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'weather': return 'طقس';
      case 'quote': return 'اقتباس';
      case 'tip': return 'نصيحة';
      case 'audio': return 'صوتي';
      case 'analysis': return 'تحليل';
      case 'article': return 'مقال';
      default: return 'محتوى';
    }
  }, []);

  // التعامل مع تشغيل الصوت
  const handleAudioPlay = useCallback((contentId: string) => {
    setPlayingAudio(playingAudio === contentId ? null : contentId);
  }, [playingAudio]);

  return (
    <section className="max-w-[100vw] mx-auto py-8 relative overflow-hidden transition-all duration-500">
      {/* الخلفية الزرقاء الصلبة */}
      <div className={`absolute inset-0 ${
        darkMode 
          ? 'bg-blue-900' 
          : 'bg-blue-600'
      }`}>
        {/* طبقة إضافية شفافة خفيفة */}
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* دوائر زخرفية بحجم أصغر */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-lg"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center relative">
          {/* رأس الجرعة مدمج */}
          <div className="mb-6 relative z-10">
            {/* أيقونة الفترة */}
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-white/20 rounded-full shadow-lg">
                <div className="text-white w-6 h-6">
                  {dose?.period === 'morning' && <Sunrise className="w-6 h-6" />}
                  {dose?.period === 'afternoon' && <Sun className="w-6 h-6" />}
                  {dose?.period === 'evening' && <Sunset className="w-6 h-6" />}
                  {dose?.period === 'night' && <Moon className="w-6 h-6" />}
                  {!dose && <Sun className="w-6 h-6" />}
                </div>
              </div>
            </div>
            
            {/* العنوان */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg mb-2">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>جاري تحضير جرعتك...</span>
                </div>
              ) : (
                'ختام يومك… باختصار تستحقه'
              )}
            </h1>
            
            <p className="text-base sm:text-lg text-white/90 drop-shadow">
              {loading ? (
                <span className="text-sm text-white/80 animate-pulse">
                  ⚡ تحميل سريع...
                </span>
              ) : (
                dose?.subtitle || 'محتوى مختار بعناية'
              )}
            </p>
          </div>
          
          {/* بطاقات المحتوى - تصميم مركزي */}
          <div className="flex justify-center gap-4 flex-wrap mb-6">
            {loading ? (
              // Loading State - بطاقات مركزية
              [0, 1, 2].map(i => (
                <div key={i} className="w-72 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/30">
                  {/* Skeleton Content أفقي */}
                  <div className="flex p-4">
                    <div className="w-20 h-20 bg-white/20 rounded-xl animate-pulse flex-shrink-0"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-white/20 rounded w-16 mb-2 animate-pulse"></div>
                      <div className="h-5 bg-white/20 rounded w-full mb-2 animate-pulse"></div>
                      <div className="h-3 bg-white/20 rounded w-4/5 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : dose?.contents && dose.contents.length > 0 ? (
              // Content Cards - تصميم مركزي
              dose.contents.slice(0, 3).map((content, index) => (
                <div 
                  key={content.id}
                  className="w-80 bg-white/20 hover:bg-white/30 rounded-2xl shadow-lg overflow-hidden border border-white/30 transition-all duration-300"
                >
                  <div className="flex p-4">
                    {/* صورة مصغرة أو أيقونة */}
                    {content.imageUrl ? (
                      <div className="relative w-24 h-24 overflow-hidden rounded-xl flex-shrink-0">
                        <img 
                          src={content.imageUrl} 
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20">
                        <div className="text-white/80">
                          {getContentIcon(content.contentType)}
                        </div>
                      </div>
                    )}

                    {/* محتوى البطاقة */}
                    <div className="ml-4 flex-1 flex flex-col">
                      {/* نوع المحتوى */}
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium text-white/90">
                          {getContentTypeLabel(content.contentType)}
                        </span>
                      </div>

                      {/* العنوان */}
                      <h3 className="text-sm font-bold text-white line-clamp-2 mb-1">
                        {content.title}
                      </h3>

                      {/* الملخص */}
                      <p className="text-white/80 text-xs leading-relaxed line-clamp-2 flex-1">
                        {content.summary}
                      </p>

                      {/* أزرار التفاعل */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          {content.audioUrl && (
                            <button
                              onClick={() => handleAudioPlay(content.id)}
                              className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                            >
                              {playingAudio === content.id ? (
                                <Pause className="w-3 h-3" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                            </button>
                          )}
                          
                          {content.article && (
                            <Link
                              href={`/article/${content.article.slug}`}
                              className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5 text-xs text-white/70">
                          <Clock className="w-2.5 h-2.5" />
                          <span>2 د</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Placeholder بسيط
              <div className="w-full max-w-2xl bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30 text-center">
                <BookOpen className="w-8 h-8 mb-2 text-white/60 mx-auto" />
                <span className="text-sm font-bold text-white/90">سيتم إضافة محتوى جديد قريبًا</span>
              </div>
            )}
          </div>
          
          {/* زر القراءة فقط */}
          <div className="text-center">
            <Link 
              href="/daily-dose" 
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white font-medium text-sm rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-white/30"
            >
              <BookOpen className="w-4 h-4" />
              <span>الجرعة الكاملة</span>
              <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 