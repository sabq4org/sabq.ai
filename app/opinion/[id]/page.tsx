'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Heart, Share2, Volume2, Eye, Clock, Calendar, User, MessageSquare,
  ThumbsUp, ThumbsDown, Lightbulb, TrendingUp, BarChart3, 
  Headphones, Zap, Star, FileText, ChevronRight, PlayCircle,
  BookOpen, Target, Sparkles, Brain, ArrowRight, Quote
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import EconomicCharts from '@/components/EconomicCharts';

interface OpinionArticleDetail {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  author_bio?: string;
  author_specialization?: string;
  author_club?: 'platinum' | 'gold' | 'silver' | 'bronze' | 'default';
  featured_image?: string;
  published_at: string;
  reading_time?: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  category_name: string;
  ai_summary?: string;
  key_points?: string[];
  poll_question?: string;
  poll_options?: { text: string; votes: number }[];
  related_articles?: any[];
  charts?: any[];
}

export default function OpinionArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { darkMode } = useDarkModeContext();
  const [article, setArticle] = useState<OpinionArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userVote, setUserVote] = useState<'agree' | 'disagree' | null>(null);
  const [showKeyIdea, setShowKeyIdea] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        
        // بيانات وهمية للمقال
        const mockArticle: OpinionArticleDetail = {
          id: id,
          title: 'مستقبل الذكاء الاصطناعي في التعليم السعودي',
          content: `
            <p>تشهد المملكة العربية السعودية تطوراً هائلاً في مجال التعليم، حيث تسعى رؤية 2030 إلى تحويل النظام التعليمي ليواكب متطلبات العصر الرقمي.</p>
            
            <p>يُعد الذكاء الاصطناعي أحد أهم الأدوات التي يمكن أن تُحدث نقلة نوعية في التعليم، من خلال تخصيص المناهج لكل طالب حسب قدراته وميوله.</p>
            
            <p>لقد شهدت السنوات الأخيرة استثمارات ضخمة في هذا المجال، حيث أطلقت الحكومة السعودية العديد من المبادرات الرائدة.</p>
            
            <h3>التحديات والفرص</h3>
            <p>رغم الفرص الهائلة، هناك تحديات تتطلب معالجة دقيقة، منها تدريب المعلمين والبنية التحتية التقنية.</p>
            
            <p>في النهاية، المستقبل مُشرق لقطاع التعليم في المملكة، وسنشهد تطورات مذهلة في السنوات القادمة.</p>
          `,
          author_name: 'د. محمد الأحمد',
          author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          author_bio: 'خبير في التقنيات التعليمية ورؤية 2030، أستاذ في جامعة الملك سعود',
          author_specialization: 'تقنية التعليم',
          author_club: 'gold',
          featured_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
          published_at: new Date().toISOString(),
          reading_time: 8,
          views_count: 12500,
          likes_count: 850,
          comments_count: 145,
          category_name: 'تقنية',
          ai_summary: 'يناقش الكاتب أهمية دمج الذكاء الاصطناعي في النظام التعليمي السعودي وتأثيره على مستقبل الطلاب والمعلمين في ظل رؤية 2030. يسلط الضوء على الفرص والتحديات ويؤكد على أهمية الاستثمار في التدريب والبنية التحتية.',
          key_points: [
            'رؤية 2030 تهدف لتحويل النظام التعليمي ليواكب العصر الرقمي',
            'الذكاء الاصطناعي يمكّن من تخصيص المناهج حسب قدرات كل طالب',
            'استثمارات حكومية ضخمة في مبادرات التعليم التقني',
            'ضرورة تدريب المعلمين وتطوير البنية التحتية التقنية',
            'مستقبل مُشرق لقطاع التعليم في المملكة'
          ],
          poll_question: 'هل تعتقد أن الذكاء الاصطناعي سيحسن جودة التعليم في المملكة؟',
          poll_options: [
            { text: 'نعم، بشكل كبير', votes: 68 },
            { text: 'نعم، بشكل محدود', votes: 22 },
            { text: 'لا أعتقد ذلك', votes: 10 }
          ],
          related_articles: [
            { id: '2', title: 'رؤية 2030 وتطوير التعليم العالي', author: 'د. سارة المحمد' },
            { id: '3', title: 'التحول الرقمي في المدارس السعودية', author: 'أ. خالد العتيبي' }
          ],
          charts: [
            {
              type: 'bar',
              title: 'الاستثمار في التعليم التقني (بالمليار ريال)',
              data: [
                { label: '2020', value: '5.2', percentage: 40 },
                { label: '2021', value: '7.8', percentage: 60 },
                { label: '2022', value: '10.5', percentage: 80 },
                { label: '2023', value: '13.2', percentage: 100 }
              ],
              description: 'نمو مستمر في الاستثمار الحكومي بقطاع التعليم التقني'
            },
            {
              type: 'pie',
              title: 'توزيع الميزانية على البرامج التعليمية',
              data: [
                { label: 'التعليم العام', value: 45 },
                { label: 'التعليم العالي', value: 30 },
                { label: 'التدريب التقني', value: 15 },
                { label: 'التعليم الإلكتروني', value: 10 }
              ]
            }
          ]
        };

        setArticle(mockArticle);
        
        // محاكاة اقتراحات الذكاء الاصطناعي للتعليقات
        setAiSuggestions([
          'ما رأيك في التحديات التي قد تواجه تطبيق هذه التقنيات؟',
          'هل جربت أي أدوات ذكاء اصطناعي في التعليم؟',
          'كيف يمكن تدريب المعلمين على استخدام هذه التقنيات؟'
        ]);
        
      } catch (error) {
        console.error('خطأ في جلب تفاصيل المقال:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handleTTSPlay = () => {
    if (!article?.ai_summary) return;
    
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(article.ai_summary);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    utterance.onend = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
  };

  const handleVote = (vote: 'agree' | 'disagree') => {
    setUserVote(vote);
    // إرسال التصويت للخادم
  };

  const extractKeyIdea = () => {
    setShowKeyIdea(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">المقال غير موجود</h1>
          <Link href="/opinion" className="text-blue-600 hover:underline">
            العودة لقائمة المقالات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* صورة الغطاء والعنوان */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={article.featured_image} 
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/90 text-white rounded-full text-sm font-medium">
                <FileText className="w-4 h-4" />
                {article.category_name}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {article.title}
            </h1>
            
            {/* معلومات الكاتب */}
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={article.author_avatar} 
                alt={article.author_name}
                className="w-16 h-16 rounded-full border-4 border-yellow-400"
              />
              <div>
                <h3 className="text-xl font-bold text-white">{article.author_name}</h3>
                <p className="text-gray-200">{article.author_specialization}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(article.published_at).toLocaleDateString('ar-SA')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {article.reading_time} دقائق
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {article.views_count.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ملخص AI */}
        <section className={`mb-12 p-6 rounded-2xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-blue-50 border border-blue-100'}`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Brain className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                ملخص ذكي بالذكاء الاصطناعي
              </h2>
              <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {article.ai_summary}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleTTSPlay}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 ${
              isPlaying 
                ? 'bg-green-500 text-white' 
                : darkMode 
                  ? 'bg-gray-700 hover:bg-green-900/20 text-gray-300 hover:text-green-400' 
                  : 'bg-white hover:bg-green-50 text-gray-700 hover:text-green-600 shadow-lg'
            }`}
          >
            {isPlaying ? (
              <Volume2 className="w-5 h-5 animate-pulse" />
            ) : (
              <Headphones className="w-5 h-5" />
            )}
            <span>{isPlaying ? 'جاري التشغيل...' : 'استمع للملخص'}</span>
          </button>
        </section>

        {/* النقاط الأساسية */}
        <section className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <Target className={`w-6 h-6 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            النقاط الأساسية
          </h2>
          
          <div className="space-y-4">
            {article.key_points?.map((point, index) => (
              <div 
                key={index}
                className={`flex items-start gap-4 p-4 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg hover:shadow-xl transition-all`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-blue-500' : 
                  index === 1 ? 'bg-green-500' : 
                  index === 2 ? 'bg-purple-500' : 
                  index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                }`}>
                  {index + 1}
                </div>
                <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* محتوى المقال */}
        <section className="mb-12">
          <div 
            className={`prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </section>

        {/* الرسوم البيانية (للمقالات الاقتصادية) */}
        {article.charts && article.charts.length > 0 && (
          <EconomicCharts charts={article.charts} darkMode={darkMode} />
        )}

        {/* لوحة التفاعل */}
        <section className={`mb-12 p-8 rounded-2xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
          <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            شارك رأيك حول هذا المقال
          </h2>
          
          {/* التصويت */}
          <div className="mb-8">
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {article.poll_question}
            </h3>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => handleVote('agree')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all hover:scale-105 ${
                  userVote === 'agree' 
                    ? 'bg-green-500 text-white scale-105' 
                    : darkMode 
                      ? 'bg-gray-700 hover:bg-green-900/20 text-gray-300 hover:text-green-400' 
                      : 'bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-600'
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                <span>أوافق</span>
              </button>
              
              <button 
                onClick={() => handleVote('disagree')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all hover:scale-105 ${
                  userVote === 'disagree' 
                    ? 'bg-red-500 text-white scale-105' 
                    : darkMode 
                      ? 'bg-gray-700 hover:bg-red-900/20 text-gray-300 hover:text-red-400' 
                      : 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600'
                }`}
              >
                <ThumbsDown className="w-5 h-5" />
                <span>لا أوافق</span>
              </button>
            </div>
          </div>

          {/* استخراج الفكرة الرئيسية */}
          <div className="text-center mb-8">
            <button 
              onClick={extractKeyIdea}
              className="flex items-center gap-3 px-8 py-4 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
            >
              <Lightbulb className="w-5 h-5" />
              <span>استخرج أهم فكرة</span>
            </button>
            
            {showKeyIdea && (
              <div className={`mt-6 p-6 rounded-xl ${darkMode ? 'bg-purple-900/20 border border-purple-700' : 'bg-purple-50 border border-purple-200'}`}>
                <Quote className={`w-8 h-8 mx-auto mb-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <p className={`text-lg font-medium italic ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                  "الاستثمار في التعليم الذكي اليوم هو استثمار في مستقبل الأجيال القادمة"
                </p>
              </div>
            )}
          </div>
        </section>

        {/* اقتراحات التعليقات الذكية */}
        <section className={`mb-12 p-6 rounded-2xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <Sparkles className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            اقتراحات للنقاش
          </h3>
          
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <button 
                key={index}
                className={`block w-full text-right p-4 rounded-xl transition-all hover:scale-[1.02] ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>

        {/* معلومات الكاتب والمقالات ذات الصلة */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* ملف الكاتب */}
          <section className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              عن الكاتب
            </h3>
            
            <div className="flex items-start gap-4 mb-4">
              <img 
                src={article.author_avatar} 
                alt={article.author_name}
                className="w-16 h-16 rounded-full border-4 border-yellow-400"
              />
              <div>
                <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {article.author_name}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {article.author_specialization}
                </p>
              </div>
            </div>
            
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {article.author_bio}
            </p>
            
            <Link 
              href={`/author/${article.id}`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>عرض جميع مقالاته</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>

          {/* المقالات ذات الصلة */}
          <section className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              مقالات ذات صلة
            </h3>
            
            <div className="space-y-4">
              {article.related_articles?.map((relatedArticle, index) => (
                <Link 
                  key={index}
                  href={`/opinion/${relatedArticle.id}`}
                  className={`block p-4 rounded-xl transition-all hover:scale-[1.02] ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {relatedArticle.title}
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    بقلم: {relatedArticle.author}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
} 