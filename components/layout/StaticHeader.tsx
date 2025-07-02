'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, User, Sun, Moon } from 'lucide-react'
import { useDarkModeContext } from '@/contexts/DarkModeContext'

export function StaticHeader() {
  const { darkMode, mounted, toggleDarkMode } = useDarkModeContext()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const navigationItems = [
    { label: 'الرئيسية', url: '/' },
    { label: 'الأخبار', url: '/news' },
    { label: 'التصنيفات', url: '/categories' },
    { label: 'تواصل معنا', url: '/contact' }
  ]

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4">
        {/* الشريط العلوي */}
        <div className="py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-4">
              <span className="text-red-600 dark:text-red-400 font-semibold animate-pulse">
                عاجل
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                آخر الأخبار والتحديثات
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* الشعار والأدوات */}
        <div className="py-4 flex items-center justify-between">
          {/* الشعار */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">س</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                صحيفة سبق
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                الذكية - مدعومة بالذكاء الاصطناعي
              </p>
            </div>
          </Link>

          {/* الأدوات */}
          <div className="flex items-center gap-4">
            {/* البحث */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* تبديل الوضع الليلي */}
            {mounted && (
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="تبديل الوضع الليلي"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            )}

            {/* تسجيل الدخول */}
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </Link>

            {/* زر القائمة للموبايل */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* شريط البحث */}
        {searchOpen && (
          <div className="pb-4">
            <form className="relative">
              <input
                type="search"
                placeholder="ابحث في الأخبار..."
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* التنقل - سطح المكتب */}
        <nav className="hidden lg:block py-4 border-t border-gray-200 dark:border-gray-700">
          <ul className="flex items-center justify-center gap-8">
            {navigationItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.url}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* التنقل - الموبايل */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <ul className="space-y-2">
              {navigationItems.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
} 