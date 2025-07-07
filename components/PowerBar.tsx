'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, TrendingUp, Users, BookOpen, Timer, Flame, 
  Award, Target, Activity, BarChart3, Crown, Sparkles
} from 'lucide-react';

interface PowerBarProps {
  articlesCount: number;
  authorsCount: number;
  todayArticles: number;
  weekArticles: number;
  userLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  userScore?: number;
  className?: string;
}

export default function PowerBar({
  articlesCount,
  authorsCount,
  todayArticles,
  weekArticles,
  userLevel = 'bronze',
  userScore = 0,
  className = ''
}: PowerBarProps) {
  const [animatedValues, setAnimatedValues] = useState({
    articles: 0,
    authors: 0,
    today: 0,
    week: 0,
    score: 0
  });

  // تحريك الأرقام
  useEffect(() => {
    const duration = 2000; // مدة الحركة بالميلي ثانية
    const steps = 60; // عدد الخطوات
    const interval = duration / steps;

    const increment = {
      articles: articlesCount / steps,
      authors: authorsCount / steps,
      today: todayArticles / steps,
      week: weekArticles / steps,
      score: userScore / steps
    };

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      
      setAnimatedValues({
        articles: Math.min(Math.floor(increment.articles * currentStep), articlesCount),
        authors: Math.min(Math.floor(increment.authors * currentStep), authorsCount),
        today: Math.min(Math.floor(increment.today * currentStep), todayArticles),
        week: Math.min(Math.floor(increment.week * currentStep), weekArticles),
        score: Math.min(Math.floor(increment.score * currentStep), userScore)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedValues({
          articles: articlesCount,
          authors: authorsCount,
          today: todayArticles,
          week: weekArticles,
          score: userScore
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [articlesCount, authorsCount, todayArticles, weekArticles, userScore]);

  // حساب نسبة التقدم
  const getProgressPercentage = () => {
    const maxScore = 1000;
    return Math.min((userScore / maxScore) * 100, 100);
  };

  // لون شريط التقدم حسب المستوى
  const getLevelColor = () => {
    switch (userLevel) {
      case 'platinum': return 'from-purple-500 to-pink-500';
      case 'gold': return 'from-yellow-400 to-orange-500';
      case 'silver': return 'from-gray-300 to-gray-500';
      default: return 'from-orange-400 to-red-500';
    }
  };

  // رسالة تحفيزية
  const getMotivationalMessage = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 90) return 'أنت في المقدمة! 🏆';
    if (percentage >= 70) return 'أداء ممتاز! استمر 💪';
    if (percentage >= 50) return 'في الطريق الصحيح! 📈';
    if (percentage >= 30) return 'بداية قوية! 🚀';
    return 'لنبدأ الرحلة! ✨';
  };

  // المؤشرات الرقمية
  const indicators = [
    {
      icon: BookOpen,
      label: 'مقالات الرأي',
      value: animatedValues.articles,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: Users,
      label: 'كتّاب نشطين',
      value: animatedValues.authors,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: Timer,
      label: 'مقالات اليوم',
      value: animatedValues.today,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      icon: TrendingUp,
      label: 'مقالات الأسبوع',
      value: animatedValues.week,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className={`bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl p-6 shadow-xl ${className}`}>
      {/* العنوان */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">مقياس الطاقة</h3>
            <p className="text-white/80 text-sm">نشاط منصة قادة الرأي</p>
          </div>
        </div>
        
        {/* شارة المستوى */}
        <div className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getLevelColor()} rounded-full text-white font-bold`}>
          {userLevel === 'platinum' && <Crown className="w-5 h-5" />}
          {userLevel === 'gold' && <Award className="w-5 h-5" />}
          {userLevel === 'silver' && <Target className="w-5 h-5" />}
          {userLevel === 'bronze' && <Flame className="w-5 h-5" />}
          <span className="capitalize">{userLevel}</span>
        </div>
      </div>

      {/* المؤشرات الرقمية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {indicators.map((indicator, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 stat-item"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`w-10 h-10 ${indicator.bgColor} rounded-lg flex items-center justify-center mb-3`}>
              <indicator.icon className={`w-5 h-5 ${indicator.color}`} />
            </div>
            <p className="text-2xl font-bold mb-1">{(indicator.value || 0).toLocaleString()}</p>
            <p className="text-white/80 text-sm">{indicator.label}</p>
          </div>
        ))}
      </div>

      {/* شريط التقدم */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">مستوى نشاطك</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold">{animatedValues.score} نقطة</span>
          </div>
        </div>
        
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getLevelColor()} transition-all duration-1000 ease-out relative`}
            style={{ width: `${getProgressPercentage()}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-white/70">0</span>
          <span className="text-xs text-white/70 font-medium">{getMotivationalMessage()}</span>
          <span className="text-xs text-white/70">1000</span>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-medium">متوسط القراءة</span>
          </div>
          <p className="text-lg font-bold">5.2 د</p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-medium">نسبة التفاعل</span>
          </div>
          <p className="text-lg font-bold">87%</p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">النمو الأسبوعي</span>
          </div>
          <p className="text-lg font-bold">+23%</p>
        </div>
      </div>

      {/* رسالة تحفيزية */}
      <div className="mt-6 text-center">
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-sm font-medium">حقق إنجازاً جديداً</span>
          </div>
          <p className="text-xs text-white/80">
            اقرأ 3 مقالات أخرى لتحصل على شارة "قارئ نهم"
          </p>
        </div>
      </div>
    </div>
  );
} 