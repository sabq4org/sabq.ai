'use client';

import React from 'react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface DividerBlockProps {
  data: { style?: 'solid' | 'dashed' | 'dotted' };
  onChange: (data: any) => void;
  readOnly?: boolean;
}

export default function DividerBlock({ data, onChange, readOnly = false }: DividerBlockProps) {
  const { darkMode } = useDarkModeContext();

  const styles = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted'
  };

  const handleStyleChange = (style: 'solid' | 'dashed' | 'dotted') => {
    onChange({ 
      divider: { 
        ...data, 
        style 
      } 
    });
  };

  if (readOnly) {
    return (
      <hr className={`my-6 border-t-2 ${styles[data.style || 'solid']} ${
        darkMode ? 'border-gray-700' : 'border-gray-300'
      }`} />
    );
  }

  return (
    <div className="relative my-4 group">
      <hr className={`border-t-2 ${styles[data.style || 'solid']} ${
        darkMode ? 'border-gray-700' : 'border-gray-300'
      }`} />
      
      {/* Style selector */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className={`flex gap-1 p-1 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {(['solid', 'dashed', 'dotted'] as const).map(style => (
            <button
              key={style}
              onClick={() => handleStyleChange(style)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                data.style === style 
                  ? darkMode 
                    ? 'bg-gray-700 text-blue-400' 
                    : 'bg-gray-100 text-blue-600'
                  : darkMode 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={
                style === 'solid' ? 'خط متصل' :
                style === 'dashed' ? 'خط متقطع' :
                'خط منقط'
              }
            >
              <div className={`w-12 h-0 border-t-2 ${styles[style]} ${
                data.style === style 
                  ? darkMode ? 'border-blue-400' : 'border-blue-600'
                  : darkMode ? 'border-gray-400' : 'border-gray-600'
              }`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 