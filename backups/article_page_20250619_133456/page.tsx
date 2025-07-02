'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../components/Header';
import { 
  ArrowRight, Calendar, Clock, User, Eye, Tag, 
  ThumbsUp, Share2, Volume2, VolumeX, Loader2,
  BookOpen, Heart, MessageCircle, Bookmark, Twitter,
  Facebook, Send, Copy, ChevronRight, Award, Hash,
  Zap, Globe, BookOpen as BookOpenIcon, PenTool, RefreshCw,
  Sparkles, TrendingUp, Check, Brain, Bot, FileText
} from 'lucide-react';
import './article-styles.css';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  content: string;
  featured_image?: string;
  image_caption?: string;
  category_id: number;
  category_name?: string;
  author_id?: string;
  author_name?: string;
  author_avatar?: string;
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
}

// ألوان التصنيفات
const categoryColors: { [key: string]: string } = {
  'تقنية': 'from-purple-500 to-purple-600',
  'اقتصاد': 'from-green-500 to-green-600',
  'رياضة': 'from-blue-500 to-blue-600',
  'سياسة': 'from-red-500 to-red-600',
  'ثقافة': 'from-yellow-500 to-yellow-600',
  'صحة': 'from-pink-500 to-pink-600',
  'محلي': 'from-indigo-500 to-indigo-600',
  'دولي': 'from-cyan-500 to-cyan-600',
  'منوعات': 'from-orange-500 to-orange-600',
  'default': 'from-gray-500 to-gray-600'
};

interface PageProps {
  params: Promise<{ id: string }>
}

