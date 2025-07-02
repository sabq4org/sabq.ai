'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

export interface TabItem {
  id: string;
  name: string;
  icon: LucideIcon;
  count?: number;
}

interface TabsEnhancedProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabsEnhanced({ tabs, activeTab, onTabChange, className = '' }: TabsEnhancedProps) {
  const { darkMode } = useDarkModeContext();

  return (
    <div className={`rounded-2xl p-2 shadow-sm border mb-8 w-full transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    } ${className}`}>
      <div className="flex gap-2 justify-start pr-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-48 flex flex-col items-center justify-center gap-2 py-4 pb-3 px-3 rounded-xl font-medium text-sm transition-all duration-300 relative ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {/* خط سفلي للتاب النشط */}
              {isActive && (
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-white/30 rounded-full" />
              )}
              
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
              <span className={isActive ? 'font-semibold' : ''}>{tab.name}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`absolute -top-1 -right-1 px-2 py-0.5 text-xs rounded-full font-bold ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-md'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 border border-gray-600'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 