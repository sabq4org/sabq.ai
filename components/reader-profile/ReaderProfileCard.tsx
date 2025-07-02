'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  Target, 
  TrendingUp, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Clock,
  Calendar,
  Award,
  Zap,
  Search,
  MessageSquare,
  Compass
} from 'lucide-react';
import { ReaderProfile } from '@/types/reader-profile';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ReaderProfileCardProps {
  profile: ReaderProfile | null;
  isLoading?: boolean;
  darkMode?: boolean;
}

const personalityConfig: Record<string, {
  gradient: string;
  icon: React.ElementType;
  title: string;
  description: string;
}> = {
  'news_hunter': {
    gradient: 'from-blue-500 to-cyan-500',
    icon: Search,
    title: 'صياد الأخبار',
    description: 'تحب متابعة آخر الأخبار أولاً بأول'
  },
  'deep_analyst': {
    gradient: 'from-purple-500 to-pink-500',
    icon: Brain,
    title: 'المحلل العميق',
    description: 'تفضل القراءة المتأنية والتحليلات المعمقة'
  },
  'opinion_seeker': {
    gradient: 'from-orange-500 to-red-500',
    icon: MessageSquare,
    title: 'باحث عن الآراء',
    description: 'تستمتع بقراءة وجهات النظر المختلفة'
  },
  'knowledge_explorer': {
    gradient: 'from-indigo-500 to-purple-500',
    icon: Compass,
    title: 'مستكشف المعرفة',
    description: 'تحب التنوع في القراءة واستكشاف مواضيع مختلفة'
  },
  'trend_follower': {
    gradient: 'from-green-500 to-emerald-500',
    icon: TrendingUp,
    title: 'متابع الترندات',
    description: 'تحب مشاركة المحتوى المثير'
  },
  'balanced_reader': {
    gradient: 'from-gray-500 to-gray-600',
    icon: BookOpen,
    title: 'القارئ المتوازن',
    description: 'تحافظ على توازن جيد في قراءاتك'
  }
};

export default function ReaderProfileCard({ profile, isLoading, darkMode = false }: ReaderProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className={cn(
        "reader-profile-card reader-profile-shadow reader-profile-transition",
        "relative w-full max-w-2xl mx-auto mb-6 rounded-2xl overflow-hidden",
        darkMode ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
      )}>
        <div className="animate-pulse p-6">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const personality = profile.personality;
  const config = personalityConfig[personality.type] || personalityConfig['balanced_reader'];
  const PersonalityIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "reader-profile-card reader-profile-shadow reader-profile-transition",
        "relative w-full max-w-2xl mx-auto mb-6 rounded-2xl overflow-hidden",
        darkMode ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
      )}
    >
      <div 
        className={cn(
          "relative p-6 rounded-2xl overflow-hidden transition-all duration-300",
          darkMode ? "bg-gray-800/95" : "bg-white/95",
          "backdrop-blur-sm shadow-xl"
        )}
      >
        {/* خلفية متدرجة */}
        <div className={cn("absolute inset-0 opacity-10", config.gradient)} />
        
        {/* المحتوى */}
        <div className="relative z-10">
          {/* رأس البطاقة */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* أيقونة الشخصية */}
              <div className={cn(
                "p-3 rounded-xl backdrop-blur-sm",
                darkMode ? "bg-white/10" : "bg-black/5"
              )}>
                <PersonalityIcon className="w-8 h-8" />
              </div>
              
              {/* معلومات الشخصية */}
              <div>
                <h3 className="text-xl font-bold">{personality.title}</h3>
                <p className={cn(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>{personality.description}</p>
              </div>
            </div>
            
            {/* زر التوسع/الطي */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                darkMode 
                  ? "hover:bg-white/10" 
                  : "hover:bg-black/5"
              )}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>

          {/* الإحصائيات السريعة */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* مقالات مقروءة */}
            <div className={cn(
              "p-4 rounded-xl text-center",
              darkMode ? "bg-white/5" : "bg-black/5"
            )}>
              <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-70" />
              <div className="text-2xl font-bold">{profile.stats.totalArticlesRead}</div>
              <div className={cn(
                "text-xs",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>مقال مقروء</div>
            </div>

            {/* معدل يومي */}
            <div className={cn(
              "p-4 rounded-xl text-center",
              darkMode ? "bg-white/5" : "bg-black/5"
            )}>
              <Activity className="w-6 h-6 mx-auto mb-2 opacity-70" />
              <div className="text-2xl font-bold">{profile.stats.dailyReadingAverage}</div>
              <div className={cn(
                "text-xs",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>معدل يومي</div>
            </div>

            {/* سلسلة الأيام */}
            <div className={cn(
              "p-4 rounded-xl text-center",
              darkMode ? "bg-white/5" : "bg-black/5"
            )}>
              <Calendar className="w-6 h-6 mx-auto mb-2 opacity-70" />
              <div className="text-2xl font-bold">{profile.stats.streakDays}</div>
              <div className={cn(
                "text-xs",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>يوم متتالي</div>
            </div>
          </div>

          {/* المحتوى القابل للتوسع */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {/* التصنيفات المفضلة */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 opacity-70">التصنيفات المفضلة</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.stats.favoriteCategories.map((cat) => (
                      <span
                        key={cat.name}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs",
                          darkMode 
                            ? "bg-white/10 text-white" 
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {cat.name} ({cat.percentage}%)
                      </span>
                    ))}
                  </div>
                </div>

                {/* السمات الشخصية */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 opacity-70">سماتك المميزة</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.traits.map((trait) => (
                      <div
                        key={trait.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full text-xs",
                          darkMode 
                            ? "bg-white/10 text-white" 
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        <span>{trait.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* إحصائيات التفاعل */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 opacity-70">التفاعلات</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>إعجابات</span>
                        <span className="font-medium">{profile.stats.interactionBreakdown.likes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>مشاركات</span>
                        <span className="font-medium">{profile.stats.interactionBreakdown.shares}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>محفوظات</span>
                        <span className="font-medium">{profile.stats.interactionBreakdown.saves}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-2 opacity-70">نقاط الولاء</h4>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold">{profile.stats.loyaltyPoints}</span>
                      <span className="text-sm opacity-70">نقطة</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* زر الملف الكامل */}
          <Link
            href="/profile/smart"
            className={cn(
              "block w-full mt-6 py-3 px-4 rounded-xl text-center font-medium transition-all",
              "bg-gradient-to-r",
              config.gradient,
              "text-white hover:shadow-lg hover:scale-[1.02]"
            )}
          >
            عرض الملف الكامل
          </Link>
        </div>
      </div>
    </motion.div>
  );
} 