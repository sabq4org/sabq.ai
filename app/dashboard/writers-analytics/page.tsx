'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, Eye, Heart, Share2, 
  MessageSquare, Calendar, Clock, Lightbulb, Sparkles,
  Target, Award, Zap, BookOpen, Star, ArrowUp, ArrowDown
} from 'lucide-react';

interface ArticlePerformance {
  id: string;
  title: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  published_date: string;
  reading_time: number;
  engagement_rate: number;
  performance_score: number;
  trending_score: number;
}

interface AIRecommendation {
  id: string;
  type: 'topic' | 'timing' | 'style' | 'collaboration';
  title: string;
  description: string;
  confidence: number;
  potential_impact: 'high' | 'medium' | 'low';
  reasoning: string[];
  suggested_keywords: string[];
  estimated_engagement: number;
}

interface WriterStats {
  total_articles: number;
  total_views: number;
  total_engagement: number;
  avg_reading_time: number;
  follower_count: number;
  engagement_growth: number;
  top_category: string;
  best_posting_time: string;
  current_streak: number;
}

export default function WritersAnalyticsPage() {
  const [stats, setStats] = useState<WriterStats | null>(null);
  const [articles, setArticles] = useState<ArticlePerformance[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'ai-suggestions'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    
    try {
      // محاكاة جلب البيانات
      await new Promise(resolve => setTimeout(resolve, 2000));

      // إحصائيات وهمية
      const mockStats: WriterStats = {
        total_articles: 47,
        total_views: 284650,
        total_engagement: 12840,
        avg_reading_time: 5.8,
        follower_count: 3420,
        engagement_growth: 18.5,
        top_category: 'التقنية والابتكار',
        best_posting_time: '9:00 ص',
        current_streak: 12
      };

      // أداء المقالات الوهمي
      const mockArticles: ArticlePerformance[] = [
        {
          id: '1',
          title: 'مستقبل الذكاء الاصطناعي في السعودية',
          views: 15420,
          likes: 890,
          shares: 145,
          comments: 78,
          published_date: '2024-01-15',
          reading_time: 7,
          engagement_rate: 8.2,
          performance_score: 92,
          trending_score: 88
        },
        {
          id: '2',
          title: 'رؤية 2030 والتحول الرقمي',
          views: 12350,
          likes: 654,
          shares: 89,
          comments: 45,
          published_date: '2024-01-10',
          reading_time: 5,
          engagement_rate: 6.8,
          performance_score: 78,
          trending_score: 72
        },
        {
          id: '3',
          title: 'الطاقة المتجددة في المملكة',
          views: 9870,
          likes: 432,
          shares: 67,
          comments: 34,
          published_date: '2024-01-05',
          reading_time: 6,
          engagement_rate: 5.4,
          performance_score: 65,
          trending_score: 58
        }
      ];

      // توصيات AI وهمية
      const mockRecommendations: AIRecommendation[] = [
        {
          id: '1',
          type: 'topic',
          title: 'اكتب عن "الميتافيرس في التعليم"',
          description: 'موضوع رائج حالياً مع اهتمام كبير من الجمهور السعودي',
          confidence: 94,
          potential_impact: 'high',
          reasoning: [
            'زيادة 340% في البحث عن هذا المصطلح',
            'مطابق لاهتمامات جمهورك',
            'قلة المحتوى العربي في هذا المجال'
          ],
          suggested_keywords: ['ميتافيرس', 'تعليم رقمي', 'واقع افتراضي', 'تقنية تعليمية'],
          estimated_engagement: 12500
        },
        {
          id: '2',
          type: 'timing',
          title: 'انشر مقالك القادم الثلاثاء 9:00 ص',
          description: 'أفضل وقت لزيادة التفاعل بناءً على سلوك جمهورك',
          confidence: 87,
          potential_impact: 'medium',
          reasoning: [
            'أعلى نشاط لجمهورك في هذا التوقيت',
            'أقل منافسة من الكتاب الآخرين',
            'تحليل 6 أشهر من البيانات'
          ],
          suggested_keywords: [],
          estimated_engagement: 8200
        },
        {
          id: '3',
          type: 'style',
          title: 'أضف المزيد من الإحصائيات والأرقام',
          description: 'مقالاتك مع الإحصائيات تحصل على تفاعل أكبر بـ 45%',
          confidence: 81,
          potential_impact: 'medium',
          reasoning: [
            'الجمهور يثق أكثر في المحتوى المدعوم بالأرقام',
            'مقالاتك السابقة مع الإحصائيات كان أداؤها أفضل',
            'اتجاه عام في المنصة'
          ],
          suggested_keywords: ['إحصائيات', 'دراسات', 'أرقام', 'بحوث'],
          estimated_engagement: 7800
        },
        {
          id: '4',
          type: 'collaboration',
          title: 'تعاون مع د. سارة الحكيم',
          description: 'كاتبة في نفس مجالك مع جمهور متداخل',
          confidence: 76,
          potential_impact: 'high',
          reasoning: [
            '35% تداخل في الجمهور',
            'تخصص مكمل لتخصصك',
            'معدل تفاعل عالي لدى جمهورها'
          ],
          suggested_keywords: [],
          estimated_engagement: 15600
        }
      ];

      setStats(mockStats);
      setArticles(mockArticles);
      setRecommendations(mockRecommendations);

    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'topic': return <Lightbulb className="w-5 h-5" />;
      case 'timing': return <Clock className="w-5 h-5" />;
      case 'style': return <Star className="w-5 h-5" />;
      case 'collaboration': return <Users className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                لوحة تحليلات الكاتب
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                رؤى ذكية واقتراحات مخصصة لتحسين أداء مقالاتك
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              نظرة عامة
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'articles'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              أداء المقالات
            </button>
            <button
              onClick={() => setActiveTab('ai-suggestions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'ai-suggestions'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              اقتراحات الذكاء الاصطناعي ({recommendations.length})
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">إجمالي</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.total_articles}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">مقال منشور</div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <ArrowUp className="w-4 h-4" />
                    +12%
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.total_views.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">مشاهدة</div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <ArrowUp className="w-4 h-4" />
                    +{stats.engagement_growth}%
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.total_engagement.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">تفاعل</div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">متابع</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.follower_count.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">متابع</div>
              </div>
            </div>

            {/* Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  تخصصك المميز
                </h3>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {stats.top_category}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  تحصل مقالاتك في هذا المجال على أعلى تفاعل
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  أفضل وقت للنشر
                </h3>
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {stats.best_posting_time}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  أعلى نشاط لجمهورك في هذا التوقيت
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  سلسلة النشر
                </h3>
                <div className="text-2xl font-bold text-yellow-600 mb-2">
                  {stats.current_streak} يوم
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  استمر في النشر للحفاظ على نشاط جمهورك
                </p>
              </div>
            </div>
          </>
        )}

        {/* Articles Performance Tab */}
        {activeTab === 'articles' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                أداء المقالات
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                تحليل تفصيلي لأداء مقالاتك الأخيرة
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="p-6 border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          نُشر في {new Date(article.published_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          article.performance_score >= 80 
                            ? 'bg-green-100 text-green-700' 
                            : article.performance_score >= 60 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {article.performance_score}/100
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                          <Eye className="w-4 h-4" />
                          <span className="font-semibold">{article.views.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">مشاهدة</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                          <Heart className="w-4 h-4" />
                          <span className="font-semibold">{article.likes}</span>
                        </div>
                        <div className="text-xs text-gray-500">إعجاب</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                          <Share2 className="w-4 h-4" />
                          <span className="font-semibold">{article.shares}</span>
                        </div>
                        <div className="text-xs text-gray-500">مشاركة</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                          <MessageSquare className="w-4 h-4" />
                          <span className="font-semibold">{article.comments}</span>
                        </div>
                        <div className="text-xs text-gray-500">تعليق</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                          <Zap className="w-4 h-4" />
                          <span className="font-semibold">{article.engagement_rate}%</span>
                        </div>
                        <div className="text-xs text-gray-500">تفاعل</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestions Tab */}
        {activeTab === 'ai-suggestions' && (
          <div className="space-y-6">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      {getTypeIcon(rec.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {rec.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getImpactColor(rec.potential_impact)}`}>
                      {rec.potential_impact === 'high' ? 'تأثير عالي' : 
                       rec.potential_impact === 'medium' ? 'تأثير متوسط' : 'تأثير منخفض'}
                    </span>
                    <span className="text-sm font-semibold text-purple-600">
                      {rec.confidence}% ثقة
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* الأسباب */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      لماذا هذا الاقتراح؟
                    </h4>
                    <ul className="space-y-2">
                      {rec.reasoning.map((reason, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* التوقعات والكلمات المفتاحية */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      التوقعات والمقترحات
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          تفاعل متوقع:
                        </span>
                        <span className="font-bold text-green-600">
                          {rec.estimated_engagement.toLocaleString()}
                        </span>
                      </div>
                      
                      {rec.suggested_keywords.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            كلمات مفتاحية مقترحة:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rec.suggested_keywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* زر العمل */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105">
                    تطبيق الاقتراح
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 