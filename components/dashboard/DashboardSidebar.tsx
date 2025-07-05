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
        <nav className="space-y-4 lg:space-y-6">
          {/* الرئيسية */}
          <Link href="/dashboard" 
            onClick={() => setSidebarOpen(false)}
            className={`group flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-300 hover:shadow-md hover:translate-x-1 ${
            darkMode 
              ? 'text-gray-300 hover:bg-gradient-to-r hover:from-blue-900/30 hover:to-indigo-900/30 hover:text-blue-300' 
              : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700'
          }`}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
              darkMode 
                ? 'bg-blue-900/40 group-hover:bg-blue-500 group-hover:text-white' 
                : 'bg-blue-100 group-hover:bg-blue-500 group-hover:text-white'
            }`}>
              <LayoutDashboard className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <span className="text-sm lg:text-base font-medium">لوحة التحكم</span>
          </Link>

          {/* المحتوى */}
          <Link href="/dashboard/news" 
            onClick={() => setSidebarOpen(false)}
            className={`group flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-300 hover:shadow-md hover:translate-x-1 ${
            darkMode 
              ? 'text-gray-300 hover:bg-gradient-to-r hover:from-green-900/30 hover:to-emerald-900/30 hover:text-green-300' 
              : 'text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700'
          }`}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
              darkMode 
                ? 'bg-green-900/40 group-hover:bg-green-500 group-hover:text-white' 
                : 'bg-green-100 group-hover:bg-green-500 group-hover:text-white'
            }`}>
              <FileText className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <span className="text-sm lg:text-base font-medium">إدارة الأخبار</span>
          </Link>

          {/* المستخدمون */}
          <Link href="/dashboard/users" 
            onClick={() => setSidebarOpen(false)}
            className={`group flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-300 hover:shadow-md hover:translate-x-1 ${
            darkMode 
              ? 'text-gray-300 hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-pink-900/30 hover:text-purple-300' 
              : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
          }`}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
              darkMode 
                ? 'bg-purple-900/40 group-hover:bg-purple-500 group-hover:text-white' 
                : 'bg-purple-100 group-hover:bg-purple-500 group-hover:text-white'
            }`}>
              <Users className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <span className="text-sm lg:text-base font-medium">المستخدمون</span>
          </Link>

          {/* التحليلات */}
          <Link href="/dashboard/analytics" 
            onClick={() => setSidebarOpen(false)}
            className={`group flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-300 hover:shadow-md hover:translate-x-1 ${
            darkMode 
              ? 'text-gray-300 hover:bg-gradient-to-r hover:from-indigo-900/30 hover:to-violet-900/30 hover:text-indigo-300' 
              : 'text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-violet-50 hover:text-indigo-700'
          }`}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
              darkMode 
                ? 'bg-indigo-900/40 group-hover:bg-indigo-500 group-hover:text-white' 
                : 'bg-indigo-100 group-hover:bg-indigo-500 group-hover:text-white'
            }`}>
              <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <span className="text-sm lg:text-base font-medium">التحليلات</span>
          </Link>

          {/* الإعدادات */}
          <Link href="/dashboard/settings" 
            onClick={() => setSidebarOpen(false)}
            className={`group flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-300 hover:shadow-md hover:translate-x-1 ${
            darkMode 
              ? 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-800 hover:text-gray-100' 
              : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:text-gray-900'
          }`}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
              darkMode 
                ? 'bg-gray-700 group-hover:bg-gray-600 group-hover:text-white' 
                : 'bg-gray-200 group-hover:bg-gray-600 group-hover:text-white'
            }`}>
              <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <span className="text-sm lg:text-base font-medium">الإعدادات</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}

// تصدير المكون Plus
export { Plus as UserPlus } from 'lucide-react'; 