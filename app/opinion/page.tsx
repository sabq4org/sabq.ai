'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, Sparkles, 
  TrendingUp, Calendar, User, Eye, Heart, MessageCircle, 
  Share2, Volume2, Zap, Podcast, Flame, Star, Award,
  Mic, BookOpen, Timer, BarChart3, Crown, Headphones,
  PlayCircle, PauseCircle, ChevronDown, Brain, Quote,
  ThumbsUp, ThumbsDown, X, Plus, HeartHandshake,
  CheckCircle, Radio, Activity
} from 'lucide-react';
import Link from 'next/link';
import { getArticleLink } from '@/lib/utils';
import { formatDateOnly } from '@/lib/date-utils';
import { generatePlaceholderImage, getValidImageUrl } from '@/lib/cloudinary';
import AuthorCarousel from '@/components/AuthorCarousel';
import EnhancedArticleCard from '@/components/EnhancedArticleCard';
import InstantSearch from '@/components/InstantSearch';
import PowerBar from '@/components/PowerBar';
import AskAuthorWidget from '@/components/AskAuthorWidget';

interface OpinionArticle {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  category_id?: number;
  category_name?: string;
  author_name?: string;
  author_id?: string;
  author_avatar?: string;
  author_bio?: string;
  author_specialization?: string;
  author_followers?: number;
  views_count: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  reading_time?: number;
  created_at: string;
  published_at?: string;
  is_trending?: boolean;
  is_featured?: boolean;
  type?: string;
  ai_summary?: string;
  ai_keywords?: string[];
  engagement_score?: number;
  topic_tags?: string[];
  audio_url?: string;
  podcast_duration?: number;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  agree_count?: number;
  disagree_count?: number;
}

interface OpinionAuthor {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  specialization?: string;
  followers_count?: number;
  articles_count?: number;
  total_views?: number;
  rating?: number;
  badge?: 'gold' | 'silver' | 'bronze' | null;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  is_featured?: boolean;
  latest_article?: OpinionArticle;
}

interface FilterOptions {
  author: string;
  mood: 'all' | 'optimistic' | 'critical' | 'analytical' | 'controversial';
  topic: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  format: 'all' | 'article' | 'podcast' | 'video';
  sortBy: 'latest' | 'popular' | 'trending' | 'controversial';
}

