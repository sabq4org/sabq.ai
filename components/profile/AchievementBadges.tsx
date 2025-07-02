'use client';

import React from 'react';
import { Trophy, Lock } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked?: boolean;
}

interface Props {
  achievements: Achievement[];
}

export default function AchievementBadges({ achievements }: Props) {
  // إنجازات محتملة أخرى (مقفلة)
  const potentialAchievements: Achievement[] = [
    {
      id: 'expert_reader',
      name: 'خبير القراءة',
      description: 'اقرأ 100 مقال',
      icon: '🎓',
      color: '#DC2626',
      unlocked: false
    },
    {
      id: 'social_butterfly',
      name: 'اجتماعي',
      description: 'شارك 50 مقال',
      icon: '🦋',
      color: '#7C3AED',
      unlocked: false
    },
    {
      id: 'night_owl',
      name: 'بومة الليل',
      description: 'اقرأ 20 مقال بعد منتصف الليل',
      icon: '🦉',
      color: '#1E40AF',
      unlocked: false
    }
  ];

  // دمج الإنجازات المفتوحة والمقفلة
  const allAchievements = [
    ...achievements.map(a => ({ ...a, unlocked: true })),
    ...potentialAchievements.filter(p => !achievements.find(a => a.id === p.id))
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        إنجازاتك
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {allAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              achievement.unlocked
                ? 'border-transparent hover:shadow-lg cursor-pointer transform hover:scale-105'
                : 'border-gray-200 dark:border-gray-700 opacity-50'
            }`}
            style={{
              backgroundColor: achievement.unlocked 
                ? `${achievement.color}15` 
                : 'transparent'
            }}
          >
            {!achievement.unlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-900/50 rounded-xl">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
            )}
            
            <div className="text-center">
              <div className="text-4xl mb-2">{achievement.icon}</div>
              <h4 className="font-semibold text-sm mb-1">{achievement.name}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {achievement.description}
              </p>
            </div>

            {achievement.unlocked && (
              <div
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: achievement.color }}
              >
                ✓
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          فتحت {achievements.length} من {allAchievements.length} إنجاز
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${(achievements.length / allAchievements.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
} 