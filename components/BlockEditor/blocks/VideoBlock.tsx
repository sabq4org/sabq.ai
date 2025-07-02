'use client';

import React, { useState } from 'react';
import { Video, Youtube, Link } from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface VideoBlockProps {
  data: { url: string; caption?: string; provider?: 'youtube' | 'vimeo' | 'other' };
  onChange: (data: any) => void;
  readOnly?: boolean;
}

export default function VideoBlock({ data, onChange, readOnly = false }: VideoBlockProps) {
  const { darkMode } = useDarkModeContext();
  const [showUrlInput, setShowUrlInput] = useState(!data.url);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const provider = detectVideoProvider(url);
    onChange({ 
      video: { 
        ...data, 
        url,
        provider 
      } 
    });
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ 
      video: { 
        ...data, 
        caption: e.target.value 
      } 
    });
  };

  const detectVideoProvider = (url: string): 'youtube' | 'vimeo' | 'other' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    } else if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    return 'other';
  };

  const getEmbedUrl = (url: string): string => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };

  if (readOnly) {
    return (
      <figure className="my-4">
        {data.url ? (
          <>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md">
              {data.provider === 'youtube' || data.provider === 'vimeo' ? (
                <iframe
                  src={getEmbedUrl(data.url)}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video 
                  src={data.url} 
                  controls
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {data.caption && (
              <figcaption className={`text-center mt-2 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {data.caption}
              </figcaption>
            )}
          </>
        ) : (
          <div className={`p-8 rounded-lg border-2 border-dashed text-center ${
            darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'
          }`}>
            <Video className="w-12 h-12 mx-auto mb-2" />
            <p>لم يتم إضافة فيديو</p>
          </div>
        )}
      </figure>
    );
  }

  return (
    <div className="space-y-3">
      {!data.url || showUrlInput ? (
        <div className={`p-4 rounded-lg border-2 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="space-y-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                رابط الفيديو
              </label>
              <input
                type="url"
                value={data.url}
                onChange={handleUrlChange}
                placeholder="https://youtube.com/watch?v=... أو رابط مباشر للفيديو"
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                autoFocus
              />
              <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                يدعم: YouTube، Vimeo، أو رابط مباشر لملف فيديو
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative group">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md bg-black">
              {data.provider === 'youtube' || data.provider === 'vimeo' ? (
                <iframe
                  src={getEmbedUrl(data.url)}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video 
                  src={data.url} 
                  controls
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button
              onClick={() => setShowUrlInput(true)}
              className={`absolute top-2 left-2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                darkMode 
                  ? 'bg-gray-800/90 hover:bg-gray-700 text-gray-200' 
                  : 'bg-white/90 hover:bg-gray-100 text-gray-700'
              }`}
              title="تغيير الفيديو"
            >
              <Link className="w-4 h-4" />
            </button>
            
            {/* Provider indicator */}
            {data.provider && (
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                data.provider === 'youtube' 
                  ? 'bg-red-600 text-white' 
                  : data.provider === 'vimeo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-white'
              }`}>
                {data.provider === 'youtube' && <Youtube className="w-3 h-3 inline ml-1" />}
                {data.provider.charAt(0).toUpperCase() + data.provider.slice(1)}
              </div>
            )}
          </div>

          <input
            type="text"
            value={data.caption || ''}
            onChange={handleCaptionChange}
            placeholder="وصف الفيديو (اختياري)"
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
          />
        </>
      )}
    </div>
  );
} 