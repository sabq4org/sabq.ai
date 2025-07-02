'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, ThumbsUp, ThumbsDown, Share2, Bookmark, Eye, Clock, User, TrendingUp, Users, Award, Target, Lightbulb, Brain, Zap, Sparkles, BarChart3, Vote, MessageSquare, Bot, Crown, Star, Heart, Activity } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface InteractiveArticle {
  id: string;
  title: string;
  topic: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    expertise: string;
  };
  stats: {
    views: number;
    participants: number;
    responses: number;
    duration: string;
  };
  discussion: {
    question: string;
    options: Array<{
      id: string;
      text: string;
      votes: number;
      percentage: number;
    }>;
  };
  poll: {
    question: string;
    options: Array<{
      id: string;
      text: string;
      votes: number;
      percentage: number;
    }>;
  };
  responses: Array<{
    id: string;
    user: {
      name: string;
      avatar: string;
      role: string;
    };
    content: string;
    timestamp: string;
    likes: number;
    isExpert: boolean;
    tags: string[];
  }>;
  tags: string[];
  relatedTopics: string[];
}

export default function InteractiveArticlePage() {
  const params = useParams();
  const { user, isLoggedIn } = useAuth();
  const [article, setArticle] = useState<InteractiveArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPollOption, setSelectedPollOption] = useState<string>('');
  const [selectedDiscussionOption, setSelectedDiscussionOption] = useState<string>('');
  const [newResponse, setNewResponse] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [userVoted, setUserVoted] = useState(false);

  // بيانات تجريبية للمقال التفاعلي
  useEffect(() => {
    const mockArticle: InteractiveArticle = {
      id: params.id as string,
      title: "تأثير رؤية 2030 على الاقتصاد المحلي",
      topic: "التحولات الاقتصادية والتنمية المستدامة",
      description: "ناقش التحولات الاقتصادية الجذرية التي تشهدها المملكة في إطار رؤية 2030، وشارك تجربتك الشخصية مع القراء حول كيفية تأثير هذه التغييرات على حياتك اليومية ومستقبلك المهني.",
      author: {
        name: "د. أحمد محمد",
        avatar: "/default-avatar.png",
        expertise: "خبير اقتصادي ومحلل سياسات التنمية"
      },
      stats: {
        views: 15420,
        participants: 2847,
        responses: 156,
        duration: "أسبوعين"
      },
      discussion: {
        question: "كيف أثرت رؤية 2030 على حياتك المهنية والشخصية؟",
        options: [
          { id: '1', text: 'تحسن كبير في الفرص الوظيفية', votes: 1247, percentage: 43.8 },
          { id: '2', text: 'زيادة في الدخل والرفاهية', votes: 892, percentage: 31.3 },
          { id: '3', text: 'تحديات في التكيف مع التغييرات', votes: 456, percentage: 16.0 },
          { id: '4', text: 'لم أشعر بتأثير كبير بعد', votes: 252, percentage: 8.9 }
        ]
      },
      poll: {
        question: "ما هو القطاع الذي تعتقد أنه الأكثر استفادة من رؤية 2030؟",
        options: [
          { id: '1', text: 'السياحة والترفيه', votes: 567, percentage: 19.9 },
          { id: '2', text: 'التقنية والابتكار', votes: 892, percentage: 31.3 },
          { id: '3', text: 'الطاقة المتجددة', votes: 678, percentage: 23.8 },
          { id: '4', text: 'الخدمات المالية', votes: 456, percentage: 16.0 },
          { id: '5', text: 'التعليم والتدريب', votes: 254, percentage: 8.9 }
        ]
      },
      responses: [
        {
          id: '1',
          user: {
            name: "سارة أحمد",
            avatar: "/default-avatar.png",
            role: "مهندسة برمجيات"
          },
          content: "كموظفة في قطاع التقنية، أشعر أن رؤية 2030 فتحت أمامي أبواباً كثيرة. التحول الرقمي المتسارع خلق فرص عمل جديدة وأجور أفضل. أرى مستقبلاً مشرقاً لقطاع التقنية في المملكة.",
          timestamp: "منذ ساعتين",
          likes: 45,
          isExpert: false,
          tags: ["تقنية", "وظائف", "تحول رقمي"]
        },
        {
          id: '2',
          user: {
            name: "محمد العتيبي",
            avatar: "/default-avatar.png",
            role: "مستشار اقتصادي"
          },
          content: "من وجهة نظر اقتصادية، رؤية 2030 تمثل نقلة نوعية في الاقتصاد السعودي. التنويع الاقتصادي وتقليل الاعتماد على النفط سيؤدي إلى استقرار أكبر وفرص نمو متنوعة. التحدي الأكبر هو في سرعة التكيف مع هذه التغييرات.",
          timestamp: "منذ 4 ساعات",
          likes: 67,
          isExpert: true,
          tags: ["اقتصاد", "تحليل", "تنويع اقتصادي"]
        },
        {
          id: '3',
          user: {
            name: "فاطمة الزهراني",
            avatar: "/default-avatar.png",
            role: "طالبة جامعية"
          },
          content: "كطالبة في مجال السياحة، أرى أن رؤية 2030 غيرت نظرة المجتمع للسياحة المحلية. أصبح هناك اهتمام أكبر بالتراث والثقافة المحلية، وهذا يفتح فرص عمل كثيرة للشباب السعودي.",
          timestamp: "منذ 6 ساعات",
          likes: 32,
          isExpert: false,
          tags: ["سياحة", "شباب", "تراث"]
        }
      ],
      tags: ["رؤية 2030", "اقتصاد", "تنمية", "وظائف", "تحول رقمي"],
      relatedTopics: ["الاقتصاد الأخضر", "الذكاء الاصطناعي", "الطاقة المتجددة", "السياحة المستدامة"]
    };

    setTimeout(() => {
      setArticle(mockArticle);
      setLoading(false);
    }, 1000);
  }, [params.id]);

  const handleVote = (type: 'poll' | 'discussion', optionId: string) => {
    if (!isLoggedIn) {
      alert('يرجى تسجيل الدخول للمشاركة');
      return;
    }

    if (type === 'poll') {
      setSelectedPollOption(optionId);
    } else {
      setSelectedDiscussionOption(optionId);
    }
    setUserVoted(true);
  };

  const handleSubmitResponse = () => {
    if (!newResponse.trim()) return;
    
    // إضافة الرد الجديد
    const newResponseObj = {
      id: Date.now().toString(),
      user: {
        name: user?.name || 'مستخدم',
        avatar: user?.avatar || '/default-avatar.png',
        role: 'قارئ'
      },
      content: newResponse,
      timestamp: 'الآن',
      likes: 0,
      isExpert: false,
      tags: []
    };

    setArticle(prev => prev ? {
      ...prev,
      responses: [newResponseObj, ...prev.responses]
    } : null);
    
    setNewResponse('');
    setShowResponseForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل المقال التفاعلي...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">لم يتم العثور على المقال</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header الصحيفة */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 shadow-2xl">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link href="/" className="flex items-center space-x-2 space-x-reverse text-white hover:text-blue-200 transition-colors">
                <ArrowLeft className="w-6 h-6" />
                <span className="font-semibold text-lg">العودة للصفحة الرئيسية</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white">صحيفة سبق</h1>
                <p className="text-blue-100 font-medium">المقالات التفاعلية الذكية</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse text-white bg-white/20 px-4 py-2 rounded-full">
                <Brain className="w-5 h-5" />
                <span className="font-medium">تفاعلي + ذكاء اصطناعي</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* عنوان المقال */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full mb-6 shadow-lg">
            <Sparkles className="w-5 h-5" />
            <span className="text-base font-medium">مقال تفاعلي ذكي</span>
            <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
            {article.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-6">
            {article.description}
          </p>
          <div className="flex items-center justify-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>تفاعل مباشر</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>تحليل ذكي</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>نتائج فورية</span>
            </div>
          </div>
        </div>

        {/* معلومات الكاتب */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 mb-8 border-2 border-blue-200">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{article.author.name}</h3>
              <p className="text-gray-600 mb-2">{article.author.expertise}</p>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">متصل الآن</span>
              </div>
            </div>
            <div className="flex items-center space-x-6 space-x-reverse text-sm">
              <div className="text-center p-3 bg-white rounded-xl shadow-md border border-gray-100">
                <div className="flex items-center space-x-1 space-x-reverse text-blue-600 mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="font-bold">{article.stats.views.toLocaleString()}</span>
                </div>
                <span className="text-gray-500">مشاهدات</span>
              </div>
              <div className="text-center p-3 bg-white rounded-xl shadow-md border border-gray-100">
                <div className="flex items-center space-x-1 space-x-reverse text-green-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="font-bold">{article.stats.participants.toLocaleString()}</span>
                </div>
                <span className="text-gray-500">مشاركون</span>
              </div>
              <div className="text-center p-3 bg-white rounded-xl shadow-md border border-gray-100">
                <div className="flex items-center space-x-1 space-x-reverse text-purple-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">{article.stats.duration}</span>
                </div>
                <span className="text-gray-500">مدة النقاش</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-8">
            {/* استطلاع الرأي */}
            <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-xl p-6 border-2 border-green-200">
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Vote className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">📊 استطلاع الرأي</h2>
                  <p className="text-gray-600">تصويت سريع ومباشر - اختر إجابة واحدة فقط</p>
                  <div className="flex items-center space-x-2 space-x-reverse mt-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 font-medium">تصويت فوري - نتائج فورية</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200">
                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">؟</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900">{article.poll.question}</p>
                </div>
                <div className="space-y-3">
                  {article.poll.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleVote('poll', option.id)}
                      disabled={selectedPollOption === option.id}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                        selectedPollOption === option.id
                          ? 'border-green-500 bg-green-50 shadow-lg transform scale-105'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedPollOption === option.id
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedPollOption === option.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-gray-900 font-medium">{option.text}</span>
                        </div>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <span className="text-sm text-gray-600">{option.votes.toLocaleString()} صوت</span>
                          <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${option.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-green-600 min-w-[3rem]">{option.percentage}%</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedPollOption && (
                  <div className="mt-4 p-3 bg-green-100 rounded-xl border border-green-300">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-green-800 font-medium">تم تسجيل تصويتك بنجاح!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* المناقشة التفاعلية */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-blue-200">
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">💬 مناقشة تفاعلية</h2>
                  <p className="text-gray-600">شارك تجربتك الشخصية واقرأ آراء الآخرين</p>
                  <div className="flex items-center space-x-2 space-x-reverse mt-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-600 font-medium">نقاش تفصيلي - تجارب شخصية</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">💭</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900">{article.discussion.question}</p>
                </div>
                <div className="space-y-3">
                  {article.discussion.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleVote('discussion', option.id)}
                      disabled={selectedDiscussionOption === option.id}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                        selectedDiscussionOption === option.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedDiscussionOption === option.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedDiscussionOption === option.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-gray-900 font-medium">{option.text}</span>
                        </div>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <span className="text-sm text-gray-600">{option.votes.toLocaleString()} مشاركة</span>
                          <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${option.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-blue-600 min-w-[3rem]">{option.percentage}%</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedDiscussionOption && (
                  <div className="mt-4 p-3 bg-blue-100 rounded-xl border border-blue-300">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-blue-800 font-medium">تم تسجيل مشاركتك بنجاح!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* الردود والتعليقات */}
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">💬 الردود والتعليقات</h2>
                    <p className="text-gray-600">{article.responses.length} رد</p>
                  </div>
                </div>
                {isLoggedIn && (
                  <button
                    onClick={() => setShowResponseForm(!showResponseForm)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center space-x-2 space-x-reverse transform hover:scale-105"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>أضف رداً</span>
                  </button>
                )}
              </div>

              {showResponseForm && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
                  <textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    className="w-full p-4 border border-purple-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                  />
                  <div className="flex justify-end space-x-3 space-x-reverse mt-3">
                    <button
                      onClick={() => setShowResponseForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSubmitResponse}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      إرسال
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {article.responses.map((response, index) => (
                  <div key={response.id} className={`border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-102 ${
                    response.isExpert 
                      ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50' 
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}>
                    <div className="flex items-start space-x-4 space-x-reverse mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 space-x-reverse mb-2">
                          <h4 className="font-semibold text-gray-900">{response.user.name}</h4>
                          {response.isExpert && (
                            <div className="flex items-center space-x-1 space-x-reverse bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                              <Crown className="w-3 h-3" />
                              <span>خبير</span>
                            </div>
                          )}
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{response.user.role}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{response.timestamp}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{response.content}</p>
                        <div className="flex items-center space-x-4 space-x-reverse mt-3">
                          <button className="flex items-center space-x-1 space-x-reverse text-gray-500 hover:text-red-500 transition-colors">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">{response.likes}</span>
                          </button>
                          <button className="flex items-center space-x-1 space-x-reverse text-gray-500 hover:text-blue-500 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">رد</span>
                          </button>
                          <button className="flex items-center space-x-1 space-x-reverse text-gray-500 hover:text-green-500 transition-colors">
                            <Share2 className="w-4 h-4" />
                            <span className="text-sm">مشاركة</span>
                          </button>
                        </div>
                        {response.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {response.tags.map((tag) => (
                              <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* الشريط الجانبي */}
          <div className="space-y-6">
            {/* إحصائيات النقاش */}
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-xl p-6 border-2 border-orange-200">
              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">إحصائيات النقاش</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <span className="text-gray-700">المشاهدات</span>
                  <span className="font-bold text-blue-600">{article.stats.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <span className="text-gray-700">المشاركون</span>
                  <span className="font-bold text-green-600">{article.stats.participants.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <span className="text-gray-700">الردود</span>
                  <span className="font-bold text-purple-600">{article.stats.responses.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                  <span className="text-gray-700">مدة النقاش</span>
                  <span className="font-bold text-orange-600">{article.stats.duration}</span>
                </div>
              </div>
            </div>

            {/* مواضيع ذات صلة */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">مواضيع ذات صلة</h3>
              </div>
              <div className="space-y-3">
                {article.relatedTopics.map((topic) => (
                  <Link
                    key={topic}
                    href="#"
                    className="block p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl hover:shadow-md transition-all duration-300 border border-teal-100 hover:border-teal-300"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Lightbulb className="w-4 h-4 text-teal-600" />
                      <span className="text-gray-700 font-medium">{topic}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* دعوة للمشاركة */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">شارك في النقاش</h3>
                <p className="text-purple-100 mb-4">ساهم برأيك وتجربتك الشخصية</p>
                {!isLoggedIn ? (
                  <Link
                    href="/login"
                    className="inline-block bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    تسجيل الدخول للمشاركة
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowResponseForm(true)}
                    className="inline-block bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    أضف رداً الآن
                  </button>
                )}
              </div>
            </div>

            {/* عناصر الذكاء الاصطناعي */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-2xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Bot className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">🤖 تحليل الذكاء الاصطناعي</h3>
                <p className="text-indigo-100 mb-6">تحليل متقدم لآراء المشاركين باستخدام أحدث تقنيات AI</p>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                    <span>معدل الرضا العام</span>
                    <span className="font-bold text-green-300">87%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                    <span>جودة النقاش</span>
                    <span className="font-bold text-yellow-300">ممتاز</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                    <span>مستوى التفاعل</span>
                    <span className="font-bold text-blue-300">عالي جداً</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                    <span>تحليل المشاعر</span>
                    <span className="font-bold text-purple-300">إيجابي</span>
                  </div>
                </div>
                <div className="mt-6 p-3 bg-white/10 rounded-xl">
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs">تحليل فوري باستخدام GPT-4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 