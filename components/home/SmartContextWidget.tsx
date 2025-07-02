'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Sparkles, ChevronRight, Moon, Sun, CloudRain } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

interface ContextData {
  location: {
    city: string;
    country: string;
    timezone: string;
  };
  time: {
    hour: number;
    period: 'morning' | 'afternoon' | 'evening' | 'night';
    date: Date;
  };
  events: {
    isRamadan: boolean;
    isHajj: boolean;
    isNationalDay: boolean;
    currentEvent?: string;
  };
  weather?: {
    temp: number;
    condition: string;
    icon: string;
  };
  recommendations: Array<{
    id: string;
    title: string;
    type: 'article' | 'event' | 'prayer' | 'weather';
    icon: React.ReactNode;
    link: string;
  }>;
}

export default function SmartContextWidget() {
  const [context, setContext] = useState<ContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchContextData();
    const interval = setInterval(fetchContextData, 60000); // تحديث كل دقيقة
    return () => clearInterval(interval);
  }, []);

  const fetchContextData = async () => {
    try {
      // محاكاة جلب البيانات - يمكن استبدالها بـ API حقيقي
      const now = new Date();
      const hour = now.getHours();
      
      // تحديد فترة اليوم
      let period: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
      if (hour >= 5 && hour < 12) period = 'morning';
      else if (hour >= 12 && hour < 17) period = 'afternoon';
      else if (hour >= 17 && hour < 21) period = 'evening';
      else period = 'night';

      // بيانات تجريبية
      const mockContext: ContextData = {
        location: {
          city: 'جدة',
          country: 'السعودية',
          timezone: 'AST'
        },
        time: {
          hour,
          period,
          date: now
        },
        events: {
          isRamadan: checkIfRamadan(now),
          isHajj: false,
          isNationalDay: false,
          currentEvent: checkIfRamadan(now) ? 'شهر رمضان المبارك' : undefined
        },
        weather: {
          temp: 28,
          condition: 'مشمس',
          icon: '☀️'
        },
        recommendations: generateRecommendations(period, checkIfRamadan(now))
      };

      setContext(mockContext);
    } catch (error) {
      console.error('Error fetching context:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfRamadan = (date: Date): boolean => {
    // منطق بسيط للتحقق من رمضان - يمكن استبداله بـ API تقويم هجري
    const month = date.getMonth();
    return month === 2 || month === 3; // مارس/أبريل كمثال
  };

  const generateRecommendations = (period: string, isRamadan: boolean): ContextData['recommendations'] => {
    const recommendations = [];

    if (isRamadan) {
      recommendations.push({
        id: '1',
        title: 'مواقيت الإفطار والسحور',
        type: 'prayer' as const,
        icon: <Moon className="w-5 h-5" />,
        link: '/ramadan/prayer-times'
      });
      recommendations.push({
        id: '2',
        title: 'وصفات رمضانية سريعة',
        type: 'article' as const,
        icon: <Sparkles className="w-5 h-5" />,
        link: '/articles/ramadan-recipes'
      });
    }

    if (period === 'morning') {
      recommendations.push({
        id: '3',
        title: 'نشرة الأخبار الصباحية',
        type: 'article' as const,
        icon: <Sun className="w-5 h-5" />,
        link: '/news/morning-brief'
      });
    }

    if (period === 'evening') {
      recommendations.push({
        id: '4',
        title: 'ملخص أحداث اليوم',
        type: 'article' as const,
        icon: <Calendar className="w-5 h-5" />,
        link: '/news/daily-summary'
      });
    }

    recommendations.push({
      id: '5',
      title: 'فعاليات محلية في جدة',
      type: 'event' as const,
      icon: <MapPin className="w-5 h-5" />,
      link: '/events/jeddah'
    });

    return recommendations;
  };

  if (loading) {
    return (
      <div className={`${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} rounded-2xl p-6 animate-pulse`}>
        <div className={`h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-48 mb-4`}></div>
        <div className="space-y-3">
          <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-full`}></div>
          <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4`}></div>
        </div>
      </div>
    );
  }

  if (!context) return null;

  const getGreeting = () => {
    const { period } = context.time;
    if (context.events.isRamadan) return '🌙 رمضان كريم';
    if (period === 'morning') return '☀️ صباح الخير';
    if (period === 'afternoon') return '🌤️ مساء النور';
    if (period === 'evening') return '🌆 مساء الخير';
    return '🌃 أهلاً بك';
  };

  return (
    <section className={`${
      isDark 
        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-white/50'
    } rounded-3xl p-8 shadow-lg border backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Sparkles className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-indigo-600'}`} />
            السياق الذكي
          </h3>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{getGreeting()} من {context.location.city}</p>
        </div>
        
        <div className="text-right">
          <div className={`flex items-center gap-2 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm">{context.time.hour}:00</span>
          </div>
          {context.weather && (
            <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="text-lg">{context.weather.icon}</span>
              <span className="text-sm">{context.weather.temp}°</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Event Banner */}
      {context.events.currentEvent && (
        <div className={`${
          isDark 
            ? 'bg-gradient-to-r from-purple-900 to-indigo-900' 
            : 'bg-gradient-to-r from-purple-600 to-indigo-600'
        } text-white rounded-2xl p-4 mb-6 shadow-md`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-8 h-8" />
              <div>
                <h4 className="font-bold text-lg">{context.events.currentEvent}</h4>
                <p className="text-sm opacity-90">محتوى وفعاليات خاصة متاحة الآن</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6" />
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {context.recommendations.map((rec) => (
          <Link
            key={rec.id}
            href={rec.link}
            className={`group ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-gray-600' 
                : 'bg-white hover:shadow-md border-gray-100 hover:border-indigo-200'
            } rounded-xl p-4 shadow-sm transition-all duration-300 border`}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                ${rec.type === 'prayer' ? `${isDark ? 'bg-purple-900 text-purple-300 group-hover:bg-purple-800' : 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'}` : ''}
                ${rec.type === 'article' ? `${isDark ? 'bg-blue-900 text-blue-300 group-hover:bg-blue-800' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}` : ''}
                ${rec.type === 'event' ? `${isDark ? 'bg-green-900 text-green-300 group-hover:bg-green-800' : 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white'}` : ''}
                ${rec.type === 'weather' ? `${isDark ? 'bg-orange-900 text-orange-300 group-hover:bg-orange-800' : 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'}` : ''}
              `}>
                {rec.icon}
              </div>
              <div className="flex-1">
                <h5 className={`font-semibold transition-colors ${
                  isDark 
                    ? 'text-gray-100 group-hover:text-purple-400' 
                    : 'text-gray-900 group-hover:text-indigo-600'
                }`}>
                  {rec.title}
                </h5>
              </div>
              <ChevronRight className={`w-5 h-5 transition-colors ${
                isDark 
                  ? 'text-gray-600 group-hover:text-purple-400' 
                  : 'text-gray-400 group-hover:text-indigo-600'
              }`} />
            </div>
          </Link>
        ))}
      </div>

      {/* Smart Insights */}
      <div className={`mt-6 p-4 rounded-xl border ${
        isDark 
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' 
          : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
      }`}>
        <p className={`text-sm flex items-start gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <Sparkles className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-purple-400' : 'text-indigo-600'}`} />
          <span>
            بناءً على وقتك وموقعك، نوصيك بمتابعة الأخبار المحلية وفعاليات {context.location.city} اليوم.
            {context.events.isRamadan && ' لا تفوت وجبة الإفطار!'}
          </span>
        </p>
      </div>
    </section>
  );
} 