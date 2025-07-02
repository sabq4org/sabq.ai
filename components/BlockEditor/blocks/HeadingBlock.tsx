'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface HeadingBlockProps {
  data: { text: string; level: 1 | 2 | 3 | 4 | 5 | 6; alignment?: 'left' | 'center' | 'right' };
  onChange: (data: any) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
}

export default function HeadingBlock({ 
  data, 
  onChange, 
  onKeyDown,
  readOnly = false,
  autoFocus = false 
}: HeadingBlockProps) {
  const { darkMode } = useDarkModeContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ 
      heading: { 
        ...data, 
        text: e.target.value 
      } 
    });
  };

  const handleLevelChange = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    onChange({ 
      heading: { 
        ...data, 
        level 
      } 
    });
  };

  const alignmentClasses = {
    left: 'text-right',
    center: 'text-center',
    right: 'text-left'
  };

  const headingSizes = {
    1: 'text-4xl font-bold',
    2: 'text-3xl font-bold',
    3: 'text-2xl font-semibold',
    4: 'text-xl font-semibold',
    5: 'text-lg font-medium',
    6: 'text-base font-medium'
  };

  if (readOnly) {
    const className = `${headingSizes[data.level]} ${alignmentClasses[data.alignment || 'left']} ${
      darkMode ? 'text-gray-100' : 'text-gray-900'
    }`;
    
    return React.createElement(
      `h${data.level}`,
      { className },
      data.text || React.createElement('span', { className: 'text-gray-400' }, 'عنوان فارغ')
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={data.text}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={`عنوان ${data.level}`}
        className={`w-full outline-none bg-transparent transition-all ${
          headingSizes[data.level]
        } ${
          alignmentClasses[data.alignment || 'left']
        } ${
          darkMode 
            ? 'text-gray-100 placeholder-gray-600' 
            : 'text-gray-900 placeholder-gray-400'
        } ${
          isFocused ? 'placeholder-gray-500' : ''
        }`}
      />
      
      {/* Heading toolbar */}
      {isFocused && (
        <div className={`absolute -top-10 left-0 flex gap-1 p-1 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {/* Level buttons */}
          <div className="flex gap-1 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
            {[1, 2, 3, 4, 5, 6].map(level => (
              <button
                key={level}
                onClick={() => handleLevelChange(level as 1 | 2 | 3 | 4 | 5 | 6)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  data.level === level 
                    ? darkMode 
                      ? 'bg-gray-700 text-blue-400' 
                      : 'bg-gray-100 text-blue-600'
                    : darkMode 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={`عنوان ${level}`}
              >
                H{level}
              </button>
            ))}
          </div>

          {/* Alignment buttons */}
          {(['right', 'center', 'left'] as const).map(align => (
            <button
              key={align}
              onClick={() => onChange({ heading: { ...data, alignment: align } })}
              className={`p-1.5 rounded transition-colors ${
                data.alignment === align 
                  ? darkMode 
                    ? 'bg-gray-700 text-blue-400' 
                    : 'bg-gray-100 text-blue-600'
                  : darkMode 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={
                align === 'right' ? 'محاذاة يمين' :
                align === 'center' ? 'توسيط' :
                'محاذاة يسار'
              }
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                {align === 'right' && (
                  <path d="M3 4h14v2H3V4zm0 4h14v2H3V8zm0 4h14v2H3v-2zm0 4h10v2H3v-2z" />
                )}
                {align === 'center' && (
                  <path d="M3 4h14v2H3V4zm2 4h10v2H5V8zm-2 4h14v2H3v-2zm2 4h10v2H5v-2z" />
                )}
                {align === 'left' && (
                  <path d="M3 4h14v2H3V4zm0 4h14v2H3V8zm0 4h14v2H3v-2zm0 4h10v2H3v-2z" transform="scale(-1, 1) translate(-20, 0)" />
                )}
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 