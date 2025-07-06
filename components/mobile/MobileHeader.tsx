'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Menu, X, Search, User, Sun, Moon, Bell, Activity, 
  Home, Newspaper, Bookmark, Settings, LogOut 
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { useTheme } from 'next-themes';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface MobileHeaderProps {
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
}

export default function MobileHeader({ 
  showSearch = true, 
  showNotifications = true,
  showUserMenu = true 
}: MobileHeaderProps) {
  const { darkMode, mounted, toggleDarkMode } = useDarkModeContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newEventsCount, setNewEventsCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const navigationItems = [
    { label: 'الرئيسية', url: '/', icon: Home },
    { 
      label: 'اللحظة بلحظة', 
      url: '/moment-by-moment', 
      icon: Activity,
      highlight: true,
      badge: newEventsCount > 0 ? newEventsCount : null
    },
    { label: 'الأخبار', url: '/news', icon: Newspaper },
    { label: 'التصنيفات', url: '/categories', icon: Bookmark },
    { label: 'المحفوظات', url: '/bookmarks', icon: Bookmark },
  ];

  // فحص الأحداث الجديدة
  useEffect(() => {
    const checkNewEvents = async () => {
      try {
        const response = await fetch('/api/articles?status=published&limit=10');
        const data = await response.json();
        
        if (data.articles) {
          const newEvents = data.articles.filter((article: any) => 
            new Date(article.created_at).getTime() > Date.now() - 3600000 // آخر ساعة
          );
          setNewEventsCount(newEvents.length);
        }
      } catch (error) {
        console.error('Error checking new events:', error);
      }
    };

    checkNewEvents();
    const interval = setInterval(checkNewEvents, 300000); // كل 5 دقائق
    
    return () => clearInterval(interval);
  }, []);

  // مراقبة التمرير لإخفاء/إظهار الهيدر
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // إغلاق القائمة عند تغيير المسار
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, []);

  if (!isMobile) {
    // الهيدر العادي للشاشات الكبيرة
    return null; // استخدم الهيدر الافتراضي
  }

  return (
    <>
      <header className={`mobile-header fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-white dark:bg-gray-900'
      }`}>
        <div className="px-4 py-3">
          {/* الصف الرئيسي */}
          <div className="flex items-center justify-between">
            {/* زر القائمة والشعار */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="فتح القائمة"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">س</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    سبق
                  </h1>
                </div>
              </Link>
            </div>

            {/* الأدوات */}
            <div className="flex items-center gap-2">
              {/* البحث */}
              {showSearch && (
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="البحث"
                >
                  <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}

              {/* الإشعارات */}
              {showNotifications && (
                <Link
                  href="/moment-by-moment"
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="الإشعارات"
                >
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  {newEventsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {newEventsCount > 9 ? '9+' : newEventsCount}
                    </span>
                  )}
                </Link>
              )}

              {/* تبديل الوضع الليلي */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="تبديل الوضع الليلي"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
              )}

              {/* قائمة المستخدم */}
              {showUserMenu && (
                <Link
                  href="/login"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="تسجيل الدخول"
                >
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
              )}
            </div>
          </div>

          {/* شريط البحث */}
          {searchOpen && (
            <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
              <form className="relative">
                <input
                  type="search"
                  placeholder="ابحث في الأخبار..."
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-gray-600 dark:text-gray-400"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* شريط التقدم للتحميل */}
        <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 transform origin-left scale-x-0 transition-transform duration-300" />
      </header>

      {/* القائمة الجانبية */}
      {mobileMenuOpen && (
        <>
          {/* خلفية شفافة */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* القائمة */}
          <nav className="fixed top-0 right-0 w-80 h-full bg-white dark:bg-gray-900 z-50 shadow-xl animate-in slide-in-from-right duration-300">
            <div className="p-4">
              {/* رأس القائمة */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">س</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      القائمة الرئيسية
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      صحيفة سبق الذكية
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* عناصر القائمة */}
              <ul className="space-y-2">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={index}>
                      <Link
                        href={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          item.highlight
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${item.highlight ? 'animate-pulse' : ''}`} />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* فاصل */}
              <div className="my-6 border-t border-gray-200 dark:border-gray-700" />

              {/* روابط إضافية */}
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>الإعدادات</span>
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      // تسجيل الخروج
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </>
      )}

      {/* مساحة للهيدر الثابت */}
      <div className="h-16" />
    </>
  );
}

// مكون مبسط للهيدر
export function SimpleMobileHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`simple-mobile-header fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-white dark:bg-gray-900'
      }`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">س</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              سبق
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <Link
              href="/menu"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
          </div>
        </div>
      </header>
      <div className="h-16" />
    </>
  );
} 