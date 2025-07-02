'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface QuoteBlockProps {
  data: { text: string; author?: string; alignment?: 'left' | 'center' | 'right' };
  onChange: (data: any) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
}

export default function QuoteBlock({ 
  data, 
  onChange, 
  onKeyDown,
  readOnly = false,
  autoFocus = false 
}: QuoteBlockProps) {
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
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [data.text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ 
      quote: { 
        ...data, 
        text: e.target.value 
      } 
    });
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ 
      quote: { 
        ...data, 
        author: e.target.value 
      } 
    });
  };

  const alignmentClasses = {
    left: 'text-right',
    center: 'text-center',
    right: 'text-left'
  };

  if (readOnly) {
    return (
      <blockquote className={`relative border-r-4 pr-6 py-2 italic ${
        darkMode 
          ? 'border-gray-600 text-gray-300' 
          : 'border-gray-400 text-gray-700'
      } ${alignmentClasses[data.alignment || 'left']}`}>
        <Quote className={`absolute top-0 right-0 w-8 h-8 opacity-10 ${
          darkMode ? 'text-gray-500' : 'text-gray-400'
        }`} />
        <p className="text-lg leading-relaxed mb-2">
          {data.text || <span className="text-gray-400">اقتباس فارغ</span>}
        </p>
        {data.author && (
          <cite className={`block text-sm mt-2 not-italic ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            — {data.author}
          </cite>
        )}
      </blockquote>
    );
  }

  return (
    <div className={`relative border-r-4 pr-6 py-2 ${
      darkMode 
        ? 'border-gray-600' 
        : 'border-gray-400'
    }`}>
      <Quote className={`absolute top-0 right-0 w-8 h-8 opacity-10 ${
        darkMode ? 'text-gray-500' : 'text-gray-400'
      }`} />
      
      <textarea
        ref={textareaRef}
        value={data.text}
        onChange={handleTextChange}
        onKeyDown={onKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="اكتب نص الاقتباس..."
        className={`w-full resize-none outline-none bg-transparent text-lg leading-relaxed italic transition-all ${
          alignmentClasses[data.alignment || 'left']
        } ${
          darkMode 
            ? 'text-gray-300 placeholder-gray-600' 
            : 'text-gray-700 placeholder-gray-400'
        } ${
          isFocused ? 'placeholder-gray-500' : ''
        }`}
        style={{ minHeight: '2em' }}
      />
      
      <input
        type="text"
        value={data.author || ''}
        onChange={handleAuthorChange}
        placeholder="— المصدر أو الكاتب (اختياري)"
        className={`w-full mt-2 text-sm outline-none bg-transparent transition-all ${
          alignmentClasses[data.alignment || 'left']
        } ${
          darkMode 
            ? 'text-gray-400 placeholder-gray-600' 
            : 'text-gray-600 placeholder-gray-400'
        }`}
      />
      
      {/* Alignment toolbar */}
      {isFocused && (
        <div className={`absolute -top-10 left-0 flex gap-1 p-1 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {(['right', 'center', 'left'] as const).map(align => (
            <button
              key={align}
              onClick={() => onChange({ quote: { ...data, alignment: align } })}
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