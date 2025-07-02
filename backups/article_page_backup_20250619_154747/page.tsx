'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../components/Header';
import { useInteractions } from '../../../hooks/useInteractions';
import { 
  ArrowRight, Calendar, Clock, User, Eye, Tag, 
  ThumbsUp, Share2, Volume2, VolumeX, Loader2,
  BookOpen, Heart, MessageCircle, Bookmark, Twitter,
  Facebook, Send, Copy, ChevronRight, Award, Hash,
  Zap, Globe, BookOpen as BookOpenIcon, PenTool, RefreshCw,
  Sparkles, TrendingUp, Check, Brain, Bot, FileText,
  Share, MessageSquare, MoreHorizontal, X
} from 'lucide-react';
import './article-styles.css';
import Footer from '@/components/Footer';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  content: string;
  featured_image?: string;
  featured_image_alt?: string;
  image_caption?: string;
  category_id: number;
  category?: {
    id: number;
    name_ar: string;
    name_en?: string;
    color_hex: string;
    icon?: string;
  };
  category_name?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  author_id?: string;
  author_name?: string;
  author_avatar?: string;
  stats?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    saves: number;
  };
  views_count: number;
  likes_count?: number;
  shares_count?: number;
  created_at: string;
  published_at?: string;
  updated_at?: string;
  reading_time?: number;
  is_breaking?: boolean;
  is_featured?: boolean;
  seo_keywords?: string | string[];
  related_articles?: RelatedArticle[];
}

interface RelatedArticle {
  id: string;
  title: string;
  featured_image?: string;
  reading_time?: number;
  published_at?: string;
  created_at?: string;
}

interface RecommendedArticle extends RelatedArticle {
  excerpt?: string;
  category_name?: string;
  recommendation_score?: number;
  recommendation_reason?: string;
  views_count?: number;
  likes_count?: number;
  image_url?: string;
  category_id?: number;
  created_at?: string;
}

