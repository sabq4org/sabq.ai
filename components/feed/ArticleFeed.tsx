"use client";
import { useEffect, useState } from "react";
import { trackEvent, trackClick, usePageTracking } from "../../lib/analytics";
import Link from "next/link";

type Article = {
  id: string;
  title: string;
  summary: string;
  content?: string;
  published_at: string;
  category: string;
  tags: string[];
  author: { 
    name: string;
    avatar?: string;
  };
  image_url?: string;
  views_count?: number;
  likes_count?: number;
};

export default function ArticleFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // تتبع مشاهدة صفحة المقالات
    usePageTracking();
    
    // جلب المقالات
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/articles");
      if (!res.ok) {
        throw new Error("فشل في جلب المقالات");
      }
      const data = await res.json();
      setArticles(data.articles || []);
      
      // تتبع تحميل المقالات بنجاح
      await trackEvent("articles_loaded", { 
        articlesCount: data.articles?.length || 0 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      await trackEvent("articles_load_error", { 
        error: err instanceof Error ? err.message : "unknown" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = async (article: Article) => {
    // تتبع النقر على المقال
    await trackClick("article_card", {
      articleId: article.id,
      articleTitle: article.title,
      category: article.category,
      author: article.author.name,
    });
  };

  const handleCategoryClick = async (category: string) => {
    await trackClick("category_tag", { category });
  };

  const handleAuthorClick = async (author: string) => {
    await trackClick("author_name", { author });
  };

  if (loading) {
    return <ArticleSkeletonLoader />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">⚠️ {error}</div>
        <button 
          onClick={fetchArticles}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">أحدث المقالات</h2>
        <p className="text-gray-600">اكتشف أحدث المقالات والأخبار من سبق</p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">📰 لا توجد مقالات متاحة حالياً</div>
          <button 
            onClick={fetchArticles}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            تحديث
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {articles.map((article) => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              onArticleClick={handleArticleClick}
              onCategoryClick={handleCategoryClick}
              onAuthorClick={handleAuthorClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// مكون بطاقة المقال
function ArticleCard({ 
  article, 
  onArticleClick, 
  onCategoryClick, 
  onAuthorClick 
}: {
  article: Article;
  onArticleClick: (article: Article) => void;
  onCategoryClick: (category: string) => void;
  onAuthorClick: (author: string) => void;
}) {
  return (
    <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="md:flex">
        {article.image_url && (
          <div className="md:w-1/3">
            <img 
              src={article.image_url} 
              alt={article.title}
              className="w-full h-48 md:h-full object-cover"
            />
          </div>
        )}
        
        <div className={`p-6 ${article.image_url ? 'md:w-2/3' : 'w-full'}`}>
          {/* تصنيف المقال */}
          <div className="mb-3">
            <button
              onClick={() => onCategoryClick(article.category)}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              {article.category}
            </button>
          </div>

          {/* عنوان المقال */}
          <Link href={`/articles/${article.id}`}>
            <h3 
              className="text-xl font-bold text-gray-800 mb-3 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2"
              onClick={() => onArticleClick(article)}
            >
              {article.title}
            </h3>
          </Link>

          {/* ملخص المقال */}
          <p className="text-gray-600 mb-4 line-clamp-3">
            {article.summary}
          </p>

          {/* العلامات */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                >
                  #{tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="text-gray-500 text-sm">
                  +{article.tags.length - 3} أخرى
                </span>
              )}
            </div>
          )}

          {/* معلومات المقال */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => onAuthorClick(article.author.name)}
                className="flex items-center space-x-2 space-x-reverse hover:text-blue-600 transition-colors"
              >
                {article.author.avatar && (
                  <img 
                    src={article.author.avatar} 
                    alt={article.author.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span>بواسطة {article.author.name}</span>
              </button>
              
              <span>•</span>
              
              <time dateTime={article.published_at}>
                {new Date(article.published_at).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              {article.views_count && (
                <span className="flex items-center space-x-1 space-x-reverse">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{article.views_count}</span>
                </span>
              )}
              
              {article.likes_count && (
                <span className="flex items-center space-x-1 space-x-reverse">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{article.likes_count}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// مكون التحميل المؤقت
function ArticleSkeletonLoader() {
  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded-md w-64 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded-md w-96 animate-pulse"></div>
      </div>

      <div className="grid gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                <div className="w-full h-48 md:h-full bg-gray-200 animate-pulse"></div>
              </div>
              <div className="p-6 md:w-2/3">
                <div className="h-6 bg-gray-200 rounded-md w-20 mb-3 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-md w-full mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-4 animate-pulse"></div>
                <div className="flex space-x-2 space-x-reverse mb-4">
                  <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded-md w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 