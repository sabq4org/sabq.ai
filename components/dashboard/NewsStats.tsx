'use client';

import React from 'react';
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { SabqCard } from '@/components/ui';

interface NewsStatsProps {
  stats: {
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    pendingArticles: number;
    totalViews: number;
    todayViews: number;
    activeWriters: number;
    todayArticles: number;
  };
}

export const NewsStats: React.FC<NewsStatsProps> = ({ stats }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}م`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}ك`;
    }
    return num.toString();
  };

  const statsCards = [
    {
      title: 'إجمالي المقالات',
      value: stats.totalArticles,
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900'
    },
    {
      title: 'المقالات المنشورة',
      value: stats.publishedArticles,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-900'
    },
    {
      title: 'المسودات',
      value: stats.draftArticles,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900'
    },
    {
      title: 'بانتظار الموافقة',
      value: stats.pendingArticles,
      icon: AlertCircle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-900'
    },
    {
      title: 'إجمالي المشاهدات',
      value: formatNumber(stats.totalViews),
      icon: Eye,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-900',
      subtitle: `اليوم: ${formatNumber(stats.todayViews)}`
    },
    {
      title: 'الكتاب النشطون',
      value: stats.activeWriters,
      icon: Users,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-900'
    },
    {
      title: 'مقالات اليوم',
      value: stats.todayArticles,
      icon: Calendar,
      color: 'teal',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      textColor: 'text-teal-900'
    },
    {
      title: 'معدل النمو',
      value: '+12%',
      icon: TrendingUp,
      color: 'rose',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      textColor: 'text-rose-900',
      subtitle: 'مقارنة بالأسبوع الماضي'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((stat, index) => (
        <SabqCard key={index} className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 overflow-hidden relative group">
          <div className={`absolute inset-0 bg-gradient-to-br ${
            stat.color === 'blue' ? 'from-blue-500/5 to-blue-600/10' :
            stat.color === 'green' ? 'from-green-500/5 to-green-600/10' :
            stat.color === 'yellow' ? 'from-yellow-500/5 to-yellow-600/10' :
            stat.color === 'orange' ? 'from-orange-500/5 to-orange-600/10' :
            stat.color === 'purple' ? 'from-purple-500/5 to-purple-600/10' :
            stat.color === 'indigo' ? 'from-indigo-500/5 to-indigo-600/10' :
            stat.color === 'teal' ? 'from-teal-500/5 to-teal-600/10' :
            'from-rose-500/5 to-rose-600/10'
          }`} />
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-600 mb-2 tracking-wide uppercase">
                  {stat.title}
                </p>
                <p className={`text-3xl font-black ${stat.textColor} mb-1`}>
                  {stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-xs font-medium text-gray-600 bg-white/70 px-2 py-1 rounded-full inline-block">
                    {stat.subtitle}
                  </p>
                )}
              </div>
              <div className={`w-16 h-16 rounded-2xl ${stat.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
              </div>
            </div>
            
            {/* شريط تقدم ديناميكي */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500 font-medium">الهدف الشهري</span>
                <span className={`font-bold ${stat.iconColor}`}>
                  {stat.color === 'blue' ? '85%' :
                   stat.color === 'green' ? '92%' :
                   stat.color === 'yellow' ? '67%' :
                   stat.color === 'orange' ? '45%' :
                   stat.color === 'purple' ? '78%' :
                   stat.color === 'indigo' ? '89%' :
                   stat.color === 'teal' ? '91%' :
                   '88%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${
                    stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                    stat.color === 'green' ? 'from-green-500 to-green-600' :
                    stat.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                    stat.color === 'orange' ? 'from-orange-500 to-orange-600' :
                    stat.color === 'purple' ? 'from-purple-500 to-purple-600' :
                    stat.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
                    stat.color === 'teal' ? 'from-teal-500 to-teal-600' :
                    'from-rose-500 to-rose-600'
                  } transition-all duration-1000 ease-out`}
                  style={{ 
                    width: stat.color === 'blue' ? '85%' :
                           stat.color === 'green' ? '92%' :
                           stat.color === 'yellow' ? '67%' :
                           stat.color === 'orange' ? '45%' :
                           stat.color === 'purple' ? '78%' :
                           stat.color === 'indigo' ? '89%' :
                           stat.color === 'teal' ? '91%' :
                           '88%'
                  }}
                />
              </div>
            </div>
          </div>
        </SabqCard>
      ))}
    </div>
  );
}; 