interface UserInteraction {
  liked: boolean;
  saved: boolean;
  shared: boolean;
  likesCount: number;
  sharesCount: number;
  savesCount: number;
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function NewsDetailPageImproved({ params }: PageProps) {
  const router = useRouter();
  const { recordInteraction, trackReadingProgress } = useInteractions();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [interaction, setInteraction] = useState<UserInteraction>({
    liked: false,
    saved: false,
    shared: false,
    likesCount: 0,
    sharesCount: 0,
    savesCount: 0
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [articleId, setArticleId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    async function loadArticle() {
      const resolvedParams = await params;
      if (resolvedParams?.id) {
        setArticleId(resolvedParams.id);
        fetchArticle(resolvedParams.id);
      }
    }
    loadArticle();
  }, []);

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const checkLoginStatus = () => {
      const storedUserId = localStorage.getItem('user_id');
      const userData = localStorage.getItem('user');
      
      const isValidLogin = !!(storedUserId && storedUserId !== 'anonymous' && userData);
      
      setIsLoggedIn(isValidLogin);
      setUserId(isValidLogin ? storedUserId : null);
      setUserDataLoaded(true);
    };
    
    checkLoginStatus();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_id' || e.key === 'user') {
        checkLoginStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const timeoutId = setTimeout(checkLoginStatus, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timeoutId);
    };
  }, []);

  // تتبع المشاهدة والقراءة
  useEffect(() => {
    if (article && articleId && userId) {
      // تسجيل المشاهدة
      recordInteraction({
        userId,
        articleId,
        interactionType: 'view',
        source: 'article_page'
      });
    }
  }, [article, articleId, userId]);

  // تتبع تقدم القراءة
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const windowHeight = window.innerHeight;
        const documentHeight = contentRef.current.offsetHeight;
        const scrollTop = window.scrollY;
        const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
        setReadProgress(Math.min(100, Math.max(0, progress)));
        
        // حساب وقت القراءة
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setReadingTime(duration);
        
        // تتبع التقدم للمستخدمين المسجلين
        if (userId && articleId) {
          trackReadingProgress(userId, articleId, progress, duration);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [userId, articleId]);

  // إعادة جلب التوصيات عند تغيير حالة تسجيل الدخول
  useEffect(() => {
    if (userDataLoaded && isLoggedIn && articleId) {
      fetchRecommendations(articleId);
    }
  }, [isLoggedIn, userDataLoaded, articleId]);

  const fetchArticle = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${id}`);
      
      if (!response.ok) {
        router.push('/');
        return;
      }
      
      const data = await response.json();
      
      // تحضير البيانات
      if (data.content_blocks && Array.isArray(data.content_blocks) && data.content_blocks.length > 0) {
        data.content = JSON.stringify(data.content_blocks);
      }
      
      setArticle(data);
      
      // تحديث عدادات التفاعل
      if (data.stats) {
        setInteraction(prev => ({
          ...prev,
          likesCount: data.stats.likes || 0,
          sharesCount: data.stats.shares || 0,
          savesCount: data.stats.saves || 0
        }));
      }
      
      // جلب التفاعلات المحفوظة
      const savedInteractions = localStorage.getItem(`article_${id}_interactions`);
      if (savedInteractions) {
        const saved = JSON.parse(savedInteractions);
        setInteraction(prev => ({ ...prev, ...saved }));
      }
      
    } catch (error) {
      console.log('Network error while fetching article:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (currentArticleId: string) => {
    try {
      setLoadingRecommendations(true);
      
      if (!userId) return;
      
      const response = await fetch(`/api/content/personalized?user_id=${userId}&limit=6`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.articles) {
          // فلترة المقال الحالي
          const filtered = data.data.articles.filter((a: any) => a.id !== currentArticleId);
          setRecommendations(filtered);
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleLike = async () => {
    if (!article || !userId) {
      alert('يرجى تسجيل الدخول لبدء رحلتك الذكية وكسب النقاط 🎯');
      return;
    }
    
    const newLiked = !interaction.liked;
    
    // تحديث الحالة المحلية فوراً
    setInteraction(prev => ({ 
      ...prev, 
      liked: newLiked,
      likesCount: newLiked ? prev.likesCount + 1 : prev.likesCount - 1
    }));
    
    // حفظ التفاعل محلياً
    localStorage.setItem(`article_${article.id}_interactions`, JSON.stringify({
      liked: newLiked,
      saved: interaction.saved,
      shared: interaction.shared
    }));
    
    // تسجيل التفاعل
    await recordInteraction({
      userId,
      articleId: article.id,
      interactionType: 'like',
      source: 'article_page'
    });
  };

  const handleSave = async () => {
    if (!article || !userId) {
      alert('يرجى تسجيل الدخول لبدء رحلتك الذكية وكسب النقاط 🎯');
      return;
    }
    
    const newSaved = !interaction.saved;
    
    setInteraction(prev => ({ 
      ...prev, 
      saved: newSaved,
      savesCount: newSaved ? prev.savesCount + 1 : prev.savesCount - 1
    }));
    
    localStorage.setItem(`article_${article.id}_interactions`, JSON.stringify({
      liked: interaction.liked,
      saved: newSaved,
      shared: interaction.shared
    }));
    
    await recordInteraction({
      userId,
      articleId: article.id,
      interactionType: 'save',
      source: 'article_page'
    });
  };

  const handleShare = async (platform: string) => {
    if (!article) return;
    
    const url = window.location.href;
    const text = article.title;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        alert('تم نسخ الرابط بنجاح ✅');
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(false);
    setInteraction(prev => ({ 
      ...prev, 
      shared: true,
      sharesCount: prev.sharesCount + 1
    }));
    
    // تسجيل التفاعل للمستخدمين المسجلين
    if (userId) {
      await recordInteraction({
        userId,
        articleId: article.id,
        interactionType: 'share',
        source: `share_${platform}`
      });
    }
  };

  const speakSummary = () => {
    if (!article) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(article.summary || article.title);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.9;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'اليوم';
    } else if (diffDays === 1) {
      return 'أمس';
    } else if (diffDays < 7) {
      return `منذ ${diffDays} أيام`;
    } else {
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCategoryColor = (category?: any) => {
    if (category?.color_hex) {
      return category.color_hex;
    }
    
    // ألوان احتياطية حسب اسم التصنيف
    const colors: { [key: string]: string } = {
      'تقنية': '#8B5CF6',
      'اقتصاد': '#10B981',
      'رياضة': '#3B82F6',
      'سياسة': '#EF4444',
      'ثقافة': '#F59E0B',
      'صحة': '#EC4899',
      'محلي': '#6366F1',
      'دولي': '#06B6D4',
      'منوعات': '#F97316'
    };
    
    return colors[category?.name_ar || ''] || '#6B7280';
  };

  const generatePlaceholderImage = (title: string) => {
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B'];
    const colorIndex = title.charCodeAt(0) % colors.length;
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors[colorIndex]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors[(colorIndex + 1) % colors.length]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="400" fill="url(#grad)"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
          ${title.substring(0, 30)}
        </text>
      </svg>
    `)}`;
  };

  const renderArticleContent = (content: string) => {
    try {
      if (!content) {
        return <p className="text-gray-500 dark:text-gray-400 text-center">لا يوجد محتوى لعرضه</p>;
      }
      
      // محاولة تحليل المحتوى كـ JSON blocks
      const blocks = JSON.parse(content);
      
      if (Array.isArray(blocks)) {
        return (
          <div className="space-y-6">
            {blocks.map((block: any, index: number) => {
              if (!block || typeof block !== 'object') return null;
              
              const blockType = block.type;
              const blockData = block.data?.[blockType] || block.data || {};
              
              switch (blockType) {
                case 'paragraph':
                  const paragraphText = blockData.text || block.text || block.content || '';
                  if (!paragraphText) return null;
                  return (
                    <p key={block.id || index} className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                      {paragraphText}
                    </p>
                  );
                
                case 'heading':
                  const headingText = blockData.text || block.text || '';
                  const level = blockData.level || 2;
                  const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
                  const headingClasses = {
                    1: 'text-3xl font-bold mt-8 mb-4',
                    2: 'text-2xl font-bold mt-6 mb-3',
                    3: 'text-xl font-bold mt-4 mb-2',
                    4: 'text-lg font-bold mt-3 mb-2',
                    5: 'text-base font-bold mt-2 mb-1',
                    6: 'text-base font-bold mt-2 mb-1'
                  };
                  
                  if (!headingText) return null;
                  return (
                    <HeadingTag 
                      key={block.id || index} 
                      className={`${headingClasses[level as keyof typeof headingClasses]} text-gray-900 dark:text-gray-100`}
                    >
                      {headingText}
                    </HeadingTag>
                  );
                
                case 'list':
                  const items = blockData.items || block.items || [];
                  const listStyle = blockData.style || 'unordered';
                  
                  if (!items.length) return null;
                  
                  const ListTag = listStyle === 'ordered' ? 'ol' : 'ul';
                  const listClass = listStyle === 'ordered' 
                    ? 'list-decimal list-inside' 
                    : 'list-disc list-inside';
                  
                  return (
                    <ListTag key={block.id || index} className={`${listClass} space-y-2 text-gray-700 dark:text-gray-300`}>
                      {items.map((item: string, i: number) => (
                        <li key={i} className="text-lg leading-relaxed pr-2">
                          {item}
                        </li>
                      ))}
                    </ListTag>
                  );
                
                case 'quote':
                  const quoteText = blockData.text || block.text || '';
                  const quoteAuthor = blockData.caption || blockData.author || block.caption || '';
                  
                  if (!quoteText) return null;
                  return (
                    <blockquote 
                      key={block.id || index} 
                      className="border-r-4 border-blue-500 pr-6 py-4 my-6 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <p className="text-lg italic text-gray-700 dark:text-gray-300 mb-2">
                        "{quoteText}"
                      </p>
                      {quoteAuthor && (
                        <cite className="text-sm text-gray-600 dark:text-gray-400 not-italic">
                          — {quoteAuthor}
                        </cite>
                      )}
                    </blockquote>
                  );
                
                case 'image':
                  const imageUrl = blockData.file?.url || blockData.url || block.url || '';
                  const imageCaption = blockData.caption || block.caption || '';
                  const imageAlt = blockData.alt || block.alt || imageCaption || 'صورة';
                  
                  if (!imageUrl) return null;
                  return (
                    <figure key={block.id || index} className="my-8">
                      <div className="overflow-hidden rounded-2xl shadow-xl">
                        <img
                          src={imageUrl}
                          alt={imageAlt}
                          className="w-full h-auto object-cover rounded-2xl transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                      {imageCaption && (
                        <figcaption className="text-sm text-gray-600 dark:text-gray-400 text-center mt-3 italic">
                          {imageCaption}
                        </figcaption>
                      )}
                    </figure>
                  );
                
                case 'divider':
                  return (
                    <hr key={block.id || index} className="my-8 border-gray-300 dark:border-gray-700" />
                  );
                
                case 'video':
                  const videoUrl = blockData.url || block.url || '';
                  if (!videoUrl) return null;
                  
                  // معالجة روابط YouTube
                  let embedUrl = '';
                  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                    const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
                    if (videoId) {
                      embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    }
                  }
                  
                  if (embedUrl) {
                    return (
                      <div key={block.id || index} className="my-8 rounded-lg overflow-hidden shadow-lg">
                        <iframe
                          src={embedUrl}
                          className="w-full h-96"
                          allowFullScreen
                        />
                      </div>
                    );
                  }
                  return null;
                
                default:
                  const defaultText = blockData.text || block.text || block.content || '';
                  const finalDefaultText = typeof defaultText === 'object' ? 
                    (defaultText.text || JSON.stringify(defaultText)) : defaultText;
                  if (!finalDefaultText) return null;
                  return (
                    <p key={block.id || index} className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                      {finalDefaultText}
                    </p>
                  );
              }
            })}
          </div>
        );
      }
    } catch (e) {
      console.log('Content is not JSON blocks, rendering as HTML');
    }
    
    // معالجة المحتوى النصي العادي (تحويل فواصل الأسطر إلى فقرات)
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    
    if (paragraphs.length > 0) {
      return (
        <div className="space-y-6">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      );
    }
    
    // عرض المحتوى كـ HTML كخيار أخير
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: content }}
        className="prose prose-lg max-w-none dark:prose-invert
                   prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                   prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                   prose-blockquote:border-r-4 prose-blockquote:border-blue-500 prose-blockquote:pr-6
                   prose-ul:list-disc prose-ol:list-decimal
                   prose-img:rounded-lg prose-img:shadow-lg"
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل المقال...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6 shadow-lg">
              <BookOpenIcon className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">المقال غير موجود</h3>
            <p className="text-gray-600 mb-8 text-lg">عذراً، لم نتمكن من العثور على المقال المطلوب</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <ArrowRight className="w-5 h-5" />
                العودة إلى الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // استخدام بيانات التصنيف الحقيقية
  const categoryData = article.category || {
    name_ar: article.category_name || 'عام',
    color_hex: getCategoryColor(article.category)
  };

  // استخدام بيانات المؤلف الموحدة
  const authorData = article.author || {
    name: article.author_name || 'فريق التحرير',
    avatar: article.author_avatar
  };

  // استخدام الإحصائيات الموحدة
  const statsData = {
    views: article.stats?.views || article.views_count || 0,
    likes: interaction.likesCount || article.stats?.likes || article.likes_count || 0,
    shares: interaction.sharesCount || article.stats?.shares || article.shares_count || 0,
    comments: article.stats?.comments || 0,
    saves: interaction.savesCount || article.stats?.saves || 0
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300" ref={contentRef}>
      <Header />
      
      {/* شريط التقدم */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* المحتوى الرئيسي */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* التصنيف والعلامات */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <Link 
                href={`/news/category/${categoryData.name_ar}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-bold rounded-full shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: categoryData.color_hex }}
              >
                {(categoryData as any).icon && <span>{(categoryData as any).icon}</span>}
                {categoryData.name_ar}
              </Link>
              
              {article.is_breaking && (
                <span className="inline-flex items-center gap-1 px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse shadow-md">
                  <Zap className="w-4 h-4" />
                  عاجل
                </span>
              )}
              
              {article.is_featured && (
                <span className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-md">
                  <Award className="w-4 h-4" />
                  مميز
                </span>
              )}
            </div>
          </div>
        </div>

        {/* العنوان والعنوان الفرعي */}
        <header className="mb-6">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              {article.subtitle}
            </p>
          )}
        </header>

        {/* المعلومات الوصفية */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-6 flex-wrap">
            {/* المؤلف */}
            <div className="flex items-center gap-2">
              {authorData.avatar ? (
                <img 
                  src={authorData.avatar} 
                  alt={authorData.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
              )}
              <span className="font-medium text-gray-900 dark:text-white">{authorData.name}</span>
            </div>

            {/* التاريخ والوقت */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(article.published_at || article.created_at)}</span>
              <span className="text-gray-400">•</span>
              <span>{formatTime(article.published_at || article.created_at)}</span>
            </div>

            {/* وقت القراءة */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{article.reading_time || 5} دقائق قراءة</span>
            </div>
          </div>

          {/* المشاهدات */}
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="font-medium">{statsData.views.toLocaleString('ar-SA')} مشاهدة</span>
          </div>
        </div>

        {/* الصورة البارزة */}
        {(article.featured_image || article.title) && (
          <figure className="mb-8">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl group">
              <img
                src={article.featured_image || generatePlaceholderImage(article.title)}
                alt={article.featured_image_alt || article.title}
                className="w-full h-[400px] md:h-[500px] object-cover rounded-3xl transition-all duration-700 group-hover:scale-105"
              />
              {article.is_breaking && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white font-bold rounded-full animate-pulse text-sm">
                  خبر عاجل
                </div>
              )}
              {/* تأثير التدرج في الأسفل */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent rounded-b-3xl"></div>
            </div>
            {(article.image_caption || article.featured_image_alt) && (
              <figcaption className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center italic">
                {article.image_caption || article.featured_image_alt}
              </figcaption>
            )}
          </figure>
        )}

        {/* الملخص الذكي */}
        {article.summary && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">الملخص الذكي</h3>
                </div>
                <button
                  onClick={speakSummary}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-medium text-sm ${
                    isSpeaking 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>استمع</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                {article.summary}
              </p>
            </div>
          </div>
        )}

        {/* محتوى المقال - بدون إطار */}
        <div className="prose prose-lg max-w-none dark:prose-invert mb-12">
          {renderArticleContent(article.content)}
        </div>

        {/* أزرار التفاعل المحسنة */}
        <div className="sticky bottom-4 bg-white dark:bg-gray-800 rounded-full shadow-xl p-2 mx-auto w-fit border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1">
            {/* زر الإعجاب */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-sm ${
                interaction.liked
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Heart className={`w-5 h-5 ${interaction.liked ? 'fill-current' : ''}`} />
              <span>{statsData.likes > 0 ? statsData.likes.toLocaleString('ar-SA') : 'إعجاب'}</span>
            </button>

            {/* زر المشاركة */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all text-sm"
              >
                <Share2 className="w-5 h-5" />
                <span>{statsData.shares > 0 ? statsData.shares.toLocaleString('ar-SA') : 'مشاركة'}</span>
              </button>
              
              {/* قائمة المشاركة */}
              {showShareMenu && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[200px]">
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  >
                    <span className="text-[#1DA1F2]">𝕏</span>
                    <span>تويتر</span>
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>واتساب</span>
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  >
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    <span>فيسبوك</span>
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  >
                    <Send className="w-4 h-4 text-[#0088CC]" />
                    <span>تيليجرام</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={() => handleShare('copy')}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  >
                    {copySuccess ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copySuccess ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* زر التعليقات */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all text-sm">
              <MessageSquare className="w-5 h-5" />
              <span>{statsData.comments > 0 ? statsData.comments.toLocaleString('ar-SA') : 'تعليق'}</span>
            </button>

            {/* زر الحفظ */}
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-sm ${
                interaction.saved
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${interaction.saved ? 'fill-current' : ''}`} />
              <span>{interaction.saved ? 'محفوظ' : 'حفظ'}</span>
            </button>
          </div>
        </div>

        {/* الكلمات المفتاحية */}
        {article.seo_keywords && (
          <div className="mt-12 mb-8">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">الكلمات المفتاحية</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                let keywords: string[] = [];
                
                if (typeof article.seo_keywords === 'string' && article.seo_keywords.trim()) {
                  keywords = article.seo_keywords.split(',').map(k => k.trim()).filter(k => k);
                } else if (Array.isArray(article.seo_keywords)) {
                  keywords = article.seo_keywords.filter(k => typeof k === 'string' && k.trim());
                }
                
                return keywords.map((keyword, index) => (
                  <Link
                    key={index}
                    href={`/search?q=${encodeURIComponent(keyword)}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Hash className="w-3 h-3" />
                    {keyword}
                  </Link>
                ));
              })()}
            </div>
          </div>
        )}

        {/* محتوى مخصص - مبسط وأنيق */}
        {isLoggedIn && recommendations.length > 0 && (
          <section className="mt-16 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">محتوى مخصص لك</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.slice(0, 4).map((rec: any) => (
                <Link key={rec.id} href={`/article/${rec.id}`}>
                  <article className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                    <div className="flex gap-4 p-4 h-full">
                      <div className="relative w-32 h-24 flex-shrink-0 overflow-hidden rounded-xl">
                        <img
                          src={rec.featured_image || generatePlaceholderImage(rec.title)}
                          alt={rec.title}
                          className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-110"
                        />
                        {rec.recommendation_reason && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                            <Sparkles className="w-3 h-3 inline mr-1" />
                            مقترح
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 mb-2">
                          {rec.title}
                        </h3>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                          <span>{formatDate(rec.published_at || rec.created_at)}</span>
                          {rec.reading_time && (
                            <>
                              <span>•</span>
                              <span>{rec.reading_time} دقائق</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* معلومات القراءة (للمستخدمين المسجلين) */}
        {userId && readingTime > 10 && (
          <div className="fixed bottom-20 left-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg text-xs">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3" />
              <span>وقت القراءة: {Math.floor(readingTime / 60)}:{(readingTime % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              <span>تقدم القراءة: {readProgress.toFixed(0)}%</span>
            </div>
          </div>
        )}
      </article>
      <Footer />
    </div>
  );
} 