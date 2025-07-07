'use client';

import React, { useState, useEffect, use } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, Calendar, Eye, Heart, Share2, MessageSquare, Clock, 
  TrendingUp, BarChart3, Brain, Headphones, Quote, Copy,
  Sparkles, Activity, BookOpen, Users, Zap, Award,
  ChevronLeft, ChevronRight, Volume2, PieChart
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { formatDateOnly, formatRelativeDate } from '@/lib/date-utils';

// Types
interface Author {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  specialization: string;
  club: 'platinum' | 'gold' | 'silver' | 'bronze' | 'default';
  yearsOfExperience: number;
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
  joinDate: string;
  achievements: string[];
  isVerified: boolean;
  backgroundImage?: string;
  coverImage?: string;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  reading_time: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  plays_count: number;
  category_name: string;
  is_trending?: boolean;
}

interface ActivityData {
  mostActiveHours: { hour: number; count: number }[];
  topicsDistribution: { topic: string; count: number; color: string }[];
  engagementTrend: { month: string; engagement: number }[];
  averageEngagement: number;
}

interface Quote {
  id: string;
  text: string;
  articleTitle: string;
  articleId: string;
  timestamp: string;
  likes: number;
}

const AuthorProfilePage = () => {
  const params = useParams();
  const { darkMode } = useDarkModeContext();
  
  const id = params?.id;
  
  const [author, setAuthor] = useState<Author | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // نوادي الكتاب والألوان
  const writerClubColors = {
    platinum: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    silver: 'from-gray-300 to-gray-500',
    bronze: 'from-amber-600 to-amber-800',
    default: 'from-blue-400 to-blue-600'
  };

  const writerClubBorders = {
    platinum: 'border-gray-400',
    gold: 'border-yellow-400',
    silver: 'border-gray-300',
    bronze: 'border-amber-600',
    default: 'border-blue-400'
  };

  const writerClubNames = {
    platinum: 'بلاتينيوم',
    gold: 'ذهبي',
    silver: 'فضي', 
    bronze: 'برونزي',
    default: 'عضو'
  };

  // جلب بيانات الكاتب
  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        const authorId = typeof id === 'string' ? id : 'dr-mohammed-ahmad';
        
        // جلب بيانات الكاتب من API
        const response = await fetch(`/api/authors/${authorId}`);
        
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات الكاتب');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setAuthor(data.author);
          setArticles(data.articles || []);
          setActivityData(data.activityData);
          setQuotes(data.quotes || []);
          
          // رسائل chat افتراضية
          setChatMessages([
            {
              id: '1',
              type: 'bot',
              message: `مرحباً! أنا مساعد ${data.author.name} الذكي. يمكنني الإجابة على أسئلتك حول آرائه ومقالاته.`,
              timestamp: new Date().toISOString()
            }
          ]);
        } else {
          throw new Error(data.error || 'حدث خطأ غير معروف');
        }

      } catch (error) {
        console.error('خطأ في جلب بيانات الكاتب:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [id]);

  // معالج Chat AI
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    // محاكاة استجابة AI
    setTimeout(() => {
      const responses = [
        'د. محمد يؤمن بأن الذكاء الاصطناعي سيغير مستقبل التعليم بشكل جذري، لكن دور المعلم سيبقى محورياً.',
        'من خلال مقالاته، يركز د. محمد على أهمية التوازن بين التكنولوجيا والعنصر البشري في التعليم.',
        'يرى د. محمد أن أمن البيانات في التعليم الرقمي أولوية قصوى لحماية خصوصية الطلاب.',
        'بحسب آراء د. محمد، الواقع المعزز سيجعل التعلم أكثر تفاعلية وإثارة للاهتمام.'
      ];
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 2000);
  };

  // دالة مشاركة الاقتباس
  const shareQuote = (quote: Quote) => {
    if (navigator.share) {
      navigator.share({
        title: 'اقتباس من د. محمد الأحمد',
        text: `"${quote.text}" - من مقال: ${quote.articleTitle}`,
        url: `${window.location.origin}/opinion/${quote.articleId}`
      });
    } else {
      navigator.clipboard.writeText(`"${quote.text}" - ${author?.name}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">الكاتب غير موجود</h2>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            العودة إلى الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header شخصي مع خلفية ذكية */}
      <section className="relative h-96 overflow-hidden">
        {/* خلفية متدرجة مع صورة */}
        <div className="absolute inset-0">
          <img 
            src={author.backgroundImage || author.coverImage}
            alt="خلفية الكاتب"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
        </div>

        {/* محتوى Header */}
        <div className="relative h-full flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <div className="flex items-end gap-6">
              {/* صورة الكاتب */}
              <div className="relative">
                <img 
                  src={author.avatar}
                  alt={author.name}
                  className={`w-32 h-32 rounded-full object-cover border-4 ${writerClubBorders[author.club]} shadow-xl`}
                />
                <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r ${writerClubColors[author.club]} flex items-center justify-center border-4 border-white`}>
                  <Star className="w-5 h-5 text-white" />
                </div>
                {author.isVerified && (
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* معلومات الكاتب */}
              <div className="flex-1 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{author.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${writerClubColors[author.club]} text-white shadow-lg`}>
                    نادي {writerClubNames[author.club]}
                  </span>
                </div>
                
                <p className="text-xl mb-3 text-gray-200">{author.specialization}</p>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{author.totalArticles} مقال</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{(author.totalViews / 1000000).toFixed(1)}M مشاهدة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span>{(author.totalLikes / 1000).toFixed(0)}K إعجاب</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{author.yearsOfExperience} سنوات خبرة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* المحتوى الرئيسي */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* العمود الأيسر - Bio والإنجازات */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Bio ذكي */}
            <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
              <div className="flex items-center gap-2 mb-4">
                <Brain className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>نبذة ذكية</h3>
                <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full">AI</span>
              </div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {author.bio}
              </p>
            </div>

            {/* الإنجازات */}
            <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
              <div className="flex items-center gap-2 mb-4">
                <Award className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>الإنجازات</h3>
              </div>
              <div className="space-y-3">
                {author.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {achievement}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* مساعد الكاتب AI */}
            <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>مساعد الكاتب</h3>
                <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">AI</span>
              </div>
              
              {/* منطقة Chat */}
              <div className="space-y-4">
                <div className="h-48 overflow-y-auto space-y-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.type === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="اسأل عن آراء الكاتب..."
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    إرسال
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* العمود الأوسط - خريطة النشاط والمقالات */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* خريطة النشاط */}
            {activityData && (
              <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <div className="flex items-center gap-2 mb-6">
                  <Activity className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>خريطة النشاط</h3>
                  <span className="text-xs bg-gradient-to-r from-green-500 to-teal-500 text-white px-2 py-1 rounded-full">AI Analytics</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* أنشط الفترات */}
                  <div>
                    <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>أنشط فترات الكتابة</h4>
                    <div className="space-y-2">
                      {activityData.mostActiveHours.map((hour, index) => (
                        <div key={hour.hour} className="flex items-center gap-3">
                          <span className={`text-xs w-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {hour.hour}:00
                          </span>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${(hour.count / 15) * 100}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {hour.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* توزيع المواضيع */}
                  <div>
                    <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>المواضيع الأكثر تناولاً</h4>
                    <div className="space-y-2">
                      {activityData.topicsDistribution.map((topic, index) => (
                        <div key={topic.topic} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          ></div>
                          <span className={`text-xs flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {topic.topic}
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {topic.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* مستوى التفاعل الإجمالي */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>متوسط التفاعل</span>
                      <div className="text-2xl font-bold text-blue-600">{activityData.averageEngagement}%</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>
            )}

            {/* أحدث المقالات - كاروسيل */}
            <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>أحدث المقالات</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentArticleIndex(prev => prev > 0 ? prev - 1 : articles.length - 1)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                  <button
                    onClick={() => setCurrentArticleIndex(prev => prev < articles.length - 1 ? prev + 1 : 0)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <ChevronLeft className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                </div>
              </div>

              {articles.length > 0 && (
                <div className="relative overflow-hidden">
                  <div 
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(${currentArticleIndex * -100}%)` }}
                  >
                    {articles.map((article, index) => (
                      <div key={article.id} className="w-full flex-shrink-0">
                        <Link href={`/opinion/${article.id}`} className="block group">
                          <div className="flex gap-4">
                            <img 
                              src={article.featured_image}
                              alt={article.title}
                              className="w-24 h-24 object-cover rounded-lg group-hover:scale-105 transition-transform"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                  {article.category_name}
                                </span>
                                {article.is_trending && (
                                  <span className="text-xs px-2 py-1 bg-red-500 text-white rounded">
                                    ترند
                                  </span>
                                )}
                              </div>
                              <h4 className={`font-bold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {article.title}
                              </h4>
                              <p className={`text-sm mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {article.excerpt}
                              </p>
                              
                              {/* إحصائيات التفاعل */}
                              <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{article.views_count.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  <span>{article.likes_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{article.comments_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Volume2 className="w-3 h-3" />
                                  <span>{article.plays_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{article.reading_time} د</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* مؤشرات الكاروسيل */}
              <div className="flex justify-center mt-4 gap-2">
                {articles.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentArticleIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentArticleIndex 
                        ? 'bg-blue-500 w-6' 
                        : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* جدارية الاقتباسات */}
            <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
              <div className="flex items-center gap-2 mb-6">
                <Quote className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>اقتباسات مختارة</h3>
                <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full">AI Extracted</span>
              </div>

              <div className="grid gap-4">
                {quotes.map((quote, index) => (
                  <div key={quote.id} className={`p-4 rounded-lg border-l-4 border-amber-500 ${darkMode ? 'bg-gray-700/50' : 'bg-amber-50'} group hover:shadow-lg transition-all`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <blockquote className={`text-lg italic mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          "{quote.text}"
                        </blockquote>
                        <div className="flex items-center gap-4 text-sm">
                          <Link href={`/opinion/${quote.articleId}`} className={`hover:text-blue-600 transition-colors ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            من مقال: {quote.articleTitle}
                          </Link>
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatRelativeDate(quote.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => shareQuote(quote)}
                          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                          title="مشاركة الاقتباس"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 text-xs">
                          <Heart className="w-3 h-3" />
                          <span>{quote.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorProfilePage;