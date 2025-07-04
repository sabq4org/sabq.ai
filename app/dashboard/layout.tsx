'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell,
  User,
  ChevronDown,
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  Activity,
  BarChart3,
  LogOut,
  Folder,
  Trophy,
  Brain,
  Target,
  Database,
  Zap,
  Shield,
  Menu,
  X,
  Mail,
  ChevronRight,
  Sun,
  Moon,
  Image,
  MessageCircle
} from 'lucide-react';
import { getCurrentUser, logActions } from '@/lib/log-activity';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { darkMode, mounted, toggleDarkMode } = useDarkModeContext();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleLogout = async () => {
    // الحصول على معلومات المستخدم الحالي
    const userInfo = getCurrentUser();
    
    // تسجيل حدث تسجيل الخروج
    await logActions.logout(userInfo);
    
    // حذف معلومات المستخدم من localStorage
    localStorage.removeItem('currentUser');
    
    // توجيه المستخدم إلى الصفحة الرئيسية بدلاً من صفحة تسجيل الدخول
    if (typeof window !== "undefined") {
      window.location.href = '/';
    }
  };

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // إغلاق الـ sidebar عند تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Toggle expanded section
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div 
      className={`min-h-screen transition-all duration-500 ease-in-out ${
        mounted && darkMode ? 'bg-gray-900' : 'bg-slate-50'
      }`}
      style={{
        direction: 'rtl'
      }}
    >
      {/* مؤشر حالة الوضع الليلي */}
      {mounted && darkMode && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 z-50 animate-pulse"></div>
      )}
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">لوحة التحكم</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                م
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900" dir="rtl">
          {children}
        </main>
      </div>
    </div>
  );
} 