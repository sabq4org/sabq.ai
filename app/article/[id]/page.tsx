'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Share2, Eye, Clock, Calendar,
  User, MessageCircle, TrendingUp, Hash, ChevronRight, Home,
  Twitter, Copy, Check, X, Menu, Heart, Bookmark
} from 'lucide-react';
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MobileOptimizer from '@/components/mobile/MobileOptimizer'
import MobileHeader from '@/components/mobile/MobileHeader'
import { Article } from '@/types'

import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { formatFullDate, formatRelativeDate } from '@/lib/date-utils';
import { getImageUrl } from '@/lib/utils';
import ArticleJsonLd from '@/components/ArticleJsonLd';
import Footer from '@/components/Footer';
import { marked } from 'marked';
import Header from '@/components/Header';
import CommentsSection from '@/components/comments/CommentsSection';
import { ArticleMobileLayout } from '@/components/mobile/MobileLayout';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// تعريف نوع twttr لتويتر
declare global {
  interface Window {
    twttr: any;
  }
}

// دالة لتسجيل التفاعل عبر API
async function trackInteraction(data: {
  userId: string;
  articleId: string;
  interactionType: string;
  source?: string;
  duration?: number;
  completed?: boolean;
}) {
  try {
    const response = await fetch('/api/interactions/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: data.userId,
        article_id: data.articleId,
        interaction_type: data.interactionType,
        source: data.source,
        duration: data.duration,
        completed: data.completed
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to track interaction');
    }
  } catch (error) {
    console.error('Error tracking interaction:', error);
  }
}

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
  author?: string | {
    id: string;
    name: string;
    avatar?: string;
  };
  author_id?: string;
  author_name?: string;
  author_avatar?: string;
  reporter?: string;
  reporter_name?: string;
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
  ai_summary?: string;
  allow_comments?: boolean;
}

interface RelatedArticle {
  id: string;
  title: string;
  featured_image?: string;
  reading_time?: number;
  published_at?: string;
  created_at?: string;
  category_name?: string;
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

export default function ArticlePage({ params }: PageProps) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { darkMode, toggleDarkMode } = useDarkModeContext();
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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [articleId, setArticleId] = useState<string>('');

  const [userId, setUserId] = useState<string | null>(null);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  const [isNewArticle, setIsNewArticle] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<{id: string; title: string; level: number}[]>([]);
  const [activeSection, setActiveSection] = useState('');
  const [showMobileToc, setShowMobileToc] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // إنشاء معرف ثابت للضيف عند تحميل الصفحة
  useEffect(() => {
    // نقل كل منطق العميل إلى useEffect لتجنب مشاكل SSR
    let guestId = localStorage.getItem('guestId');
    
    if (!guestId) {
      // استخدام معرف ثابت بدلاً من Date.now() و Math.random()
      const timestamp = new Date().getTime();
      const randomPart = Math.floor(Math.random() * 1000000).toString(36);
      guestId = `guest-${timestamp}-${randomPart}`;
      localStorage.setItem('guestId', guestId);
    }
    
    // التحقق من تسجيل الدخول
    const storedUserId = localStorage.getItem('user_id');
    const userData = localStorage.getItem('user');
    
    const isValidLogin = !!(storedUserId && storedUserId !== 'anonymous' && userData);
    setUserId(isValidLogin ? storedUserId : guestId);
  }, []);

  useEffect(() => {
    async function loadArticle() {
      const resolvedParams = await params;
      
      if (resolvedParams?.id) {
        const cleanArticleId = resolvedParams.id.trim();
        setArticleId(cleanArticleId);
        fetchArticle(cleanArticleId);
      }
    }
    loadArticle();
  }, []);

