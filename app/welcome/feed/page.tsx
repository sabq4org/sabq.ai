'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, Star, TrendingUp, Clock, User, Share2, 
  BookOpen, Zap, ArrowRight, Gift, Award, Target,
  Sparkles, Trophy, Calendar, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  name: string;
  interests: string[];
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  category_id: number;
  featured_image: string;
  published_at: string;
  author: {
    name: string;
  };
  views: number;
  reading_time: number;
}

const interestMap: { [key: string]: { name: string; color: string; icon: any } } = {
  'tech': { name: 'تقنية', color: 'from-blue-500 to-cyan-500', icon: Zap },
  'business': { name: 'اقتصاد', color: 'from-green-500 to-emerald-500', icon: TrendingUp },
  'sports': { name: 'رياضة', color: 'from-orange-500 to-red-500', icon: Trophy },
  'culture': { name: 'ثقافة', color: 'from-purple-500 to-pink-500', icon: BookOpen },
  'health': { name: 'صحة', color: 'from-pink-500 to-rose-500', icon: Heart },
  'international': { name: 'دولي', color: 'from-indigo-500 to-blue-500', icon: Target }
};

export default function WelcomeFeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [recommendedArticles, setRecommendedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(5); // النقاط المكتسبة من الاهتمامات

  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // جلب المقالات المقترحة بناءً على الاهتمامات
          fetchRecommendedArticles(parsedUser.interests);
        } else {
          // إذا لم توجد بيانات المستخدم، توجيه للصفحة الرئيسية
          router.push('/');
        }
      } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
        router.push('/');
      }
    };

    loadUserData();
  }, [router]);

  const fetchRecommendedArticles = async (interests: string[]) => {
    try {
      setLoading(true);
      
      // جلب المقالات من التصنيفات المختارة
      const promises = interests.slice(0, 3).map(async (interest) => {
        const categoryId = getCategoryId(interest);
        const response = await fetch(`/api/articles?category_id=${categoryId}&limit=2&status=published&sort=published_at&order=desc`);
        if (response.ok) {
          const data = await response.json();
          return data.articles || [];
        }
        return [];
      });

      const results = await Promise.all(promises);
      const allArticles = results.flat();
      setRecommendedArticles(allArticles);
      
    } catch (error) {
      console.error('خطأ في جلب المقالات المقترحة:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryId = (interest: string) => {
    const mapping: { [key: string]: number } = {
      'tech': 1,
      'business': 2,
      'sports': 3,
      'culture': 4,
      'health': 5,
      'international': 6
    };
    return mapping[interest] || 1;
  };

  const handleStartReading = () => {
    toast.success('مرحباً بك في صحيفة سبق! 🎉');
    router.push('/');
  };

  const handleArticleClick = async (articleId: string) => {
    // تسجيل التفاعل
    if (user?.id) {
      try {
        await fetch('/api/interactions/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            articleId: articleId,
            interactionType: 'view',
            metadata: {
              source: 'welcome_feed',
              timestamp: new Date().toISOString()
            }
          }),
        });
      } catch (error) {
        console.error('خطأ في تسجيل التفاعل:', error);
      }
    }
    
    router.push(`/article/${articleId}`);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحضير تجربتك المخصصة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* خلفية ديناميكية */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 pt-20">
        {/* ترحيب شخصي */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg dark:shadow-gray-900/50 mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            أهلاً بك يا {user.name}! 🎉
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            تهانينا! لقد أكملت إعداد ملفك الشخصي وحصلت على أول نقاط الولاء. إليك تجربة مخصصة بناءً على اهتماماتك.
          </p>

          {/* بطاقة نقاط الولاء */}
          <div className="inline-flex items-center gap-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50 mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">+{loyaltyPoints} نقاط ولاء</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">مكافأة إتمام الاهتمامات</p>
            </div>
          </div>
        </div>

        {/* اهتمامات المستخدم */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">اهتماماتك المختارة</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {user.interests.map((interest) => {
              const interestData = interestMap[interest];
              if (!interestData) return null;
              
              const Icon = interestData.icon;
              return (
                <div
                  key={interest}
                  className={`flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${interestData.color} text-white rounded-full shadow-lg transform hover:scale-105 transition-all duration-300`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{interestData.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* المقالات المقترحة */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">مقالات مخصصة لك</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article.id)}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
              >
                {article.featured_image && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                      {typeof article.category === 'string' ? article.category : ((article.category as any)?.name_ar || (article.category as any)?.name || 'عام')}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{article.reading_time || 3} دقائق</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{article.author?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{article.views || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* إحصائيات وتحفيز */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">مستوى مبتدئ</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">ابدأ رحلتك في القراءة</p>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-4">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{loyaltyPoints} نقطة</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">نقاط الولاء الحالية</p>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">اليوم الأول</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">من رحلتك معنا</p>
          </div>
        </div>

        {/* نصائح سريعة */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/50 dark:border-gray-700/50 mb-12">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">نصائح لتحقيق أقصى استفادة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white mb-1">اقرأ يومياً</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">احصل على نقاط إضافية بقراءة مقال واحد يومياً</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex-shrink-0">
                <Share2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white mb-1">شارك المحتوى</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">احصل على 5 نقاط عند مشاركة مقال</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex-shrink-0">
                <Heart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white mb-1">تفاعل مع المحتوى</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">أعجب واحفظ المقالات المفضلة</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex-shrink-0">
                <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white mb-1">حدّث اهتماماتك</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">يمكنك تعديل اهتماماتك في أي وقت</p>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleStartReading}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <span>ابدأ القراءة الآن</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <Link
            href="/profile"
            className="px-8 py-4 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
          >
            عرض الملف الشخصي
          </Link>
        </div>
      </div>
    </div>
  );
} 