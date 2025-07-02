'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface ParagraphBlockProps {
  data: { text: string; alignment?: 'left' | 'center' | 'right' | 'justify' };
  onChange: (data: any) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
}

export default function ParagraphBlock({ 
  data, 
  onChange, 
  onKeyDown,
  readOnly = false,
  autoFocus = false 
}: ParagraphBlockProps) {
  const { darkMode } = useDarkModeContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [data.text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('ParagraphBlock handleChange:', e.target.value);
    console.log('Current data:', data);
    onChange({ 
      paragraph: { 
        text: e.target.value,
        alignment: data.alignment || 'left'
      } 
    });
  };

  const alignmentClasses = {
    left: 'text-right',
    center: 'text-center',
    right: 'text-left',
    justify: 'text-justify'
  };

  if (readOnly) {
    return (
      <p className={`${alignmentClasses[data.alignment || 'left']} leading-relaxed ${
        darkMode ? 'text-gray-200' : 'text-gray-800'
      }`}>
        {data.text || <span className="text-gray-400">فقرة فارغة</span>}
      </p>
    );
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={data.text || ''}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="اكتب نص الفقرة..."
        disabled={readOnly}
        className={`w-full resize-none outline-none bg-transparent leading-relaxed transition-all ${
          alignmentClasses[data.alignment || 'left']
        } ${
          darkMode 
            ? 'text-gray-200 placeholder-gray-600' 
            : 'text-gray-800 placeholder-gray-400'
        } ${
          isFocused ? 'placeholder-gray-500' : ''
        }`}
        style={{ minHeight: '1.5em' }}
      />
      
      {/* Alignment toolbar */}
      {isFocused && (
        <div className={`absolute -top-10 left-0 flex gap-1 p-1 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {(['right', 'center', 'left', 'justify'] as const).map(align => (
            <button
              key={align}
              onClick={() => onChange({ paragraph: { ...data, alignment: align } })}
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
                align === 'left' ? 'محاذاة يسار' :
                'ضبط'
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
                {align === 'justify' && (
                  <path d="M3 4h14v2H3V4zm0 4h14v2H3V8zm0 4h14v2H3v-2zm0 4h14v2H3v-2z" />
                )}
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 