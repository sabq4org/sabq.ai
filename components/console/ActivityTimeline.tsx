'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, User, Shield, Settings, AlertCircle, 
  Edit3, Trash2, Eye, UserPlus, Lock, CheckCircle,
  XCircle, Clock, Zap
} from 'lucide-react';
import { SabqBadge } from '@/components/ui/SabqBadge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Activity {
  id: string;
  type: string;
  action: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  target: {
    type: string;
    id: string;
    title: string;
  };
  metadata?: any;
  timestamp: Date;
  ip?: string;
}

const getActivityIcon = (type: string, action: string) => {
  if (type === 'article') {
    switch (action) {
      case 'create': return FileText;
      case 'edit': return Edit3;
      case 'delete': return Trash2;
      case 'publish': return CheckCircle;
      case 'view': return Eye;
      default: return FileText;
    }
  }
  if (type === 'user') {
    switch (action) {
      case 'login': return Lock;
      case 'create': return UserPlus;
      case 'update': return User;
      case 'suspend': return XCircle;
      default: return User;
    }
  }
  if (type === 'system') return Settings;
  if (type === 'security') return Shield;
  return AlertCircle;
};

const getActivityColor = (action: string) => {
  switch (action) {
    case 'create':
    case 'publish':
      return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    case 'edit':
    case 'update':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    case 'delete':
    case 'suspend':
      return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    case 'login':
      return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
    default:
      return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  }
};

const getActionText = (type: string, action: string) => {
  const actions: Record<string, Record<string, string>> = {
    article: {
      create: 'أنشأ مقالاً',
      edit: 'عدّل مقالاً',
      delete: 'حذف مقالاً',
      publish: 'نشر مقالاً',
      view: 'شاهد مقالاً',
      approve: 'وافق على مقال',
      reject: 'رفض مقالاً'
    },
    user: {
      login: 'سجّل دخول',
      logout: 'سجّل خروج',
      create: 'أنشأ مستخدماً',
      update: 'حدّث بيانات',
      suspend: 'علّق حساب',
      activate: 'فعّل حساب'
    },
    ai: {
      generate_title: 'طلب توليد عنوان',
      generate_summary: 'طلب توليد ملخص',
      analyze_content: 'طلب تحليل محتوى',
      accepted_suggestion: 'قبل اقتراح AI',
      rejected_suggestion: 'رفض اقتراح AI'
    }
  };
  
  return actions[type]?.[action] || action;
};

interface ActivityTimelineProps {
  searchQuery?: string;
}

export default function ActivityTimeline({ searchQuery = '' }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // محاكاة البيانات - في الواقع ستأتي من WebSocket/API
  useEffect(() => {
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'article',
        action: 'publish',
        user: {
          id: '1',
          name: 'عبدالله العتيبي',
          role: 'محرر'
        },
        target: {
          type: 'article',
          id: '185',
          title: 'وزير الطاقة يعلن عن مشروع جديد للطاقة المتجددة'
        },
        metadata: {
          section: 'اقتصاد',
          breaking: true
        },
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 دقائق
      },
      {
        id: '2',
        type: 'ai',
        action: 'generate_title',
        user: {
          id: '2',
          name: 'سارة المطيري',
          role: 'محررة'
        },
        target: {
          type: 'article',
          id: '186',
          title: 'تطورات جديدة في قطاع التقنية'
        },
        metadata: {
          ai_accepted: true,
          processing_time: 1.2
        },
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 دقائق
      },
      {
        id: '3',
        type: 'user',
        action: 'login',
        user: {
          id: '3',
          name: 'محمد الشمري',
          role: 'رئيس تحرير'
        },
        target: {
          type: 'system',
          id: 'auth',
          title: 'نظام المصادقة'
        },
        metadata: {
          ip: '192.168.1.100',
          device: 'MacBook Pro'
        },
        timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 دقائق
      },
      {
        id: '4',
        type: 'article',
        action: 'edit',
        user: {
          id: '4',
          name: 'فاطمة القحطاني',
          role: 'مدققة لغوية'
        },
        target: {
          type: 'article',
          id: '184',
          title: 'الرياض تستضيف مؤتمر الذكاء الاصطناعي العالمي'
        },
        metadata: {
          changes: ['تصحيح أخطاء إملائية', 'تحسين الصياغة']
        },
        timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 دقيقة
      },
      {
        id: '5',
        type: 'system',
        action: 'alert',
        user: {
          id: 'system',
          name: 'النظام',
          role: 'تلقائي'
        },
        target: {
          type: 'performance',
          id: 'server-1',
          title: 'أداء الخادم'
        },
        metadata: {
          alert_type: 'warning',
          message: 'ارتفاع في استخدام الذاكرة (85%)'
        },
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 دقيقة
      }
    ];

    // إضافة المزيد من النشاطات العشوائية
    const additionalActivities = Array.from({ length: 10 }, (_, i) => ({
      id: `mock-${i + 6}`,
      type: ['article', 'user', 'ai', 'system'][Math.floor(Math.random() * 4)],
      action: ['create', 'edit', 'publish', 'delete', 'login'][Math.floor(Math.random() * 5)],
      user: {
        id: `user-${i}`,
        name: ['أحمد محمد', 'نورة السالم', 'خالد العمري', 'هند الراشد'][Math.floor(Math.random() * 4)],
        role: ['محرر', 'مراسل', 'مدقق لغوي', 'محرر أقسام'][Math.floor(Math.random() * 4)]
      },
      target: {
        type: 'article',
        id: `${180 - i}`,
        title: `مقال تجريبي رقم ${i + 1}`
      },
      timestamp: new Date(Date.now() - (20 + i * 5) * 60 * 1000)
    }));

    setActivities([...mockActivities, ...additionalActivities]);
    setLoading(false);
  }, []);

  // Filter activities based on search
  const filteredActivities = activities.filter(activity => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      activity.user.name.toLowerCase().includes(searchLower) ||
      activity.target.title.toLowerCase().includes(searchLower) ||
      getActionText(activity.type, activity.action).toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
      {filteredActivities.map((activity) => {
        const Icon = getActivityIcon(activity.type, activity.action);
        const colorClass = getActivityColor(activity.action);
        
        return (
          <div
            key={activity.id}
            className="group relative flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {/* Icon */}
            <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-medium text-gray-900 dark:text-white">
                  {activity.user.name}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getActionText(activity.type, activity.action)}
                </span>
                {activity.target.type === 'article' && (
                  <a href="#" className="text-sm text-blue-600 hover:underline truncate max-w-xs">
                    "{activity.target.title}"
                  </a>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(activity.timestamp, { locale: ar, addSuffix: true })}
                </span>
                {activity.user.role && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                    {activity.user.role}
                  </span>
                )}
                {activity.metadata?.section && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {activity.metadata.section}
                  </span>
                )}
                {activity.metadata?.breaking && (
                  <SabqBadge variant="error" size="sm">
                    <Zap className="h-3 w-3 ml-1" />
                    عاجل
                  </SabqBadge>
                )}
                {activity.metadata?.ai_accepted !== undefined && (
                  <span className={`flex items-center gap-1 ${activity.metadata.ai_accepted ? 'text-green-600' : 'text-red-600'}`}>
                    {activity.metadata.ai_accepted ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    AI
                  </span>
                )}
              </div>
            </div>

            {/* Hover Actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <Eye className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
} 