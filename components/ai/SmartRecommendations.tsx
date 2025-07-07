'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, TrendingUp, User, Heart, BookOpen, 
  ChevronRight, Star, Eye, Share2, Clock 
} from 'lucide-react';
import Link from 'next/link';
import { getArticleLink } from '@/lib/utils';
import { formatDateOnly } from '@/lib/date-utils';

interface RecommendedArticle {
  id: string;
  title: string;
  excerpt?: string;
  author_name: string;
  author_avatar?: string;
  category_name: string;
  featured_image?: string;
  views_count: number;
  likes_count: number;
  reading_time: number;
  published_at: string;
  similarity_score: number;
  recommendation_reason: string;
  recommendation_type: 'similar_author' | 'similar_topic' | 'trending' | 'personalized';
}

interface Author {
  id: string;
  name: string;
  avatar?: string;
  specialization: string;
  articles_count: number;
  similarity_reasons: string[];
}

interface SmartRecommendationsProps {
  currentArticleId?: string;
  currentAuthorId?: string;
  userInterests?: string[];
  readingHistory?: string[];
  limit?: number;
}

export default function SmartRecommendations({
  currentArticleId,
  currentAuthorId,
  userInterests = [],
  readingHistory = [],
  limit = 6
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedArticle[]>([]);
  const [similarAuthors, setSimilarAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'authors'>('articles');

  useEffect(() => {
    fetchRecommendations();
  }, [currentArticleId, currentAuthorId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    
    try {
      // محاكاة API للحصول على التوصيات الذكية
      await new Promise(resolve => setTimeout(resolve, 1500));

      // توصيات مقالات وهمية
      const mockRecommendations: RecommendedArticle[] = [
        {
          id: '1',
          title: 'مستقبل الذكاء الاصطناعي في التعليم السعودي',
          excerpt: 'تحليل شامل لتطبيقات AI في القطاع التعليمي ورؤية 2030',
          author_name: 'د. سارة الحكيم',
          author_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?auto=format&fit=crop&w=150&q=80',
          category_name: 'تقنية',
          featured_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=400&q=80',
          views_count: 15420,
          likes_count: 890,
          reading_time: 7,
          published_at: new Date().toISOString(),
          similarity_score: 92,
          recommendation_reason: 'موضوع مشابه لاهتماماتك في التقنية والتعليم',
          recommendation_type: 'similar_topic'
        },
        {
          id: '2',
          title: 'الاستدامة والطاقة المتجددة في المملكة',
          excerpt: 'كيف تقود المملكة التحول نحو الطاقة النظيفة عالمياً',
          author_name: 'أ. محمد الغامدي',
          author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          category_name: 'بيئة',
          featured_image: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=400&q=80',
          views_count: 12350,
          likes_count: 654,
          reading_time: 5,
          published_at: new Date(Date.now() - 86400000).toISOString(),
          similarity_score: 87,
          recommendation_reason: 'نفس الكاتب الذي أعجبك في مقالات سابقة',
          recommendation_type: 'similar_author'
        },
        {
          id: '3',
          title: 'ريادة الأعمال النسائية في العصر الرقمي',
          excerpt: 'قصص نجاح ملهمة لرائدات أعمال سعوديات غيّرن قواعد اللعبة',
          author_name: 'أ. نورا الفيصل',
          author_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
          category_name: 'أعمال',
          featured_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
          views_count: 9870,
          likes_count: 743,
          reading_time: 6,
          published_at: new Date(Date.now() - 172800000).toISOString(),
          similarity_score: 84,
          recommendation_reason: 'شائع بين القراء ذوي اهتماماتك',
          recommendation_type: 'trending'
        }
      ];

      // كتاب مشابهون وهميون
      const mockSimilarAuthors: Author[] = [
        {
          id: '1',
          name: 'د. أحمد الشهري',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
          specialization: 'تقنية واتصالات',
          articles_count: 24,
          similarity_reasons: ['يكتب في نفس المجال', 'أسلوب كتابة مشابه', 'نفس المواضيع']
        },
        {
          id: '2',
          name: 'أ. فاطمة الزهراني',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?auto=format&fit=crop&w=150&q=80',
          specialization: 'اقتصاد وأعمال',
          articles_count: 31,
          similarity_reasons: ['تحليلات عميقة', 'منظور مختلف', 'خبرة واسعة']
        }
      ];

      setRecommendations(mockRecommendations);
      setSimilarAuthors(mockSimilarAuthors);

    } catch (error) {
      console.error('خطأ في جلب التوصيات:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'similar_author': return <User className="w-4 h-4" />;
      case 'similar_topic': return <BookOpen className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      case 'personalized': return <Heart className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'similar_author': return 'text-purple-600 bg-purple-100';
      case 'similar_topic': return 'text-blue-600 bg-blue-100';
      case 'trending': return 'text-red-600 bg-red-100';
      case 'personalized': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg animate-pulse">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-20 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              اقتراحات ذكية لك
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              محتوى مخصص بناءً على اهتماماتك وقراءاتك
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'articles'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            مقالات مقترحة ({recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('authors')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'authors'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            كتاب مشابهون ({similarAuthors.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'articles' ? (
          <div className="space-y-4">
            {recommendations.slice(0, limit).map((article) => (
              <div
                key={article.id}
                className="group flex gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                {/* صورة المقال */}
                <div className="flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden">
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* محتوى المقال */}
                <div className="flex-1 min-w-0">
                  {/* شارة التوصية */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(article.recommendation_type)}`}>
                      {getRecommendationIcon(article.recommendation_type)}
                      {article.similarity_score}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {article.recommendation_reason}
                    </span>
                  </div>

                  {/* العنوان */}
                  <Link href={getArticleLink(article)}>
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                      {article.title}
                    </h4>
                  </Link>

                  {/* معلومات إضافية */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {article.author_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.views_count.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.reading_time}د
                      </span>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}

            {/* رابط عرض المزيد */}
            <div className="text-center pt-4">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-medium"
              >
                عرض جميع التوصيات
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {similarAuthors.map((author) => (
              <div
                key={author.id}
                className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                {/* صورة الكاتب */}
                <div className="flex-shrink-0">
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                </div>

                {/* معلومات الكاتب */}
                <div className="flex-1 min-w-0">
                  <Link href={`/author/${author.id}`}>
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {author.name}
                    </h4>
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {author.specialization} • {author.articles_count} مقال
                  </p>
                  
                  {/* أسباب التشابه */}
                  <div className="flex flex-wrap gap-1">
                    {author.similarity_reasons.slice(0, 2).map((reason, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-md"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}

            {/* رابط عرض المزيد */}
            <div className="text-center pt-4">
              <Link
                href="/authors"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-medium"
              >
                استكشف جميع الكتاب
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 