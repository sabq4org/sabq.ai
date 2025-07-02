'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import DeepAnalysisWidget from '@/components/DeepAnalysisWidget';
import FooterDashboard from '@/components/FooterDashboard';
import { 
  Share2, 
  Eye, 
  Clock, 
  Calendar,
  TrendingUp,
  Brain,
  Award,
  Target,
  Users,
  MapPin,
  Play,
  Volume2,
  Star,
  Zap,
  Globe,
  Newspaper,
  BarChart3,
  Lightbulb,
  Sparkles,
  Crown,
  Trophy,
  Gift,
  Coins,
  Activity,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Filter,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  Signal,
  Battery,
  WifiOff,
  SignalHigh,
  SignalMedium,
  SignalLow,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Laptop,
  Building2,
  Leaf,
  BookOpen,
  Home,
  Beaker,
  Palette,
  Car,
  Plane,
  GraduationCap,
  Briefcase,
  CloudRain,
  Tag,
  Flame,
  AlertCircle,
  Compass,
  PlayCircle,
  Download,
  Globe2,
  X,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Heart,
  Bookmark,
  MessageSquare
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getCookie, setCookie } from '@/lib/cookies';
import { generatePlaceholderImage } from '@/lib/cloudinary';

import CategoryBadge from './components/CategoryBadge';
import Header from '../components/Header';
import { SmartSlot } from '@/components/home/SmartSlot';

import ReaderProfileCard from '@/components/reader-profile/ReaderProfileCard';
import { useReaderProfile } from '@/hooks/useReaderProfile';
import SmartDigestBlock from '@/components/smart-blocks/SmartDigestBlock';
import SmartContextWidget from '@/components/home/SmartContextWidget';
import InteractiveArticle from '@/components/InteractiveArticle';

// دالة تشخيص المصادقة
function DebugAuth() {
  const { isLoggedIn, userId, user } = useAuth();

  useEffect(() => {
    console.log("====[تشخيص المصادقة]====");
    console.log("isLoggedIn:", isLoggedIn);
    console.log("userId:", userId);
    console.log("user:", user);
    console.log("localStorage.user_id:", localStorage.getItem("user_id"));
    console.log("localStorage.user:", localStorage.getItem("user"));
    console.log("كوكيز:", document.cookie);

    fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("/api/auth/me =>", data);
      })
      .catch((err) => {
        console.error("خطأ في /api/auth/me:", err);
      });
  }, [isLoggedIn, userId]);

  return null; // لا يعرض شيء في الواجهة
}

// أيقونات التصنيفات
const categoryIcons: { [key: string]: any } = {
  'تقنية': Laptop,
  'رياضة': Trophy,
  'اقتصاد': TrendingUp,
  'سياسة': Building2,
  'صحة': Activity,
  'بيئة': Leaf,
  'ثقافة': BookOpen,
  'محلي': Home,
  'دولي': Globe,
  'منوعات': Activity,
  'علوم': Beaker,
  'فن': Palette,
  'سيارات': Car,
  'سياحة': Plane,
  'تعليم': GraduationCap,
  'أعمال': Briefcase,
  'طقس': CloudRain,
  'default': Tag
};

// ===============================
// نظام ذكاء المستخدم والتخصيص
// ===============================

interface UserInteraction {
  user_id: string;
  article_id: string;
  interaction_type: 'view' | 'read' | 'share' | 'comment';
  category: string;
  read_duration_seconds?: number;
  scroll_percentage?: number;
  source?: string;
  device_type?: string;
  session_id?: string;
  timestamp: number;
}

interface UserPreferences {
  [category: string]: number;
}

// نظام تتبع ذكاء المستخدم
class UserIntelligenceTracker {
  private interactions: UserInteraction[] = [];
  private preferences: { [userId: string]: UserPreferences } = {};
  private sessionId: string;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  // تسجيل تفاعل جديد
  trackInteraction(articleId: string, type: UserInteraction['interaction_type'], category: string, additionalData: any = {}) {
    const interaction: UserInteraction = {
      user_id: this.userId,
      article_id: articleId,
      interaction_type: type,
      category,
      session_id: this.sessionId,
      device_type: this.getDeviceType(),
      timestamp: Date.now(),
      ...additionalData
    };

    this.interactions.push(interaction);
    this.updatePreferences(interaction);
    this.saveToStorage();

    return this.calculatePoints(interaction);
  }

  // تحديث التفضيلات
  private updatePreferences(interaction: UserInteraction) {
    if (!this.preferences[this.userId]) {
      this.preferences[this.userId] = {};
    }

    const current = this.preferences[this.userId][interaction.category] || 1;
    
    // أوزان التفاعلات
    const weights: { [key: string]: number } = {
      view: 0.1,
      read: 0.5,
      share: 0.7,
      comment: 0.8
    };

    const weight = weights[interaction.interaction_type] || 0;
    const newWeight = Math.min(5, Math.max(0, current + weight));
    this.preferences[this.userId][interaction.category] = Number(newWeight.toFixed(2));
  }

  // حساب النقاط
  private calculatePoints(interaction: UserInteraction): number {
    const pointsMap: { [key: string]: number } = {
      view: 1,
      read: 2,
      share: 5,
      comment: 4
    };
    
    return pointsMap[interaction.interaction_type] || 0;
  }

  // الحصول على التفضيلات
  getPreferences(): UserPreferences {
    return this.preferences[this.userId] || {};
  }

  // حساب نقاط الثقة للمقال
  calculateConfidence(category: string): number {
    const prefs = this.getPreferences();
    const categoryWeight = prefs[category] || 1;
    return Math.min(5, categoryWeight * 1.2);
  }

  private generateSessionId(): string {
    // استخدام معرف ثابت بدلاً من Math.random() لتجنب مشكلة Hydration
    const timestamp = Date.now();
    const uniqueId = timestamp.toString(36);
    return 'session_' + timestamp + '_' + uniqueId;
  }

  getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`user_interactions_${this.userId}`, JSON.stringify(this.interactions));
    localStorage.setItem(`user_preferences_${this.userId}`, JSON.stringify(this.preferences));
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    const interactions = localStorage.getItem(`user_interactions_${this.userId}`);
    const preferences = localStorage.getItem(`user_preferences_${this.userId}`);
    
    if (interactions) this.interactions = JSON.parse(interactions);
    if (preferences) this.preferences = JSON.parse(preferences);
  }
}

