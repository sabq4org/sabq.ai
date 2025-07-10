"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { trackClick, trackEvent } from "../../lib/analytics";

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // جلب معلومات المستخدم الحالي
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await trackEvent("logout_attempt", { userId: user?.id });
      
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      if (res.ok) {
        await trackEvent("logout_success", { userId: user?.id });
        setUser(null);
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
      await trackEvent("logout_error", { userId: user?.id, error: "network_error" });
    }
  };

  const handleNavClick = (navItem: string) => {
    trackClick("nav_item", { navItem });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    trackClick("mobile_menu_toggle", { isOpen: !isMenuOpen });
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* الشعار */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">س</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">سبق الذكية</h1>
                <p className="text-xs text-gray-500">نظام إدارة المحتوى</p>
              </div>
            </Link>
          </div>

          {/* القائمة الرئيسية - للشاشات الكبيرة */}
          <div className="hidden md:flex items-center space-x-8 space-x-reverse">
            <NavLink href="/" onClick={() => handleNavClick("home")}>
              الرئيسية
            </NavLink>
            <NavLink href="/articles" onClick={() => handleNavClick("articles")}>
              المقالات
            </NavLink>
            <NavLink href="/categories" onClick={() => handleNavClick("categories")}>
              التصنيفات
            </NavLink>
            <NavLink href="/authors" onClick={() => handleNavClick("authors")}>
              الكتاب
            </NavLink>
            <NavLink href="/about" onClick={() => handleNavClick("about")}>
              من نحن
            </NavLink>
          </div>

          {/* البحث وإعدادات المستخدم */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* شريط البحث */}
            <div className="hidden lg:block">
              <SearchBar />
            </div>

            {/* إعدادات المستخدم */}
            <div className="flex items-center space-x-4 space-x-reverse">
              {isLoading ? (
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              ) : user ? (
                <UserMenu user={user} onLogout={handleLogout} />
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => handleNavClick("login")}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    onClick={() => handleNavClick("register")}
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </div>

            {/* زر القائمة المتنقلة */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* القائمة المتنقلة */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <MobileNavLink href="/" onClick={() => handleNavClick("home")}>
                الرئيسية
              </MobileNavLink>
              <MobileNavLink href="/articles" onClick={() => handleNavClick("articles")}>
                المقالات
              </MobileNavLink>
              <MobileNavLink href="/categories" onClick={() => handleNavClick("categories")}>
                التصنيفات
              </MobileNavLink>
              <MobileNavLink href="/authors" onClick={() => handleNavClick("authors")}>
                الكتاب
              </MobileNavLink>
              <MobileNavLink href="/about" onClick={() => handleNavClick("about")}>
                من نحن
              </MobileNavLink>
              
              {/* البحث في القائمة المتنقلة */}
              <div className="px-3 py-2">
                <SearchBar />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// مكون رابط التنقل
function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

// مكون رابط التنقل المتنقل
function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      className="text-gray-700 hover:text-blue-600 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium transition-colors"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

// مكون البحث
function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await trackEvent("search_attempt", { query: searchQuery });
      // تنفيذ البحث هنا
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <input
        type="text"
        placeholder="البحث في المقالات..."
        className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}

// مكون قائمة المستخدم
function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    trackClick("user_menu_toggle", { isOpen: !isMenuOpen });
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center space-x-3 space-x-reverse text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-white font-medium">{user.name.charAt(0)}</span>
          )}
        </div>
        <span className="text-gray-700 hidden sm:block">{user.name}</span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isMenuOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => trackClick("user_menu_item", { item: "profile" })}
          >
            الملف الشخصي
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => trackClick("user_menu_item", { item: "settings" })}
          >
            الإعدادات
          </Link>
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => trackClick("user_menu_item", { item: "admin" })}
            >
              لوحة التحكم
            </Link>
          )}
          <hr className="my-1" />
          <button
            onClick={onLogout}
            className="block w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
} 