  // تتبع المشاهدة والقراءة
  useEffect(() => {
    if (article && article.id && userId) {
      trackInteraction({
        userId: userId,
        articleId: article.id,
        interactionType: 'view',
        source: 'article_page'
      });
    }
  }, [article, userId]);

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
        

        
        // تحديد القسم النشط
        if (tableOfContents.length > 0) {
          const scrollPosition = window.scrollY + 150;
          let currentSection = '';
          
          for (let i = tableOfContents.length - 1; i >= 0; i--) {
            const section = document.getElementById(tableOfContents[i].id);
            if (section && section.offsetTop <= scrollPosition) {
              currentSection = tableOfContents[i].id;
              break;
            }
          }
          
          if (currentSection && currentSection !== activeSection) {
            setActiveSection(currentSection);
          }
        }
      }
      
      // إظهار/إخفاء الأزرار العائمة
      setShowFloatingActions(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [userId, article, tableOfContents, activeSection]);
  
  // جلب التفاعلات المحفوظة
  useEffect(() => {
    async function fetchUserInteractions() {
      if (!article?.id || !userId) return;

      // محاولة جلب من الخادم للمستخدمين المسجلين
      if (userId && !userId.startsWith('guest-')) {
        try {
          const interactionsResponse = await fetch(`/api/interactions/user-article?userId=${userId}&articleId=${article.id}`);
          if (interactionsResponse.ok) {
            const interactionsData = await interactionsResponse.json();
            if (interactionsData.success && interactionsData.data) {
              const serverInteractions = interactionsData.data;
              setInteraction(prev => ({
                ...prev,
                liked: serverInteractions.liked || false,
                saved: serverInteractions.saved || false,
                shared: serverInteractions.shared || false
              }));
            }
          }
        } catch (error) {
          console.log('خطأ في جلب التفاعلات');
        }
      }
    }

    fetchUserInteractions();
  }, [userId, article]);

  // تحميل سكريبت تويتر
  useEffect(() => {
    if (article && article.content) {
      try {
        const blocks = JSON.parse(article.content);
        const hasTweets = blocks.some((block: any) => block.type === 'tweet');
        
        if (hasTweets && !window.twttr) {
          const script = document.createElement('script');
          script.src = 'https://platform.twitter.com/widgets.js';
          script.async = true;
          script.onload = () => {
            if (window.twttr && window.twttr.widgets) {
              window.twttr.widgets.load();
            }
          };
          document.body.appendChild(script);
        } else if (hasTweets && window.twttr && window.twttr.widgets) {
          setTimeout(() => {
            window.twttr.widgets.load();
          }, 100);
        }
      } catch (e) {
        // ليس محتوى JSON
      }
    }
  }, [article]);





  // استخراج فهرس المحتويات عند تحديث المقال
  useEffect(() => {
    if (article && contentRef.current) {
      setTimeout(() => {
        generateTableOfContents();
      }, 100);
    }
  }, [article]);

  const fetchArticle = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${id}`, {
        next: { revalidate: 60 },
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=59'
        }
      });
      
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
      
      // التحقق من أن المقال جديد (نُشر خلال آخر 24 ساعة)
      // تأجيل هذا الحساب لتجنب اختلاف التوقيت بين الخادم والعميل
      if (data.published_at || data.created_at) {
        setTimeout(() => {
          const publishDate = new Date(data.published_at || data.created_at);
          const now = new Date();
          const hoursDiff = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);
          setIsNewArticle(hoursDiff <= 24);
        }, 0);
      }
      
    } catch (error) {
      console.log('Network error while fetching article:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  // إيقاف توليد فهرس المحتويات (تم إلغاء البلوك بناءً على طلب العميل)
  const generateTableOfContents = () => {
    // مسح أي بيانات سابقة لضمان عدم ظهور البلوك
    setTableOfContents([]);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setShowMobileToc(false);
      setActiveSection(id);
    }
  };

  const handleAiQuestion = async (question: string) => {
    if (!question.trim() || !article) return;
    
    setIsAiLoading(true);
    setAiResponse('');
    
    try {
      // محاكاة استجابة AI (يمكن استبدالها بـ API حقيقي لاحقاً)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // استجابات محاكاة بناءً على نوع السؤال
      if (question.includes('النقاط الرئيسية') || question.includes('الملخص')) {
        setAiResponse('بناءً على تحليلي للمقال، النقاط الرئيسية هي: ' + (article.summary || article.ai_summary || 'يتناول المقال موضوعاً مهماً يستحق القراءة بتمعن.'));
      } else if (question.includes('ببساطة') || question.includes('اشرح')) {
        setAiResponse('ببساطة، هذا المقال يتحدث عن ' + article.title + '. الفكرة الأساسية سهلة الفهم وتتعلق بجوانب مهمة في حياتنا اليومية.');
      } else if (question.includes('إحصائيات') || question.includes('أرقام')) {
        setAiResponse('المقال حصل على ' + article.views_count + ' مشاهدة و ' + interaction.likesCount + ' إعجاب. وقت القراءة المقدر هو ' + calculateReadingTime(article.content) + ' دقائق.');
      } else {
        setAiResponse('شكراً لسؤالك! ' + question + '. بناءً على محتوى المقال، يمكنني القول أن هذا موضوع مثير للاهتمام يستحق المناقشة.');
      }
    } catch (error) {
      setAiResponse('عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleShare = async (platform: string) => {
    if (!article) return;
    
    const url = window.location.href;
    const title = article.title;
    
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    } else {
      shareOnSocial(platform, title, url);
    }
    
    // تسجيل المشاركة
    if (userId) {
      trackInteraction({
        userId,
        articleId: article.id,
        interactionType: 'share',
        source: platform
      });
    }
    
    setShowShareMenu(false);
  };

  // دالة معالجة الإعجاب
  const handleLike = async () => {
    if (!article || !userId) {
      // إذا لم يكن المستخدم مسجل، توجيه إلى صفحة تسجيل الدخول
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          articleId: article.id,
          type: 'like',
          action: interaction.liked ? 'remove' : 'add'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInteraction(prev => ({
          ...prev,
          liked: !prev.liked,
          likesCount: prev.liked ? prev.likesCount - 1 : prev.likesCount + 1
        }));
        
        // تسجيل التفاعل
        trackInteraction({
          userId,
          articleId: article.id,
          interactionType: interaction.liked ? 'unlike' : 'like',
          source: 'article_page'
        });
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  // دالة معالجة الحفظ
  const handleSave = async () => {
    if (!article || !userId) {
      // إذا لم يكن المستخدم مسجل، توجيه إلى صفحة تسجيل الدخول
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          itemId: article.id,
          itemType: 'article'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInteraction(prev => ({
          ...prev,
          saved: data.action === 'added',
          savesCount: data.action === 'added' ? prev.savesCount + 1 : prev.savesCount - 1
        }));
        
        // تسجيل التفاعل
        trackInteraction({
          userId,
          articleId: article.id,
          interactionType: data.action === 'added' ? 'save' : 'unsave',
          source: 'article_page'
        });
      }
    } catch (error) {
      console.error('Error handling save:', error);
    }
  };

  const getCategoryColor = (category?: any) => {
    if (category?.color_hex) return category.color_hex;
    if ((category as any)?.color) return (category as any).color;
    
    const colors = ['#1a73e8', '#ea4335', '#34a853', '#fbbc04', '#673ab7', '#e91e63'];
    const index = Math.abs(category?.id || 0) % colors.length;
    return colors[index];
  };

  const generatePlaceholderImage = (title: string) => {
    const colors = ['#1a73e8', '#ea4335', '#34a853', '#fbbc04', '#673ab7'];
    const colorIndex = Math.abs(title.charCodeAt(0) - 65) % colors.length;
    
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
    if (!content) return null;
    
    // محاولة معالجة المحتوى كـ JSON blocks
    try {
      const blocks = JSON.parse(content);
      if (Array.isArray(blocks)) {
        return (
          <div className="space-y-6">
            {blocks.map((block, index) => {
              switch (block.type) {
                case 'paragraph':
                  return (
                    <p key={block.id || index} className="text-lg leading-[1.9] text-gray-700 dark:text-gray-300">
                      {block.text}
                    </p>
                  );
                
                case 'heading':
                  const level = block.level || 2;
                  const headingClasses: Record<number, string> = {
                    1: 'text-3xl',
                    2: 'text-2xl', 
                    3: 'text-xl',
                    4: 'text-lg',
                    5: 'text-base',
                    6: 'text-sm'
                  };
                  const headingClass = headingClasses[level] || 'text-xl';
                  
                  return React.createElement(
                    `h${level}`,
                    {
                      key: block.id || index,
                      className: `font-bold mt-8 mb-4 text-gray-900 dark:text-white ${headingClass}`
                    },
                    block.text
                  );
                
                case 'list':
                  return (
                    <ul key={block.id || index} className="list-disc list-inside space-y-2">
                      {block.items?.map((item: string, i: number) => (
                        <li key={i} className="text-lg text-gray-700 dark:text-gray-300">{item}</li>
                      ))}
                    </ul>
                  );
                
                case 'quote':
                  return (
                    <blockquote key={block.id || index} className="border-r-4 border-blue-600 pr-4 italic text-lg text-gray-600 dark:text-gray-400">
                      {block.text}
                      {block.caption && <cite className="block mt-2 text-sm not-italic">— {block.caption}</cite>}
                    </blockquote>
                  );
                
                case 'image':
                  return (
                    <figure key={block.id || index} className="my-8">
                      <img 
                        src={block.url} 
                        alt={block.alt || ''} 
                        className="w-full rounded-lg shadow-lg"
                      />
                      {block.caption && (
                        <figcaption className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                
                case 'gallery':
                case 'imageGallery':
                  return (
                    <div key={block.id || index} className="my-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {block.images?.map((image: any, imgIndex: number) => (
                          <figure key={imgIndex} className="relative group overflow-hidden rounded-lg shadow-lg">
                            <img 
                              src={image.url || image} 
                              alt={image.alt || `صورة ${imgIndex + 1}`} 
                              className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            {image.caption && (
                              <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-3 text-sm">
                                {image.caption}
                              </figcaption>
                            )}
                          </figure>
                        ))}
                      </div>
                      {block.caption && (
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                          {block.caption}
                        </p>
                      )}
                    </div>
                  );
                
                case 'html':
                  return (
                    <div 
                      key={block.id || index}
                      dangerouslySetInnerHTML={{ __html: block.content || '' }}
                      className="prose prose-lg max-w-none dark:prose-invert"
                    />
                  );
                
                default:
                  return null;
              }
            })}
          </div>
        );
      }
    } catch (e) {
      // ليس JSON، نتابع للمعالجات الأخرى
      console.log('Content is not JSON blocks, trying Markdown...');
    }
    
    // معالجة المحتوى كـ Markdown
    // تحسين الكشف عن المحتوى Markdown
    const markdownIndicators = ['#', '**', '*', '![', '[', '|', '>', '-', '```'];
    const hasMarkdown = markdownIndicators.some(indicator => content.includes(indicator));
    
    if (hasMarkdown) {
      console.log('Processing as Markdown content...');
      // تكوين marked للغة العربية
      marked.setOptions({
        breaks: true,
        gfm: true
      });
      
      // معالجة المحتوى وتحويله إلى HTML
      let htmlContent = marked(content) as string;
      
      // إضافة أنماط للجداول
      htmlContent = htmlContent.replace(/<table>/g, '<div class="table-container"><table>');
      htmlContent = htmlContent.replace(/<\/table>/g, '</table></div>');
      
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          className="prose prose-lg max-w-none dark:prose-invert 
            prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
            prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-6
            prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-3
            prose-p:text-lg prose-p:leading-[1.9] prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:mb-4
            prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
            prose-em:italic
            prose-img:rounded-lg prose-img:shadow-lg prose-img:mx-auto prose-img:my-8
            prose-blockquote:border-r-4 prose-blockquote:border-blue-600 prose-blockquote:pr-4 prose-blockquote:italic prose-blockquote:my-6
            prose-ul:list-disc prose-ul:list-inside prose-ul:space-y-2 prose-ul:my-4
            prose-ol:list-decimal prose-ol:list-inside prose-ol:space-y-2 prose-ol:my-4
            prose-li:text-lg prose-li:text-gray-700 dark:prose-li:text-gray-300
            prose-table:w-full prose-table:my-8
            prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:p-3 prose-th:font-bold prose-th:text-right prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600
            prose-td:p-3 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600
            prose-tr:even:bg-gray-50 dark:prose-tr:even:bg-gray-800/50
            space-y-4"
        />
      );
    }
    
    // معالجة المحتوى النصي العادي
    const paragraphs = content
      .split(/\n\s*\n|\r\n\s*\r\n|(?:\. )(?=[A-Z\u0600-\u06FF])/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (paragraphs.length > 0) {
      return (
        <div className="space-y-6">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-lg leading-[1.9] text-gray-700 dark:text-gray-300">
              {paragraph}
            </p>
          ))}
        </div>
      );
    }
    
    // عرض المحتوى كـ HTML كخيار أخير
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: content }}
        className="prose prose-lg max-w-none dark:prose-invert"
      />
    );
  };

  // عرض مؤشر تحميل موحد قبل تحميل الصفحة بالكامل في المتصفح لتجنب أخطاء Hydration
  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">جاري تحميل المقال...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">المقال غير موجود</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">عذراً، لم نتمكن من العثور على المقال المطلوب</p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              <Home className="w-5 h-5" />
              العودة إلى الرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MobileOptimizer>
      <MobileHeader />
      
      <article className="min-h-screen bg-white dark:bg-gray-900">
        {/* صورة المقال */}
        {article.featured_image && (
          <div className="relative w-full h-48 sm:h-64 md:h-96">
            <img
              src={getImageUrl(article.featured_image) || generatePlaceholderImage(article.title)}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}
        
        {/* محتوى المقال */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            {/* معلومات المقال */}
            <div className="mb-6">
              {article.category && (
                <span 
                  className="inline-block px-3 py-1 text-xs sm:text-sm font-medium rounded-full mb-3"
                  style={{ 
                    backgroundColor: `${getCategoryColor(article.category)}20`,
                    color: getCategoryColor(article.category) 
                  }}
                >
                  {article.category.name_ar || (article.category as any)?.name || article.category_name || 'غير مصنف'}
                </span>
              )}
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
                {article.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                {article.author && (
                  <div className="flex items-center gap-2">
                    {typeof article.author === 'object' && article.author.avatar && (
                      <img
                        src={article.author.avatar}
                        alt={article.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span>{article.author_name || (article.author && typeof article.author === 'object' ? article.author.name : article.author) || '—'}</span>
                  </div>
                )}
                
                <span>•</span>
                
                <time>{formatFullDate(article.published_at || article.created_at)}</time>
                
                {article.reading_time && (
                  <>
                    <span>•</span>
                    <span>{article.reading_time} دقيقة قراءة</span>
                  </>
                )}
                
                {article.views_count !== undefined && (
                  <>
                    <span>•</span>
                    <span>{article.views_count} مشاهدة</span>
                  </>
                )}
              </div>
            </div>
            
            {/* المحتوى */}
            <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
              {renderArticleContent(article.content)}
            </div>
            
            {/* أزرار المشاركة والتفاعل */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span>إعجاب</span>
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span>حفظ</span>
                  </button>
                </div>
                
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: article.title,
                        text: article.summary || article.title,
                        url: window.location.href
                      })
                    }
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.432-2.684m5.432 2.684l-3.276 4.408a4.5 4.5 0 01-7.364 0l-3.276-4.408a3 3 0 10-5.432 2.684m15.464 0A3 3 0 0118 12c0 .482-.114.938-.316 1.342" />
                  </svg>
                  <span>مشاركة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </MobileOptimizer>
  )
}

// دوال مساعدة
function shareOnSocial(platform: string, title: string, url: string) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  
  const urls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle} ${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  };
  
  if (urls[platform as keyof typeof urls]) {
    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
  }
}

function calculateReadingTime(content: any): number {
  if (!content) return 1;
  
  let wordCount = 0;
  if (typeof content === 'string') {
    wordCount = content.split(' ').length;
  } else if (Array.isArray(content)) {
    content.forEach((block: any) => {
      if (block.text) {
        wordCount += block.text.split(' ').length;
      }
    });
  }
  
  return Math.max(1, Math.ceil(wordCount / 200)); // 200 كلمة في الدقيقة
} 