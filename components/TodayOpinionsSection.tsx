'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Heart, 
  Share2, 
  Volume2, 
  Eye, 
  Clock, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
  Flame,
  User,
  MessageSquare,
  ArrowRight,
  Headphones
} from 'lucide-react';

// أيقونات أندية الكتاب
const writerClubColors = {
  'platinum': 'from-gray-400 to-gray-600',
  'gold': 'from-yellow-400 to-yellow-600', 
  'silver': 'from-gray-300 to-gray-500',
  'bronze': 'from-orange-400 to-orange-600',
  'default': 'from-blue-400 to-blue-600'
};

const writerClubBorders = {
  'platinum': 'border-gray-400',
  'gold': 'border-yellow-400',
  'silver': 'border-gray-300', 
  'bronze': 'border-orange-400',
  'default': 'border-blue-400'
};

interface OpinionArticle {
  id: string;
  title: string;
  author_name: string;
  author_avatar?: string;
  author_club?: 'platinum' | 'gold' | 'silver' | 'bronze' | 'default';
  author_specialization?: string;
  excerpt: string;
  ai_summary?: string;
  featured_image?: string;
  published_at: string;
  reading_time?: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  is_featured?: boolean;
  is_trending?: boolean;
  author_slug?: string;
}

interface TodayOpinionsSectionProps {
  darkMode?: boolean;
}

