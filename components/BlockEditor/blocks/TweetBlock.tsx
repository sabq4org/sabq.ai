'use client';

import React from 'react';
import { Twitter } from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface TweetBlockProps {
  data: {
    url?: string;
    tweet?: {
      url?: string;
    };
  };
  onChange: (data: any) => void;
  readOnly?: boolean;
}

export default function TweetBlock({ data, onChange, readOnly }: TweetBlockProps) {
  const { darkMode } = useDarkModeContext();
  
  // استخراج URL من البيانات المحفوظة
  const tweetUrl = data.tweet?.url || data.url || '';
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      tweet: {
        url: e.target.value
      }
    });
  };

  if (readOnly && tweetUrl) {
    return (
      <div className={`rounded-lg overflow-hidden ${
        darkMode ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <div className="p-4 text-center">
          <Twitter className="w-8 h-8 mx-auto mb-2 text-blue-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">تغريدة مضمنة</p>
          <a 
            href={tweetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm"
          >
            {tweetUrl}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 ${
      darkMode ? 'bg-gray-800' : 'bg-gray-50'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <Twitter className="w-5 h-5 text-blue-400" />
        <span className="font-medium">تضمين تغريدة</span>
      </div>
      <input
        type="url"
        value={tweetUrl}
        onChange={handleUrlChange}
        placeholder="الصق رابط التغريدة هنا..."
        className={`w-full px-3 py-2 rounded-lg border ${
          darkMode 
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-white border-gray-300 text-gray-900'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        disabled={readOnly}
      />
      <p className="text-xs text-gray-500 mt-2">
        مثال: https://twitter.com/username/status/1234567890
      </p>
    </div>
  );
} 