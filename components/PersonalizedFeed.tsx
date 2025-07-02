'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Clock, Eye, Share2, MessageSquare, 
  BookmarkPlus, Sparkles, User, Calendar,
  TrendingUp, Star, Heart
} from 'lucide-react';

interface PersonalizedArticle {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  featured_image?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  category?: {
    id: number;
    name: string;
    color: string;
  };
  published_at: string;
  reading_time?: number;
  stats?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    saves: number;
  };
  recommendation_reason?: string;
  category_weight?: number;
  author_weight?: number;
}

interface PersonalizedFeedProps {
  userId?: string;
  limit?: number;
}

export default function PersonalizedFeed({ userId, limit = 10 }: PersonalizedFeedProps) {
  const [articles, setArticles] = useState<PersonalizedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interacting, setInteracting] = useState<string | null>(null);

  // جلب المحتوى المخصص
  useEffect(() => {
    if (!userId) return;
    
    const fetchPersonalizedContent = async () => {
      try {
        const response = await fetch(`/api/content/personalized?user_id=${userId}&limit=${limit}`);
        const data = await response.json();
        
        if (data.success) {
          setArticles(data.data.articles);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('فشل في تحميل المحتوى المخصص');
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalizedContent();
  }, [userId, limit]);

  // تسجيل التفاعل
  const recordInteraction = async (
    articleId: string, 
    interactionType: 'view' | 'read' | 'like' | 'share' | 'save'
  ) => {
    if (!userId) return;
    
    setInteracting(articleId);
    
    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          article_id: articleId,
          interaction_type: interactionType,
          source: 'personalized_feed',
          device: 'web'
        })
      });
      
      // تحديث الإحصائيات محلياً
      if (interactionType !== 'view' && interactionType !== 'read') {
        setArticles(prev => prev.map(article => {
          if (article.id === articleId && article.stats) {
            const statKey = interactionType === 'save' ? 'saves' : `${interactionType}s` as keyof typeof article.stats;
            return {
              ...article,
              stats: {
                ...article.stats,
                [statKey]: (article.stats[statKey] || 0) + 1
              }
            };
          }
          return article;
        }));
      }
    } catch (error) {
      console.error('Error recording interaction:', error);
    } finally {
      setInteracting(null);
    }
  };

  // الحصول على أيقونة ووصف سبب التوصية
  const getRecommendationInfo = (reason?: string) => {
    switch (reason) {
      case 'based_on_interests':
        return {
          icon: <Sparkles className="w-4 h-4" />,
          text: 'مبني على اهتماماتك',
          color: 'text-purple-600'
        };
      case 'favorite_author':
        return {
          icon: <User className="w-4 h-4" />,
          text: 'من كاتب مفضل',
          color: 'text-blue-600'
        };
      case 'trending':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          text: 'رائج الآن',
          color: 'text-orange-600'
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-32 h-32 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-12 text-center">
        <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد محتوى مخصص بعد</h3>
        <p className="text-gray-500">تفاعل أكثر مع المقالات لنتمكن من تخصيص المحتوى لك</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* رأس القسم */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">محتوى مخصص لك</h2>
            <p className="text-sm text-gray-600">مقالات مختارة بناءً على اهتماماتك</p>
          </div>
        </div>
      </div>

      {/* قائمة المقالات */}
      {articles.map((article) => {
        const recommendInfo = getRecommendationInfo(article.recommendation_reason);
        
        return (
          <article 
            key={article.id}
            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
          >
            <div className="flex gap-4 p-6">
              {/* الصورة البارزة */}
              {article.featured_image && (
                <Link 
                  href={`/articles/${article.id}`}
                  onClick={() => recordInteraction(article.id, 'view')}
                  className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0"
                >
                  <Image
                    src={article.featured_image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 128px, 160px"
                    className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  {recommendInfo && (
                    <div className={`absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 ${recommendInfo.color}`}>
                      {recommendInfo.icon}
                      <span className="text-xs font-medium">{recommendInfo.text}</span>
                    </div>
                  )}
                </Link>
              )}

              {/* المحتوى */}
              <div className="flex-1 min-w-0">
                {/* العنوان والوصف */}
                <Link 
                  href={`/articles/${article.id}`}
                  onClick={() => recordInteraction(article.id, 'view')}
                  className="block"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="text-gray-600 line-clamp-2 mb-3">{article.summary}</p>
                  )}
                </Link>

                {/* البيانات الوصفية */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {/* المؤلف */}
                  {article.author && (
                    <div className="flex items-center gap-2">
                      {article.author.avatar ? (
                        <Image
                          src={article.author.avatar}
                          alt={article.author.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span>{article.author.name}</span>
                    </div>
                  )}

                  {/* التاريخ */}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(article.published_at).toLocaleDateString('ar-SA')}</span>
                  </div>

                  {/* وقت القراءة */}
                  {article.reading_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{article.reading_time} دقائق</span>
                    </div>
                  )}

                  {/* التصنيف */}
                  {article.category && (
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${article.category.color}20`,
                        color: article.category.color 
                      }}
                    >
                      {article.category.name}
                    </span>
                  )}
                </div>

                {/* أزرار التفاعل */}
                <div className="flex items-center gap-2 mt-4">
                  {/* الإحصائيات */}
                  {article.stats && (
                    <>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="w-4 h-4" />
                        <span>{article.stats.views}</span>
                      </div>

                      <button
                        onClick={() => recordInteraction(article.id, 'like')}
                        disabled={interacting === article.id}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Heart className={`w-4 h-4 ${article.stats.likes > 0 ? 'fill-current' : ''}`} />
                        <span>{article.stats.likes}</span>
                      </button>

                      <button
                        onClick={() => recordInteraction(article.id, 'share')}
                        disabled={interacting === article.id}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{article.stats.shares}</span>
                      </button>

                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        <span>{article.stats.comments}</span>
                      </div>
                    </>
                  )}

                  {/* زر الحفظ */}
                  <button
                    onClick={() => recordInteraction(article.id, 'save')}
                    disabled={interacting === article.id}
                    className="mr-auto p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                  >
                    <BookmarkPlus className="w-5 h-5" />
                  </button>
                </div>

                {/* مؤشر الثقة (للتطوير) */}
                {article.category_weight && article.category_weight > 5 && (
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(Math.min(5, Math.floor(article.category_weight / 2)))].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                    ))}
                    <span className="text-xs text-gray-500 mr-1">توافق عالي</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}

      {/* زر تحميل المزيد */}
      {articles.length >= limit && (
        <div className="text-center pt-4">
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all">
            عرض المزيد من المقالات
          </button>
        </div>
      )}
    </div>
  );
} 