'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  FileText, 
  TrendingUp, 
  Users, 
  Shield, 
  Activity, 
  Calendar, 
  Settings, 
  Bell,
  BarChart,
  Edit3,
  FolderOpen,
  Plus,
  UserPlus,
  Zap,
  Layout,
  Newspaper,
  Brain,
  Grid3X3,
  Award,
  Image
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardCounts } from '@/hooks/useDashboardCounts';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  countKey?: keyof ReturnType<typeof useDashboardCounts>['counts'];
  countColor?: string; // لون مخصص للرقم
}

// تعريف الألوان المخصصة لكل قسم
const countColors = {
  articles: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  users: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  loyaltyMembers: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  categories: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  teamMembers: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  templates: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  deepAnalysis: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  smartBlocks: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  activities: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  notifications: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

const sidebarItems: SidebarItem[] = [
  { icon: Home, label: 'الرئيسية', href: '/dashboard' },
  { icon: Zap, label: 'لوحة سبق الذكية', href: '/dashboard/console', badge: 'جديد' },
  { icon: Newspaper, label: 'إدارة الأخبار', href: '/dashboard/news', countKey: 'articles' },
  { icon: Brain, label: 'التحليل العميق', href: '/dashboard/deep-analysis', badge: 'جديد', countKey: 'deepAnalysis' },
  { icon: Grid3X3, label: 'البلوكات الذكية', href: '/dashboard/smart-blocks', badge: 'جديد', countKey: 'smartBlocks' },
  { icon: Award, label: 'برنامج الولاء', href: '/dashboard/loyalty', countKey: 'loyaltyMembers' },
  { icon: Settings, label: 'الإعدادات', href: '/dashboard/settings' },
  { icon: FileText, label: 'المقالات', href: '/dashboard/articles', countKey: 'articles' },
  { icon: Edit3, label: 'التحرير', href: '/dashboard/editor' },
  { icon: FolderOpen, label: 'التصنيفات', href: '/dashboard/categories', countKey: 'categories' },
  { icon: Image, label: 'مكتبة الوسائط', href: '/dashboard/media', badge: 'جديد' },
  { icon: Layout, label: 'القوالب', href: '/dashboard/templates', badge: 'جديد', countKey: 'templates' },
  { icon: TrendingUp, label: 'التحليلات', href: '/dashboard/analytics' },
  { icon: Users, label: 'المستخدمون', href: '/dashboard/users', countKey: 'users' },
  { icon: Users, label: 'الفريق', href: '/dashboard/team', countKey: 'teamMembers' },
  { icon: Shield, label: 'الأدوار والصلاحيات', href: '/dashboard/roles' },
  { icon: Activity, label: 'سجل النشاطات', href: '/dashboard/activities', countKey: 'activities' },
  { icon: Bell, label: 'الإشعارات', href: '/dashboard/notifications', countKey: 'notifications' },
  { icon: BarChart, label: 'التقارير', href: '/dashboard/reports' },
  { icon: Calendar, label: 'جدولة النشر', href: '/dashboard/schedule' },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { counts, loading } = useDashboardCounts();

  // دالة للحصول على النص التوضيحي للرقم
  const getCountTooltip = (key: string, count: number) => {
    const tooltips: Record<string, string> = {
      articles: `${count} مقال منشور`,
      users: `${count} مستخدم مسجل`,
      loyaltyMembers: `${count} عضو في برنامج الولاء`,
      categories: `${count} تصنيف`,
      teamMembers: `${count} عضو في الفريق`,
      templates: `${count} قالب`,
      deepAnalysis: `${count} تحليل عميق`,
      smartBlocks: `${count} بلوك ذكي`,
      activities: `${count} نشاط مسجل`,
      notifications: `${count} إشعار جديد`
    };
    return tooltips[key] || `${count} عنصر`;
  };

  return (
    <aside className="sabq-sidebar w-64 min-h-[calc(100vh-4rem)] p-4">
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
          القائمة الرئيسية
        </h3>
      </div>
      
      <ul className="space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;
          const count = item.countKey && counts[item.countKey];
          const countColorClass = item.countKey ? countColors[item.countKey] : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
          
          return (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={cn(
                  "sabq-sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                  isActive && "active"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                <div className="flex items-center gap-2">
                  {!loading && count !== undefined && count > 0 && (
                    <div className="relative group/tooltip">
                      <span 
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full min-w-[32px] text-center font-medium transition-all duration-200",
                          countColorClass,
                          "group-hover:scale-110"
                        )}
                      >
                        {(() => {
                          // للتحقق من القيمة
                          if (item.label === 'المستخدمون') {
                            console.log('Users count in sidebar:', count, typeof count);
                          }
                          return count > 999 ? '999+' : count;
                        })()}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                        <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                          {item.countKey && getCountTooltip(item.countKey, count)}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                            <div className="border-4 border-transparent border-l-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {loading && item.countKey && (
                    <span className="text-xs px-2 py-0.5 rounded-full min-w-[32px] text-center bg-gray-100 dark:bg-gray-700">
                      <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                    </span>
                  )}
                  {item.badge && (
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
          اختصارات
        </h3>
        <ul className="space-y-2">
          <li>
            <Link 
              href="/dashboard/articles/new"
              className="sabq-sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Plus className="w-5 h-5" />
              <span>مقال جديد</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/dashboard/users/invite"
              className="sabq-sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <UserPlus className="w-5 h-5" />
              <span>دعوة مستخدم</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* معلومات المستخدم */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-medium">م</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                مستخدم
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                محرر
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// تصدير المكون Plus
export { Plus as UserPlus } from 'lucide-react'; 