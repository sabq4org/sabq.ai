'use client';

import React from 'react';
import { Brain, TrendingUp, Clock, Target, Sparkles } from 'lucide-react';

interface ReadingProfile {
  type: string;
  description: string;
  level: string;
}

interface CategoryDistribution {
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
}

interface TimePatterns {
  bestTime: string;
  bestDay: string;
  hourlyDistribution: Record<number, number>;
  dailyDistribution: Record<string, number>;
}

interface Props {
  readingProfile: ReadingProfile;
  categoryDistribution: CategoryDistribution;
  timePatterns: TimePatterns;
  stats: {
    totalArticlesRead: number;
    totalLikes: number;
    totalShares: number;
    totalSaves: number;
    totalComments: number;
    averageReadingTime: number;
    streakDays: number;
  };
}

export default function ReadingInsights({ 
  readingProfile, 
  categoryDistribution, 
  timePatterns,
  stats 
}: Props) {
  const getProfileIcon = (type: string) => {
    switch(type) {
      case 'analytical': return '🧠';
      case 'balanced': return '⚖️';
      case 'casual': return '📱';
      default: return '📖';
    }
  };

  const getProfileColor = (type: string) => {
    switch(type) {
      case 'analytical': return 'text-purple-600';
      case 'balanced': return 'text-blue-600';
      case 'casual': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* نمط القارئ */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{getProfileIcon(readingProfile.type)}</div>
          <div className="flex-1">
            <h3 className={`text-2xl font-bold mb-2 ${getProfileColor(readingProfile.type)}`}>
              {readingProfile.description}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-white/80 dark:bg-gray-800/80 rounded-full text-sm font-medium">
                مستوى {readingProfile.level}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                • {stats.totalArticlesRead} مقال مقروء
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <Clock className="w-4 h-4" />
                  متوسط القراءة
                </div>
                <div className="text-xl font-bold">{stats.averageReadingTime} دقيقة</div>
              </div>
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <Sparkles className="w-4 h-4" />
                  سلسلة القراءة
                </div>
                <div className="text-xl font-bold">{stats.streakDays} يوم</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* توزيع الاهتمامات */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          توزيع اهتماماتك
        </h3>
        
        <div className="space-y-3">
          {categoryDistribution.distribution.slice(0, 5).map((category, index) => (
            <div key={category.name} className="relative">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-xl">{category.icon}</span>}
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {category.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${category.percentage}%`,
                    backgroundColor: category.color || '#3B82F6'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {categoryDistribution.recommendations.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 {categoryDistribution.recommendations[0]}
            </p>
          </div>
        )}
      </div>

      {/* أفضل أوقات القراءة */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          أوقات القراءة المفضلة
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-3xl mb-2">
              {timePatterns.bestTime === 'الصباح' ? '🌅' : 
               timePatterns.bestTime === 'الظهيرة' ? '☀️' : '🌙'}
            </div>
            <div className="font-medium">{timePatterns.bestTime}</div>
            <div className="text-sm text-gray-500">أفضل وقت</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-3xl mb-2">📅</div>
            <div className="font-medium">{timePatterns.bestDay}</div>
            <div className="text-sm text-gray-500">أكثر يوم نشاطاً</div>
          </div>
        </div>
      </div>
    </div>
  );
} 