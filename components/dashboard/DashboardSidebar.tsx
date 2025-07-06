'use client';

import React, { useState } from 'react';
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
  BarChart3,
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
  Image,
  MessageCircle,
  X,
  ChevronRight,
  LayoutDashboard
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
  { icon: MessageCircle, label: 'إدارة المنتدى', href: '/dashboard/forum', badge: 'جديد' },
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

interface DashboardSidebarProps {
  darkMode: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function DashboardSidebar({ darkMode, sidebarOpen, setSidebarOpen }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { counts, loading } = useDashboardCounts();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

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
    <aside className={`${
      sidebarOpen ? 'translate-x-0' : 'translate-x-full'
    } lg:translate-x-0 fixed lg:relative w-72 lg:w-64 xl:w-72 shadow-xl border-l h-screen lg:h-auto transition-all duration-300 z-40 lg:z-0 ${
      darkMode 
        ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700' 
        : 'bg-gradient-to-b from-slate-50 to-white border-gray-100'
    }`}>
      {/* زر إغلاق للموبايل */}
      <div className="lg:hidden flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          القائمة الرئيسية
        </h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 lg:p-6 overflow-y-auto h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]">
        {/* شارة الحالة */}
        <div className={`hidden lg:block p-4 rounded-xl border transition-colors duration-300 mb-6 ${
          darkMode 
            ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700' 
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                darkMode ? 'text-green-300' : 'text-green-800'
              }`}>النظام يعمل بشكل طبيعي</p>
              <p className={`text-xs transition-colors duration-300 ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`}>آخر تحديث: الآن</p>
            </div>
          </div>
        </div>

        {/* قائمة التنقل */}
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            const count = item.countKey && counts ? counts[item.countKey] : null;
            const countColor = item.countKey ? countColors[item.countKey as keyof typeof countColors] : '';
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? darkMode
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={item.countKey && count !== null && count !== undefined ? getCountTooltip(item.countKey, count) : item.label}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${
                    isActive ? 'text-white' : ''
                  }`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      darkMode
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  
                  {item.countKey && count !== null && count !== undefined && count > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : countColor || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {count > 999 ? '999+' : count}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
} 