function NewspaperHomePage(): React.ReactElement {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // إضافة حالة التحقق من المصادقة
  const [userTracker, setUserTracker] = useState<UserIntelligenceTracker | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [readingTime, setReadingTime] = useState<{ [key: string]: number }>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryArticles, setCategoryArticles] = useState<any[]>([]);
  const [categoryArticlesLoading, setCategoryArticlesLoading] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [personalizedArticles, setPersonalizedArticles] = useState<any[]>([]);
  const [personalizedLoading, setPersonalizedLoading] = useState(true);
  const [trendingData, setTrendingData] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>({
    mainEvent: null,
    alert: null,
    trend: null
  });
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [blocksConfig, setBlocksConfig] = useState({
    briefing: { enabled: true, order: 1 },
    trending: { enabled: true, order: 2 },
    analysis: { enabled: true, order: 3 },
    recommendation: { enabled: true, order: 4 },
    categories: { enabled: true, order: 5 },
    audio: { enabled: true, order: 6 },
    todayEvent: { enabled: true, order: 7 },
    regions: { enabled: true, order: 8 }
  });
  const [deepInsights, setDeepInsights] = useState<any[]>([]);
  const [deepInsightsLoading, setDeepInsightsLoading] = useState(true);
  const [showPersonalized, setShowPersonalized] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showUserWidget, setShowUserWidget] = useState(true);

  const { user, isLoggedIn: authIsLoggedIn, userId: authUserId } = useAuth();

  // تحميل تفضيل إظهار الويدجت من localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('showUserWidget');
    if (savedPreference !== null) {
      setShowUserWidget(savedPreference === 'true');
    }
  }, []);

  // حفظ تفضيل إظهار الويدجت
  const handleToggleWidget = (show: boolean) => {
    setShowUserWidget(show);
    localStorage.setItem('showUserWidget', show.toString());
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // هوك ملف القارئ الذكي
  const { profile: readerProfile, isLoading: readerProfileLoading } = useReaderProfile();

  // التحقق من حالة تسجيل الدخول
  useEffect(() => {
    const checkAuthStatus = () => {
      let storedUserId = localStorage.getItem('user_id');
      let userData = localStorage.getItem('user');
      
      let hasUserId = storedUserId && storedUserId.trim() !== '' && storedUserId !== 'null' && storedUserId !== 'undefined';
      let isNotAnonymous = storedUserId !== 'anonymous';
      let hasUserData = userData && userData.trim() !== '' && userData !== 'null' && userData !== 'undefined';

      // في حال عدم وجود بيانات في localStorage، نحاول جلبها من الكوكيز
      if (!hasUserId || !hasUserData) {
        const cookieUser = getCookie('user');
        const cookieUserId = getCookie('userId');
        
        if (cookieUser) {
          try {
            const parsed = JSON.parse(cookieUser);
            if (parsed?.id) {
              localStorage.setItem('user_id', parsed.id);
              localStorage.setItem('user', cookieUser);
              localStorage.setItem('currentUser', cookieUser);
              // إضافة cookie userId للتوافق
              setCookie('userId', parsed.id, 7);
              storedUserId = parsed.id;  // تحديث storedUserId
              userData = cookieUser;     // تحديث userData
              hasUserId = true;
              isNotAnonymous = true;
              hasUserData = true;
            }
          } catch (_) {
            // تجاهل أخطاء JSON
          }
        } else if (cookieUserId) {
          // إذا كان هناك userId في الكوكيز ولكن لا يوجد user data
          localStorage.setItem('user_id', cookieUserId);
          storedUserId = cookieUserId;
          hasUserId = true;
          isNotAnonymous = true;
        }
      }

      const isUserLoggedIn = !!(hasUserId && isNotAnonymous && hasUserData);
      
      setIsLoggedIn(isUserLoggedIn);
      setIsCheckingAuth(false);
      setUserId(isUserLoggedIn ? storedUserId : null);
      
      // إنشاء UserTracker إذا كان المستخدم مسجل دخول
      if (isUserLoggedIn && storedUserId) {
        setUserTracker(new UserIntelligenceTracker(storedUserId));
        
        // جلب النقاط المحفوظة
        const savedPoints = localStorage.getItem('user_points');
        if (savedPoints) {
          setUserPoints(JSON.parse(savedPoints));
        }
        
        // جلب الاهتمامات المحفوظة
        try {
          const userDataParsed = JSON.parse(userData || '{}');
          if (userDataParsed.interests) {
            setUserInterests(userDataParsed.interests);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };
    
    checkAuthStatus();
  }, []);



  // دالة جلب مقالات التصنيف
  const fetchCategoryArticles = async (categoryId: string) => {
    try {
      setCategoryArticlesLoading(true);
      const response = await fetch(`/api/articles?category_id=${categoryId}&status=published&limit=6`);
      if (response.ok) {
        const data = await response.json();
        setCategoryArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Error fetching category articles:', error);
    } finally {
      setCategoryArticlesLoading(false);
    }
  };

  // معالج النقر على التصنيف
  const handleCategoryClick = async (categoryId: string) => {
    if (selectedCategory === categoryId) {
      // إذا كان نفس التصنيف، أغلق القائمة
      setSelectedCategory(null);
      setCategoryArticles([]);
    } else {
      // اختر التصنيف الجديد واجلب مقالاته
      setSelectedCategory(categoryId);
      await fetchCategoryArticles(categoryId);
    }
  };

  // دالة مساعدة لاختبار حالة تسجيل الدخول
  const testAuthStatus = useCallback(async () => {
    try {
      console.log('🔍 اختبار حالة تسجيل الدخول...');
      
      // التحقق من localStorage
      const localUser = localStorage.getItem('user');
      const localUserId = localStorage.getItem('user_id');
      console.log('📱 localStorage:', { localUser, localUserId });
      
      // التحقق من الكوكيز
      const cookies = document.cookie;
      console.log('🍪 Cookies:', cookies);
      
      // اختبار API المصادقة
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔐 API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response Data:', data);
        return data.success && data.user;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ API Error:', errorData);
        return false;
      }
    } catch (error) {
      console.error('🚨 Error testing auth status:', error);
      return false;
    }
  }, []);

  // دالة تتبع التفاعلات الذكية
  const trackUserInteraction = useCallback(async (articleId: string, type: UserInteraction['interaction_type'], category: string, additionalData: any = {}) => {
    if (!userTracker) return;
    
    // التحقق من تسجيل الدخول بشكل أكثر دقة
    if (!isLoggedIn || !userId) {
      console.log('🔍 حالة تسجيل الدخول:', { isLoggedIn, userId, user });
      
      // عرض رسالة أكثر تفصيلاً للمستخدم
      toast.error('يرجى تسجيل الدخول للاحتفاظ بتفاعلاتك وكسب النقاط 🎯', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: 'white',
          fontSize: '14px',
        }
      });
      return;
    }
    
    const points = userTracker.trackInteraction(articleId, type, category, additionalData);
    
    // تحديث النقاط
    const newPoints = userPoints + points;
    setUserPoints(newPoints);
    localStorage.setItem('user_points', JSON.stringify(newPoints));
    
    // إرسال التفاعل إلى API
    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          article_id: articleId,
          type: type,
          metadata: {
            category: category,
            ...additionalData
          }
        })
      });
      
      if (!response.ok) {
        console.error('فشل في إرسال التفاعل إلى API:', response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('تفاصيل الخطأ:', errorData);
      } else {
        console.log('✅ تم إرسال التفاعل بنجاح:', { type, articleId, userId });
      }
    } catch (error) {
      console.error('خطأ في إرسال التفاعل إلى API:', error);
    }
    
    // إظهار إشعار النقاط (اختياري)
    if (points > 0) {
      console.log(`🎉 حصلت على ${points} نقطة! (المجموع: ${newPoints})`);
    }
    
    return points;
  }, [userTracker, userPoints, isLoggedIn, userId, user]);

  // Time-based content
  const getTimeContent = () => {
    // استخدام ساعة افتراضية إذا لم يتم تحميل الوقت بعد
    const hour = currentTime ? currentTime.getHours() : 10;
    
    if (hour >= 5 && hour < 12) {
      return {
        period: "صباح الخير",
        title: "مرحباً بك في يوم جديد",
        subtitle: "استمتع بأحدث الأخبار وأهم التطورات",
        cards: [
          { title: "قمة المناخ تستضيفها المملكة", desc: "تحضيرات واسعة لاستقبال قادة العالم", category: "دولي", image: "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e5?auto=format&fit=crop&w=800&q=60" },
          { title: "نيوم تطلق مشروع المرآة الذكية", desc: "مدينة المستقبل تواصل ابتكاراتها", category: "تقنية", image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=800&q=60" },
          { title: "انطلاق موسم الرياض 2025", desc: "فعاليات ومهرجانات استثنائية", category: "ترفيه", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=60" }
        ]
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        period: "مساء الخير",
        title: "نتابع معك تطورات اليوم",
        subtitle: "آخر الأخبار والتحديثات المهمة",
        cards: [
          { title: "الأمير محمد بن سلمان يلتقي قادة التقنية", desc: "رؤية 2030 وتطوير القطاع التقني", category: "أخبار", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=60" },
          { title: "بورصة الرياض تسجل أرقاماً قياسية", desc: "نمو متواصل في الأسواق المالية", category: "اقتصاد", image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=60" },
          { title: "الهلال يتأهل لنهائي كؤوس آسيا", desc: "إنجاز رياضي جديد للكرة السعودية", category: "رياضة", image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=60" }
        ]
      };
    } else {
      return {
        period: "مساء الخير",
        title: "نختتم معك يوماً حافلاً",
        subtitle: "ملخص أهم أحداث اليوم",
        cards: [
          { title: "خادم الحرمين يستقبل ضيوف الرحمن", desc: "حفاوة الاستقبال في موسم الحج", category: "محلي", image: "https://images.unsplash.com/photo-1564769662642-4ea21ff5e468?auto=format&fit=crop&w=800&q=60" },
          { title: "معرض الكتاب يختتم فعالياته", desc: "إقبال جماهيري كبير على المعرض", category: "ثقافة", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=60" },
          { title: "حملة تطوير الأحياء تتوسع", desc: "مشاريع تنموية في جميع المناطق", category: "تطوير", image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=60" }
        ]
      };
    }
  };

  const timeContent = getTimeContent();

  // بيانات وهمية للبلوكات
  const briefingData = [
    { id: 1, title: "انطلاق مؤتمر الذكاء الاصطناعي في الرياض\nبمشاركة عالمية واسعة وحضور أكثر من 500 خبير", time: "منذ 15 دقيقة", isNew: true },
    { id: 2, title: "صندوق الاستثمارات يعلن عن شراكة جديدة\nمع عمالقة التقنية لتطوير الذكاء الاصطناعي", time: "منذ 30 دقيقة", isNew: true },
    { id: 3, title: "نجاح عملية إطلاق القمر الاصطناعي السعودي\nويدخل المدار المحدد بنجاح تام وفقاً للخطة", time: "منذ ساعة", isNew: false },
    { id: 4, title: "افتتاح مدينة نيوم الطبية الذكية\nأول مستشفى رقمي متكامل يعتمد على الذكاء الاصطناعي", time: "منذ ساعتين", isNew: false }
  ];

  const userRecommendation = {
    title: "تطوير الذكاء الاصطناعي في التعليم السعودي يدخل مرحلة جديدة\nمع إطلاق منصات تعليمية ذكية في 500 مدرسة حكومية",
    category: "تقنية",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=60",
    time: "منذ 3 ساعات"
  };

  const categoriesData = [
    { name: "اقتصاد", articles: ["صعود البورصة السعودية إلى مستويات تاريخية\nبدعم من القطاعات الناشئة والاستثمارات الأجنبية", "انطلاق مشروع جديد لتطوير الاقتصاد الرقمي\nباستثمارات تصل إلى 50 مليار ريال", "تطوير القطاع المصرفي يشهد نقلة نوعية\nمع إطلاق خدمات مصرفية رقمية متطورة"], icon: "💼" },
    { name: "تقنية", articles: ["شراكة استراتيجية مع عمالقة التقنية العالمية\nلتطوير حلول الذكاء الاصطناعي في المملكة", "ابتكار سعودي في الذكاء الاصطناعي يحصد جوائز عالمية\nويفتح آفاق جديدة للتطوير التقني", "تطوير المدن الذكية يدخل مرحلة التنفيذ\nمع استخدام أحدث التقنيات في 15 مدينة"], icon: "💻" },
    { name: "رياضة", articles: ["استعدادات مكثفة لكأس العالم 2030\nومشاريع بنية تحتية رياضية ضخمة", "بطولة الدوري السعودي تشهد منافسة قوية\nبمشاركة نجوم عالميين وحضور جماهيري كبير", "إنجازات رياضية سعودية تتواصل على المستوى العالمي\nفي مختلف الألعاب الأولمبية"], icon: "⚽" }
  ];

  const audioData = {
    title: "نشرة أخبار سبق الصوتية - مساء اليوم\nأهم الأحداث والتطورات مع التحليل الاقتصادي اليومي",
    duration: "12:45",
    publishTime: "منذ 30 دقيقة",
    isPlaying: false
  };

  const todayEvent = {
    title: "اليوم الوطني السعودي - 94\nذكرى توحيد المملكة على يد الملك عبدالعزيز",
    description: "احتفالات شعبية ورسمية تشهدها جميع مناطق المملكة\nمع فعاليات متنوعة وعروض ثقافية استثنائية",
    date: "23 سبتمبر",
    isActive: false // محاكاة عدم وجود مناسبة اليوم
  };

  const regionsData = [
    { name: "الرياض", newsCount: 15, lastUpdate: "منذ ساعة" },
    { name: "جدة", newsCount: 8, lastUpdate: "منذ ساعتين" },
    { name: "الدمام", newsCount: 5, lastUpdate: "منذ 3 ساعات" },
    { name: "أبها", newsCount: 3, lastUpdate: "منذ 4 ساعات" }
  ];

  // NewsCard component with AI tracking
  const NewsCard = ({ news }: { news: any }) => {
    
    const categoryForConfidence = typeof news.category === 'string' ? news.category : 
      (typeof news.category === 'object' && news.category ? news.category.name_ar || news.category.name : 'عام');
    const confidenceScore = userTracker ? userTracker.calculateConfidence(categoryForConfidence) : 1;
    const isPersonalized = confidenceScore > 2.5;
    
    return (
      <Link href={`/article/${news.id}`} className="block h-full" prefetch={true}>
        <div 
        className={`group h-full flex flex-col rounded-3xl bg-white dark:bg-gray-800 ${isPersonalized ? 'ring-2 ring-blue-400/30' : ''} shadow-lg dark:shadow-gray-900/50 overflow-hidden`}
      >
          <div className="relative h-48 overflow-hidden">
            <img 
              src={news.featured_image || news.image || generatePlaceholderImage(news.title, 'article')} 
              alt={news.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* تأثير التدرج على الصورة */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {(news.is_breaking || news.isBreaking) && (
              <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg dark:shadow-gray-900/50">
                عاجل
              </span>
            )}
            
            {/* شارة سبب التوصية */}
            {news.recommendation_reason === 'explicit_interest' && (
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-600/90 text-white text-xs rounded-full shadow-lg backdrop-blur-sm">
                  <Target className="w-3 h-3" />
                  <span>اهتمامك</span>
                </div>
              </div>
            )}
            {news.recommendation_reason === 'behavior_signal' && (
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-1 px-2 py-1 bg-sky-600/90 text-white text-xs rounded-full shadow-lg backdrop-blur-sm">
                  <TrendingUp className="w-3 h-3" />
                  <span>تفاعلاتك</span>
                </div>
              </div>
            )}
            
            {/* fallback إلى الشارة القديمة إذا لم يتوفر سبب التوصية */}
            {!news.recommendation_reason && isPersonalized && (
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/90 text-white text-xs rounded-full backdrop-blur-sm">
                  <Target className="w-3 h-3" />
                  <span>مخصص</span>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* شارة التصنيف الذكية */}
                  {(() => {
                    // التحقق من أن categories موجودة ومصفوفة
                    if (!Array.isArray(categories)) {
                      return (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md">
                          {typeof news.category_name === 'string' ? news.category_name : 
                           typeof news.category === 'string' ? news.category : 'عام'}
                        </span>
                      );
                    }
                    
                    const newsCategory = typeof news.category === 'object' && news.category
                      ? (news.category.name_ar || news.category.name)
                      : news.category;
                    
                    const categoryData = categories.find((cat: any) => 
                      cat.name_ar === newsCategory || 
                      cat.name_en === newsCategory ||
                      cat.name === newsCategory ||
                      cat.id === news.category_id
                    );
                    
                    if (categoryData && typeof categoryData === 'object') {
                      // التأكد من أن categoryData يحتوي على الخصائص المطلوبة
                      const safeCategoryData = {
                        id: categoryData.id || 0,
                        name_ar: categoryData.name_ar || categoryData.name || 'عام',
                        name_en: categoryData.name_en || '',
                        slug: categoryData.slug || '',
                        color_hex: categoryData.color_hex || categoryData.color || '#3B82F6',
                        icon: categoryData.icon || '📁',
                        description: categoryData.description || ''
                      };
                      
                      return (
                        <CategoryBadge
                          category={safeCategoryData}
                          size="sm"
                          variant="filled"
                          showIcon={true}
                          clickable={false}
                          className="text-xs"
                        />
                      );
                    }
                    
                    // إذا لم يُعثر على التصنيف، استخدم التصميم القديم
                    return (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md">
                        {typeof news.category_name === 'string' ? news.category_name : 
                         typeof news.category === 'string' ? news.category : 'عام'}
                      </span>
                    );
                  })()}
                  
                  <div className="flex items-center gap-1 text-blue-400">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs">AI</span>
                  </div>
                </div>
                
                {/* نقاط الثقة */}
                {userTracker && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span>{confidenceScore.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 flex-grow flex flex-col">
            <h3 className="text-lg font-bold mb-3 leading-tight transition-colors duration-300 text-gray-800 dark:text-white">
              {news.title}
            </h3>
            
            {(news.excerpt || news.summary) && (
              <p className="text-sm mb-4 line-clamp-2 transition-colors duration-300 text-gray-600 dark:text-gray-400">
                {news.excerpt || news.summary}
              </p>
            )}
            
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs transition-colors duration-300 text-gray-500 dark:text-gray-400">
                    {news.author?.name || ''}
                  </span>
                  {news.reading_time && (
                    <span className="text-xs transition-colors duration-300 text-gray-500 dark:text-gray-400">
                      {news.reading_time} دقائق قراءة
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs transition-colors duration-300 text-gray-500 dark:text-gray-400">
                    {news.views_count || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {news.tags && Array.isArray(news.tags) && news.tags.slice(0, 2).map((tag: string) => (
                  <span key={tag} className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    #{tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                {/* زر المشاركة */}
                {/* زر الإعجاب */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    toast('ميزة الإعجاب قيد التطوير 🚧');
                  }}
                  className="p-2 rounded-lg transition-all duration-300 transform hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500"
                  title="إعجاب"
                >
                  <Heart className="w-4 h-4" />
                </button>
                
                {/* زر الحفظ */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    toast('ميزة الحفظ قيد التطوير 🚧');
                  }}
                  className="p-2 rounded-lg transition-all duration-300 transform hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-500"
                  title="حفظ"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    // يمكن إضافة وظيفة المشاركة هنا لاحقاً
                    navigator.share({
                      title: news.title,
                      url: `/article/${news.id}`
                    }).catch(() => {
                      // Fallback للمتصفحات التي لا تدعم Web Share API
                      navigator.clipboard.writeText(`${window.location.origin}/article/${news.id}`);
                      toast.success('تم نسخ الرابط');
                    });
                  }}
                  className="p-2 rounded-lg transition-all duration-300 transform hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  title="مشاركة"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // مكون ويدجت الذكاء الشخصي
  const UserIntelligenceWidget = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">الذكاء الاصطناعي</h3>
                  <p className="text-sm opacity-90">نظام التوصيات الذكي</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="p-4 space-y-4">
              {/* Auth Status */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    حالة تسجيل الدخول
                  </span>
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    {showDebug ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isLoggedIn ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">
                    {isLoggedIn ? 'مسجل دخول' : 'غير مسجل دخول'}
                  </span>
                </div>
                
                {showDebug && (
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>User ID:</span>
                      <span className="font-mono">{userId || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Name:</span>
                      <span>{user?.name || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Email:</span>
                      <span>{user?.email || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Role:</span>
                      <span>{user?.role || 'غير محدد'}</span>
                    </div>
                    <button
                      onClick={testAuthStatus}
                      className="w-full mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      اختبار حالة المصادقة
                    </button>
                  </div>
                )}
              </div>

              {/* Points Display */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    نقاط الولاء
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-lg">{userPoints}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  استمر في التفاعل لكسب المزيد من النقاط
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium"
                >
                  عرض الملف الشخصي
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm"
                >
                  لوحة التحكم
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // مكونات البلوكات الذكية المحسنة
  const BriefingBlock = () => {
    // تم تعطيل هذا المكون مؤقتاً حتى يتم ربطه بمقالات حقيقية
    return null;
    
    return (
    <div className={`rounded-3xl p-6 shadow-xl dark:shadow-gray-900/50 border transition-all duration-300 hover:shadow-2xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-600/30' : 'bg-blue-500'}`}>
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>موجز الآن</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>ابدأ من هنا</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-500 text-white'}`}>
          {briefingData.length} تحديث
        </span>
      </div>
      
      <div className="space-y-4">
        {briefingData.map((item) => (
          <Link key={item.id} href={`/article/briefing-${item.id}`} className="block">
            <div className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg dark:shadow-gray-900/50 cursor-pointer ${darkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${item.isNew ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div className="flex-1">
                  <div className="mb-2">
                    <h4 className={`text-sm font-medium leading-relaxed whitespace-pre-line ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{item.title}</h4>
                    {item.isNew && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium mt-2 inline-block">جديد</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>{item.time}</span>
                    <div className="flex items-center gap-1">
                      <Eye className={`w-3 h-3 ${darkMode ? 'text-gray-500 dark:text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`} />
                      <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}>2.3K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <button className={`w-full mt-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
        عرض جميع التحديثات
      </button>
    </div>
    );
  };

  const TrendingBlock = () => {
    // تم تعطيل هذا المكون مؤقتاً حتى يتم ربطه بمقالات حقيقية
    return null;
    
    return (
    <div className={`rounded-3xl p-6 shadow-xl dark:shadow-gray-900/50 border transition-all duration-300 hover:shadow-2xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>يتم قراءته الآن</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>الأكثر شعبية في آخر ساعة</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
          <TrendingUp className="w-3 h-3 text-orange-600" />
          <span className="text-xs font-medium text-orange-600">+24%</span>
        </div>
      </div>
      
      {trendingLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-4 animate-pulse">
                <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <div className="flex-1">
                  <div className={`h-4 rounded mb-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                  <div className={`h-3 rounded w-1/3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : trendingData.length > 0 ? (
        <div className="space-y-4">
          {trendingData.map((item, index) => (
          <Link key={item.id} href={`/article/trending-${item.id}`} className="block">
            <div className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg dark:shadow-gray-900/50 cursor-pointer ${darkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${ index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 dark:text-gray-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 dark:text-gray-500' }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-medium mb-3 leading-relaxed whitespace-pre-line ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{item.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                      {typeof item.category === 'object' ? (item.category.name_ar || item.category.name || 'عام') : (item.category || 'عام')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                        {item.views.toLocaleString()} قراءة
                      </span>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      ) : (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          لا توجد مقالات متداولة حالياً
        </div>
      )}
      
      {!trendingLoading && trendingData.length > 0 && (
        <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <div className="flex items-center justify-between text-xs">
            <span className={darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}>إجمالي القراءات اليوم</span>
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
              {trendingData.reduce((sum, item) => sum + item.views, 0).toLocaleString()} قراءة
            </span>
          </div>
        </div>
      )}
    </div>
    );
  };

  const AnalysisBlock = () => (
    <div className={`rounded-3xl p-6 shadow-xl dark:shadow-gray-900/50 border transition-all duration-300 hover:shadow-2xl min-h-[320px] flex flex-col justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
            <Lightbulb className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>موجز اليوم الذكي</h2>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-600">AI</span>
              <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>محدث كل ساعتين</span>
            </div>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full animate-pulse ${darkMode ? 'bg-green-400' : 'bg-green-500'}`}></div>
      </div>
      
      {analysisLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-700/50 border-gray-600/30' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
              <div className="animate-pulse">
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                  <div className="flex-1">
                    <div className={`h-4 rounded mb-2 w-1/3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                    <div className={`h-4 rounded mb-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                    <div className={`h-3 rounded w-1/4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {analysisData.mainEvent && (
            <div className={`p-4 rounded-2xl border shadow-sm dark:shadow-gray-900/50 hover:shadow-lg dark:shadow-gray-900/50 transition-all duration-300 ${darkMode ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'}`}>
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>أبرز حدث اليوم</h4>
                  <p className={`text-sm mb-3 leading-relaxed whitespace-pre-line ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>{analysisData.mainEvent}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs ${darkMode ? 'bg-blue-800/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                      تأثير عالي
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>منذ 3 ساعات</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {analysisData.alert && (
            <div className={`p-4 rounded-2xl border shadow-sm dark:shadow-gray-900/50 hover:shadow-lg dark:shadow-gray-900/50 transition-all duration-300 ${darkMode ? 'bg-orange-900/20 border-orange-700/30' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>تنبيه مهم</h4>
                  <p className={`text-sm mb-3 leading-relaxed whitespace-pre-line ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>{analysisData.alert}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs ${darkMode ? 'bg-orange-800/50 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                      متوسط الأهمية
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>منذ ساعة</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {analysisData.trend && (
            <div className={`p-4 rounded-2xl border shadow-sm dark:shadow-gray-900/50 hover:shadow-lg dark:shadow-gray-900/50 transition-all duration-300 ${darkMode ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>توجه إيجابي</h4>
                  <p className={`text-sm mb-3 leading-relaxed whitespace-pre-line ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>{analysisData.trend}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs ${darkMode ? 'bg-green-800/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                      نمو +34%
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>هذا الأسبوع</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!analysisData.mainEvent && !analysisData.alert && !analysisData.trend && (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              لا توجد تحليلات متاحة حالياً
            </div>
          )}
        </div>
      )}
      
      <button className={`w-full mt-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 ${darkMode ? 'bg-purple-900/30 hover:bg-purple-800/30 text-purple-300' : 'bg-purple-50 hover:bg-purple-100 text-purple-700'}`}>
        عرض التحليل الكامل
      </button>
    </div>
  );

  const RecommendationBlock = () => {
    // تم تعطيل هذا المكون مؤقتاً حتى يتم ربطه بمقالات حقيقية
    return null;
    
    // إذا لم يكن المستخدم مسجل دخول، لا نعرض هذا البلوك
    if (!isLoggedIn) return null;
    
    return (
      <div className={`rounded-3xl p-6 shadow-xl dark:shadow-gray-900/50 border transition-all duration-300 hover:shadow-2xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>اقترحنا لك هذا</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>بناءً على اهتماماتك</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
            98% مطابقة
          </span>
        </div>
      
      <div className={`rounded-2xl overflow-hidden border shadow-lg dark:shadow-gray-900/50 hover:shadow-xl dark:shadow-gray-900/50 transition-all duration-300 ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
        <div className="relative h-40 overflow-hidden group">
          <img src={userRecommendation.image} alt={userRecommendation.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${darkMode ? 'bg-gray-900/80 text-white' : 'bg-white dark:bg-gray-800/90 text-gray-800 dark:text-gray-100'}`}>
              {userRecommendation.category}
            </span>
          </div>
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-white" />
              <span className="text-xs text-white">{userRecommendation.time}</span>
            </div>
          </div>
        </div>
        
        <div className={`p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <h4 className={`text-sm font-medium mb-3 leading-relaxed whitespace-pre-line ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
            {userRecommendation.title}
          </h4>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className={`w-3 h-3 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`} />
                <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>4.2K</span>
              </div>

            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>4.8</span>
            </div>
          </div>
          
          <Link href="/article/recommendation-1" className="block">
            <button className={`w-full py-2 text-sm font-medium rounded-xl transition-all duration-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 ${darkMode ? 'bg-green-900/30 hover:bg-green-800/30 text-green-300' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}>
              اقرأ المقال كاملاً
            </button>
          </Link>
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all duration-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700 text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
          المزيد من هذا النوع
        </button>
        <button className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all duration-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700 text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
          حفظ للاحقاً
        </button>
      </div>
    </div>
    );
  };

  const CategoriesBlock = () => (
    <div className={`rounded-3xl p-6 shadow-xl dark:shadow-gray-900/50 border transition-all duration-300 hover:shadow-2xl min-h-[320px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
            <Compass className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>استكشف بحسب اهتماماتك</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>أقسام مختارة لك</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {categoriesData.map((category, index) => (
          <div key={index} className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-lg dark:shadow-gray-900/50 hover:scale-[1.02] ${darkMode ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{category.icon}</span>
                <div>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{category.name}</h4>
                  <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                    {category.articles.length} مقال متاح
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`} />
            </div>
            
            <div className="space-y-2">
                             {category.articles.slice(0, 2).map((article, i) => (
                 <div key={i} className="flex items-start justify-between">
                   <p className={`text-sm hover:text-indigo-600 cursor-pointer transition-colors leading-relaxed whitespace-pre-line flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                     • {article}
                   </p>
                  <div className="flex items-center gap-1">
                    <Eye className={`w-3 h-3 ${darkMode ? 'text-gray-500 dark:text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {((i + 1) * 1.2).toFixed(1)}K
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <button className={`w-full mt-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 ${darkMode ? 'bg-indigo-900/30 hover:bg-indigo-800/30 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}>
        استكشف جميع الأقسام
      </button>
    </div>
  );

  const AudioBlock = () => (
    <div className={`rounded-3xl p-6 shadow-xl dark:shadow-gray-900/50 border transition-all duration-300 hover:shadow-2xl min-h-[320px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-pink-900/30' : 'bg-pink-50'}`}>
            <Volume2 className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>استمع لأبرز الأخبار</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>النشرة الصوتية اليومية</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>مباشر</span>
        </div>
      </div>
      
      <div className={`rounded-2xl p-5 border shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 transition-all duration-300 ${darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative group">
            <img 
              src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=400&q=60" 
              alt="صورة المذيع"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div>
            <h4 className={`font-medium mb-1 leading-relaxed whitespace-pre-line ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{audioData.title}</h4>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Clock className={`w-3 h-3 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`} />
                <span className={darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}>{audioData.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className={`w-3 h-3 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`} />
                <span className={darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}>2.1K مستمع</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <button className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-pink-900/50 hover:bg-pink-800/50 text-pink-300' : 'bg-pink-100 hover:bg-pink-200 text-pink-700'}`}>
            <PlayCircle className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <div className="w-1/3 h-full bg-pink-500 rounded-full"></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>4:20</span>
              <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>12:45</span>
            </div>
          </div>
          <button className={`p-2 rounded-xl transition-all duration-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
            <Download className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-2">
          <button className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all duration-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
            النشرة السابقة
          </button>
          <button className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all duration-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 ${darkMode ? 'bg-pink-900/50 hover:bg-pink-800/50 text-pink-300' : 'bg-pink-100 hover:bg-pink-200 text-pink-700'}`}>
            تشغيل تلقائي
          </button>
        </div>
      </div>
    </div>
  );

  const TodayEventBlock = () => (
    todayEvent.isActive ? (
      <div className={`rounded-3xl p-6 shadow-xl dark:shadow-gray-900/50 border transition-all duration-300 hover:shadow-2xl min-h-[320px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>حدث اليوم</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>مناسبة وطنية مهمة</p>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className={`text-lg font-bold mb-3 leading-relaxed whitespace-pre-line ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{todayEvent.title}</h3>
          <p className={`text-sm mb-4 leading-relaxed whitespace-pre-line ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>{todayEvent.description}</p>
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
            {todayEvent.date}
          </span>
        </div>
      </div>
    ) : null
  );

  const RegionsBlock = () => (
    <div className={`rounded-3xl p-6 shadow-xl dark:shadow-gray-900/50 border transition-all duration-300 hover:shadow-2xl min-h-[320px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-teal-900/30' : 'bg-teal-50'}`}>
            <Globe2 className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>جغرافيا الأخبار</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>أخبار المناطق السعودية</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${darkMode ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
          4 مناطق
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {regionsData.map((region, index) => (
          <div key={index} className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-lg dark:shadow-gray-900/50 hover:scale-[1.02] ${darkMode ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{region.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-teal-900/50 text-teal-300' : 'bg-teal-100 text-teal-700'}`}>
                {region.newsCount}
              </span>
            </div>
            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
              آخر تحديث: {region.lastUpdate}
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${ index < 2 ? 'bg-green-500' : 'bg-yellow-500' }`}></div>
              <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                {index < 2 ? 'نشط' : 'هادئ'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <button className={`w-full mt-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-md dark:shadow-gray-900/50 ${darkMode ? 'bg-teal-900/30 hover:bg-teal-800/30 text-teal-300' : 'bg-teal-50 hover:bg-teal-100 text-teal-700'}`}>
        خريطة الأخبار التفاعلية
      </button>
    </div>
  );

  // ترتيب البلوكات حسب الإعدادات
  const getOrderedBlocks = () => {
    const blocks = [
      { key: 'briefing' as keyof typeof blocksConfig, component: <BriefingBlock /> },
      { key: 'trending' as keyof typeof blocksConfig, component: <TrendingBlock /> },
      { key: 'analysis' as keyof typeof blocksConfig, component: <AnalysisBlock /> },
      { key: 'recommendation' as keyof typeof blocksConfig, component: <RecommendationBlock /> },
      { key: 'categories' as keyof typeof blocksConfig, component: <CategoriesBlock /> },
      { key: 'audio' as keyof typeof blocksConfig, component: <AudioBlock /> },
      { key: 'todayEvent' as keyof typeof blocksConfig, component: <TodayEventBlock /> },
      { key: 'regions' as keyof typeof blocksConfig, component: <RegionsBlock /> }
    ];

    return blocks
      .filter(block => blocksConfig[block.key]?.enabled)
      .sort((a, b) => blocksConfig[a.key].order - blocksConfig[b.key].order);
  };

  // مكون عرض نقاط الولاء
  const LoyaltyPointsDisplay = () => {
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      fetchLoyaltyPoints();
    }, []);
    
    const fetchLoyaltyPoints = async () => {
      try {
        const userId = localStorage.getItem('user_id') || 'anonymous';
        if (userId === 'anonymous') {
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/user/loyalty-points/${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          setLoyaltyPoints(data.data?.total_points || 0);
          // حفظ في localStorage
          localStorage.setItem('user_loyalty_points', data.data?.total_points?.toString() || '0');
        }
      } catch (error) {
        console.error('Error fetching loyalty points:', error);
        // استخدام القيمة المحفوظة محلياً
        const savedPoints = localStorage.getItem('user_loyalty_points');
        if (savedPoints) {
          setLoyaltyPoints(parseInt(savedPoints));
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (!isLoggedIn) return null;
    
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${darkMode ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700/50' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300'}`}>
        <Crown className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
        <div className="flex flex-col">
          <span className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
            رصيد النقاط
          </span>
          <span className={`text-lg font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                {loyaltyPoints.toLocaleString('ar-SA')} نقطة
              </>
            )}
          </span>
        </div>
      </div>
    );
  };

  // جلب المقالات الشخصية
  useEffect(() => {
    const fetchArticles = async () => {
      setArticlesLoading(true);
      try {
        const response = await fetch('/api/articles?status=published&limit=8');
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles || []);
        } else {
          console.error('Failed to fetch articles:', response.status);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setArticlesLoading(false);
      }
    };

    fetchArticles();
  }, []);
  
  // جلب المحتوى المخصص
  useEffect(() => {
    const fetchPersonalizedContent = async () => {
      if (!isLoggedIn || !userId || !userInterests.length) {
        setShowPersonalized(false);
        setPersonalizedLoading(false); // تأكد من إيقاف التحميل للزوار
        return;
      }
      
      try {
        setPersonalizedLoading(true);
        const response = await fetch(`/api/articles/personalized?userId=${userId}&limit=12`);
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
          setPersonalizedArticles(data.articles);
          setShowPersonalized(true);
        } else {
          setShowPersonalized(false);
        }
      } catch (error) {
        console.error('Error fetching personalized content:', error);
        setShowPersonalized(false);
      } finally {
        setPersonalizedLoading(false);
      }
    };
    
    if (!isCheckingAuth) {
      fetchPersonalizedContent();
    }
  }, [isLoggedIn, userId, userInterests, isCheckingAuth]);

  // جلب التحليلات العميقة
  useEffect(() => {
    const fetchDeepInsights = async () => {
      try {
        setDeepInsightsLoading(true);
        const response = await fetch('/api/deep-insights?limit=3&sort=desc');
        if (response.ok) {
          const data = await response.json();
          console.log('Deep insights fetched:', data);
          setDeepInsights(data || []);
        } else {
          console.error('Failed to fetch deep insights:', response.status);
        }
      } catch (error) {
        console.error('Error fetching deep insights:', error);
      } finally {
        setDeepInsightsLoading(false);
      }
    };

    fetchDeepInsights();
  }, []);

  // جلب التصنيفات
  useEffect(() => {
    const fetchCategoriesData = async () => {
      setCategoriesLoading(true);
      try {
        // إذا كان المستخدم مسجل دخول، جلب التصنيفات المخصصة
        if (isLoggedIn && userId) {
          const response = await fetch(`/api/categories/personalized?userId=${userId}&limit=6`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setCategories(data.categories);
              console.log('تم جلب التصنيفات المخصصة:', data.personalization_info);
            } else {
              console.error('Failed to fetch personalized categories:', data.error);
              // إذا فشل، جلب التصنيفات العادية
              await fetchRegularCategories();
            }
          } else {
            console.error('Failed to fetch personalized categories:', response.status);
            // إذا فشل، جلب التصنيفات العادية
            await fetchRegularCategories();
          }
        } else {
          // إذا لم يكن مسجل دخول، جلب التصنيفات العادية
          await fetchRegularCategories();
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // في حالة الخطأ، جلب التصنيفات العادية
        await fetchRegularCategories();
      } finally {
        setCategoriesLoading(false);
      }
    };

    const fetchRegularCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCategories(data.categories);
          } else {
            console.error('Failed to fetch regular categories:', data.error);
          }
        } else {
          console.error('Failed to fetch regular categories:', response.status);
        }
      } catch (error) {
        console.error('Error fetching regular categories:', error);
      }
    };

    fetchCategoriesData();
  }, []);

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{
        direction: 'rtl'
      }}
    >
      {/* دالة تشخيص المصادقة - تظهر معلومات في Console فقط */}
      <DebugAuth />
      
      {/* Header */}
      <Header />

      {/* بلوك الجرعات الذكي - أول بلوك بعد الهيدر */}
      <SmartDigestBlock />
      
      {/* Deep Analysis Widget - ثاني بلوك مباشرة بعد الجرعات */}
      {!deepInsightsLoading && deepInsights.length > 0 && (
        <DeepAnalysisWidget insights={deepInsights} />
      )}

      {/* Smart Blocks - Top Banner - مخفي للنسخة المطورة */}
      {/* <div className="max-w-7xl mx-auto px-6 py-4">
        <SmartSlot position="topBanner" />
      </div> */}

      {/* Smart Blocks - After Highlights - مخفي للنسخة المطورة */}
      {/* <SmartSlot position="afterHighlights" /> */}

      {/* Elegant Separator */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex items-center justify-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <div className={`px-6 py-2 rounded-full ${darkMode ? 'bg-gray-800 text-gray-400 dark:text-gray-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">المحتوى الذكي</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>
      </div>

      {/* شريط التنقل بالتصنيفات */}
      <section className="max-w-7xl mx-auto px-6 mb-16">
        <div className={`rounded-3xl p-8 transition-all duration-500 shadow-lg dark:shadow-gray-900/50 ${darkMode ? 'bg-blue-900/10 border border-blue-800/30' : 'bg-blue-50 dark:bg-blue-900/20/50 border border-blue-200/50'}`} style={{ 
          backdropFilter: 'blur(10px)',
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(30, 64, 175, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(191, 219, 254, 0.3) 100%)'
        }}>
          <div className="text-center mb-8">
            {/* أيقونة كبيرة وواضحة */}
            <div className="mb-4">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-xl ${
                darkMode 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-800' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-700'
              }`}>
                <Tag className="w-10 h-10 text-white" />
              </div>
            </div>
            
            {/* العنوان */}
            <h2 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'
            }`}>
              {isLoggedIn ? 'استكشف بحسب اهتماماتك' : 'استكشف بحسب التصنيفات'}
            </h2>
            
            {/* الوصف */}
            <p className={`text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {isLoggedIn 
                ? 'التصنيفات المختارة لك بناءً على تفضيلاتك وتفاعلاتك'
                : 'اختر التصنيف الذي يهمك لتصفح الأخبار المتخصصة'
              }
            </p>
            <div className={`text-xs mt-2 transition-colors duration-300 ${
              darkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              {isLoggedIn ? (
                <div className="flex items-center gap-1 justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="opacity-75">مخصص لك بناءً على تفضيلاتك</span>
                </div>
              ) : (
                <span className="opacity-75">التصنيفات مرتبطة بنظام إدارة المحتوى</span>
              )}
            </div>
          </div>

          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {categories.map((category: any) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`group px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 relative ${ selectedCategory === category.id ? darkMode ? 'bg-blue-600 text-white border-2 border-blue-500 shadow-lg dark:shadow-gray-900/50' : 'bg-blue-500 text-white border-2 border-blue-400 shadow-lg dark:shadow-gray-900/50' : darkMode ? 'bg-blue-800/20 hover:bg-blue-700/30 text-blue-100 hover:text-blue-50 border border-blue-700/30 hover:border-blue-600/50' : 'bg-white dark:bg-gray-800/80 hover:bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-blue-600 border border-blue-200/50 hover:border-blue-300 shadow-sm dark:shadow-gray-900/50 hover:shadow-lg dark:shadow-gray-900/50 backdrop-blur-sm' }`}
                  >
                    {/* شارة "مخصص" للتصنيفات المخصصة */}
                    {isLoggedIn && category.is_personalized && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = categoryIcons[category.name_ar] || categoryIcons['default'];
                        return category.icon ? (
                          <span className="text-lg group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
                        ) : (
                          <IconComponent className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        );
                      })()}
                      <span>{category.name_ar || category.name}</span>
                      <span className={`text-xs ${ selectedCategory === category.id ? 'text-white/90' : darkMode ? 'text-blue-200 opacity-60' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 opacity-60' }`}>
                        ({category.articles_count || 0})
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* عرض المقالات المرتبطة بالتصنيف المختار */}
              {selectedCategory && (
                <div className={`mt-8 p-6 rounded-3xl shadow-lg dark:shadow-gray-900/50 ${darkMode ? 'bg-gray-800/50' : 'bg-white dark:bg-gray-800/70'} backdrop-blur-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                      مقالات {categories.find(c => c.id === selectedCategory)?.name_ar}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setCategoryArticles([]);
                      }}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800'}`}
                    >
                      <X className={`w-5 h-5 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`} />
                    </button>
                  </div>

                  {categoryArticlesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : categoryArticles.length > 0 ? (
                    <>
                      {/* Grid Layout for Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryArticles.map((article: any) => (
                          <Link key={article.id} href={`/article/${article.id}`} className="group">
                            <article className={`h-full rounded-3xl overflow-hidden shadow-xl dark:shadow-gray-900/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}>
                              {/* صورة المقال */}
                              <div className="relative h-48 overflow-hidden">
                                {article.featured_image ? (
                                  <img
                                    src={article.featured_image}
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    <BookOpen className={`w-16 h-16 ${darkMode ? 'text-gray-600 dark:text-gray-400 dark:text-gray-500' : 'text-gray-300'}`} />
                                  </div>
                                )}
                                
                                {/* تأثير التدرج على الصورة */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                {/* Category Badge */}
                                <div className="absolute top-3 right-3">
                                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-blue-900/80 text-blue-200 backdrop-blur-sm' : 'bg-blue-500/90 text-white backdrop-blur-sm'}`}>
                                    <Tag className="w-3 h-3" />
                                    {categories.find(c => c.id === selectedCategory)?.name_ar}
                                  </span>
                                </div>
                              </div>

                              {/* محتوى البطاقة */}
                              <div className="p-5">
                                {/* العنوان */}
                                <h4 className={`font-bold text-lg mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                  {article.title}
                                </h4>

                                {/* الملخص */}
                                {article.summary && (
                                  <p className={`text-sm mb-4 line-clamp-2 transition-colors duration-300 text-gray-600 dark:text-gray-400 dark:text-gray-500`}>
                                    {article.summary}
                                  </p>
                                )}

                                {/* التفاصيل السفلية */}
                                <div className={`flex items-center justify-between pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100 dark:border-gray-700'}`}>
                                  {/* المعلومات */}
                                  <div className="flex flex-col gap-1">
                                    {/* التاريخ والوقت */}
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                                        <Calendar className="w-3 h-3" />
                                        {new Date(article.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                      </span>
                                      {article.reading_time && (
                                        <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                                          <Clock className="w-3 h-3" />
                                          {article.reading_time} د
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* الكاتب والمشاهدات */}
                                    <div className="flex items-center gap-3 text-xs">
                                      {article.author_name && (
                                        <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                                          <User className="w-3 h-3" />
                                          {article.author_name}
                                        </span>
                                      )}
                                      <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                                        <Eye className="w-3 h-3" />
                                        {article.views_count || 0}
                                      </span>
                                    </div>
                                  </div>

                                  {/* زر القراءة */}
                                  <div className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-blue-900/20 group-hover:bg-blue-800/30' : 'bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100'}`}>
                                    <ArrowLeft className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                  </div>
                                </div>
                              </div>
                            </article>
                          </Link>
                        ))}
                      </div>
                      
                      {/* زر عرض جميع المقالات */}
                      <div className="text-center mt-8">
                        <Link 
                          href={`/categories/${categories.find(c => c.id === selectedCategory)?.slug || categories.find(c => c.id === selectedCategory)?.name_ar?.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 transform hover:scale-105 shadow-lg dark:shadow-gray-900/50 hover:shadow-xl dark:shadow-gray-900/50 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'}`}>
                          <span>عرض جميع مقالات {categories.find(c => c.id === selectedCategory)?.name_ar}</span>
                          <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </>
                    
                  ) : (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد مقالات منشورة في هذا التصنيف حالياً</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
              <p className="text-sm">لا توجد تصنيفات متاحة حالياً</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Enhanced News Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            {isCheckingAuth ? (
              // عرض حالة تحميل أثناء التحقق من تسجيل الدخول
              <div className="animate-pulse">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700 mb-6">
                  <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-32 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="w-96 h-10 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-4"></div>
                <div className="w-full max-w-2xl h-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                {/* رأس القسم مع شرط حالة تسجيل الدخول */}
                {!isCheckingAuth && (
                  isLoggedIn ? (
                    // للمستخدم المسجل
                    <>
                      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-6">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          نسخة مطورة بالذكاء الاصطناعي
                        </span>
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      </div>
                      <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        🎯 محتوى ذكي مخصص لاهتماماتك
                      </h2>
                      <p className={`text-xl max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        نقدم لك أفضل المقالات المختارة خصيصاً بناءً على اهتماماتك المحددة
                      </p>
                    </>
                  ) : (
                    // للزائر غير المسجل
                    <>
                      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 mb-6 dark:bg-gray-800/40 dark:border-gray-700">
                        <Newspaper className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          أحدث المقالات
                        </span>
                      </div>
                      <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        📰 آخر الأخبار
                      </h2>
                      <p className={`text-xl max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        تابع أحدث المقالات المنشورة من جميع التصنيفات
                      </p>
                    </>
                  )
                )}
              </>
            )}
          </div>

          {/* Enhanced Show All Link */}
          <div className="flex items-center justify-end mb-8">
            <Link 
              href="/for-you"
              className="group inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg dark:shadow-gray-900/50 hover:shadow-xl dark:shadow-gray-900/50 hover:scale-105">
              <span>عرض الكل</span>
              <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Enhanced News Grid - مع دعم المحتوى المخصص */}
          {articlesLoading || personalizedLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>جاري تحميل المقالات...</p>
              </div>
            </div>
          ) : (
            <>
              {/* رسالة للمستخدمين المسجلين مع اهتمامات */}
              {isLoggedIn && userInterests.length > 0 && showPersonalized && (
                <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
                  darkMode 
                    ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/30' 
                    : 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <Sparkles className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      يتم عرض المحتوى بناءً على اهتماماتك: {userInterests.map(interestId => {
                        // البحث عن اسم الفئة من قائمة الفئات المحملة
                        const category = categories.find(cat => cat.id === interestId);
                        return category ? (category.name_ar || category.name) : '';
                      }).filter(name => name).join(' • ')}
                    </p>
                  </div>
                  <Link 
                    href="/welcome/preferences"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      darkMode 
                        ? 'bg-purple-800/30 hover:bg-purple-700/40 text-purple-300' 
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                    }`}
                  >
                    <Settings className="w-3 h-3" />
                    تعديل
                  </Link>
                </div>
              )}
              
              {/* رسالة للمستخدمين غير المسجلين */}
              {!isLoggedIn && (
                <div className={`mb-6 p-4 rounded-xl text-center ${
                  darkMode 
                    ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                }`}>
                  <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    🎯 سجل دخولك للحصول على محتوى مخصص حسب اهتماماتك
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link 
                      href="/register"
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                    >
                      إنشاء حساب
                    </Link>
                    <Link 
                      href="/login"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                        darkMode 
                          ? 'border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-800' 
                          : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      تسجيل دخول
                    </Link>
                  </div>
                </div>
              )}
              
              {/* عرض المقالات */}
              {(showPersonalized && personalizedArticles.length > 0) ? (
                // عرض المقالات المخصصة للمستخدمين المسجلين
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {personalizedArticles.slice(0, 8).map((news) => (
                    <div key={news.id} className="relative">
                      {/* شارة "مخصص لك" */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                          darkMode 
                            ? 'bg-purple-900/80 text-purple-200' 
                            : 'bg-purple-500/90 text-white'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          مخصص
                        </span>
                      </div>
                      <NewsCard news={news} />
                    </div>
                  ))}
                </div>
              ) : articles.length > 0 ? (
                // عرض آخر المقالات للزوار أو المستخدمين بدون تفضيلات
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {articles.slice(0, 8).map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              ) : (
                // لا توجد مقالات
                <div className={`text-center py-20 ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                  <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">لا توجد مقالات منشورة حالياً</p>
                  <p className="text-sm">تحقق لاحقاً للحصول على آخر الأخبار والمقالات</p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Smart Blocks - After Cards - مخفي للنسخة المطورة */}
        {/* <SmartSlot position="afterCards" /> */}

        {/* Smart Blocks - Before Personalization - مخفي للنسخة المطورة */}
        {/* <SmartSlot position="beforePersonalization" /> */}

        {/* Enhanced Smart Blocks Section - مخفي للنسخة المطورة */}
        {/* <section className="mb-16">
          ... البلوكات الذكية مخفية للتركيز على المحتوى المخصص ...
        </section> */}

        {/* السياق الذكي */}
        <section className="mb-16">
          <SmartContextWidget />
        </section>

        {/* المقالات التفاعلية - التصميم الجديد */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 mb-6">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  تفاعل مباشر
                </span>
                <Zap className="w-5 h-5 text-pink-600" />
              </div>
              <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                🎯 شارك رأيك وتفاعل مع المحتوى
              </h2>
              <p className={`text-lg max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                مقالات مميزة تتيح لك التصويت والمشاركة في استطلاعات الرأي والنقاش المباشر مع القراء
              </p>
            </div>

            {/* التصميم الجديد - Mix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* بطاقة التصويت السريع */}
              <div className={`group relative rounded-3xl overflow-hidden shadow-2xl dark:shadow-gray-900/50 hover:shadow-3xl transition-all duration-500 transform hover:scale-105 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* شارة النوع */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                    تصويت سريع
                  </span>
                </div>
                
                {/* الصورة */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80" 
                    alt="الذكاء الاصطناعي في التعليم"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* عداد المشاركين */}
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
                      <Users className="w-4 h-4" />
                      <span>2.3K مشارك</span>
                    </div>
                  </div>
                </div>
                
                {/* المحتوى */}
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    هل يجب تدريس الذكاء الاصطناعي في المدارس؟
                  </h3>
                  <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    شارك برأيك في أهمية إدخال مناهج الذكاء الاصطناعي في التعليم الأساسي
                  </p>
                  
                  {/* أزرار التصويت */}
                  <div className="space-y-3 mb-6">
                    <button className={`w-full p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      darkMode 
                        ? 'border-gray-600 hover:border-green-500 bg-gray-800 hover:bg-green-900/20' 
                        : 'border-gray-200 hover:border-green-500 bg-white hover:bg-green-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>نعم، ضروري</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>68%</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{width: '68%'}}></div>
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    <button className={`w-full p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      darkMode 
                        ? 'border-gray-600 hover:border-red-500 bg-gray-800 hover:bg-red-900/20' 
                        : 'border-gray-200 hover:border-red-500 bg-white hover:bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>لا، مبكر جداً</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>32%</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{width: '32%'}}></div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  {/* زر المشاركة */}
                  <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                    صوت الآن
                  </button>
                </div>
              </div>

              {/* بطاقة الاستطلاع المتعدد */}
              <div className={`group relative rounded-3xl overflow-hidden shadow-2xl dark:shadow-gray-900/50 hover:shadow-3xl transition-all duration-500 transform hover:scale-105 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* شارة النوع */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                    استطلاع متعدد
                  </span>
                </div>
                
                {/* الصورة */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=80" 
                    alt="كأس آسيا"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* مؤقت */}
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
                      <Clock className="w-4 h-4" />
                      <span>ينتهي خلال 4 ساعات</span>
                    </div>
                  </div>
                </div>
                
                {/* المحتوى */}
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    من سيفوز بكأس آسيا هذا العام؟
                  </h3>
                  <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    توقع الفريق الفائز وشارك في النقاش مع المشجعين
                  </p>
                  
                  {/* خيارات الاستطلاع */}
                  <div className="space-y-3 mb-6">
                    {[
                      {name: 'السعودية', votes: 45, color: 'green'},
                      {name: 'اليابان', votes: 25, color: 'blue'},
                      {name: 'كوريا الجنوبية', votes: 20, color: 'red'},
                      {name: 'أستراليا', votes: 10, color: 'yellow'}
                    ].map((option, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-purple-300 transition-all cursor-pointer">
                        <div className={`w-4 h-4 rounded-full bg-${option.color}-500`}></div>
                        <span className={`flex-1 font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{option.name}</span>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{option.votes}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full bg-${option.color}-500 rounded-full`} style={{width: `${option.votes}%`}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* زر المشاركة */}
                  <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                    شارك توقعك
                  </button>
                </div>
              </div>

              {/* بطاقة النقاش المفتوح */}
              <div className={`group relative rounded-3xl overflow-hidden shadow-2xl dark:shadow-gray-900/50 hover:shadow-3xl transition-all duration-500 transform hover:scale-105 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* شارة النوع */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                    نقاش مفتوح
                  </span>
                </div>
                
                {/* الصورة */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80" 
                    alt="رؤية 2030"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* عدد التعليقات */}
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
                      <MessageSquare className="w-4 h-4" />
                      <span>134 تعليق</span>
                    </div>
                  </div>
                </div>
                
                {/* المحتوى */}
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    تأثير رؤية 2030 على الاقتصاد المحلي
                  </h3>
                  <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    ناقش التحولات الاقتصادية وشارك تجربتك الشخصية مع القراء
                  </p>
                  
                  {/* آخر التعليقات */}
                  <div className="space-y-3 mb-6">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">أ</div>
                        <div className="flex-1">
                          <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            "شهدت تحسناً كبيراً في فرص العمل..."
                          </p>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>أحمد محمد - منذ ساعة</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">س</div>
                        <div className="flex-1">
                          <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            "الاستثمارات الأجنبية زادت بشكل ملحوظ"
                          </p>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>سارة أحمد - منذ 3 ساعات</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* زر المشاركة */}
                  <Link href="/article/interactive/vision-2030-impact" className="block">
                    <button className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                      انضم للنقاش
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* شريط الإحصائيات */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`text-center p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <div className="text-3xl font-bold text-orange-500 mb-2">15K+</div>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>تصويت اليوم</div>
              </div>
              <div className={`text-center p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <div className="text-3xl font-bold text-purple-500 mb-2">8.2K</div>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>مشارك نشط</div>
              </div>
              <div className={`text-center p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <div className="text-3xl font-bold text-green-500 mb-2">2.1K</div>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>تعليق جديد</div>
              </div>
              <div className={`text-center p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <div className="text-3xl font-bold text-blue-500 mb-2">94%</div>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>معدل التفاعل</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Smart Blocks - Before Footer - مخفي للنسخة المطورة */}
      {/* <SmartSlot position="beforeFooter" /> */}

      {/* ويدجت الذكاء الشخصي العائمة - تم إخفاؤه */}
      {/* {!isCheckingAuth && userTracker && isLoggedIn && showUserWidget && (
        <UserIntelligenceWidget />
      )} */}

      {/* Footer Dashboard */}
      <FooterDashboard />

      {/* Enhanced Footer */}
      <footer className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50 dark:bg-gray-900'}`}>

        {/* Border */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            {/* Logo Section */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                  <span className="text-white font-bold text-xl">س</span>
                </div>
                <div className="text-left">
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                    سبق
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                    صحيفة المستقبل الذكية
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className={`text-center px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="text-2xl font-bold text-blue-600 mb-1">1.2M+</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>قارئ نشط</div>
              </div>
              <div className={`text-center px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="text-2xl font-bold text-green-600 mb-1">50K+</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>مقال يومياً</div>
              </div>
              <div className={`text-center px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="text-2xl font-bold text-purple-600 mb-1">AI</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>ذكاء اصطناعي</div>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <a href="#" className={`text-sm hover:text-blue-500 transition-colors ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                سياسة الخصوصية
              </a>
              <a href="#" className={`text-sm hover:text-blue-500 transition-colors ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                شروط الاستخدام
              </a>
              <a href="#" className={`text-sm hover:text-blue-500 transition-colors ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                تواصل معنا
              </a>
              <a href="#" className={`text-sm hover:text-blue-500 transition-colors ${darkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                عن سبق
              </a>
            </div>

            {/* Copyright */}
            <div className="flex items-center justify-center gap-2">
              <p className={`text-sm ${darkMode ? 'text-gray-500 dark:text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                © 2025 صحيفة سبق – جميع الحقوق محفوظة
              </p>
              <div className="flex items-center gap-1">
                <span className="text-red-500">❤️</span>
                <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500'}`}>
                  صُنع بحب في المملكة العربية السعودية
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-slide-down {
          animation: slideDown 0.5s ease-out;
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translate(-50%, -20px);
          }
          to { 
            opacity: 1; 
            transform: translate(-50%, 0);
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        
        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkMode ? '#1f2937' : '#f1f5f9'};
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#4f46e5' : '#3b82f6'};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#4338ca' : '#2563eb'};
        }
      `}</style>
    </div>
  );
}

// Export with client-side wrapper to ensure ThemeProvider is available
export default function Page() {
  return <NewspaperHomePage />;
} 