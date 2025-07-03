'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Filter, 
  Bell, 
  TrendingUp, 
  Newspaper, 
  BarChart3, 
  Edit3, 
  Settings, 
  Tag,
  Eye,
  Heart,
  Share2,
  ArrowUp,
  RefreshCw,
  Loader2,
  ChevronDown,
  Sunrise,
  Moon,
  Sun,
  MessageCircle,
  Trophy,
  Users,
  AlertCircle,
  Activity,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import Header from '@/components/Header';

interface TimelineEvent {
  id: string;
  type: string;
  timestamp: string;
  date: string;
  timeAgo: string;
  title: string;
  description?: string;
  category?: string;
  categoryColor?: string;
  icon: string;
  author?: string;
  authorAvatar?: string;
  url?: string;
  isNew?: boolean;
  displayType: string;
  metadata?: any;
  engagement?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

export default function MomentByMomentPage() {
  const { darkMode } = useDarkModeContext();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newEventsCount, setNewEventsCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<any>({});

  // أنواع المحتوى وألوانها
  const eventTypes = {
    all: { icon: '📍', color: 'blue', label: 'الكل', bgColor: '#3B82F6' },
    articles: { icon: '📰', color: 'blue', label: 'أخبار', bgColor: '#3B82F6' },
    analysis: { icon: '📊', color: 'purple', label: 'تحليلات', bgColor: '#8B5CF6' },
    comments: { icon: '💬', color: 'green', label: 'تعليقات', bgColor: '#10B981' },
    system: { icon: '🛠️', color: 'gray', label: 'نظام', bgColor: '#6B7280' },
    community: { icon: '🏆', color: 'pink', label: 'مجتمع', bgColor: '#EC4899' }
  };

  // تحديث الوقت الحالي
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTimelineEvents();
    
    // طلب إذن الإشعارات
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // تحديث تلقائي كل 30 ثانية للأحداث الحية
    if (autoRefresh) {
      const interval = setInterval(() => {
        checkForNewEvents();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filter]);

  const fetchTimelineEvents = async (append = false) => {
    try {
      if (!append) setLoading(true);
      
      const currentCount = append ? events.length : 0;
      const response = await fetch(`/api/timeline?limit=50&offset=${currentCount}&filter=${filter}&realtime=${autoRefresh}`);
      const data = await response.json();
      
      if (data.success && data.events) {
        if (append) {
          setEvents([...events, ...data.events]);
        } else {
          setEvents(data.events);
        }
        setStats(data.stats || {});
        setNewEventsCount(data.stats?.newEvents || 0);
        setHasMore(data.pagination?.hasMore || false);
      }
      
    } catch (error) {
      console.error('Error fetching timeline events:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const checkForNewEvents = async () => {
    try {
      const response = await fetch('/api/timeline?limit=10&realtime=true');
      const data = await response.json();
      
      if (data.success && data.events) {
        const newEvents = data.events.filter((event: any) => event.isNew);
        
        if (newEvents.length > 0) {
          setNewEventsCount(prev => prev + newEvents.length);
          
          // إشعار صوتي
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
          
          // إشعار مرئي
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('📍 أحداث جديدة في اللحظة بلحظة!', {
              body: `${newEvents.length} حدث جديد`,
              icon: '/favicon.ico'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new events:', error);
    }
  };

  const loadMore = () => {
    setIsLoadingMore(true);
    fetchTimelineEvents(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'ك';
    }
    return num.toString();
  };

  // دالة للحصول على تحية الوقت
  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return { text: 'صباح الخير', icon: Sunrise, color: 'text-yellow-500' };
    if (hour >= 12 && hour < 17) return { text: 'مساء الخير', icon: Sun, color: 'text-orange-500' };
    return { text: 'مساء الخير', icon: Moon, color: 'text-indigo-500' };
  };

  // دالة للتحقق من تغيير اليوم
  const isDifferentDay = (date1: string, date2: string) => {
    return date1 !== date2;
  };

  // دالة للحصول على اسم اليوم
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[date.getDay()];
  };

  // دالة للحصول على أيقونة النوع
  const getEventIcon = (event: TimelineEvent) => {
    switch (event.displayType) {
      case 'article':
        return event.metadata?.breaking ? <AlertCircle className="w-4 h-4" /> : <Newspaper className="w-4 h-4" />;
      case 'analysis':
        return <BarChart3 className="w-4 h-4" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4" />;
      case 'community':
        return <Trophy className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        {/* Header */}
        <Header />
        
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              جاري تحميل اللحظات...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const greeting = getTimeGreeting();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
      {/* Header الرسمي */}
      <Header />

      {/* Page Header - محسّن بخلفية متدرجة */}
      <div className={`relative overflow-hidden ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      } border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* خلفية متحركة */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-1/2 -right-1/2 w-96 h-96 rounded-full ${
            darkMode ? 'bg-blue-900/20' : 'bg-blue-200/30'
          } blur-3xl animate-pulse`}></div>
          <div className={`absolute -bottom-1/2 -left-1/2 w-96 h-96 rounded-full ${
            darkMode ? 'bg-purple-900/20' : 'bg-purple-200/30'
          } blur-3xl animate-pulse delay-1000`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* العنوان الرئيسي والوصف */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className={`p-4 rounded-2xl ${
                darkMode 
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              } shadow-xl`}>
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h1 className={`text-5xl font-bold ${
                darkMode 
                  ? 'text-white' 
                  : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
              }`}>
                اللحظة بلحظة
              </h1>
            </div>
            <p className={`text-lg max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              تابع أحدث الأحداث والمحتويات والتحديثات في صحيفة سبق لحظة بلحظة، في تسلسل زمني تفاعلي
            </p>
          </div>

          {/* الإحصائيات - تصميم أنيق ومدمج */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            {/* العدد الإجمالي */}
            <div className={`group relative overflow-hidden px-6 py-3 rounded-2xl ${
              darkMode 
                ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' 
                : 'bg-white/70 backdrop-blur-sm border border-gray-200 shadow-lg'
            } transition-all hover:scale-105`}>
              <div className="flex items-center gap-3">
                <Activity className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <span className={`text-3xl font-bold ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>{stats.total || events.length}</span>
                  <span className={`text-sm font-medium mr-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>لحظة موثقة</span>
                </div>
              </div>
            </div>

            {/* الأحداث الجديدة */}
            {newEventsCount > 0 && (
              <button
                onClick={() => {
                  setNewEventsCount(0);
                  fetchTimelineEvents();
                }}
                className="relative overflow-hidden px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 animate-bounce" />
                  <span className="font-bold text-lg">{newEventsCount}</span>
                  <span className="text-sm">حدث جديد</span>
                </div>
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </button>
            )}
          </div>

          {/* التحكم والفلاتر - مدمج في شريط واحد */}
          <div className={`p-4 rounded-2xl ${
            darkMode 
              ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' 
              : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'
          }`}>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* الفلاتر */}
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(eventTypes).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`group relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      filter === key
                        ? 'text-white shadow-lg transform scale-105'
                        : (darkMode 
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                    }`}
                    style={{
                      backgroundColor: filter === key ? value.bgColor : undefined
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-1">
                      <span>{value.icon}</span>
                      <span>{value.label}</span>
                      {stats.byType && key !== 'all' && stats.byType[key] > 0 && (
                        <span className={`mr-1 px-1.5 py-0.5 rounded-full text-xs ${
                          filter === key 
                            ? 'bg-white/20 text-white' 
                            : (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600')
                        }`}>
                          {stats.byType[key]}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>

              {/* أزرار التحكم */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchTimelineEvents()}
                  className={`px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 ${
                    darkMode 
                      ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 inline ml-1" />
                  تحديث
                </button>
                
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    autoRefresh 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl'
                      : (darkMode 
                          ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-200' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                  }`}
                >
                  <ArrowUp className={`w-4 h-4 inline ml-1 ${autoRefresh ? 'animate-bounce' : ''}`} />
                  {autoRefresh ? 'مباشر' : 'تفعيل المباشر'}
                </button>
              </div>
            </div>
          </div>

          {/* زر استعراض التسلسل الزمني */}
          <div className="text-center mt-8">
            <button
              onClick={() => {
                const timelineSection = document.getElementById('timeline-content');
                timelineSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-medium text-white transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl ${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              <span className="text-lg">استعراض التسلسل الزمني</span>
              <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Sub Header - مبسط ومحسّن */}
      <div className={`sticky top-16 z-40 ${
        darkMode 
          ? 'bg-gray-800/90 backdrop-blur-md' 
          : 'bg-white/90 backdrop-blur-md'
      } border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <greeting.icon className={`w-5 h-5 ${greeting.color}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {greeting.text} • {currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            {/* مخطط دائري صغير للإحصائيات */}
            <div className="hidden md:flex items-center gap-4">
              {stats.byType && Object.entries(eventTypes).filter(([key]) => key !== 'all' && stats.byType[key] > 0).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: value.bgColor }}
                  ></div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stats.byType[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div id="timeline-content" className={`max-w-4xl mx-auto px-6 py-12 ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-white'
      }`}>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              لا توجد أحداث في هذا التصنيف
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* الخط الزمني العمودي */}
            <div className={`absolute right-8 top-0 bottom-0 w-0.5 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>

            {/* الأحداث */}
            {events.map((event, index) => {
              const showDayDivider = index === 0 || isDifferentDay(event.date, events[index - 1].date);
              
              return (
                <React.Fragment key={event.id}>
                  {/* فاصل اليوم على الخط الزمني */}
                  {showDayDivider && (
                    <div className="relative mb-6">
                      {/* أيقونة التقويم على الخط الزمني */}
                      <div className={`absolute right-5 w-6 h-6 rounded-full ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      } border-2 ${
                        darkMode ? 'border-blue-500' : 'border-blue-600'
                      } flex items-center justify-center`}>
                        <Calendar className={`w-3 h-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      
                      {/* تاريخ اليوم */}
                      <div className="pr-16">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                          darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>
                          <span>{getDayName(event.date)}</span>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {event.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative mb-6 pr-16">
                    {/* النقطة على الخط الزمني */}
                    <div 
                      className="absolute right-5 w-6 h-6 rounded-full border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center"
                      style={{ backgroundColor: event.categoryColor || '#6B7280' }}
                    >
                      <span className="text-xs">{getEventIcon(event)}</span>
                      {event.isNew && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>

                    {/* محتوى الحدث - تصميم مبسط وأنيق */}
                    <div className={`group relative overflow-hidden ${
                      darkMode ? 'bg-gray-800/50' : 'bg-white'
                    } rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border ${
                      darkMode ? 'border-gray-700/50' : 'border-gray-100'
                    }`}>
                      {/* خلفية متدرجة خفيفة */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        darkMode 
                          ? 'bg-gradient-to-br from-gray-800/50 to-transparent' 
                          : 'bg-gradient-to-br from-gray-50/50 to-transparent'
                      }`}></div>

                      {/* المحتوى الرئيسي */}
                      <div className="relative z-10">
                        {/* رأس البطاقة - مبسط */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            {/* أيقونة النوع */}
                            <div className={`p-2 rounded-lg ${
                              darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                            }`}>
                              <span className="text-lg">{event.icon}</span>
                            </div>
                            
                            {/* المعلومات الأساسية */}
                            <div className="flex-1">
                              {/* العنوان */}
                              <h3 className={`text-base font-semibold leading-tight mb-1 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {event.url ? (
                                  <Link 
                                    href={event.url} 
                                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  >
                                    {event.title}
                                  </Link>
                                ) : (
                                  event.title
                                )}
                              </h3>
                              
                              {/* الوقت والتصنيف */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {event.timeAgo}
                                </span>
                                
                                {/* عرض تصنيف واحد فقط */}
                                {event.category && (
                                  <span 
                                    className="text-xs px-2 py-0.5 rounded-full text-white"
                                    style={{ 
                                      backgroundColor: event.categoryColor || '#6B7280',
                                      opacity: 0.9
                                    }}
                                  >
                                    {event.category}
                                  </span>
                                )}
                                
                                {/* عاجل فقط إذا كان موجوداً */}
                                {event.metadata?.breaking && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/90 text-white animate-pulse">
                                    عاجل
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* شارة جديد */}
                          {event.isNew && (
                            <div className="relative">
                              <div className="absolute -inset-1 bg-red-500 rounded-full blur opacity-75 animate-pulse"></div>
                              <span className="relative bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                جديد
                              </span>
                            </div>
                          )}
                        </div>

                        {/* الوصف - مختصر */}
                        {event.description && (
                          <p className={`text-sm line-clamp-2 mb-3 ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {event.description}
                          </p>
                        )}

                        {/* شريط المعلومات السفلي - مبسط */}
                        <div className="flex items-center justify-between pt-3 border-t ${
                          darkMode ? 'border-gray-700/50' : 'border-gray-100'
                        }">
                          {/* التفاعلات - مدمجة */}
                          {event.engagement && (event.engagement.views > 0 || event.engagement.likes > 0) && (
                            <div className="flex items-center gap-3">
                              {event.engagement.views > 0 && (
                                <div className={`flex items-center gap-1 text-xs ${
                                  darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  <Eye className="w-3 h-3" />
                                  <span>{formatNumber(event.engagement.views)}</span>
                                </div>
                              )}
                              {(event.engagement.likes > 0 || event.engagement.comments > 0) && (
                                <div className={`flex items-center gap-2 text-xs ${
                                  darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  {event.engagement.likes > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Heart className="w-3 h-3 text-red-400" />
                                      <span>{formatNumber(event.engagement.likes)}</span>
                                    </div>
                                  )}
                                  {event.engagement.comments > 0 && (
                                    <div className="flex items-center gap-1">
                                      <MessageCircle className="w-3 h-3 text-blue-400" />
                                      <span>{formatNumber(event.engagement.comments)}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* المؤلف - مبسط */}
                          {event.author && (
                            <span className={`text-xs ${
                              darkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              {event.author}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* زر تحميل المزيد */}
            {hasMore && !isLoadingMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all hover:scale-105 ${
                    darkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <ChevronDown className="w-4 h-4 inline ml-2" />
                  عرض المزيد
                </button>
              </div>
            )}

            {isLoadingMore && (
              <div className="text-center mt-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 