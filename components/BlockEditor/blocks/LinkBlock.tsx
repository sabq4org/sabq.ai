'use client';

import React from 'react';
import { Link, ExternalLink } from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface LinkBlockProps {
  data: {
    url?: string;
    text?: string;
  };
  onChange: (data: any) => void;
  readOnly?: boolean;
}

export default function LinkBlock({ data, onChange, readOnly }: LinkBlockProps) {
  const { darkMode } = useDarkModeContext();
  
  const handleChange = (field: 'url' | 'text', value: string) => {
    onChange({
      link: {
        ...data,
        [field]: value
      }
    });
  };

  if (readOnly && data.url) {
    return (
      <div className={`rounded-lg p-4 border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
      }`}>
        <a 
          href={data.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 group"
        >
          <div className={`p-3 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-blue-100'
          }`}>
            <ExternalLink className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-blue-600 group-hover:underline">
              {data.text || data.url}
            </p>
            {data.text && (
              <p className="text-sm text-gray-500 mt-1">{data.url}</p>
            )}
          </div>
        </a>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 ${
      darkMode ? 'bg-gray-800' : 'bg-gray-50'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <Link className="w-5 h-5 text-blue-500" />
        <span className="font-medium">رابط خارجي</span>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            عنوان الرابط
          </label>
          <input
            type="text"
            value={data.text || ''}
            onChange={(e) => handleChange('text', e.target.value)}
            placeholder="أدخل عنوان الرابط..."
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={readOnly}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            الرابط URL
          </label>
          <input
            type="url"
            value={data.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://example.com"
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
} 