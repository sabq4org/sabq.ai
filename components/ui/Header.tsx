'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">س</span>
            </div>
            <span className="text-xl font-bold text-gray-900">سبق الذكي</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              لوحة التحكم
            </Link>
            <Link href="/dashboard/articles" className="text-gray-600 hover:text-gray-900">
              المقالات
            </Link>
            <Link href="/dashboard/analytics" className="text-gray-600 hover:text-gray-900">
              التحليلات
            </Link>
            <Link href="/dashboard/settings" className="text-gray-600 hover:text-gray-900">
              الإعدادات
            </Link>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
            <button className="text-gray-600 hover:text-gray-900">
              الإشعارات
            </button>
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <Link href="/dashboard" className="block py-2 text-gray-600">
              لوحة التحكم
            </Link>
            <Link href="/dashboard/articles" className="block py-2 text-gray-600">
              المقالات
            </Link>
            <Link href="/dashboard/analytics" className="block py-2 text-gray-600">
              التحليلات
            </Link>
            <Link href="/dashboard/settings" className="block py-2 text-gray-600">
              الإعدادات
            </Link>
          </div>
        )}
      </div>
    </header>
  )
} 