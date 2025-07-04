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
  ChevronRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import Header from '@/components/Header';
import '@/styles/moment-by-moment.css';

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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [newEventsCount, setNewEventsCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<any>({});
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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
    
    // تحديث تلقائي كل 60 ثانية للأحداث الحية
    if (autoRefresh) {
      const interval = setInterval(() => {
        checkForNewEvents();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filter]);

  const fetchTimelineEvents = async (append = false) => {
    try {
      if (!append) setLoading(true);
      
      const currentCount = append ? events.length : 0;
      const response = await fetch(`/api/timeline?limit=20&offset=${currentCount}&filter=${filter}&realtime=${autoRefresh}`);
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-16">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center p-8 mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-xl opacity-70 animate-pulse" />
            <div className="relative bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full p-6 shadow-2xl">
              <Activity className="w-12 h-12 text-white drop-shadow-lg animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-6 drop-shadow-lg">
            لحظة بلحظة
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8">
            تابع آخر الأحداث والتحديثات الفورية من جميع أقسام الموقع
          </p>
          
          {/* الإحصائيات السريعة */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 bg-black bg-opacity-20 backdrop-blur-md rounded-2xl px-6 sm:px-8 py-4 shadow-xl border border-white border-opacity-20">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">
                  {stats.totalEvents}
                </div>
                <div className="text-xs sm:text-sm text-white">إجمالي الأحداث</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white bg-opacity-50"></div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">
                  {stats.todayEvents}
                </div>
                <div className="text-xs sm:text-sm text-white">أحداث اليوم</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white bg-opacity-50"></div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">
                  {stats.activeUsers}
                </div>
                <div className="text-xs sm:text-sm text-white">مستخدم نشط</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white bg-opacity-50"></div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-300 mb-1 drop-shadow-lg animate-pulse">
                  {newEventsCount > 0 ? newEventsCount : 'مباشر'}
                </div>
                <div className="text-xs sm:text-sm text-white">
                  {newEventsCount > 0 ? 'حدث جديد' : 'بث حي'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar - Sticky */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                جميع الأحداث
              </button>
                              {Object.entries(eventTypes).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                      filter === key
                        ? 'text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={{
                      backgroundColor: filter === key ? value.bgColor : undefined
                    }}
                  >
                    <span className="w-4 h-4">{value.icon}</span>
                    {value.label}
                  </button>
                ))}
            </div>

            {/* Sort and Load More */}
            <div className="flex items-center gap-3">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
              </select>

              {hasMore && (
                                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      تحميل المزيد
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-8">
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
                        <div className={`flex items-center justify-between pt-3 border-t ${
                          darkMode ? 'border-gray-700/50' : 'border-gray-100'
                        }`}>
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
      </section>

      <style jsx>{`
        /* تأثيرات backdrop blur للمتصفحات المختلفة */
        .backdrop-blur-md {
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
        }
        
        /* خلفية سوداء شفافة */
        .bg-black {
          background-color: rgb(0, 0, 0);
        }
        
        .bg-opacity-20 {
          --tw-bg-opacity: 0.2;
        }
        
        .bg-opacity-50 {
          --tw-bg-opacity: 0.5;
        }
        
        /* حدود بيضاء شفافة */
        .border-white {
          border-color: rgb(255, 255, 255);
        }
        
        .border-opacity-20 {
          --tw-border-opacity: 0.2;
        }
        
        /* ضمان ظهور النصوص البيضاء */
        .text-white {
          color: rgb(255, 255, 255);
        }
        
        /* تأثير الظل للنصوص */
        .drop-shadow-lg {
          filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04)) drop-shadow(0 4px 3px rgba(0, 0, 0, 0.1));
        }
        
        .shadow-xl {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
} 