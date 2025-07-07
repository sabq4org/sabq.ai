'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Menu, ChevronDown, LogIn, User, Sun, Moon, Activity, Clock, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import UserDropdown from './UserDropdown';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { getCookie } from '@/lib/cookies';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function Header() {
  const router = useRouter();
  const { darkMode, mounted, toggleDarkMode } = useDarkModeContext();
  const [user, setUser] = useState<UserData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newEventsCount, setNewEventsCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  const fetchUserData = async () => {
    try {
      console.log('[Safari Debug] Fetching user data from API...');
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('[Safari Debug] API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Safari Debug] API Response data:', data);
        
        if (data.user) {
          setUser(data.user);
          try {
            localStorage.setItem('user', JSON.stringify(data.user));
          } catch (e) {
            console.error('[Safari Debug] localStorage error:', e);
          }
        }
      }
    } catch (error) {
      console.error('[Safari Debug] Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    console.log('[Safari Debug] Starting to load user data...');
    
    try {
      const userDataFromStorage = localStorage.getItem('user');
      if (userDataFromStorage) {
        console.log('[Safari Debug] Found user in localStorage');
        const parsedUser = JSON.parse(userDataFromStorage);
        setUser(parsedUser);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('[Safari Debug] localStorage error:', error);
    }
    
    try {
      const userCookie = getCookie('user');
      console.log('[Safari Debug] User cookie exists:', !!userCookie);
      
      if (userCookie) {
        const userData = JSON.parse(userCookie);
        console.log('[Safari Debug] Parsed user from cookie:', userData);
        setUser(userData);
        try {
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
          console.error('[Safari Debug] localStorage save error:', e);
        }
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('[Safari Debug] Cookie parsing error:', error);
    }
    
    console.log('[Safari Debug] No cached data found, fetching from API...');
    await fetchUserData();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUserData();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
    
    // فحص كل 5 دقائق
    const interval = setInterval(checkNewEvents, 300000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('[Safari Debug] No user found after loading, retrying...');
      const retryTimer = setTimeout(() => {
        fetchUserData();
      }, 1000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [isLoading, user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // تجاهل النقرات على الروابط داخل القائمة
      if ((target as HTMLElement).closest('a') || (target as HTMLElement).closest('button')) {
        return;
      }
      
      // للديسكتوب
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
      
      // للموبايل
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
    }

    // استخدام click بدلاً من mousedown لتجنب التداخل مع النقرات
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        localStorage.clear();
        sessionStorage.clear();
        
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        setUser(null);
        toast.success('تم تسجيل الخروج بنجاح');
        
        setTimeout(() => {
          window.location.href = '/'; // العودة للصفحة الرئيسية بدلاً من صفحة تسجيل الدخول
        }, 500);
      } else {
        toast.error('حدث خطأ في تسجيل الخروج');
      }
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      toast.error('حدث خطأ في تسجيل الخروج');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const navigationItems = [
    { label: 'الرئيسية', url: '/', order: 1 },
    { label: '', url: '/moment-by-moment', order: 2, highlight: true },
    { label: 'أخبار', url: '/news', order: 3 },
    { label: 'مقالات', url: '/opinion', order: 4 },
    { label: 'تصنيفات', url: '/categories', order: 5 },
    { label: 'منتدى', url: '/forum', order: 6, icon: MessageCircle },
    { label: 'عمق', url: '/insights/deep', order: 7 },
    { label: 'تواصل', url: '/contact', order: 8 }
  ];

  return (
    <header className="bg-white dark:bg-gray-900 shadow-lg dark:shadow-black/50 sticky top-0 z-50 transition-colors duration-300 h-16 safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Mobile Layout */}
          <div className="flex lg:hidden items-center justify-between w-full">
            {/* زر المينيو على اليمين */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="القائمة الرئيسية"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* الشعار في المنتصف */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">سبق</span>
            </Link>

            {/* أزرار التحكم على اليسار - مبسطة */}
            <div className="flex items-center gap-1">
              {/* زر الوضع الليلي - مخفي في الموبايل لتوفير المساحة */}
              {mounted && (
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg hidden sm:block"
                  aria-label="تبديل الوضع الليلي"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}
              
              {isLoading ? (
                <div className="w-8 h-8" />
              ) : user ? (
                <div ref={mobileDropdownRef}>
                  <button
                    ref={mobileButtonRef}
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="قائمة المستخدم"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs shadow-sm border border-gray-200 dark:border-gray-700">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </button>

                  {showDropdown && (
                    <UserDropdown 
                      user={user}
                      onClose={() => setShowDropdown(false)}
                      onLogout={handleLogout}
                      anchorElement={mobileButtonRef.current}
                    />
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  aria-label="تسجيل الدخول"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between w-full">
            {/* الشعار */}
            <Link href="/" className="flex-shrink-0 min-w-[120px]">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">سبق</span>
            </Link>

            {/* التنقل الرئيسي */}
            <nav className="flex items-center gap-8 flex-1 justify-center">
              {navigationItems.map((item) => (
                <Link 
                  key={item.url}
                  href={item.url} 
                  className={`flex items-center gap-2 transition-all font-medium text-lg ${
                    item.highlight 
                      ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 relative' 
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                  } hover:font-semibold`}
                  title={item.label === '' ? 'لحظة بلحظة' : item.label}
                >
                  {(item.label === '' || item.label === 'لحظة بلحظة') && (
                    <Activity className="w-5 h-5 animate-pulse" />
                  )}
                  {item.icon && <item.icon className="w-5 h-5" />}
                  {item.label && <span>{item.label}</span>}
                  {item.highlight && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  )}
                </Link>
              ))}
            </nav>

            {/* أدوات التحكم - مبسطة ومتناسقة */}
            <div className="flex items-center gap-2 min-w-[120px] justify-end">
              {/* زر الوضع الليلي */}
              {mounted && (
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  aria-label="تبديل الوضع الليلي"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}

              {isLoading ? (
                <div className="w-10 h-10" />
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    ref={desktopButtonRef}
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="قائمة المستخدم"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm border border-gray-200 dark:border-gray-700 ${user.avatar ? 'hidden' : ''}`}>
                      {getInitials(user.name)}
                    </div>
                    {/* إزالة السهم لتقليل التشتيت */}
                  </button>

                  {showDropdown && (
                    <UserDropdown 
                      user={user}
                      onClose={() => setShowDropdown(false)}
                      onLogout={handleLogout}
                      anchorElement={desktopButtonRef.current}
                    />
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
            <nav className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${
                    item.highlight
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {(item.label === '' || item.label === 'لحظة بلحظة') && (
                    <Activity className="w-5 h-5 animate-pulse" />
                  )}
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span className="flex-1">
                    {item.label === '' ? 'لحظة بلحظة' : item.label}
                  </span>
                  {item.highlight && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  )}
                </Link>
              ))}
              
              {/* إضافة زر الوضع الليلي في قائمة الموبايل */}
              {mounted && (
                <button
                  onClick={() => {
                    toggleDarkMode();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 w-full text-right"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span className="flex-1">
                    {darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
                  </span>
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}