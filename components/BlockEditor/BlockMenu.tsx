'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Type, Heading, Image, Video, Quote, List, Code,
  Minus, Twitter, Link, Table, Plus
} from 'lucide-react';
import { BlockType } from './types';
import { getBlockTitle } from './utils';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface BlockMenuProps {
  onSelect: (type: BlockType) => void;
  trigger?: React.ReactNode;
}

const blockItems: { type: BlockType; icon: any; description: string; isEnabled?: boolean }[] = [
  { type: 'paragraph', icon: Type, description: 'نص عادي', isEnabled: true },
  { type: 'heading', icon: Heading, description: 'عنوان فرعي', isEnabled: true },
  { type: 'image', icon: Image, description: 'صورة من جهازك أو رابط', isEnabled: true },
  { type: 'video', icon: Video, description: 'فيديو يوتيوب أو رابط', isEnabled: true },
  { type: 'quote', icon: Quote, description: 'اقتباس مميز', isEnabled: true },
  { type: 'list', icon: List, description: 'قائمة نقطية أو رقمية', isEnabled: true },
  { type: 'code', icon: Code, description: 'كود برمجي', isEnabled: false },
  { type: 'divider', icon: Minus, description: 'خط فاصل', isEnabled: true },
  { type: 'tweet', icon: Twitter, description: 'تضمين تغريدة', isEnabled: true },
  { type: 'link', icon: Link, description: 'رابط مع معاينة', isEnabled: true },
  { type: 'table', icon: Table, description: 'جدول بيانات', isEnabled: true }
];

export default function BlockMenu({ onSelect, trigger }: BlockMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const { darkMode } = useDarkModeContext();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = blockItems
    .filter(item => item.isEnabled !== false) // إخفاء البلوكات غير المفعلة
    .filter(item =>
      getBlockTitle(item.type).toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleSelect = (type: BlockType) => {
    onSelect(type);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={menuRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-lg transition-all hover:scale-105 ${
            darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="إضافة بلوك جديد"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {isOpen && (
        <div className={`absolute z-[9999] mt-2 w-72 rounded-xl shadow-2xl overflow-hidden block-menu-dropdown ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
        style={{ zIndex: 9999 }}>
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن نوع البلوك..."
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 text-gray-100 placeholder-gray-400' 
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              }`}
              autoFocus
            />
          </div>

          {/* Menu Items */}
          <div className="max-h-96 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                لا توجد نتائج
              </div>
            ) : (
              filteredItems.map(({ type, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => handleSelect(type)}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-200' 
                      : 'hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-right flex-1">
                    <div className="font-medium text-sm">{getBlockTitle(type)}</div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {description}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Shortcut hint */}
          <div className={`p-2 text-center text-xs border-t ${
            darkMode 
              ? 'bg-gray-900 text-gray-500 border-gray-700' 
              : 'bg-gray-50 text-gray-400 border-gray-200'
          }`}>
            اكتب "/" في بداية أي سطر لفتح هذه القائمة
          </div>
        </div>
      )}
    </div>
  );
} 