export default function OpinionPage() {
  // الحالات الأساسية
  const [articles, setArticles] = useState<OpinionArticle[]>([]);
  const [authors, setAuthors] = useState<OpinionAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // إعدادات العرض والفلترة
  const [filters, setFilters] = useState<FilterOptions>({
    author: 'all',
    mood: 'all',
    topic: 'all',
    dateRange: 'all',
    format: 'all',
    sortBy: 'latest'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // ميزات AI والتفاعل
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<OpinionArticle[]>([]);
  const [topTrends, setTopTrends] = useState<string[]>([]);
  const [userMood, setUserMood] = useState<string>('neutral');
  
  // المراجع
  const authorsCarouselRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // جلب البيانات الأولية
  useEffect(() => {
    fetchInitialData();
  }, []);

  // جلب المقالات عند تغيير الفلاتر
  useEffect(() => {
    fetchArticles();
  }, [filters, searchQuery]);

  // تحديث أسهم التنقل للكاروسيل
  useEffect(() => {
    const checkScrollButtons = () => {
      if (authorsCarouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = authorsCarouselRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    const carousel = authorsCarouselRef.current;
    carousel?.addEventListener('scroll', checkScrollButtons);
    checkScrollButtons();

    return () => {
      carousel?.removeEventListener('scroll', checkScrollButtons);
    };
  }, [authors]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // جلب البيانات بالتوازي
      const [articlesRes, authorsRes, trendsRes, recommendationsRes] = await Promise.all([
        fetch('/api/articles?type=OPINION&status=published&limit=20'),
        fetch('/api/opinion-authors?isActive=true&featured=true'),
        fetch('/api/analytics/trending-topics?type=opinion').catch(() => null),
        fetch('/api/ai/recommendations?type=opinion').catch(() => null)
      ]);

      // معالجة المقالات
      const articlesData = await articlesRes.json();
      const articlesList = Array.isArray(articlesData) ? articlesData : articlesData.articles || [];
      setArticles(articlesList);

      // معالجة الكتاب
      if (authorsRes.ok) {
        const authorsData = await authorsRes.json();
        setAuthors(Array.isArray(authorsData) ? authorsData : authorsData.authors || []);
      }

      // معالجة المواضيع الرائجة
      if (trendsRes?.ok) {
        const trendsData = await trendsRes.json();
        setTopTrends(trendsData.topics || []);
      }

      // معالجة التوصيات
      if (recommendationsRes?.ok) {
        const recommendationsData = await recommendationsRes.json();
        setAiRecommendations(recommendationsData.articles || []);
      }

    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);

      // بناء URL مع الفلاتر
      let url = `/api/articles?type=OPINION&status=published&limit=20`;
      
      if (filters.author !== 'all') url += `&author_id=${filters.author}`;
      if (filters.topic !== 'all') url += `&tag=${filters.topic}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      // ترتيب النتائج
      switch (filters.sortBy) {
        case 'popular':
          url += '&sortBy=views_count&order=desc';
          break;
        case 'trending':
          url += '&sortBy=engagement_score&order=desc';
          break;
        case 'controversial':
          url += '&sortBy=comments_count&order=desc';
          break;
        default:
          url += '&sortBy=published_at&order=desc';
      }

      // فلترة التاريخ
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        url += `&from_date=${startDate.toISOString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      const newArticles = Array.isArray(data) ? data : data.articles || [];
      setArticles(newArticles);

    } catch (error) {
      console.error('خطأ في جلب المقالات:', error);
    } finally {
      setLoading(false);
    }
  };

  // التنقل في كاروسيل الكتاب
  const scrollAuthors = (direction: 'left' | 'right') => {
    if (authorsCarouselRef.current) {
      const scrollAmount = 300;
      authorsCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // تشغيل الملخص الصوتي
  const handleAudioPlay = async (articleId: string, audioUrl?: string, text?: string) => {
    if (currentPlayingId === articleId) {
      setIsPlaying(false);
      setCurrentPlayingId(null);
      if (!audioUrl) speechSynthesis.cancel();
      return;
    }

    setIsPlaying(true);
    setCurrentPlayingId(articleId);
    
    if (audioUrl) {
      // تشغيل ملف صوتي إذا كان متوفراً
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingId(null);
      };
    } else if (text) {
      // استخدام TTS إذا لم يكن هناك ملف صوتي
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.9;
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
    }
  };

  // تحديث الفلتر
  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // حساب نسبة التوافق مع اهتمامات المستخدم
  const getRelevanceScore = (article: OpinionArticle): number => {
    // نسبة وهمية للعرض - يمكن استبدالها بخوارزمية حقيقية
    return Math.floor(Math.random() * 30) + 70;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* الهيدر الرئيسي */}
      <header className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Crown className="w-10 h-10 text-yellow-400" />
              <h1 className="text-5xl font-bold">منصة قادة الرأي</h1>
              <Crown className="w-10 h-10 text-yellow-400" />
            </div>
            <p className="text-xl text-blue-100 mb-8">
              من هنا يبدأ النقاش... آراء الكتّاب وصنّاع الفكر في منصة واحدة تفاعلية مدعومة بالذكاء الاصطناعي
            </p>
            
            {/* أزرار الإجراءات الرئيسية */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button className="px-6 py-3 bg-white text-purple-900 font-bold rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                قدّم رأيك
              </button>
              <button className="px-6 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-all transform hover:scale-105 flex items-center gap-2">
                <Search className="w-5 h-5" />
                اكتشف كاتبك المفضل
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-105 flex items-center gap-2">
                <Podcast className="w-5 h-5" />
                بودكاست الرأي
              </button>
            </div>
          </div>
        </div>

        {/* شريط المواضيع الساخنة */}
        <div className="bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
              <span className="flex items-center gap-2 text-yellow-400 font-bold whitespace-nowrap">
                <Flame className="w-5 h-5 animate-pulse" />
                الأكثر نقاشاً:
              </span>
              {topTrends.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => updateFilter('topic', topic)}
                  className="px-4 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm whitespace-nowrap transition-colors"
                >
                  #{topic}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* شريط الطاقة */}
        <div className="bg-black/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <PowerBar 
              articlesCount={articles.length}
              authorsCount={authors.length}
              todayArticles={articles.filter(a => {
                const today = new Date();
                const articleDate = new Date(a.published_at || a.created_at);
                return articleDate.toDateString() === today.toDateString();
              }).length}
              weekArticles={articles.filter(a => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                const articleDate = new Date(a.published_at || a.created_at);
                return articleDate >= weekAgo;
              }).length}
              userLevel="gold"
              userScore={750}
              className="bg-opacity-90"
            />
          </div>
        </div>
      </header>

      {/* شريط الكتّاب المميزين */}
      <AuthorCarousel 
        authors={authors.map(author => ({
          ...author,
          is_online: Math.random() > 0.5,
          new_articles_count: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
          weekly_trend: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same',
          weekly_rank_change: Math.floor(Math.random() * 5) + 1,
          is_guest: Math.random() > 0.8,
          is_verified: Math.random() > 0.6,
          has_new_podcast: Math.random() > 0.7
        }))}
        onAuthorSelect={(authorId) => updateFilter('author', authorId)}
      />

      {/* البحث والفلترة المتقدمة */}
      <div className="container mx-auto px-4 py-6">
        <InstantSearch 
          authors={authors}
          onSearch={(query) => setSearchQuery(query)}
          onFilterChange={(newFilters) => setFilters(newFilters)}
          initialFilters={filters}
          popularTopics={topTrends}
        />
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* قائمة المقالات */}
          <div className="lg:col-span-3">
            {/* توصية اليوم */}
            {aiRecommendations.length > 0 && (
              <div className="mb-8 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    مقال اليوم الأنسب لك
                  </h3>
                  <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">
                    توافق {getRelevanceScore(aiRecommendations[0])}%
                  </span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                  <EnhancedArticleCard 
                    article={aiRecommendations[0]} 
                    isRecommended={true}
                    onPlay={handleAudioPlay}
                    currentPlayingId={currentPlayingId}
                  />
                </div>
              </div>
            )}

            {/* قائمة المقالات */}
            <div className="space-y-6">
              {articles.map((article) => (
                <EnhancedArticleCard
                  key={article.id}
                  article={article}
                  onPlay={handleAudioPlay}
                  currentPlayingId={currentPlayingId}
                />
              ))}
            </div>

            {articles.length === 0 && (
              <div className="text-center py-12">
                <Quote className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500">لا توجد مقالات رأي حالياً</p>
              </div>
            )}
          </div>

          {/* الشريط الجانبي */}
          <div className="space-y-6">
            {/* أفضل 5 كتّاب الأسبوع */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                أفضل 5 كتّاب الأسبوع
              </h3>
              <div className="space-y-3">
                {authors.slice(0, 5).map((author, index) => {
                  const trend = ['up', 'down', 'same'][Math.floor(Math.random() * 3)];
                  const trendChange = Math.floor(Math.random() * 3) + 1;
                  const isOnline = Math.random() > 0.5;
                  const engagementScore = Math.floor(Math.random() * 50) + 50;
                  
                  return (
                    <Link
                      key={author.id}
                      href={`/author/${author.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-orange-500' :
                          'text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        
                        {/* مؤشر الاتجاه */}
                        <div className="flex flex-col items-center">
                          {trend === 'up' && (
                            <div className="flex items-center text-green-500 text-xs">
                              <TrendingUp className="w-3 h-3" />
                              <span className="mr-1">+{trendChange}</span>
                            </div>
                          )}
                          {trend === 'down' && (
                            <div className="flex items-center text-red-500 text-xs">
                              <Activity className="w-3 h-3 rotate-180" />
                              <span className="mr-1">-{trendChange}</span>
                            </div>
                          )}
                          {trend === 'same' && (
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <img
                          src={author.avatar || generatePlaceholderImage(author.name)}
                          alt={author.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:scale-110 transition-transform"
                        />
                        
                        {/* مؤشر الحالة */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                          isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {author.is_featured && (
                            <CheckCircle className="w-2.5 h-2.5 text-white m-0.5" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {author.name}
                          </p>
                          {author.is_featured && (
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{author.total_views?.toLocaleString() || 0} مشاهدة</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span>{engagementScore}% تفاعل</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* أيقونة الراديو للبودكاست */}
                      {Math.random() > 0.6 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-xs">
                          <Radio className="w-3 h-3" />
                          <span>جديد</span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ركن بودكاست الرأي */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Podcast className="w-6 h-6" />
                بودكاست الرأي
              </h3>
              <p className="text-sm mb-4 opacity-90">
                استمع لآخر مقالات الرأي بتقنية الصوت الذكي
              </p>
              <button className="w-full py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <Headphones className="w-5 h-5" />
                استمع الآن
              </button>
            </div>

            {/* إحصائيات القسم */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                إحصائيات القسم
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">عدد المقالات</span>
                  <span className="font-bold text-gray-900 dark:text-white">{articles.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">عدد الكتّاب</span>
                  <span className="font-bold text-gray-900 dark:text-white">{authors.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">متوسط القراءة</span>
                  <span className="font-bold text-gray-900 dark:text-white">5 دقائق</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">نسبة التفاعل</span>
                  <span className="font-bold text-green-600">87%</span>
                </div>
              </div>
            </div>

            {/* ميزة "اسأل الكاتب" */}
            <AskAuthorWidget 
              authors={authors.map(author => ({
                ...author,
                is_online: Math.random() > 0.5,
                response_time: ['30 دقيقة', '1-2 ساعة', '3-5 ساعات'][Math.floor(Math.random() * 3)]
              }))}
              popularQuestions={[
                {
                  id: '1',
                  text: 'ما رأيك في التطورات التقنية الأخيرة؟',
                  author_name: 'أحمد محمد',
                  created_at: 'منذ 3 ساعات',
                  likes: 12,
                  answer: 'أعتقد أن التطورات التقنية تسير بوتيرة سريعة جداً، وهذا يتطلب منا مواكبة مستمرة.',
                  answer_date: 'منذ ساعة'
                },
                {
                  id: '2', 
                  text: 'كيف نحقق التوازن بين التقليد والحداثة؟',
                  author_name: 'فاطمة علي',
                  created_at: 'أمس',
                  likes: 8
                }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// مكون بطاقة مقال الرأي
function OpinionArticleCard({ 
  article, 
  isRecommended = false,
  onPlay,
  currentPlayingId
}: { 
  article: OpinionArticle;
  isRecommended?: boolean;
  onPlay: (id: string, audioUrl?: string, text?: string) => void;
  currentPlayingId: string | null;
}) {
  const isPlaying = currentPlayingId === article.id;
  const relevanceScore = Math.floor(Math.random() * 30) + 70;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
      isRecommended ? 'ring-2 ring-purple-500' : ''
    }`}>
      <div className="flex flex-col md:flex-row">
        {/* صورة المقال */}
        <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
          <img
            src={getValidImageUrl(article.featured_image) || generatePlaceholderImage(article.title)}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          {article.audio_url || article.podcast_duration ? (
            <div className="absolute top-4 left-4 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Podcast className="w-3 h-3" />
              بودكاست
            </div>
          ) : null}
        </div>

        {/* محتوى البطاقة */}
        <div className="flex-1 p-6">
          {/* معلومات الكاتب */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={article.author_avatar || generatePlaceholderImage(article.author_name || '')}
                alt={article.author_name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
              <div>
                <Link href={`/author/${article.author_id}`} className="font-bold text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                  {article.author_name}
                </Link>
                <p className="text-sm text-gray-500">
                  {article.author_specialization || 'كاتب رأي'} • {formatDateOnly(article.published_at || article.created_at)}
                </p>
              </div>
            </div>
            {!isRecommended && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {relevanceScore}% توافق
                </span>
              </div>
            )}
          </div>

          {/* عنوان المقال */}
          <Link href={getArticleLink(article)}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 transition-colors line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {/* الملخص الذكي */}
          {article.ai_summary && (
            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
              {article.ai_summary}
            </p>
          )}

          {/* الوسوم والمواضيع */}
          {article.topic_tags && article.topic_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.topic_tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* التفاعلات والأزرار */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* زر الاستماع */}
              <button
                onClick={() => onPlay(article.id, article.audio_url, article.ai_summary || article.excerpt)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isPlaying 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30'
                }`}
              >
                {isPlaying ? (
                  <PauseCircle className="w-5 h-5" />
                ) : (
                  <PlayCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {article.podcast_duration ? `${article.podcast_duration} د` : 'استمع'}
                </span>
              </button>

              {/* أزرار التفاعل */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">{article.agree_count || 0}</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-sm">{article.disagree_count || 0}</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{article.comments_count || 0}</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* الإحصائيات */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.views_count > 1000 ? `${(article.views_count / 1000).toFixed(1)}ك` : article.views_count}
              </span>
              <span className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {article.reading_time || 5} د
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// مكون جائزة الكاتب
function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15C15.866 15 19 11.866 19 8V4H5V8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 4H20C21.1046 4 22 4.89543 22 6V7C22 8.10457 21.1046 9 20 9H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 4H4C2.89543 4 2 4.89543 2 6V7C2 8.10457 2.89543 9 4 9H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 15V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 19H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
} 