export default function NewsDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [interaction, setInteraction] = useState<UserInteraction>({
    liked: false,
    saved: false,
    shared: false
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [articleId, setArticleId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      const resolvedParams = await params;
      if (resolvedParams?.id) {
        setArticleId(resolvedParams.id);
        fetchArticle(resolvedParams.id);
        trackView(resolvedParams.id);
      }
    }
    loadArticle();
  }, []);

  useEffect(() => {
    // التحقق من تسجيل الدخول بشكل أكثر دقة
    const checkLoginStatus = () => {
      const userId = localStorage.getItem('user_id');
      const userData = localStorage.getItem('user');
      
      // التحقق من وجود user_id صالح وبيانات المستخدم
      const isValidLogin = !!(userId && userId !== 'anonymous' && userData);
      
      setIsLoggedIn(isValidLogin);
      setUserDataLoaded(true);
    };
    
    // التحقق الأولي
    checkLoginStatus();
    
    // الاستماع لتغييرات localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_id' || e.key === 'user') {
        checkLoginStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // إعادة التحقق بعد تحميل الصفحة بالكامل
    const timeoutId = setTimeout(checkLoginStatus, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timeoutId);
    };
  }, []);

  // إعادة جلب التوصيات عند تغيير حالة تسجيل الدخول
  useEffect(() => {
    if (userDataLoaded && isLoggedIn && articleId) {
      fetchRecommendations(articleId);
    }
  }, [isLoggedIn, userDataLoaded, articleId]);

  useEffect(() => {
    // تتبع تقدم القراءة
    const handleScroll = () => {
      if (contentRef.current) {
        const windowHeight = window.innerHeight;
        const documentHeight = contentRef.current.offsetHeight;
        const scrollTop = window.scrollY;
        const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
        setReadProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // تتبع وقت القراءة عند مغادرة الصفحة
    const handleBeforeUnload = () => {
      if (article && articleId) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration > 10) { // تسجيل القراءة فقط إذا كانت أكثر من 10 ثواني
          // استخدام sendBeacon لضمان إرسال البيانات قبل إغلاق الصفحة
          const data = {
            type: 'read',
            article_id: articleId,
            user_id: localStorage.getItem('user_id') || 'anonymous',
            category_id: article.category_id,
            duration,
            scroll_percentage: readProgress
          };
          navigator.sendBeacon('/api/interactions/track', JSON.stringify(data));
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // تسجيل القراءة عند unmount
    };
  }, [article, readProgress, articleId]);

  const fetchArticle = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${id}`);
      
      if (!response.ok) {
        // معالجة أفضل للأخطاء بدون console.error في production
        if (response.status === 404) {
          console.log('Article not found:', id);
        } else {
          console.log('Error loading article:', response.status);
        }
        // إعادة التوجيه إلى الصفحة الرئيسية بدلاً من /news
        router.push('/');
        return;
      }
      
      const data = await response.json();
      
      // التعامل مع البيانات المباشرة (API يرجع المقال مباشرة)
      // إذا كان المقال يحتوي على content_blocks، استخدمها بدلاً من content
      if (data.content_blocks && Array.isArray(data.content_blocks) && data.content_blocks.length > 0) {
        // تحويل content_blocks إلى JSON string لاستخدامه في renderArticleContent
        data.content = JSON.stringify(data.content_blocks);
      }
      
      setArticle(data);
      
      // جلب التفاعلات المحفوظة
      const savedInteractions = localStorage.getItem(`article_${id}_interactions`);
      if (savedInteractions) {
        setInteraction(JSON.parse(savedInteractions));
      }
      
      // التوصيات سيتم جلبها في useEffect منفصل بعد التحقق من تسجيل الدخول
    } catch (error) {
      console.log('Network error while fetching article:', error);
      // إعادة التوجيه إلى الصفحة الرئيسية في حالة خطأ الشبكة
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (currentArticleId: string) => {
    try {
      setLoadingRecommendations(true);
      const userId = localStorage.getItem('user_id');
      const userData = localStorage.getItem('user');
      
      if (!userId || userId === 'anonymous' || !userData) {
        // إذا لم يكن المستخدم مسجل دخول بشكل صحيح، لا نعرض التوصيات
        return;
      }
      
      const response = await fetch(`/api/content/recommendations?user_id=${userId}&current_article_id=${currentArticleId}&limit=6`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.recommendations) {
          setRecommendations(data.data.recommendations);
        }
      } else {
        console.error('Failed to fetch recommendations:', response.status);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const trackView = async (articleId: string) => {
    try {
      const userId = localStorage.getItem('user_id') || 'anonymous';
      
      // لا نتتبع المشاهدات للمستخدمين غير المسجلين
      if (userId === 'anonymous') {
        return;
      }
      
      const response = await fetch('/api/interactions/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'view',
          article_id: articleId,
          user_id: userId,
          category_id: article?.category_id,
          source: 'article_detail'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const trackInteraction = async (type: string, articleId: string, additionalData?: any) => {
    try {
      const userId = localStorage.getItem('user_id') || 'anonymous';
      
      // التحقق من تسجيل الدخول
      if (userId === 'anonymous') {
        alert('يرجى تسجيل الدخول لبدء رحلتك الذكية وكسب النقاط 🎯');
        return;
      }
      
      const response = await fetch('/api/interactions/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          article_id: articleId,
          user_id: userId,
          category_id: article?.category_id,
          ...additionalData
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          // استخدام alert بدلاً من toast مؤقتاً
          alert(data.message);
        }
        // تحديث نقاط الولاء في localStorage
        if (data.data?.loyalty) {
          localStorage.setItem('user_loyalty_points', data.data.loyalty.total_points.toString());
          // إطلاق حدث تحديث النقاط
          window.dispatchEvent(new Event('loyalty-points-updated'));
        }
      } else {
        const error = await response.json();
        if (response.status === 401) {
          alert(error.message || 'يرجى تسجيل الدخول لبدء رحلتك الذكية وكسب النقاط 🎯');
        }
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const handleLike = async () => {
    if (!article) return;
    
    const newLiked = !interaction.liked;
    setInteraction(prev => ({ ...prev, liked: newLiked }));
    
    // حفظ التفاعل محلياً
    localStorage.setItem(`article_${article.id}_interactions`, JSON.stringify({
      ...interaction,
      liked: newLiked
    }));
    
    // تتبع التفاعل
    await trackInteraction(newLiked ? 'like' : 'unlike', article.id);
  };

  const handleSave = async () => {
    if (!article) return;
    
    const newSaved = !interaction.saved;
    setInteraction(prev => ({ ...prev, saved: newSaved }));
    
    localStorage.setItem(`article_${article.id}_interactions`, JSON.stringify({
      ...interaction,
      saved: newSaved
    }));
    
    await trackInteraction(newSaved ? 'save' : 'unsave', article.id);
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
        alert('تم نسخ الرابط');
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setInteraction(prev => ({ ...prev, shared: true }));
    await trackInteraction('share', article.id, { platform });
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
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCategoryColor = (categoryName?: string) => {
    return categoryColors[categoryName || ''] || categoryColors['default'];
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
      // التحقق من وجود المحتوى
      if (!content) {
        return <p className="text-gray-500 dark:text-gray-400 text-center">لا يوجد محتوى لعرضه</p>;
      }
      
      // محاولة تحليل المحتوى كـ JSON blocks
      const blocks = JSON.parse(content);
      
      if (Array.isArray(blocks)) {
        return (
          <div className="article-content">
            {blocks.map((block: any, index: number) => {
              // التحقق من صحة البلوك
              if (!block || typeof block !== 'object') return null;
              
              // التعامل مع البنية الجديدة من BlockEditor
              const blockType = block.type;
              const blockData = block.data?.[blockType] || block.data || {};
              
              switch (blockType) {
                case 'paragraph':
                  const paragraphText = blockData.text || block.text || block.content || '';
                  // التحقق من نوع النص
                  const finalText = typeof paragraphText === 'object' ? 
                    (paragraphText.text || JSON.stringify(paragraphText)) : paragraphText;
                  if (!finalText) return null;
                  return (
                    <p key={block.id || index} className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                      {finalText}
                    </p>
                  );
                
                case 'heading':
                  const headingText = blockData.text || block.text || block.content || '';
                  const level = blockData.level || 2;
                  // التحقق من نوع النص
                  const finalHeadingText = typeof headingText === 'object' ? 
                    (headingText.text || JSON.stringify(headingText)) : headingText;
                  if (!finalHeadingText) return null;
                  
                  const headingClasses = {
                    1: "text-4xl font-bold mt-12 mb-6 text-gray-900 dark:text-white",
                    2: "text-3xl font-bold mt-10 mb-5 text-gray-900 dark:text-white",
                    3: "text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white",
                    4: "text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-white",
                    5: "text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white",
                    6: "text-base font-bold mt-3 mb-2 text-gray-900 dark:text-white"
                  };
                  
                  return React.createElement(
                    `h${level}`,
                    { 
                      key: block.id || index, 
                      className: headingClasses[level as keyof typeof headingClasses] || headingClasses[2]
                    },
                    finalHeadingText
                  );
                
                case 'quote':
                  const quoteText = blockData.text || block.text || block.content || '';
                  // التحقق من نوع النص
                  const finalQuoteText = typeof quoteText === 'object' ? 
                    (quoteText.text || JSON.stringify(quoteText)) : quoteText;
                  if (!finalQuoteText) return null;
                  return (
                    <blockquote key={block.id || index} className="relative my-10 px-8 py-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl border-r-4 border-blue-500">
                      <div className="absolute -top-4 -right-2 text-6xl text-blue-200 dark:text-blue-800">"</div>
                      <p className="relative z-10 text-lg text-gray-700 dark:text-gray-300 italic">
                        {finalQuoteText}
                      </p>
                      {blockData.author && (
                        <cite className="block mt-3 text-sm text-gray-600 dark:text-gray-400 font-medium not-italic">
                          — {blockData.author}
                        </cite>
                      )}
                    </blockquote>
                  );
                
                case 'list':
                  const listItems = blockData.items || block.items || [];
                  const isOrdered = blockData.style === 'ordered' || block.ordered;
                  if (listItems.length === 0) return null;
                  
                  const ListTag = isOrdered ? 'ol' : 'ul';
                  return (
                    <ListTag key={block.id || index} className={`mb-6 ${isOrdered ? 'list-decimal' : 'list-disc'} pr-6 space-y-1`}>
                      {listItems.map((item: any, i: number) => {
                        // التعامل مع العناصر سواء كانت نص أو كائن
                        const itemText = typeof item === 'string' ? item : (item.text || item.content || '');
                        return (
                          <li key={i} className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">{itemText}</li>
                        );
                      })}
                    </ListTag>
                  );
                
                case 'image':
                  const imageUrl = blockData.url || blockData.file?.url || block.url || block.src;
                  if (!imageUrl) return null;
                  
                  return (
                    <figure key={block.id || index} className="my-10">
                      <div className="relative rounded-2xl overflow-hidden shadow-xl">
                        <img
                          src={imageUrl}
                          alt={blockData.alt || block.alt || ''}
                          className="w-full h-auto"
                        />
                      </div>
                      {(blockData.caption || block.caption) && (
                        <figcaption className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4 italic">
                          {typeof (blockData.caption || block.caption) === 'object' 
                            ? (blockData.caption?.text || block.caption?.text || '') 
                            : (blockData.caption || block.caption)}
                        </figcaption>
                      )}
                    </figure>
                  );
                
                case 'video':
                  const videoUrl = blockData.url || block.url || block.src;
                  if (!videoUrl) return null;
                  
                  // تحديد نوع الفيديو (YouTube, Vimeo, etc.)
                  const getVideoEmbed = (url: string) => {
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
                      return `https://www.youtube.com/embed/${videoId}`;
                    }
                    if (url.includes('vimeo.com')) {
                      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
                      return `https://player.vimeo.com/video/${videoId}`;
                    }
                    return url;
                  };
                  
                  return (
                    <figure key={block.id || index} className="my-10">
                      <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-100 dark:bg-gray-800">
                        <iframe
                          src={getVideoEmbed(videoUrl)}
                          className="w-full aspect-video"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                      {(blockData.caption || block.caption) && (
                        <figcaption className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4 italic">
                          {typeof (blockData.caption || block.caption) === 'object' 
                            ? (blockData.caption?.text || block.caption?.text || '') 
                            : (blockData.caption || block.caption)}
                        </figcaption>
                      )}
                    </figure>
                  );
                
                case 'divider':
                  return (
                    <hr key={block.id || index} className="my-12 border-t-2 border-gray-200 dark:border-gray-700 w-1/2 mx-auto" />
                  );
                
                case 'code':
                  const codeText = blockData.code || block.code || blockData.text || '';
                  // التحقق من نوع النص
                  const finalCodeText = typeof codeText === 'object' ? 
                    (codeText.text || codeText.code || JSON.stringify(codeText, null, 2)) : codeText;
                  if (!finalCodeText) return null;
                  return (
                    <pre key={block.id || index} className="my-6 p-6 bg-gray-900 dark:bg-gray-950 rounded-2xl overflow-x-auto">
                      <code className="text-gray-100 text-sm font-mono">
                        {finalCodeText}
                      </code>
                    </pre>
                  );
                
                case 'table':
                  const tableData = blockData.content || block.content || [];
                  if (!tableData.length) return null;
                  return (
                    <div key={block.id || index} className="my-8 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {tableData.map((row: any, rowIndex: number) => (
                            <tr key={rowIndex}>
                              {Array.isArray(row) ? row.map((cell: any, cellIndex: number) => {
                                // التحقق من نوع البيانات في الخلية
                                const cellContent = typeof cell === 'object' ? 
                                  (cell.text || cell.content || JSON.stringify(cell)) : cell;
                                return (
                                  <td 
                                    key={cellIndex} 
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                                  >
                                    {cellContent}
                                  </td>
                                );
                              }) : (
                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                  {typeof row === 'object' ? JSON.stringify(row) : row}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                
                case 'embed':
                  const embedUrl = blockData.url || block.url || '';
                  const embedCode = blockData.embed || block.embed || '';
                  
                  if (embedCode) {
                    return (
                      <div 
                        key={block.id || index} 
                        className="my-8"
                        dangerouslySetInnerHTML={{ __html: embedCode }}
                      />
                    );
                  }
                  
                  if (embedUrl) {
                    return (
                      <div key={block.id || index} className="my-8 rounded-2xl overflow-hidden shadow-xl">
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
                  // للبلوكات غير المدعومة، نحاول عرض النص إن وجد
                  const defaultText = blockData.text || block.text || block.content || '';
                  // التحقق من نوع النص
                  const finalDefaultText = typeof defaultText === 'object' ? 
                    (defaultText.text || JSON.stringify(defaultText)) : defaultText;
                  if (!finalDefaultText) return null;
                  return (
                    <p key={block.id || index} className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                      {finalDefaultText}
                    </p>
                  );
              }
            })}
          </div>
        );
      }
    } catch (e) {
      // إذا فشل التحليل، المحتوى ليس JSON، نعرضه كـ HTML عادي
      console.log('Content is not JSON blocks, rendering as HTML');
    }
    
    // عرض المحتوى كـ HTML إذا لم يكن JSON
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: content }}
        className="article-content prose prose-lg prose-gray dark:prose-invert max-w-none
                   prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                   prose-h1:text-4xl prose-h1:mt-12 prose-h1:mb-6
                   prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-5
                   prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                   prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3
                   prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-lg prose-p:mb-6
                   prose-blockquote:not-italic prose-blockquote:border-r-4 prose-blockquote:border-blue-500 prose-blockquote:pr-6
                   prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800 prose-blockquote:py-4 prose-blockquote:rounded-2xl
                   prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
                   prose-ul:list-disc prose-ol:list-decimal prose-ul:pr-6 prose-ol:pr-6
                   prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:marker:text-gray-500 prose-li:leading-relaxed
                   prose-img:rounded-2xl prose-img:shadow-xl prose-img:my-10 prose-img:w-full
                   prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-a:no-underline hover:prose-a:underline
                   prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                   prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:text-gray-100 prose-pre:rounded-2xl
                   prose-hr:border-gray-300 dark:prose-hr:border-gray-700 prose-hr:my-12"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ArrowRight className="w-5 h-5" />
                العودة إلى الرئيسية
              </Link>
              <Link 
                href="/categories" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-200"
              >
                <Tag className="w-5 h-5" />
                تصفح التصنيفات
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300" ref={contentRef}>
      <Header />
      
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Main Content Container - تقليل العرض */}
      <div className="max-w-4xl mx-auto px-4 py-8 transition-colors duration-300">
        {/* Category and Tags - فوق العنوان */}
        <div className="mb-4 text-right">
          <div className="flex items-center justify-start gap-4">
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r ${getCategoryColor(article.category_name)} text-white text-sm font-bold rounded-full shadow-md`}>
              <Tag className="w-4 h-4" />
              {article.category_name || 'عام'}
            </span>
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

        {/* عنوان وتعريف الصفحة */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white transition-colors duration-300 text-right">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-xl leading-relaxed text-right">
              {article.subtitle}
            </p>
          )}
        </div>

        {/* معلومات المقال المبسطة */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              {/* Author */}
              {article.author_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{article.author_name}</span>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.published_at || article.created_at)}</span>
              </div>

              {/* Reading Time */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{article.reading_time || 5} دقائق</span>
              </div>

              {/* Views */}
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{article.views_count || 0} مشاهدة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {(article.featured_image || article.title) && (
          <div className="mb-8">
            <div className="relative rounded-xl overflow-hidden shadow-lg">
              <img
                src={article.featured_image || generatePlaceholderImage(article.title)}
                alt={article.title}
                className="w-full h-auto"
              />
              {article.is_breaking && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white font-bold rounded-full animate-pulse text-sm">
                  خبر عاجل
                </div>
              )}
            </div>
            {article.image_caption && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center italic">
                {article.image_caption}
              </p>
            )}
          </div>
        )}

        {/* Smart Summary */}
        {article.summary && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-6 border border-blue-100 dark:border-blue-700 transition-colors duration-300">
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
                      ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300' 
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
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
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg text-right">
                {article.summary}
              </p>
            </div>
          </div>
        )}

        {/* Article Content */}
        <article className="mb-12">
          <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-850 rounded-xl p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-lg prose-p:text-right prose-headings:text-right prose-li:text-right" dir="rtl">
              {renderArticleContent(article.content)}
            </div>
          </div>
        </article>

        {/* Action Buttons */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                interaction.liked
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${interaction.liked ? 'fill-current' : ''}`} />
              <span>{interaction.liked ? 'أعجبني' : 'إعجاب'}</span>
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                interaction.saved
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${interaction.saved ? 'fill-current' : ''}`} />
              <span>{interaction.saved ? 'محفوظ' : 'حفظ'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">شارك:</span>
              <button
                onClick={() => handleShare('twitter')}
                className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                title="شارك على تويتر"
              >
                <Twitter className="w-5 h-5 text-[#1DA1F2]" />
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                title="شارك على واتساب"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                title="نسخ الرابط"
              >
                {copySuccess ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Keywords */}
        {article.seo_keywords && (
          <div className="mb-12">
            <div className="text-right">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">الكلمات المفتاحية</h3>
              <div className="flex items-center justify-start gap-3 flex-wrap">
                {(() => {
                  // معالجة الكلمات المفتاحية بأمان
                  let keywords: string[] = [];
                  
                  if (typeof article.seo_keywords === 'string' && article.seo_keywords.trim()) {
                    // إذا كانت نص، نقسمها
                    keywords = article.seo_keywords.split(',').map(k => k.trim()).filter(k => k);
                  } else if (Array.isArray(article.seo_keywords)) {
                    // إذا كانت مصفوفة، نستخدمها مباشرة
                    keywords = article.seo_keywords.filter(k => typeof k === 'string' && k.trim());
                  }
                  
                  return keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      #{keyword}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendations - محتوى مخصص لك - مبسط */}
        {!userDataLoaded ? (
          // عرض حالة التحميل أثناء التحقق من تسجيل الدخول
          <div className="mt-12 mb-12">
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التحقق من حالة تسجيل الدخول...</span>
              </div>
            </div>
          </div>
        ) : isLoggedIn ? (
          recommendations.length > 0 ? (
            <div className="mt-12 mb-12">
              <div className="text-right mb-6">
                <div className="flex items-center justify-start gap-2 mb-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">محتوى مخصص لك 🤖</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">اخترنا لك هذا المحتوى بناءً على اهتماماتك</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.slice(0, 4).map((rec: any) => (
                  <Link key={rec.id} href={`/article/${rec.id}`}>
                    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
                      {/* AI Badge */}
                      {rec.recommendation_reason && (
                        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium rounded-full shadow-md">
                          {rec.recommendation_reason}
                        </div>
                      )}
                      
                      <div className="flex gap-4 p-4">
                        {/* Image */}
                        <div className="relative w-24 h-20 overflow-hidden rounded-md">
                          <img
                            src={rec.featured_image || rec.image_url || generatePlaceholderImage(rec.title)}
                            alt={rec.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          {/* Category */}
                          {rec.category_name && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 mb-2 text-xs font-medium text-white rounded-full bg-gradient-to-r ${getCategoryColor(rec.category_name)}`}>
                              <Tag className="w-3 h-3" />
                              {rec.category_name}
                            </span>
                          )}
                          
                          {/* Title */}
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 mb-2">
                            {rec.title}
                          </h4>
                          
                          {/* Meta */}
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            {rec.created_at && (
                              <span>{formatDate(rec.created_at)}</span>
                            )}
                            {rec.reading_time && (
                              <>
                                <span>•</span>
                                <span>{rec.reading_time} د</span>
                              </>
                            )}
                            {rec.views_count > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{rec.views_count}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Loading State */}
              {loadingRecommendations && (
                <div className="flex items-center justify-center py-8 mt-4">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري تحميل التوصيات المخصصة...</span>
                  </div>
                </div>
              )}
            </div>
          ) : loadingRecommendations ? (
            <div className="mt-12 mb-12">
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تحميل التوصيات المخصصة...</span>
                </div>
              </div>
            </div>
          ) : null
        ) : (
          <div className="mt-12 mb-12">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 text-right border border-purple-200 dark:border-gray-700">
              <div className="inline-flex items-center justify-start w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-full mb-3">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">احصل على توصيات مخصصة لك 🤖</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">سجل دخولك لتحصل على محتوى مختار خصيصاً بناءً على اهتماماتك</p>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                سجل دخولك الآن
              </Link>
            </div>
          </div>
        )}

        {/* Related Articles - مبسط */}
        {article.related_articles && article.related_articles.length > 0 && (
          <div className="mt-12 mb-16">
            <div className="text-right mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">مقالات ذات صلة</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {article.related_articles.slice(0, 4).map((related) => (
                <Link key={related.id} href={`/article/${related.id}`}>
                  <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="flex gap-4 p-4">
                      <img
                        src={related.featured_image || generatePlaceholderImage(related.title)}
                        alt={related.title}
                        className="w-24 h-20 object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2 text-sm">
                          {related.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDate(related.published_at || related.created_at || '')}</span>
                          {related.reading_time && (
                            <>
                              <span>•</span>
                              <span>{related.reading_time} د</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 