'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { 
  User, Settings, Bell, LogOut, 
  Crown, Star, Award, Gem, X, Heart
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserPopoverProps {
  user: UserData;
  onClose: () => void;
  onLogout: () => void;
  anchorElement?: HTMLElement | null;
}

export default function UserPopover({ user, onClose, onLogout, anchorElement }: UserPopoverProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ top: 64, right: 16 });

  // حساب موقع القائمة
  useEffect(() => {
    if (!isMobile && anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [anchorElement, isMobile]);

  // كشف حجم الشاشة
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // تأكد من وجود document قبل استخدام createPortal
  if (typeof document === 'undefined') return null;

  const popoverContent = (
    <>
      {/* خلفية شفافة للموبايل */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/30 z-[999] md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* القائمة المنبثقة */}
      <div className={`
        ${isMobile 
          ? 'fixed bottom-0 left-0 right-0 w-full max-h-[60vh] rounded-t-2xl' 
          : 'fixed w-72 rounded-xl'
        }
        bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/50 
        border border-gray-100 dark:border-gray-700 overflow-hidden z-[1000]
        ${isMobile ? 'animate-slide-up' : 'animate-fade-in'}
      `} 
      style={!isMobile ? { 
        top: `${position.top}px`, 
        right: `${position.right}px` 
      } : undefined}
      >
        {/* زر الإغلاق للموبايل */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
        )}

        {/* رأس القائمة - معلومات المستخدم مبسطة */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-gray-200 dark:border-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* قائمة الروابط المبسطة */}
        <div className="py-2">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <span>الملف الشخصي</span>
          </Link>

          <Link
            href="/welcome/preferences"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            <Heart className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <span>اهتماماتي</span>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            <Settings className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <span>الإعدادات</span>
          </Link>
        </div>

        {/* زر تسجيل الخروج */}
        <div className="border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-right"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* مساحة إضافية للموبايل */}
        {isMobile && <div className="h-safe-area-inset-bottom" />}
      </div>
    </>
  );

  return ReactDOM.createPortal(popoverContent, document.body);
} 