'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Share2, Eye, Clock, Calendar, User, MessageCircle, 
  Heart, Bookmark, ArrowLeft, Menu, X, ChevronUp 
} from 'lucide-react';

import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { formatFullDate, formatRelativeDate } from '@/lib/date-utils';
import { getImageUrl } from '@/lib/utils';
import { ArticleMobileLayout } from '@/components/mobile/MobileLayout';
import MobileArticleCard from '@/components/mobile/MobileArticleCard';
import CommentsSection from '@/components/comments/CommentsSection';

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
  views_count: number;
  likes_count?: number;
  shares_count?: number;
  created_at: string;
  published_at?: string;
  updated_at?: string;
  reading_time?: number;
  is_breaking?: boolean;
  is_featured?: boolean;
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

interface PageProps {
  params: Promise<{ id: string }>
}

export default function MobileArticlePage({ params }: PageProps) {
  const router = useRouter();
  const { darkMode } = useDarkModeContext();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [articleId, setArticleId] = useState<string>('');
  const [readProgress, setReadProgress] = useState(0);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      const resolvedParams = await params;
      
      if (resolvedParams?.id) {
        const cleanArticleId = resolvedParams.id.trim();
        setArticleId(cleanArticleId);
        await fetchArticle(cleanArticleId);
      }
    }

    loadArticle();
  }, [params]);

  // مراقبة التمرير
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadProgress(Math.min(progress, 100));
      
      // إظهار القائمة العائمة عند التمرير
      setShowFloatingMenu(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchArticle = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }
      
      const data = await response.json();
      setArticle(data.article);
      
      // تسجيل مشاهدة المقال
      await trackView(id);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async (articleId: string) => {
    try {
      await fetch('/api/interactions/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          interaction_type: 'view',
          source: 'mobile'
        })
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleLike = async () => {
    if (!article) return;
    
    try {
      const response = await fetch(`/api/articles/${article.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setLiked(!liked);
        // تحديث عدد الإعجابات محلياً
        setArticle(prev => prev ? {
          ...prev,
          likes_count: (prev.likes_count || 0) + (liked ? -1 : 1)
        } : null);
      }
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  const handleSave = async () => {
    if (!article) return;
    
    try {
      const response = await fetch(`/api/articles/${article.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setSaved(!saved);
      }
    } catch (error) {
      console.error('Error saving article:', error);
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
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    } else {
      shareOnSocial(platform, title, url);
    }
    
    setShowShareMenu(false);
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    
    // تقسيم المحتوى إلى فقرات
    const paragraphs = content
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    return (
      <div className="mobile-article-content space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-base leading-7 text-gray-700 dark:text-gray-300">
            {paragraph}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <ArticleMobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ArticleMobileLayout>
    );
  }

  if (!article) {
    return (
      <ArticleMobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              المقال غير موجود
            </h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </ArticleMobileLayout>
    );
  }

  return (
    <ArticleMobileLayout>
      {/* مؤشر تقدم القراءة */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* الهيدر المبسط */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowFloatingMenu(!showFloatingMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* الصورة الرئيسية */}
      <div className="relative w-full h-64 overflow-hidden">
        <img
          src={getImageUrl(article.featured_image) || '/default-image.jpg'}
          alt={article.featured_image_alt || article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* شارة عاجل */}
        {article.is_breaking && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            عاجل
          </div>
        )}
      </div>

      {/* محتوى المقال */}
      <article className="px-4 py-6">
        {/* العنوان */}
        <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white mb-4">
          {article.title}
        </h1>

        {/* العنوان الفرعي */}
        {article.subtitle && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {article.subtitle}
          </p>
        )}

        {/* الملخص الذكي */}
        {(article.summary || article.ai_summary) && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">AI</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  ملخص ذكي
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {article.summary || article.ai_summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* معلومات المقال */}
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{article.author_name || 'كاتب مجهول'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{article.reading_time || 5} دقائق</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{article.views_count || 0}</span>
          </div>
        </div>

        {/* التصنيف */}
        {article.category_name && (
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-full">
              {article.category_name}
            </span>
          </div>
        )}

        {/* محتوى المقال */}
        <div className="prose prose-lg max-w-none dark:prose-invert mb-8">
          {renderContent(article.content)}
        </div>

        {/* أزرار التفاعل */}
        <div className="flex items-center justify-between py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                liked 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{article.likes_count || 0}</span>
            </button>
            
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                saved 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
              <span>حفظ</span>
            </button>
          </div>
          
          <button
            onClick={() => setShowShareMenu(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"
          >
            <Share2 className="w-5 h-5" />
            <span>مشاركة</span>
          </button>
        </div>

        {/* المقالات ذات الصلة */}
        {article.related_articles && article.related_articles.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              مقالات ذات صلة
            </h3>
            <div className="space-y-4">
              {article.related_articles.slice(0, 3).map((relatedArticle) => (
                <MobileArticleCard
                  key={relatedArticle.id}
                  article={{
                    ...relatedArticle,
                    category_id: 0,
                    views_count: 0,
                    content: ''
                  }}
                  viewMode="compact"
                />
              ))}
            </div>
          </div>
        )}
      </article>

      {/* قسم التعليقات */}
      <div className="px-4 pb-6">
        <CommentsSection 
          articleId={article.id} 
          allowComments={article.allow_comments !== false}
        />
      </div>

      {/* قائمة المشاركة */}
      {showShareMenu && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowShareMenu(false)}
          />
          <div className="relative w-full bg-white dark:bg-gray-900 rounded-t-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                مشاركة المقال
              </h3>
              <button
                onClick={() => setShowShareMenu(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex flex-col items-center gap-2 p-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">W</span>
                </div>
                <span className="text-sm">واتساب</span>
              </button>
              
              <button
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
                <span className="text-sm">تويتر</span>
              </button>
              
              <button
                onClick={() => handleShare('copy')}
                className="flex flex-col items-center gap-2 p-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"
              >
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
                <span className="text-sm">
                  {copySuccess ? 'تم النسخ!' : 'نسخ الرابط'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* زر العودة للأعلى */}
      {showFloatingMenu && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors z-40"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </ArticleMobileLayout>
  );
}

// دالة مساعدة للمشاركة
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