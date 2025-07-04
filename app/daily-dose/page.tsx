'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, Eye, Clock, ArrowLeft, BookOpen, 
  Sun, Cloud, Moon, Sparkles, Volume2, Headphones, 
  Sunrise, Sunset, Share2, Bookmark, ThumbsUp,
  Play, Pause, Download, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import { toast } from 'react-hot-toast';

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
    publishedAt?: string;
    readingTime?: number;
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

export default function DailyDosePage() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [dose, setDose] = useState<DailyDose | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // جلب الجرعة الحالية
  const fetchDailyDose = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/daily-doses');
      if (!response.ok) throw new Error('Failed to fetch dose');
      
      const data = await response.json();
      setDose(data);
    } catch (error) {
      console.error('Error fetching daily dose:', error);
      toast.error('حدث خطأ في تحميل الجرعة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyDose();
  }, []);

  // الحصول على الأيقونة حسب الفترة
  const getPeriodIcon = () => {
    if (!dose) return <Sun className="w-12 h-12" />;
    
    switch (dose.period) {
      case 'morning': return <Sunrise className="w-12 h-12" />;
      case 'afternoon': return <Sun className="w-12 h-12" />;
      case 'evening': return <Sunset className="w-12 h-12" />;
      case 'night': return <Moon className="w-12 h-12" />;
      default: return <Sun className="w-12 h-12" />;
    }
  };

  // الحصول على الألوان حسب الفترة
  const getPeriodColors = () => {
    if (!dose) return { bg: 'from-blue-600 to-purple-600', accent: 'blue' };
    
    switch (dose.period) {
      case 'morning': 
        return { 
          bg: darkMode ? 'from-blue-900 to-indigo-900' : 'from-blue-500 to-cyan-500',
          accent: 'blue',
          card: darkMode ? 'bg-blue-900/20' : 'bg-blue-50',
          icon: 'text-blue-500',
          border: darkMode ? 'border-blue-700' : 'border-blue-200'
        };
      case 'afternoon': 
        return { 
          bg: darkMode ? 'from-orange-900 to-amber-900' : 'from-orange-500 to-yellow-500',
          accent: 'orange',
          card: darkMode ? 'bg-orange-900/20' : 'bg-orange-50',
          icon: 'text-orange-500',
          border: darkMode ? 'border-orange-700' : 'border-orange-200'
        };
      case 'evening': 
        return { 
          bg: darkMode ? 'from-purple-900 to-pink-900' : 'from-purple-600 to-pink-600',
          accent: 'purple',
          card: darkMode ? 'bg-purple-900/20' : 'bg-purple-50',
          icon: 'text-purple-500',
          border: darkMode ? 'border-purple-700' : 'border-purple-200'
        };
      case 'night': 
        return { 
          bg: darkMode ? 'from-gray-900 to-blue-900' : 'from-indigo-700 to-blue-800',
          accent: 'indigo',
          card: darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50',
          icon: 'text-indigo-500',
          border: darkMode ? 'border-indigo-700' : 'border-indigo-200'
        };
      default: 
        return { 
          bg: 'from-blue-600 to-purple-600',
          accent: 'blue',
          card: 'bg-blue-50',
          icon: 'text-blue-500',
          border: 'border-blue-200'
        };
    }
  };

  // الحصول على أيقونة نوع المحتوى
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'weather': return <Cloud className="w-6 h-6" />;
      case 'quote': return <Sparkles className="w-6 h-6" />;
      case 'tip': return <Sparkles className="w-6 h-6" />;
      case 'audio': return <Headphones className="w-6 h-6" />;
      case 'analysis': return <BookOpen className="w-6 h-6" />;
      default: return <BookOpen className="w-6 h-6" />;
    }
  };

  const handleShare = async (content: DoseContent) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: content.title,
          text: content.summary,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('تم نسخ الرابط');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = (contentId: string) => {
    setSavedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contentId)) {
        newSet.delete(contentId);
        toast.success('تم إزالة من المحفوظات');
      } else {
        newSet.add(contentId);
        toast.success('تم الحفظ');
      }
      return newSet;
    });
  };

  const handleLike = (contentId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contentId)) {
        newSet.delete(contentId);
      } else {
        newSet.add(contentId);
        toast.success('أعجبك هذا');
      }
      return newSet;
    });
  };

  const colors = getPeriodColors();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} py-8`}>
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center">
            {/* أيقونة الفترة */}
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-white/20 backdrop-blur-md rounded-full shadow-xl">
                {getPeriodIcon()}
              </div>
            </div>

            {/* العنوان */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
              {loading ? (
                <span className="animate-pulse">جاري التحميل...</span>
              ) : (
                dose?.title || 'جرعتك اليومية'
              )}
            </h1>

            {/* العنوان الفرعي */}
            <p className="text-xl sm:text-2xl mb-8 text-gray-700 dark:text-white/95">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                dose?.subtitle || 'محتوى مختار بعناية'
              )}
            </p>

            {/* معلومات إضافية */}
            {dose && !loading && (
              <div className="flex items-center justify-center gap-8 text-gray-600 dark:text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {new Date(dose.date).toLocaleDateString('ar-SA', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>{dose.views} مشاهدة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{dose.contents.length} عناصر</span>
                </div>
              </div>
            )}
          </div>

          {/* محتوى الجرعة */}
          <div className="mt-10">
            {loading ? (
              // Loading State
              <div className="grid gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`animate-pulse rounded-2xl p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : dose?.contents ? (
              // Content Grid
              <div className="grid gap-8">
                {dose.contents.map((content, index) => (
                  <div 
                    key={content.id}
                    className={`rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                  >
                    {content.article ? (
                      // Article Card
                      <article className="flex flex-col lg:flex-row">
                        {/* Image */}
                        {content.imageUrl && (
                          <div className="lg:w-2/5 h-64 lg:h-auto relative overflow-hidden">
                            <img 
                              src={content.imageUrl}
                              alt={content.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r"></div>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 p-8">
                          {/* Category & Type */}
                          <div className="flex items-center gap-4 mb-4">
                            {content.article.category && (
                              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${colors.card} ${colors.border} border`}>
                                {getContentIcon(content.contentType)}
                                {content.article.category.name_ar || content.article.category.name}
                              </span>
                            )}
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              #{index + 1} في الجرعة
                            </span>
                          </div>

                          {/* Title */}
                          <h2 className={`text-2xl lg:text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {content.title}
                          </h2>

                          {/* Summary */}
                          <p className={`text-lg leading-relaxed mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {content.summary}
                          </p>

                          {/* Meta Info */}
                          <div className="flex items-center gap-6 mb-6 text-sm">
                            {content.article.author && (
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                بقلم: {content.article.author.name}
                              </span>
                            )}
                            {content.article.publishedAt && (
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                {new Date(content.article.publishedAt).toLocaleDateString('ar-SA')}
                              </span>
                            )}
                            {content.article.readingTime && (
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                {content.article.readingTime} دقائق قراءة
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-4">
                            <Link
                              href={`/article/${content.article.slug || content.article.id}`}
                              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
                                darkMode 
                                  ? 'bg-white text-gray-900 hover:bg-gray-100' 
                                  : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                            >
                              <BookOpen className="w-5 h-5" />
                              اقرأ المقال كاملاً
                            </Link>

                            <button
                              onClick={() => handleLike(content.id)}
                              className={`p-3 rounded-full transition-colors ${
                                likedItems.has(content.id)
                                  ? `${colors.card} ${colors.icon}`
                                  : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                            >
                              <ThumbsUp className={`w-5 h-5 ${likedItems.has(content.id) ? 'fill-current' : ''}`} />
                            </button>

                            <button
                              onClick={() => handleSave(content.id)}
                              className={`p-3 rounded-full transition-colors ${
                                savedItems.has(content.id)
                                  ? `${colors.card} ${colors.icon}`
                                  : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                            >
                              <Bookmark className={`w-5 h-5 ${savedItems.has(content.id) ? 'fill-current' : ''}`} />
                            </button>

                            <button
                              onClick={() => handleShare(content)}
                              className={`p-3 rounded-full transition-colors ${
                                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                            >
                              <Share2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ) : (
                      // Special Content Card
                      <div className={`p-12 text-center ${colors.card}`}>
                        {/* Icon */}
                        <div className={`flex justify-center mb-6 ${colors.icon}`}>
                          {getContentIcon(content.contentType)}
                        </div>

                        {/* Title */}
                        <h3 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {content.title}
                        </h3>

                        {/* Content */}
                        <p className={`text-xl leading-relaxed max-w-3xl mx-auto mb-8 ${
                          darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {content.summary}
                        </p>

                        {/* Audio Player */}
                        {content.audioUrl && (
                          <div className="flex justify-center">
                            <button
                              onClick={() => setPlayingAudio(playingAudio === content.id ? null : content.id)}
                              className={`inline-flex items-center gap-3 px-8 py-4 rounded-full font-medium transition-colors ${
                                darkMode 
                                  ? 'bg-white text-gray-900 hover:bg-gray-100' 
                                  : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                            >
                              {playingAudio === content.id ? (
                                <>
                                  <Pause className="w-6 h-6" />
                                  إيقاف الاستماع
                                </>
                              ) : (
                                <>
                                  <Play className="w-6 h-6" />
                                  استمع الآن
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                          <button
                            onClick={() => handleLike(content.id)}
                            className={`p-3 rounded-full transition-colors ${
                              likedItems.has(content.id)
                                ? `bg-white/20 ${colors.icon}`
                                : 'hover:bg-white/10'
                            }`}
                          >
                            <ThumbsUp className={`w-5 h-5 ${likedItems.has(content.id) ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleShare(content)}
                            className="p-3 rounded-full transition-colors hover:bg-white/10"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Empty State
              <div className={`text-center py-20 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <BookOpen className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  لا توجد محتويات
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  سيتم إضافة محتوى الجرعة قريباً
                </p>
              </div>
            )}

            {/* Navigation Between Periods */}
            {dose && !loading && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  dose.period === 'morning' 
                    ? `${colors.card} ${colors.icon} ${colors.border} border-2`
                    : darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                  <Sunrise className="w-5 h-5 inline ml-2" />
                  الصباح
                </button>
                <button className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  dose.period === 'afternoon' 
                    ? `${colors.card} ${colors.icon} ${colors.border} border-2`
                    : darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                  <Sun className="w-5 h-5 inline ml-2" />
                  الظهيرة
                </button>
                <button className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  dose.period === 'evening' 
                    ? `${colors.card} ${colors.icon} ${colors.border} border-2`
                    : darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                  <Sunset className="w-5 h-5 inline ml-2" />
                  المساء
                </button>
                <button className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  dose.period === 'night' 
                    ? `${colors.card} ${colors.icon} ${colors.border} border-2`
                    : darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                  <Moon className="w-5 h-5 inline ml-2" />
                  الليل
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 