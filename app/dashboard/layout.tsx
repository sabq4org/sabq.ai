'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { DashboardMobileLayout } from '@/components/mobile/MobileLayout';
import { Bell, User, ChevronDown, LogOut, Settings, Menu, Sun, Moon } from 'lucide-react';
import { getCurrentUser, logActions } from '@/lib/log-activity';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme, mounted, toggleTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleLogout = async () => {
    const userInfo = getCurrentUser();
    await logActions.logout(userInfo);
    localStorage.removeItem('currentUser');
    if (typeof window !== "undefined") {
      window.location.href = '/';
    }
  };

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

  useEffect(() => {
    const checkDevice = () => {
      if (typeof window !== "undefined") {
        const userAgent = navigator.userAgent;
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isSmallScreen = window.innerWidth <= 768;
        setIsMobile(isMobileDevice || isSmallScreen);
        
        if (window.innerWidth >= 1024) {
          setSidebarOpen(false);
        }
      }
    };

    checkDevice();
    
    if (typeof window !== "undefined") {
      window.addEventListener('resize', checkDevice);
      return () => window.removeEventListener('resize', checkDevice);
    }
  }, []);

  if (isMobile) {
    return (
      <DashboardMobileLayout>
        {children}
      </DashboardMobileLayout>
    );
  }

  return (
    <div 
      className={`min-h-screen transition-all duration-500 ease-in-out ${
        mounted && darkMode ? 'bg-gray-900' : 'bg-slate-50'
      }`}
      style={{ direction: 'rtl' }}
    >
      {/* Header */}
      <header className={`shadow-sm border-b px-3 sm:px-6 py-3 sm:py-6 transition-colors duration-300 sticky top-0 z-30 ${
        mounted && darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors duration-300 ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-lg">س</span>
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>لوحة تحكم سبق</h1>
              <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>نسخة 1.0</p>
            </div>
          </div>
        
          <div className="flex items-center gap-1 sm:gap-4">
            {mounted && (
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="تبديل الوضع الليلي"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            <button className={`relative p-2 rounded-lg transition-colors duration-300 ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}>
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative profile-menu-container">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-1 sm:gap-3 cursor-pointer rounded-lg p-1 sm:p-2 transition-colors duration-300 ${
                  darkMode 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-right">
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>علي الحازمي</p>
                  <p className={`text-xs transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>مدير النظام</p>
                </div>
                <ChevronDown className={`hidden md:block w-4 h-4 transition-transform duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-400'
                } ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {mounted && showProfileMenu && (
                <div className={`absolute left-0 mt-2 w-48 rounded-lg shadow-lg border transition-all duration-200 z-40 ${
                  mounted && darkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <Link
                    href="/profile"
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-opacity-10 transition-colors duration-200 rounded-t-lg ${
                      darkMode 
                        ? 'text-gray-300 hover:bg-white' 
                        : 'text-gray-700 hover:bg-gray-500'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">الملف الشخصي</span>
                  </Link>
                  
                  <Link
                    href="/dashboard/settings"
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-opacity-10 transition-colors duration-200 ${
                      darkMode 
                        ? 'text-gray-300 hover:bg-white' 
                        : 'text-gray-700 hover:bg-gray-500'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">الإعدادات</span>
                  </Link>
                  
                  <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                  
                  <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 px-4 py-3 w-full text-right hover:bg-opacity-10 transition-colors duration-200 rounded-b-lg ${
                      darkMode 
                        ? 'text-red-400 hover:bg-red-500' 
                        : 'text-red-600 hover:bg-red-500'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {mounted && sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        <DashboardSidebar 
          darkMode={darkMode} 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />

        <main className={`flex-1 p-4 lg:p-8 transition-colors duration-300 ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
} 