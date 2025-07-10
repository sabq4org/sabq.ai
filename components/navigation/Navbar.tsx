/**
 * شريط التنقل الشامل
 * Comprehensive Navigation Bar Component
 * @version 1.0.0
 * @author Sabq AI Team
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { analyticsManager, EventType } from '../../lib/analytics';
import { authManager, User, UserRole } from '../../lib/auth';

// أنواع التنقل
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
  requiresAuth?: boolean;
  requiredRole?: UserRole;
  external?: boolean;
  disabled?: boolean;
}

export interface NavbarProps {
  // التصميم
  variant?: 'default' | 'transparent' | 'dark' | 'light';
  fixed?: boolean;
  sticky?: boolean;
  shadow?: boolean;
  
  // المحتوى
  brand?: {
    name: string;
    logo?: string;
    href?: string;
  };
  navItems?: NavItem[];
  rightActions?: React.ReactNode;
  
  // السلوك
  showSearch?: boolean;
  showLanguageSwitch?: boolean;
  showThemeSwitch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  mobileBreakpoint?: number;
  
  // الأحداث
  onNavClick?: (item: NavItem) => void;
  onBrandClick?: () => void;
  onUserMenuClick?: (action: string) => void;
}

// البيانات الافتراضية للتنقل
const defaultNavItems: NavItem[] = [
  {
    id: 'home',
    label: 'الرئيسية',
    href: '/',
    icon: '🏠'
  },
  {
    id: 'news',
    label: 'الأخبار',
    href: '/news',
    icon: '📰',
    children: [
      { id: 'local', label: 'محليات', href: '/news/local' },
      { id: 'world', label: 'العالم', href: '/news/world' },
      { id: 'sports', label: 'رياضة', href: '/news/sports' },
      { id: 'technology', label: 'تقنية', href: '/news/technology' },
      { id: 'business', label: 'أعمال', href: '/news/business' }
    ]
  },
  {
    id: 'articles',
    label: 'المقالات',
    href: '/articles',
    icon: '📝'
  },
  {
    id: 'about',
    label: 'من نحن',
    href: '/about',
    icon: 'ℹ️'
  },
  {
    id: 'contact',
    label: 'اتصل بنا',
    href: '/contact',
    icon: '📞'
  }
];

// مكون شريط التنقل الرئيسي
export const Navbar: React.FC<NavbarProps> = ({
  variant = 'default',
  fixed = false,
  sticky = true,
  shadow = true,
  brand = { name: 'سبق AI', href: '/' },
  navItems = defaultNavItems,
  rightActions,
  showSearch = true,
  showLanguageSwitch = true,
  showThemeSwitch = true,
  showNotifications = true,
  showUserMenu = true,
  mobileBreakpoint = 768,
  onNavClick,
  onBrandClick,
  onUserMenuClick
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLNavElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // تحميل بيانات المستخدم
  useEffect(() => {
    // في تطبيق حقيقي، سيتم الحصول على المستخدم من السياق أو التخزين
    const loadCurrentUser = async () => {
      // محاكاة تحميل المستخدم
      // const user = await authManager.getCurrentUser();
      // setCurrentUser(user);
    };
    
    loadCurrentUser();
  }, []);

  // إغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // إغلاق القائمة المحمولة عند تغيير المسار
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // فئات CSS
  const navClasses = [
    'sabq-navbar',
    `sabq-navbar--${variant}`,
    fixed ? 'sabq-navbar--fixed' : '',
    sticky ? 'sabq-navbar--sticky' : '',
    shadow ? 'sabq-navbar--shadow' : ''
  ].filter(Boolean).join(' ');

  // فحص الصلاحيات
  const canAccessItem = (item: NavItem): boolean => {
    if (!item.requiresAuth) return true;
    if (!currentUser) return false;
    if (item.requiredRole && currentUser.role !== item.requiredRole) return false;
    return true;
  };

  // معالج النقر على عناصر التنقل
  const handleNavClick = async (item: NavItem, event?: React.MouseEvent) => {
    // تتبع النقرة
    await analyticsManager.trackEvent({
      type: EventType.CLICK,
      category: 'navigation',
      action: 'nav_click',
      label: item.label,
      metadata: {
        customDimensions: {
          href: item.href,
          hasChildren: !!item.children,
          requiresAuth: !!item.requiresAuth
        },
        customMetrics: {}
      }
    });

    onNavClick?.(item);

    // التعامل مع الروابط الخارجية
    if (item.external) {
      event?.preventDefault();
      window.open(item.href, '_blank', 'noopener,noreferrer');
      return;
    }

    // فحص الصلاحيات
    if (!canAccessItem(item)) {
      event?.preventDefault();
      router.push('/login');
      return;
    }

    // التعامل مع القوائم المنسدلة
    if (item.children) {
      event?.preventDefault();
      setActiveDropdown(activeDropdown === item.id ? null : item.id);
      return;
    }
  };

  // معالج البحث
  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!searchQuery.trim()) return;

    // تتبع البحث
    await analyticsManager.trackSearch(searchQuery, 0); // في تطبيق حقيقي، سيتم تمرير عدد النتائج

    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  // تبديل القائمة المحمولة
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // تبديل البحث
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  };

  // معالج قائمة المستخدم
  const handleUserAction = async (action: string) => {
    await analyticsManager.trackEvent({
      type: EventType.USER_ACTION,
      category: 'user_menu',
      action: action,
      label: action
    });

    onUserMenuClick?.(action);

    switch (action) {
      case 'profile':
        router.push('/profile');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'logout':
        await authManager.logout('current_session'); // في تطبيق حقيقي
        router.push('/');
        break;
    }
  };

  return (
    <nav ref={navRef} className={navClasses}>
      <div className="sabq-navbar-container">
        {/* العلامة التجارية */}
        <div className="sabq-navbar-brand">
          <Link 
            href={brand.href || '/'}
            onClick={() => onBrandClick?.()}
            className="sabq-navbar-brand-link"
          >
            {brand.logo && (
              <img 
                src={brand.logo} 
                alt={brand.name}
                className="sabq-navbar-logo"
              />
            )}
            <span className="sabq-navbar-brand-text">{brand.name}</span>
          </Link>
        </div>

        {/* عناصر التنقل - سطح المكتب */}
        <div className="sabq-navbar-nav sabq-navbar-nav--desktop">
          {navItems.filter(canAccessItem).map((item) => (
            <div key={item.id} className="sabq-navbar-item-wrapper">
              <Link
                href={item.href}
                className={`sabq-navbar-item ${pathname === item.href ? 'sabq-navbar-item--active' : ''} ${item.disabled ? 'sabq-navbar-item--disabled' : ''}`}
                onClick={(e) => handleNavClick(item, e)}
              >
                {item.icon && <span className="sabq-navbar-item-icon">{item.icon}</span>}
                <span className="sabq-navbar-item-text">{item.label}</span>
                {item.badge && (
                  <span className="sabq-navbar-badge">{item.badge}</span>
                )}
                {item.children && (
                  <span className="sabq-navbar-dropdown-indicator">▼</span>
                )}
              </Link>

              {/* القائمة المنسدلة */}
              {item.children && activeDropdown === item.id && (
                <div className="sabq-navbar-dropdown">
                  {item.children.filter(canAccessItem).map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      className={`sabq-navbar-dropdown-item ${pathname === child.href ? 'sabq-navbar-dropdown-item--active' : ''}`}
                      onClick={(e) => handleNavClick(child, e)}
                    >
                      {child.icon && <span className="sabq-navbar-item-icon">{child.icon}</span>}
                      <span>{child.label}</span>
                      {child.badge && (
                        <span className="sabq-navbar-badge">{child.badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* الإجراءات اليمنى */}
        <div className="sabq-navbar-actions">
          {/* البحث */}
          {showSearch && (
            <div className="sabq-navbar-search">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="sabq-navbar-search-form">
                  <input
                    ref={searchRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في الموقع..."
                    className="sabq-navbar-search-input"
                  />
                  <button type="submit" className="sabq-navbar-search-submit">
                    🔍
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsSearchOpen(false)}
                    className="sabq-navbar-search-close"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button 
                  onClick={toggleSearch}
                  className="sabq-navbar-action-btn"
                  aria-label="فتح البحث"
                >
                  🔍
                </button>
              )}
            </div>
          )}

          {/* تبديل اللغة */}
          {showLanguageSwitch && (
            <button 
              className="sabq-navbar-action-btn"
              onClick={() => handleUserAction('switch_language')}
              aria-label="تغيير اللغة"
            >
              🌐
            </button>
          )}

          {/* تبديل المظهر */}
          {showThemeSwitch && (
            <button 
              className="sabq-navbar-action-btn"
              onClick={() => handleUserAction('switch_theme')}
              aria-label="تغيير المظهر"
            >
              🌙
            </button>
          )}

          {/* الإشعارات */}
          {showNotifications && currentUser && (
            <div className="sabq-navbar-notifications">
              <button 
                className="sabq-navbar-action-btn sabq-navbar-notifications-btn"
                onClick={() => handleUserAction('notifications')}
                aria-label="الإشعارات"
              >
                🔔
                {notifications.length > 0 && (
                  <span className="sabq-navbar-notifications-count">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* قائمة المستخدم */}
          {showUserMenu && (
            <div className="sabq-navbar-user-menu">
              {currentUser ? (
                <div className="sabq-navbar-user-dropdown">
                  <button 
                    className="sabq-navbar-user-btn"
                    onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                  >
                    {currentUser.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt={currentUser.fullName}
                        className="sabq-navbar-user-avatar"
                      />
                    ) : (
                      <div className="sabq-navbar-user-avatar-placeholder">
                        {currentUser.fullName.charAt(0)}
                      </div>
                    )}
                    <span className="sabq-navbar-user-name">{currentUser.fullName}</span>
                    <span className="sabq-navbar-dropdown-indicator">▼</span>
                  </button>

                  {activeDropdown === 'user' && (
                    <div className="sabq-navbar-dropdown sabq-navbar-user-dropdown-menu">
                      <button 
                        onClick={() => handleUserAction('profile')}
                        className="sabq-navbar-dropdown-item"
                      >
                        👤 الملف الشخصي
                      </button>
                      <button 
                        onClick={() => handleUserAction('settings')}
                        className="sabq-navbar-dropdown-item"
                      >
                        ⚙️ الإعدادات
                      </button>
                      <hr className="sabq-navbar-dropdown-divider" />
                      <button 
                        onClick={() => handleUserAction('logout')}
                        className="sabq-navbar-dropdown-item sabq-navbar-dropdown-item--danger"
                      >
                        🚪 تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="sabq-navbar-auth-buttons">
                  <Link href="/login" className="sabq-navbar-auth-btn sabq-navbar-auth-btn--login">
                    تسجيل الدخول
                  </Link>
                  <Link href="/register" className="sabq-navbar-auth-btn sabq-navbar-auth-btn--register">
                    التسجيل
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* الإجراءات المخصصة */}
          {rightActions}

          {/* زر القائمة المحمولة */}
          <button 
            className="sabq-navbar-mobile-toggle"
            onClick={toggleMobileMenu}
            aria-label="تبديل القائمة"
          >
            <span className={`sabq-navbar-hamburger ${isMobileMenuOpen ? 'sabq-navbar-hamburger--open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* القائمة المحمولة */}
      {isMobileMenuOpen && (
        <div className="sabq-navbar-mobile-menu">
          <div className="sabq-navbar-mobile-content">
            {navItems.filter(canAccessItem).map((item) => (
              <div key={item.id} className="sabq-navbar-mobile-item-wrapper">
                <Link
                  href={item.href}
                  className={`sabq-navbar-mobile-item ${pathname === item.href ? 'sabq-navbar-mobile-item--active' : ''}`}
                  onClick={(e) => handleNavClick(item, e)}
                >
                  {item.icon && <span className="sabq-navbar-item-icon">{item.icon}</span>}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="sabq-navbar-badge">{item.badge}</span>
                  )}
                </Link>

                {/* عناصر فرعية للمحمول */}
                {item.children && (
                  <div className="sabq-navbar-mobile-submenu">
                    {item.children.filter(canAccessItem).map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`sabq-navbar-mobile-subitem ${pathname === child.href ? 'sabq-navbar-mobile-subitem--active' : ''}`}
                        onClick={(e) => handleNavClick(child, e)}
                      >
                        {child.icon && <span className="sabq-navbar-item-icon">{child.icon}</span>}
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* إجراءات إضافية للمحمول */}
            <div className="sabq-navbar-mobile-actions">
              {!currentUser && (
                <div className="sabq-navbar-mobile-auth">
                  <Link href="/login" className="sabq-navbar-mobile-auth-btn">
                    تسجيل الدخول
                  </Link>
                  <Link href="/register" className="sabq-navbar-mobile-auth-btn">
                    التسجيل
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

// مكونات فرعية مساعدة
export const NavbarSpacer: React.FC<{ height?: string }> = ({ height = '60px' }) => (
  <div style={{ height }} className="sabq-navbar-spacer" />
);

// خطاف للتنقل
export const useNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = async (href: string, trackingLabel?: string) => {
    await analyticsManager.trackEvent({
      type: EventType.CLICK,
      category: 'navigation',
      action: 'programmatic_navigation',
      label: trackingLabel || href
    });

    router.push(href);
  };

  const isActive = (href: string): boolean => {
    return pathname === href;
  };

  const isChildActive = (parentHref: string): boolean => {
    return pathname.startsWith(parentHref);
  };

  return {
    navigateTo,
    isActive,
    isChildActive,
    currentPath: pathname
  };
};

// أنماط CSS أساسية
export const NavbarStyles = `
.sabq-navbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
  z-index: 1000;
}

.sabq-navbar--fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

.sabq-navbar--sticky {
  position: sticky;
  top: 0;
}

.sabq-navbar--shadow {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.sabq-navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.sabq-navbar-brand-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #1f2937;
  font-weight: 700;
  font-size: 1.25rem;
}

.sabq-navbar-logo {
  height: 32px;
  margin-right: 0.5rem;
}

.sabq-navbar-nav--desktop {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.sabq-navbar-item {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #4b5563;
  font-weight: 500;
  padding: 0.5rem 0;
  transition: color 0.2s;
  position: relative;
}

.sabq-navbar-item:hover {
  color: #3b82f6;
}

.sabq-navbar-item--active {
  color: #3b82f6;
}

.sabq-navbar-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1001;
}

.sabq-navbar-dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #374151;
  transition: background-color 0.2s;
}

.sabq-navbar-dropdown-item:hover {
  background-color: #f3f4f6;
}

.sabq-navbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sabq-navbar-action-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sabq-navbar-action-btn:hover {
  background-color: #f3f4f6;
}

.sabq-navbar-mobile-toggle {
  display: none;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
}

.sabq-navbar-mobile-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  max-height: calc(100vh - 60px);
  overflow-y: auto;
}

@media (max-width: 768px) {
  .sabq-navbar-nav--desktop {
    display: none;
  }
  
  .sabq-navbar-mobile-toggle {
    display: block;
  }
  
  .sabq-navbar-mobile-menu {
    display: block;
  }
}
`; 