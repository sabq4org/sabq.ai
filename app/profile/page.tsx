'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Heart, 
  Edit2, X, Star, TrendingUp,
  Calendar, Activity, BookOpen, Share2, ChevronRight, Zap, Eye,
  MessageCircle, Bookmark, Camera, Brain, Trophy, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import { getMembershipLevel, getProgressToNextLevel, getPointsToNextLevel } from '@/lib/loyalty';

// المكونات الجديدة
import ReadingInsights from '@/components/profile/ReadingInsights';
import AchievementBadges from '@/components/profile/AchievementBadges';
import ReadingTimeline from '@/components/profile/ReadingTimeline';
import SavedArticles from '@/components/profile/SavedArticles';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  avatar?: string;
  gender?: string;
  city?: string;
  loyaltyLevel?: string;
  loyaltyPoints?: number;
  role?: string;
  status?: string;
  isVerified?: boolean;
}

interface LoyaltyData {
  total_points: number;
  level: string;
  next_level_points: number;
  recent_activities: Activity[];
}

interface Activity {
  id: string;
  action: string;
  points: number;
  created_at: string;
  description: string;
}

interface UserPreference {
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
}

// الواجهات الجديدة للبيانات المتقدمة
interface UserInsights {
  readingProfile: {
    type: string;
    description: string;
    level: string;
  };
  categoryDistribution: {
    distribution: Array<{
      name: string;
      count: number;
      percentage: number;
      color?: string;
      icon?: string;
    }>;
    topCategory: string;
    diversity: number;
    recommendations: string[];
  };
  timePatterns: {
    bestTime: string;
    bestDay: string;
    hourlyDistribution: Record<number, number>;
    dailyDistribution: Record<string, number>;
  };
  stats: {
    totalArticlesRead: number;
    totalLikes: number;
    totalShares: number;
    totalSaves: number;
    totalComments: number;
    averageReadingTime: number;
    streakDays: number;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  }>;
  timeline: Array<{
    date: string;
    articlesCount: number;
    totalReadingTime: number;
    articles: Array<{
      time: string;
      title: string;
      category: string;
      readingTime: number;
    }>;
  }>;
  savedArticles: Array<{
    id: string;
    title: string;
    category?: string;
    savedAt: string;
  }>;
  unfinishedArticles: Array<{
    id: string;
    title: string;
    category?: string;
    readingTime: number;
    excerpt?: string;
  }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [userStats, setUserStats] = useState({
    articlesRead: 0,
    interactions: 0,
    shares: 0
  });
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [userInsights, setUserInsights] = useState<UserInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'achievements' | 'timeline'>('overview');

