'use client';

import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Link, Loader } from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { getDefaultImageUrl } from '@/lib/cloudinary';

interface ImageBlockProps {
  data: { url: string; alt?: string; caption?: string };
  onChange: (data: any) => void;
  readOnly?: boolean;
}

export default function ImageBlock({ data, onChange, readOnly = false }: ImageBlockProps) {
  const { darkMode } = useDarkModeContext();
  const [showUrlInput, setShowUrlInput] = useState(!data.url);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ 
      image: { 
        ...data, 
        url: e.target.value 
      } 
    });
  };

  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ 
      image: { 
        ...data, 
        alt: e.target.value 
      } 
    });
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ 
      image: { 
        ...data, 
        caption: e.target.value 
      } 
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح');
      return;
    }

    // التحقق من حجم الملف (5MB كحد أقصى)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('حجم الصورة يجب أن يكون أقل من 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // إنشاء FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'article');

      // رفع الصورة إلى API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('فشل رفع الصورة');
      }

      const data = await response.json();
      
      // تحديث بيانات البلوك بعنوان URL الجديد
      onChange({ 
        image: { 
          url: data.data?.url || data.url, // التعامل مع كلا التنسيقين
          alt: file.name.split('.')[0], // استخدام اسم الملف كنص بديل افتراضي
          caption: ''
        } 
      });
      
      setShowUrlInput(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (readOnly) {
    return (
      <figure className="my-4">
        {data.url ? (
          <>
            <img 
              src={data.url} 
              alt={data.alt || ''} 
              className="w-full rounded-lg shadow-md object-cover"
              onError={(e) => {
                console.error('خطأ في تحميل الصورة:', {
                  src: e.currentTarget.src,
                  alt: e.currentTarget.alt
                });
                e.currentTarget.src = getDefaultImageUrl('article');
              }}
            />
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
            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
            <p>لم يتم إضافة صورة</p>
          </div>
        )}
      </figure>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
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
                رابط الصورة
              </label>
              <input
                type="url"
                value={data.url}
                onChange={handleUrlChange}
                placeholder="https://example.com/image.jpg"
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                autoFocus
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                أو
              </div>
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={uploading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  uploading
                    ? darkMode 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>جارٍ الرفع...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>رفع من الجهاز</span>
                  </>
                )}
              </button>
            </div>

            {uploadError && (
              <div className={`text-sm p-2 rounded ${
                darkMode 
                  ? 'bg-red-900/50 text-red-300' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {uploadError}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="relative group">
            <img 
              src={data.url} 
              alt={data.alt || ''} 
              className="w-full rounded-lg shadow-md object-cover"
              onError={(e) => {
                console.error('خطأ في تحميل الصورة:', {
                  src: e.currentTarget.src,
                  alt: e.currentTarget.alt
                });
                e.currentTarget.src = getDefaultImageUrl('article');
              }}
            />
            <button
              onClick={() => setShowUrlInput(true)}
              className={`absolute top-2 left-2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                darkMode 
                  ? 'bg-gray-800/90 hover:bg-gray-700 text-gray-200' 
                  : 'bg-white/90 hover:bg-gray-100 text-gray-700'
              }`}
              title="تغيير الصورة"
            >
              <Link className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={data.alt || ''}
              onChange={handleAltChange}
              placeholder="النص البديل (للأشخاص ذوي الإعاقة البصرية)"
              className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
            
            <input
              type="text"
              value={data.caption || ''}
              onChange={handleCaptionChange}
              placeholder="وصف الصورة (اختياري)"
              className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </>
      )}
    </div>
  );
} 