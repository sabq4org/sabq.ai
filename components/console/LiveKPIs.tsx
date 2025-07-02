'use client';

import React from 'react';
import { 
  Users, FileText, Eye, Clock, MessageSquare,
  Zap, BarChart3, Activity, Globe
} from 'lucide-react';
import { SabqCard } from '@/components/ui/SabqCard';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, value, change, changeType = 'neutral', icon: Icon, color, bgColor 
}) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className={`${bgColor} rounded-lg p-4 relative overflow-hidden`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className={`text-sm font-medium ${color}`}>{title}</p>
          <Icon className={`h-5 w-5 ${color} opacity-80`} />
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {change && (
          <p className={`text-xs mt-1 ${changeColors[changeType]}`}>
            {change}
          </p>
        )}
      </div>
      <div className={`absolute -bottom-2 -left-2 h-20 w-20 ${bgColor} opacity-50 rounded-full blur-xl`}></div>
    </div>
  );
};

interface LiveKPIsProps {
  timeRange: string;
}

export default function LiveKPIs({ timeRange }: LiveKPIsProps) {
  // في الواقع، هذه البيانات ستأتي من API
  const kpis = [
    {
      title: 'الزوار النشطون',
      value: '12,845',
      change: '+23% من أمس',
      changeType: 'positive' as const,
      icon: Users,
      color: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'المقالات المنشورة',
      value: '147',
      change: '+12 مقال جديد',
      changeType: 'positive' as const,
      icon: FileText,
      color: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'إجمالي المشاهدات',
      value: '89.3K',
      change: '+18% من المتوسط',
      changeType: 'positive' as const,
      icon: Eye,
      color: 'text-purple-700 dark:text-purple-300',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'معدل التفاعل',
      value: '67.8%',
      change: '-2.3% انخفاض طفيف',
      changeType: 'negative' as const,
      icon: Activity,
      color: 'text-orange-700 dark:text-orange-300',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'الأخبار العاجلة',
      value: '3',
      change: 'آخر خبر قبل 15 دقيقة',
      changeType: 'neutral' as const,
      icon: Zap,
      color: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'متوسط وقت القراءة',
      value: '3:24',
      change: 'دقيقة:ثانية',
      changeType: 'neutral' as const,
      icon: Clock,
      color: 'text-indigo-700 dark:text-indigo-300',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      title: 'التعليقات الجديدة',
      value: '234',
      change: '12 بانتظار المراجعة',
      changeType: 'neutral' as const,
      icon: MessageSquare,
      color: 'text-teal-700 dark:text-teal-300',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20'
    },
    {
      title: 'أداء الخادم',
      value: '99.9%',
      change: 'ممتاز',
      changeType: 'positive' as const,
      icon: Globe,
      color: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    }
  ];

  return (
    <div className="space-y-4">
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Real-time Chart */}
      <SabqCard>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              نشاط الموقع - آخر 24 ساعة
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">زوار</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">مشاهدات</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">تفاعل</span>
              </div>
            </div>
          </div>
          
          {/* Chart Placeholder */}
          <div className="h-48 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-12 w-12 text-blue-200 dark:text-blue-800" />
          </div>
        </div>
      </SabqCard>
    </div>
  );
} 