  // منع تكرار الطلبات
  const fetchDataRef = useRef(false);
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    if (!fetchDataRef.current) {
      fetchDataRef.current = true;
      checkAuth();
    }
  }, []);

  useEffect(() => {
    if (user && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      // جلب جميع البيانات بشكل متوازي
      fetchAllDataOptimized();
    }
  }, [user]);

  // دالة محسّنة لجلب جميع البيانات بشكل متوازي
  const fetchAllDataOptimized = async () => {
    if (!user) return;
    
    try {
      // دالة مساعدة لإنشاء timeout signal
      const createTimeoutSignal = (ms: number) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
      };
      
      // تنفيذ جميع الطلبات بشكل متوازي مع timeout
      const promises = [
        // نقاط الولاء - مع timeout 3 ثواني
        fetch(`/api/loyalty/points?userId=${user.id}`, {
          signal: createTimeoutSignal(3000)
        }).then(res => res.ok ? res.json() : null).catch(() => null),
        
        // التصنيفات - مطلوبة دائماً
        fetch('/api/categories').then(res => res.ok ? res.json() : null).catch(() => null),
        
        // الاهتمامات - للمستخدمين المسجلين فقط
        (!user.id.startsWith('guest-') ? 
          fetch(`/api/user/interests?userId=${user.id}`, {
            signal: createTimeoutSignal(3000)
          }).then(res => res.ok ? res.json() : null).catch(() => null) 
          : Promise.resolve(null)),
        
        // التفاعلات - مع timeout
        fetch(`/api/interactions/user/${user.id}`, {
          signal: createTimeoutSignal(3000)
        }).then(res => res.ok ? res.json() : null).catch(() => null),
        
        // التحليلات - مع timeout أطول
        fetch(`/api/user/${user.id}/insights`, {
          signal: createTimeoutSignal(5000)
        }).then(res => res.ok ? res.json() : null).catch(() => null)
      ];

      const [loyaltyResult, categoriesResult, interestsResult, interactionsResult, insightsResult] = 
        await Promise.allSettled(promises);

      // معالجة نقاط الولاء
      if (loyaltyResult.status === 'fulfilled' && loyaltyResult.value) {
        setLoyaltyData(loyaltyResult.value);
      }

      // معالجة التصنيفات والاهتمامات
      const allCategories = categoriesResult.status === 'fulfilled' && categoriesResult.value ? 
        (categoriesResult.value.categories || categoriesResult.value || []) : [];

      if (user.id && user.id.startsWith('guest-')) {
        // للمستخدمين الضيوف
        if (user.interests && user.interests.length > 0 && allCategories.length > 0) {
          const userCategories = allCategories
            .filter((cat: any) => user.interests.includes(cat.id))
            .map((cat: any) => ({
              category_id: cat.id,
              category_name: cat.name || cat.name_ar,
              category_icon: cat.icon || '📌',
              category_color: cat.color || '#6B7280'
            }));
          setPreferences(userCategories);
        }
      } else {
        // للمستخدمين المسجلين
        if (interestsResult.status === 'fulfilled' && interestsResult.value?.interests?.length > 0) {
          const userCategories = allCategories
            .filter((cat: any) => 
              interestsResult.value.interests.some((interest: any) => 
                interest.interest === cat.slug || interest.interest === cat.name
              )
            )
            .map((cat: any) => ({
              category_id: cat.id,
              category_name: cat.name || cat.name_ar,
              category_icon: cat.icon || '📌',
              category_color: cat.color || '#6B7280'
            }));
          setPreferences(userCategories);
        } else if (user.interests && user.interests.length > 0 && allCategories.length > 0) {
          // استخدام localStorage كخيار احتياطي
          const userCategories = allCategories
            .filter((cat: any) => user.interests.includes(cat.id) || user.interests.includes(cat.slug))
            .map((cat: any) => ({
              category_id: cat.id,
              category_name: cat.name || cat.name_ar,
              category_icon: cat.icon || '📌',
              category_color: cat.color || '#6B7280'
            }));
          setPreferences(userCategories);
        }
      }

      // معالجة التفاعلات
      if (interactionsResult.status === 'fulfilled' && interactionsResult.value?.stats) {
        setUserStats(interactionsResult.value.stats);
      } else {
        // قيم افتراضية
        setUserStats({
          articlesRead: 5,
          interactions: 12,
          shares: 3
        });
      }
      
      // معالجة التحليلات
      if (insightsResult.status === 'fulfilled' && insightsResult.value?.success) {
        setUserInsights(insightsResult.value.data);
      }
      
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    }
  };

  const checkAuth = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const localUser = JSON.parse(userData);
    
    // جلب البيانات المحدثة من API
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // دمج البيانات المحدثة مع البيانات المحلية
          const updatedUser = {
            ...localUser,
            ...data.user,
            interests: data.user.interests || []
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          setUser(localUser);
        }
      } else {
        setUser(localUser);
      }
    } catch (error) {
      console.error('Error fetching updated user data:', error);
      setUser(localUser);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/'); // العودة للصفحة الرئيسية بدلاً من صفحة تسجيل الدخول
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // التحقق من نوع الملف
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('يرجى اختيار ملف صورة صالح (PNG أو JPG)');
      return;
    }

    // التحقق من حجم الملف (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');
      formData.append('userId', user.id);

      console.log('📤 رفع الصورة للمستخدم:', user.id);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        console.log('✅ تم رفع الصورة:', uploadData);
        
        // تحديث في قاعدة البيانات
        console.log('💾 تحديث قاعدة البيانات...');
        const updateResponse = await fetch('/api/user/update-avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            avatarUrl: (uploadData.data || uploadData).url
          })
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          console.log('✅ تم تحديث قاعدة البيانات:', updateData);
          
          // تحديث بيانات المستخدم المحلية
          const avatarUrl = (uploadData.data || uploadData).url;
          const updatedUser = { ...user, avatar: avatarUrl };
          setUser(updatedUser);
          
          // تحديث localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          toast.success('تم تحديث الصورة الشخصية بنجاح');
          
          // تحديث الصفحة لضمان ظهور الصورة في جميع الأماكن
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          const updateError = await updateResponse.json() as { error?: string };
          console.error('❌ خطأ في تحديث قاعدة البيانات:', updateError);
          toast.error(updateError.error || 'حدث خطأ في تحديث قاعدة البيانات');
        }
      } else {
        const uploadError = await uploadResponse.json();
        console.error('❌ خطأ في رفع الصورة:', uploadError);
        toast.error(uploadError.error || 'حدث خطأ في رفع الصورة');
      }
    } catch (error) {
      console.error('💥 خطأ عام في رفع الصورة:', error);
      toast.error('حدث خطأ في رفع الصورة');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'read': 
      case 'read_article': 
        return <BookOpen className="w-4 h-4" />;
      case 'share':
      case 'share_article': 
        return <Share2 className="w-4 h-4" />;
      case 'like':
      case 'like_article': 
        return <Heart className="w-4 h-4" />;
      case 'view':
        return <Eye className="w-4 h-4" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4" />;
      case 'save':
        return <Bookmark className="w-4 h-4" />;
      case 'select_preferences': 
        return <Activity className="w-4 h-4" />;
      default: 
        return <Star className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  if (!user) return null;

  const userPoints = loyaltyData?.total_points || user.loyaltyPoints || 0;
  const membership = getMembershipLevel(userPoints);
  const pointsToNext = getPointsToNextLevel(userPoints);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* رأس الصفحة بتصميم محسّن */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-screen-xl mx-auto px-4 py-12">
            <div className="flex items-center gap-6">
              <div className="relative group">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-32 h-32 rounded-full object-cover shadow-xl border-4 border-white/20"
                  />
                ) : (
                  <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-5xl font-bold shadow-xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* زر تغيير الصورة */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </label>
                
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">{membership.icon}</span>
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <p className="text-white/80 mb-3">{user.email}</p>
                
                {/* معلومات سريعة */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>عضو منذ {formatDate(user.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>{membership.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>{userPoints} نقطة</span>
                  </div>
                  {userInsights && (
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      <span>{userInsights.readingProfile.type === 'analytical' ? 'قارئ تحليلي' : 
                             userInsights.readingProfile.type === 'balanced' ? 'قارئ متوازن' : 'قارئ عادي'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="px-6 py-3 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-all font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Edit2 className="w-5 h-5" />
                  تعديل الملف
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* التبويبات */}
        <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'overview'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                نظرة عامة
                {activeTab === 'overview' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'insights'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                تحليلات القراءة
                {activeTab === 'insights' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'achievements'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                الإنجازات
                {activeTab === 'achievements' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeTab === 'timeline'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                سجل القراءة
                {activeTab === 'timeline' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* العمود الأيسر */}
              <div className="lg:col-span-1 space-y-6">
                {/* بطاقة النقاط */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    نقاط الولاء
                  </h3>
                  
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-amber-600 mb-2">
                      {userPoints}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">نقطة</p>
                  </div>

                  {membership.nextLevel && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>المستوى التالي</span>
                        <span>{pointsToNext} نقطة</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${getProgressToNextLevel(userPoints)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => setShowLoyaltyModal(true)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center justify-center gap-1 w-full"
                  >
                    عرض التفاصيل
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* بطاقة الإحصائيات السريعة */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    إحصائيات سريعة
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">مقالات مقروءة</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {userInsights?.stats.totalArticlesRead || userStats.articlesRead}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">إعجابات</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {userInsights?.stats.totalLikes || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">مشاركات</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {userInsights?.stats.totalShares || userStats.shares}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">مقالات محفوظة</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {userInsights?.stats.totalSaves || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* العمود الأيمن */}
              <div className="lg:col-span-2 space-y-6">
                {/* الاهتمامات */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      اهتماماتي
                    </h3>
                    <Link
                      href="/welcome/preferences"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      تعديل
                    </Link>
                  </div>

                  {preferences.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {preferences.map((pref) => (
                        <div 
                          key={pref.category_id}
                          className="flex items-center gap-3 p-3 rounded-lg border-2 hover:shadow-md transition-shadow"
                          style={{ 
                            backgroundColor: pref.category_color + '10',
                            borderColor: pref.category_color + '30'
                          }}
                        >
                          <span className="text-2xl">{pref.category_icon}</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {pref.category_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      
                      {user.id && user.id.startsWith('guest-') ? (
                        <>
                          <p className="text-gray-500 dark:text-gray-400 mb-2">أنت تتصفح كضيف</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                            سجل الدخول لحفظ اهتماماتك وتخصيص تجربتك بشكل دائم
                          </p>
                          <div className="space-y-3">
                            <Link
                              href="/welcome/preferences"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all mb-3"
                            >
                              <Heart className="w-5 h-5" />
                              اختر اهتماماتك كضيف
                            </Link>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                              <p className="text-xs text-gray-400 mb-3">للحصول على تجربة كاملة:</p>
                              <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                              >
                                تسجيل الدخول
                              </Link>
                              <span className="mx-2 text-gray-400">أو</span>
                              <Link
                                href="/register"
                                className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                إنشاء حساب جديد
                              </Link>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-500 dark:text-gray-400 mb-4">لم تختر اهتمامات بعد</p>
                          <Link
                            href="/welcome/preferences"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                          >
                            <Heart className="w-5 h-5" />
                            اختر اهتماماتك الآن
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* المقالات المحفوظة وغير المكتملة */}
                {userInsights && (
                  <SavedArticles 
                    savedArticles={userInsights.savedArticles}
                    unfinishedArticles={userInsights.unfinishedArticles}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'insights' && userInsights && (
            <ReadingInsights 
              readingProfile={userInsights.readingProfile}
              categoryDistribution={userInsights.categoryDistribution}
              timePatterns={userInsights.timePatterns}
              stats={userInsights.stats}
            />
          )}

          {activeTab === 'achievements' && userInsights && (
            <AchievementBadges achievements={userInsights.achievements} />
          )}

          {activeTab === 'timeline' && userInsights && (
            <ReadingTimeline timeline={userInsights.timeline} />
          )}

          {/* رسالة التحميل للبيانات المتقدمة */}
          {loadingInsights && activeTab !== 'overview' && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Modal تفاصيل النقاط */}
        {showLoyaltyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">تفاصيل نقاط الولاء</h3>
                  <button
                    onClick={() => setShowLoyaltyModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">مستوى العضوية الحالي</p>
                        <p className="text-3xl font-bold flex items-center gap-2 mt-2">
                          <span>{membership.icon}</span>
                          <span style={{ color: membership.color }}>{membership.name}</span>
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">النقاط الحالية</p>
                        <p className="text-2xl font-bold text-amber-600">{userPoints}</p>
                      </div>
                    </div>
                    {membership.nextLevel && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">التقدم نحو المستوى التالي ({membership.nextLevel} نقطة)</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${getProgressToNextLevel(userPoints)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">باقي {pointsToNext} نقطة للوصول إلى المستوى التالي</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">كيفية كسب النقاط:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          قراءة المقالات
                        </span>
                        <span className="text-sm font-medium text-blue-600">+10 نقاط</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          الإعجاب بالمقالات
                        </span>
                        <span className="text-sm font-medium text-red-600">+5 نقاط</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-green-500" />
                          مشاركة المقالات
                        </span>
                        <span className="text-sm font-medium text-green-600">+15 نقاط</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4 text-purple-500" />
                          حفظ المقالات
                        </span>
                        <span className="text-sm font-medium text-purple-600">+5 نقاط</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 