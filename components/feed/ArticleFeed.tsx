/**
 * خلاصة المقالات الشاملة
 * Comprehensive Article Feed Component
 * @version 1.0.0
 * @author Sabq AI Team
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analyticsManager, EventType } from '../../lib/analytics';

// أنواع المقالات والخلاصة
export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
  tags: string[];
  publishedAt: Date;
  updatedAt?: Date;
  readingTime: number;
  wordCount: number;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  featured: boolean;
  trending: boolean;
  premium: boolean;
  images: {
    thumbnail?: string;
    featured?: string;
    gallery?: string[];
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  status: 'draft' | 'published' | 'archived';
}

export interface FeedConfig {
  // التخطيط
  layout: 'grid' | 'list' | 'cards' | 'masonry';
  columns?: number;
  showImages?: boolean;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  showTags?: boolean;
  showStats?: boolean;
  
  // التصفية والترتيب
  category?: string;
  tags?: string[];
  author?: string;
  sortBy?: 'publishedAt' | 'viewsCount' | 'likesCount' | 'trending';
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
  premium?: boolean;
  
  // التقسيم
  pageSize?: number;
  enableInfiniteScroll?: boolean;
  enableLoadMore?: boolean;
  
  // السلوك
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableBookmarks?: boolean;
  enableSharing?: boolean;
  trackViews?: boolean;
}

export interface ArticleFeedProps {
  // البيانات
  articles?: Article[];
  loading?: boolean;
  error?: string;
  
  // التكوين
  config?: Partial<FeedConfig>;
  
  // التخصيص
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
  
  // الأحداث
  onArticleClick?: (article: Article) => void;
  onAuthorClick?: (author: Article['author']) => void;
  onCategoryClick?: (category: Article['category']) => void;
  onTagClick?: (tag: string) => void;
  onBookmark?: (article: Article) => void;
  onShare?: (article: Article, platform: string) => void;
  onLoadMore?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: any) => void;
}

// التكوين الافتراضي
const defaultConfig: FeedConfig = {
  layout: 'cards',
  columns: 3,
  showImages: true,
  showExcerpt: true,
  showAuthor: true,
  showDate: true,
  showCategory: true,
  showTags: false,
  showStats: true,
  sortBy: 'publishedAt',
  sortOrder: 'desc',
  pageSize: 12,
  enableInfiniteScroll: true,
  enableLoadMore: false,
  enableSearch: true,
  enableFilters: true,
  enableBookmarks: true,
  enableSharing: true,
  trackViews: true
};

// مكون خلاصة المقالات الرئيسي
export const ArticleFeed: React.FC<ArticleFeedProps> = ({
  articles = [],
  loading = false,
  error,
  config: userConfig,
  title,
  subtitle,
  emptyMessage = 'لا توجد مقالات متاحة',
  loadingMessage = 'جاري التحميل...',
  className = '',
  onArticleClick,
  onAuthorClick,
  onCategoryClick,
  onTagClick,
  onBookmark,
  onShare,
  onLoadMore,
  onSearch,
  onFilter
}) => {
  const config = { ...defaultConfig, ...userConfig };
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [visibleArticles, setVisibleArticles] = useState<Article[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();
  const feedRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // تحديث المقالات المرئية
  useEffect(() => {
    let filtered = [...articles];

    // تطبيق البحث
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // تطبيق المرشحات
    if (config.category) {
      filtered = filtered.filter(article => article.category.slug === config.category);
    }
    
    if (config.tags && config.tags.length > 0) {
      filtered = filtered.filter(article => 
        article.tags.some(tag => config.tags!.includes(tag))
      );
    }

    if (config.featured !== undefined) {
      filtered = filtered.filter(article => article.featured === config.featured);
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (config.sortBy) {
        case 'viewsCount':
          aVal = a.viewsCount;
          bVal = b.viewsCount;
          break;
        case 'likesCount':
          aVal = a.likesCount;
          bVal = b.likesCount;
          break;
        case 'trending':
          aVal = a.trending ? 1 : 0;
          bVal = b.trending ? 1 : 0;
          break;
        default:
          aVal = new Date(a.publishedAt).getTime();
          bVal = new Date(b.publishedAt).getTime();
      }

      return config.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    setVisibleArticles(filtered.slice(0, config.pageSize));
    setHasMore(filtered.length > config.pageSize);
  }, [articles, searchQuery, activeFilters, config]);

  // إعداد التمرير اللانهائي
  useEffect(() => {
    if (!config.enableInfiniteScroll || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, config.enableInfiniteScroll]);

  // معالج تحميل المزيد
  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return;
    
    const currentLength = visibleArticles.length;
    const nextBatch = articles.slice(currentLength, currentLength + config.pageSize!);
    
    setVisibleArticles(prev => [...prev, ...nextBatch]);
    setHasMore(currentLength + nextBatch.length < articles.length);
    
    onLoadMore?.();
  }, [articles, visibleArticles, hasMore, loading, config.pageSize, onLoadMore]);

  // معالج النقر على المقال
  const handleArticleClick = async (article: Article, event?: React.MouseEvent) => {
    // تتبع النقرة
    if (config.trackViews) {
      await analyticsManager.trackArticleView({
        id: article.id,
        title: article.title,
        category: article.category.name,
        author: article.author.name,
        publishDate: article.publishedAt,
        wordCount: article.wordCount,
        readingTime: article.readingTime,
        tags: article.tags
      });
    }

    onArticleClick?.(article);

    // التنقل إلى المقال
    if (!event?.defaultPrevented) {
      router.push(`/articles/${article.slug}`);
    }
  };

  // معالج البحث
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);

    // تتبع البحث
    if (query) {
      analyticsManager.trackSearch(query, visibleArticles.length);
    }
  };

  // معالج المشاركة
  const handleShare = async (article: Article, platform: string) => {
    const url = `${window.location.origin}/articles/${article.slug}`;
    
    // تتبع المشاركة
    await analyticsManager.trackEvent({
      type: EventType.ARTICLE_SHARE,
      category: 'social',
      action: 'share',
      label: platform,
      metadata: {
        customDimensions: {
          articleId: article.id,
          articleTitle: article.title,
          platform: platform
        },
        customMetrics: {},
        articleData: {
          id: article.id,
          title: article.title,
          category: article.category.name,
          author: article.author.name,
          publishDate: article.publishedAt,
          wordCount: article.wordCount,
          readingTime: article.readingTime,
          tags: article.tags
        }
      }
    });

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + url)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }

    onShare?.(article, platform);
  };

  // معالج الإشارة المرجعية
  const handleBookmark = (article: Article) => {
    const newBookmarks = new Set(bookmarkedArticles);
    
    if (bookmarkedArticles.has(article.id)) {
      newBookmarks.delete(article.id);
    } else {
      newBookmarks.add(article.id);
    }
    
    setBookmarkedArticles(newBookmarks);
    onBookmark?.(article);
  };

  // تنسيق التاريخ
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // تنسيق وقت القراءة
  const formatReadingTime = (minutes: number): string => {
    return `${minutes} دقيقة قراءة`;
  };

  // فئات CSS
  const feedClasses = [
    'sabq-feed',
    `sabq-feed--${config.layout}`,
    `sabq-feed--columns-${config.columns}`,
    className
  ].filter(Boolean).join(' ');

  // عرض حالة التحميل
  if (loading && visibleArticles.length === 0) {
    return (
      <div className="sabq-feed-loading">
        <div className="sabq-feed-loading-spinner"></div>
        <p>{loadingMessage}</p>
      </div>
    );
  }

  // عرض حالة الخطأ
  if (error) {
    return (
      <div className="sabq-feed-error">
        <p>❌ {error}</p>
        <button onClick={() => window.location.reload()}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // عرض رسالة فارغة
  if (visibleArticles.length === 0) {
    return (
      <div className="sabq-feed-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div ref={feedRef} className={feedClasses}>
      {/* رأس الخلاصة */}
      {(title || subtitle || config.enableSearch) && (
        <div className="sabq-feed-header">
          {title && <h2 className="sabq-feed-title">{title}</h2>}
          {subtitle && <p className="sabq-feed-subtitle">{subtitle}</p>}
          
          {config.enableSearch && (
            <div className="sabq-feed-search">
              <input
                type="search"
                placeholder="ابحث في المقالات..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="sabq-feed-search-input"
              />
            </div>
          )}
        </div>
      )}

      {/* مرشحات الخلاصة */}
      {config.enableFilters && (
        <div className="sabq-feed-filters">
          {/* مرشحات التصنيف والعلامات */}
        </div>
      )}

      {/* شبكة المقالات */}
      <div className="sabq-feed-grid">
        {visibleArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            config={config}
            isBookmarked={bookmarkedArticles.has(article.id)}
            onClick={handleArticleClick}
            onAuthorClick={onAuthorClick}
            onCategoryClick={onCategoryClick}
            onTagClick={onTagClick}
            onBookmark={handleBookmark}
            onShare={handleShare}
            formatDate={formatDate}
            formatReadingTime={formatReadingTime}
          />
        ))}
      </div>

      {/* تحميل المزيد */}
      {hasMore && (
        <div className="sabq-feed-load-more">
          {config.enableLoadMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="sabq-feed-load-more-btn"
            >
              {loading ? 'جاري التحميل...' : 'تحميل المزيد'}
            </button>
          )}
          
          {config.enableInfiniteScroll && (
            <div ref={loadMoreRef} className="sabq-feed-infinite-trigger">
              {loading && <div className="sabq-feed-loading-spinner"></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// مكون بطاقة المقال
interface ArticleCardProps {
  article: Article;
  config: FeedConfig;
  isBookmarked: boolean;
  onClick: (article: Article, event?: React.MouseEvent) => void;
  onAuthorClick?: (author: Article['author']) => void;
  onCategoryClick?: (category: Article['category']) => void;
  onTagClick?: (tag: string) => void;
  onBookmark: (article: Article) => void;
  onShare: (article: Article, platform: string) => void;
  formatDate: (date: Date) => string;
  formatReadingTime: (minutes: number) => string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  config,
  isBookmarked,
  onClick,
  onAuthorClick,
  onCategoryClick,
  onTagClick,
  onBookmark,
  onShare,
  formatDate,
  formatReadingTime
}) => {
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  return (
    <article className="sabq-article-card">
      {/* صورة المقال */}
      {config.showImages && article.images.thumbnail && (
        <div className="sabq-article-image">
          <img
            src={article.images.thumbnail}
            alt={article.title}
            loading="lazy"
            onClick={(e) => onClick(article, e)}
          />
          
          {article.featured && (
            <span className="sabq-article-badge sabq-article-badge--featured">
              مميز
            </span>
          )}
          
          {article.trending && (
            <span className="sabq-article-badge sabq-article-badge--trending">
              رائج
            </span>
          )}
          
          {article.premium && (
            <span className="sabq-article-badge sabq-article-badge--premium">
              مميز
            </span>
          )}
        </div>
      )}

      {/* محتوى المقال */}
      <div className="sabq-article-content">
        {/* التصنيف */}
        {config.showCategory && (
          <button
            onClick={() => onCategoryClick?.(article.category)}
            className="sabq-article-category"
            style={{ backgroundColor: article.category.color }}
          >
            {article.category.name}
          </button>
        )}

        {/* عنوان المقال */}
        <h3 className="sabq-article-title">
          <Link
            href={`/articles/${article.slug}`}
            onClick={(e) => {
              e.preventDefault();
              onClick(article);
            }}
          >
            {article.title}
          </Link>
        </h3>

        {/* مقتطف المقال */}
        {config.showExcerpt && (
          <p className="sabq-article-excerpt">{article.excerpt}</p>
        )}

        {/* العلامات */}
        {config.showTags && article.tags.length > 0 && (
          <div className="sabq-article-tags">
            {article.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className="sabq-article-tag"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* بيانات وصفية */}
        <div className="sabq-article-meta">
          {/* المؤلف */}
          {config.showAuthor && (
            <button
              onClick={() => onAuthorClick?.(article.author)}
              className="sabq-article-author"
            >
              {article.author.avatar && (
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="sabq-article-author-avatar"
                />
              )}
              <span>{article.author.name}</span>
            </button>
          )}

          {/* التاريخ */}
          {config.showDate && (
            <span className="sabq-article-date">
              {formatDate(article.publishedAt)}
            </span>
          )}

          {/* وقت القراءة */}
          <span className="sabq-article-reading-time">
            {formatReadingTime(article.readingTime)}
          </span>
        </div>

        {/* إحصائيات وإجراءات */}
        {config.showStats && (
          <div className="sabq-article-stats">
            <span className="sabq-article-stat">
              👁️ {article.viewsCount.toLocaleString('ar')}
            </span>
            <span className="sabq-article-stat">
              ❤️ {article.likesCount.toLocaleString('ar')}
            </span>
            <span className="sabq-article-stat">
              💬 {article.commentsCount.toLocaleString('ar')}
            </span>
          </div>
        )}

        {/* إجراءات المقال */}
        <div className="sabq-article-actions">
          {config.enableBookmarks && (
            <button
              onClick={() => onBookmark(article)}
              className={`sabq-article-action ${isBookmarked ? 'sabq-article-action--active' : ''}`}
              aria-label="إضافة إلى الإشارات المرجعية"
            >
              🔖
            </button>
          )}

          {config.enableSharing && (
            <div className="sabq-article-share">
              <button
                onClick={() => setShareMenuOpen(!shareMenuOpen)}
                className="sabq-article-action"
                aria-label="مشاركة المقال"
              >
                📤
              </button>

              {shareMenuOpen && (
                <div className="sabq-article-share-menu">
                  <button onClick={() => onShare(article, 'twitter')}>
                    تويتر
                  </button>
                  <button onClick={() => onShare(article, 'facebook')}>
                    فيسبوك
                  </button>
                  <button onClick={() => onShare(article, 'linkedin')}>
                    لينكدإن
                  </button>
                  <button onClick={() => onShare(article, 'whatsapp')}>
                    واتساب
                  </button>
                  <button onClick={() => onShare(article, 'copy')}>
                    نسخ الرابط
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

// خطاف للمقالات
export const useArticles = (config?: Partial<FeedConfig>) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // في تطبيق حقيقي، سيتم جلب المقالات من API
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('فشل في جلب المقالات');

      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return { articles, loading, error, refetch: fetchArticles };
};

// أنماط CSS أساسية
export const ArticleFeedStyles = `
.sabq-feed {
  width: 100%;
}

.sabq-feed-grid {
  display: grid;
  gap: 2rem;
}

.sabq-feed--grid .sabq-feed-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.sabq-feed--list .sabq-feed-grid {
  grid-template-columns: 1fr;
}

.sabq-feed--cards .sabq-feed-grid {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.sabq-article-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.sabq-article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.sabq-article-image {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.sabq-article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.sabq-article-content {
  padding: 1.5rem;
}

.sabq-article-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.5rem 0 1rem;
  line-height: 1.4;
}

.sabq-article-title a {
  text-decoration: none;
  color: #1f2937;
}

.sabq-article-title a:hover {
  color: #3b82f6;
}

.sabq-article-excerpt {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.sabq-article-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.sabq-article-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sabq-article-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}
`; 