export default function TodayOpinionsSection({ darkMode = false }: TodayOpinionsSectionProps) {
  const [featuredWriters, setFeaturedWriters] = useState<OpinionArticle[]>([]);
  const [opinionArticles, setOpinionArticles] = useState<OpinionArticle[]>([]);
  const [currentWriterIndex, setCurrentWriterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  // جلب البيانات
  useEffect(() => {
    const fetchOpinionData = async () => {
      try {
        setLoading(true);
        
        // جلب مقالات الرأي
        const articlesResponse = await fetch('/api/articles?type=OPINION&status=published&sortBy=latest');
        const articlesData = await articlesResponse.json();
        
        // جلب كتاب الرأي المميزين
        const authorsResponse = await fetch('/api/opinion-authors?isActive=true');
        const authorsData = await authorsResponse.json();

        const mockArticles: OpinionArticle[] = [
          {
            id: '1',
            title: 'مستقبل الذكاء الاصطناعي في التعليم السعودي',
            author_name: 'د. محمد الأحمد',
            author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
            author_club: 'gold',
            author_specialization: 'تقنية التعليم',
            excerpt: 'تشهد المملكة تطوراً هائلاً في دمج التقنيات الحديثة...',
            ai_summary: 'يناقش الكاتب أهمية دمج الذكاء الاصطناعي في النظام التعليمي السعودي وتأثيره على مستقبل الطلاب والمعلمين في ظل رؤية 2030.',
            featured_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
            published_at: new Date().toISOString(),
            reading_time: 8,
            views_count: 12500,
            likes_count: 850,
            comments_count: 145,
            is_featured: true,
            is_trending: true,
            author_slug: 'dr-mohammed-ahmad'
          },
          {
            id: '2', 
            title: 'رؤية 2030 وتمكين المرأة في ريادة الأعمال',
            author_name: 'أ. فاطمة النصر',
            author_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?auto=format&fit=crop&w=150&q=80',
            author_club: 'platinum',
            author_specialization: 'ريادة الأعمال',
            excerpt: 'شهدت المملكة نقلة نوعية في تمكين المرأة...',
            ai_summary: 'تسلط الكاتبة الضوء على الإنجازات المحققة في تمكين المرأة السعودية وريادة الأعمال، والفرص المستقبلية في ظل التحولات الاقتصادية.',
            featured_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
            published_at: new Date(Date.now() - 3600000).toISOString(),
            reading_time: 6,
            views_count: 8900,
            likes_count: 650,
            comments_count: 89,
            is_featured: true
          },
          {
            id: '3',
            title: 'الاستدامة البيئية في المدن الذكية',
            author_name: 'م. خالد العتيبي',
            author_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
            author_club: 'silver',
            author_specialization: 'التخطيط العمراني',
            excerpt: 'تسعى المملكة لبناء مدن ذكية مستدامة...',
            ai_summary: 'يستعرض الكاتب مشاريع المدن الذكية في المملكة والتقنيات المستخدمة لتحقيق الاستدامة البيئية والحفاظ على الموارد الطبيعية.',
            featured_image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?auto=format&fit=crop&w=800&q=80',
            published_at: new Date(Date.now() - 7200000).toISOString(),
            reading_time: 10,
            views_count: 6750,
            likes_count: 420,
            comments_count: 67,
            is_trending: true
          },
          {
            id: '4',
            title: 'الثقافة السعودية في عصر العولمة',
            author_name: 'د. نورا السديري',
            author_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
            author_club: 'gold',
            author_specialization: 'الدراسات الثقافية',
            excerpt: 'كيف تحافظ الثقافة السعودية على هويتها...',
            ai_summary: 'تناقش الكاتبة التوازن بين الحفاظ على الهوية الثقافية السعودية وتبني التطورات العالمية، وأهمية الثقافة في بناء المجتمعات الحديثة.',
            featured_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
            published_at: new Date(Date.now() - 10800000).toISOString(),
            reading_time: 7,
            views_count: 5200,
            likes_count: 380,
            comments_count: 52
          }
        ];

        setOpinionArticles(mockArticles);
        setFeaturedWriters(mockArticles.filter(article => article.is_featured));
      } catch (error) {
        console.error('خطأ في جلب بيانات الرأي:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpinionData();
  }, []);

  // تدوير الكتاب المميزين
  useEffect(() => {
    if (featuredWriters.length > 0) {
      const interval = setInterval(() => {
        setCurrentWriterIndex((prev) => (prev + 1) % featuredWriters.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredWriters.length]);

  const handleTTSPlay = async (articleId: string, summary: string) => {
    if (currentPlayingId === articleId) {
      setIsPlaying(false);
      setCurrentPlayingId(null);
      // إيقاف التشغيل
      speechSynthesis.cancel();
      return;
    }

    setIsPlaying(true);
    setCurrentPlayingId(articleId);
    
    try {
      // استخدام Web Speech API للتجربة
      const utterance = new SpeechSynthesisUtterance(summary);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentPlayingId(null);
      };
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('خطأ في تشغيل الصوت:', error);
      setIsPlaying(false);
      setCurrentPlayingId(null);
    }
  };

  const handleLike = async (articleId: string) => {
    // منطق الإعجاب
    try {
      await fetch(`/api/articles/${articleId}/like`, { method: 'POST' });
      // تحديث حالة الإعجاب
    } catch (error) {
      console.error('خطأ في الإعجاب:', error);
    }
  };

  const handleShare = (article: OpinionArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.ai_summary || article.excerpt,
        url: `/opinion/${article.id}`
      });
    } else {
      // نسخ الرابط
      navigator.clipboard.writeText(`${window.location.origin}/opinion/${article.id}`);
      // إظهار رسالة نجاح
    }
  };

  if (loading) {
    return (
      <section className="mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className={`h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg mb-6 w-64`}></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`h-96 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl`}></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header متحرك */}
        <div className="mb-12">
          {/* العنوان الرئيسي */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 mb-6 dark:bg-gradient-to-r dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-800/30">
              <Flame className="w-5 h-5 text-orange-600" />
              <span className={`font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                رأي اليوم
              </span>
              <Zap className="w-5 h-5 text-red-600" />
            </div>
            <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              🔥 قادة الرأي اليوم
            </h2>
            <p className={`text-lg max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              آراء مميزة من نخبة الكتاب والمفكرين السعوديين حول أبرز القضايا المعاصرة
            </p>
          </div>

          {/* شريط الكتاب المتحرك */}
          {featuredWriters.length > 0 && (
            <div className={`relative overflow-hidden rounded-2xl p-6 mb-8 ${
              darkMode 
                ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600' 
                : 'bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-100'
            }`}>
              <div className="flex items-center justify-between">
                {/* معلومات الكاتب الحالي */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={featuredWriters[currentWriterIndex]?.author_avatar} 
                      alt={featuredWriters[currentWriterIndex]?.author_name}
                      className={`w-16 h-16 rounded-full object-cover border-4 ${
                        writerClubBorders[featuredWriters[currentWriterIndex]?.author_club || 'default']
                      }`}
                    />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r ${
                      writerClubColors[featuredWriters[currentWriterIndex]?.author_club || 'default']
                    } flex items-center justify-center border-2 border-white dark:border-gray-800`}>
                      <Star className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {featuredWriters[currentWriterIndex]?.author_name}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {featuredWriters[currentWriterIndex]?.author_specialization}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        📖 {featuredWriters[currentWriterIndex]?.reading_time} دقائق قراءة
                      </span>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        👁️ {featuredWriters[currentWriterIndex]?.views_count.toLocaleString()} مشاهدة
                      </span>
                    </div>
                  </div>
                </div>

                {/* أيقونات التفاعل */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleLike(featuredWriters[currentWriterIndex]?.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105 ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-red-900/20 text-gray-300 hover:text-red-400' 
                        : 'bg-white hover:bg-red-50 text-gray-600 hover:text-red-600'
                    } shadow-lg`}
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {featuredWriters[currentWriterIndex]?.likes_count}
                    </span>
                  </button>
                  
                  <button 
                    onClick={() => handleShare(featuredWriters[currentWriterIndex])}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105 ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-blue-900/20 text-gray-300 hover:text-blue-400' 
                        : 'bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                    } shadow-lg`}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">مشاركة</span>
                  </button>
                  
                  <button 
                    onClick={() => handleTTSPlay(
                      featuredWriters[currentWriterIndex]?.id, 
                      featuredWriters[currentWriterIndex]?.ai_summary || featuredWriters[currentWriterIndex]?.excerpt
                    )}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105 ${
                      currentPlayingId === featuredWriters[currentWriterIndex]?.id
                        ? 'bg-green-500 text-white'
                        : darkMode 
                          ? 'bg-gray-700 hover:bg-green-900/20 text-gray-300 hover:text-green-400' 
                          : 'bg-white hover:bg-green-50 text-gray-600 hover:text-green-600'
                    } shadow-lg`}
                  >
                    {currentPlayingId === featuredWriters[currentWriterIndex]?.id ? (
                      <Volume2 className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Headphones className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">استمع</span>
                  </button>
                </div>
              </div>

              {/* شريط التقدم */}
              <div className="mt-4 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                <div 
                  className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: `${((currentWriterIndex + 1) / featuredWriters.length) * 100}%` }}
                ></div>
              </div>

              {/* نقاط التنقل */}
              <div className="flex justify-center mt-4 gap-2">
                {featuredWriters.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentWriterIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentWriterIndex 
                        ? 'bg-blue-500 w-8' 
                        : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* بطاقات المقالات الأنيقة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {opinionArticles.map((article) => (
            <div 
              key={article.id}
              className={`group relative rounded-3xl overflow-hidden shadow-xl dark:shadow-gray-900/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
              }`}
            >
              {/* شارات المقال */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {article.is_trending && (
                  <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                    🔥 ترند
                  </span>
                )}
                {article.is_featured && (
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                    ⭐ مميز
                  </span>
                )}
              </div>

              {/* صورة المقال */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={article.featured_image} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* معلومات الكاتب */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/author/${article.author_slug || 'dr-mohammed-ahmad'}`} className="flex items-center gap-3 group/author">
                    <div className="relative">
                      <img 
                        src={article.author_avatar} 
                        alt={article.author_name}
                        className={`w-12 h-12 rounded-full object-cover border-3 ${
                          writerClubBorders[article.author_club || 'default']
                        } group-hover/author:scale-110 transition-transform`}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r ${
                        writerClubColors[article.author_club || 'default']
                      } flex items-center justify-center border-2 border-white dark:border-gray-800`}>
                        <Star className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className={`font-bold group-hover/author:text-blue-600 transition-colors ${
                        darkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {article.author_name}
                      </h4>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {article.author_specialization}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* عنوان المقال */}
                <Link href={`/opinion/${article.id}`}>
                  <h3 className={`font-bold text-lg mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {article.title}
                  </h3>
                </Link>

                {/* الملخص الذكي */}
                <div className={`mb-4 p-3 rounded-xl ${
                  darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-blue-50 border border-blue-100'
                }`}>
                  <div className="flex items-start gap-2 mb-2">
                    <Zap className={`w-4 h-4 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-xs font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      ملخص ذكي بالـ AI
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed line-clamp-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {article.ai_summary || article.excerpt}
                  </p>
                </div>

                {/* أزرار التفاعل */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleTTSPlay(article.id, article.ai_summary || article.excerpt)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
                        currentPlayingId === article.id
                          ? 'bg-green-500 text-white'
                          : darkMode 
                            ? 'bg-gray-700 hover:bg-green-900/20 text-gray-300 hover:text-green-400' 
                            : 'bg-gray-100 hover:bg-green-50 text-gray-600 hover:text-green-600'
                      }`}
                    >
                      {currentPlayingId === article.id ? (
                        <Volume2 className="w-4 h-4 animate-pulse" />
                      ) : (
                        <Headphones className="w-4 h-4" />
                      )}
                      <span>استمع</span>
                    </button>

                    <button 
                      onClick={() => handleLike(article.id)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm transition-all hover:scale-105 ${
                        darkMode 
                          ? 'hover:bg-red-900/20 text-gray-400 hover:text-red-400' 
                          : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      <span>{article.likes_count}</span>
                    </button>

                    <button 
                      onClick={() => handleShare(article)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm transition-all hover:scale-105 ${
                        darkMode 
                          ? 'hover:bg-blue-900/20 text-gray-400 hover:text-blue-400' 
                          : 'hover:bg-blue-50 text-gray-500 hover:text-blue-600'
                      }`}
                    >
                      <Share2 className="w-4 h-4" />
                      <span>مشاركة</span>
                    </button>
                  </div>
                </div>

                {/* التفاصيل السفلية */}
                <div className={`flex items-center justify-between pt-4 border-t ${
                  darkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={`flex items-center gap-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {article.reading_time} د
                    </span>
                    <span className={`flex items-center gap-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <Eye className="w-3 h-3" />
                      {article.views_count.toLocaleString()}
                    </span>
                    <span className={`flex items-center gap-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <MessageSquare className="w-3 h-3" />
                      {article.comments_count}
                    </span>
                  </div>

                  <Link 
                    href={`/opinion/${article.id}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
                      darkMode 
                        ? 'bg-blue-900/20 hover:bg-blue-800/30 text-blue-400' 
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                    }`}
                  >
                    <span>التفاصيل</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* رابط عرض المزيد */}
        <div className="text-center mt-12">
          <Link 
            href="/opinion"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            <span>استكشف جميع آراء اليوم</span>
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
} 