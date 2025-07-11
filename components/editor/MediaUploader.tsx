"use client";

import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Image, Video, Music, File, AlertCircle } from 'lucide-react';

interface MediaUploaderProps {
  type: 'image' | 'video' | 'audio' | 'document';
  onUploaded: (mediaData: any) => void;
  onClose: () => void;
  maxSize?: number; // بالبايت
  allowedTypes?: string[];
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function MediaUploader({
  type,
  onUploaded,
  onClose,
  maxSize = 10 * 1024 * 1024, // 10MB افتراضي
  allowedTypes = []
}: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // أنواع الملفات المسموحة حسب النوع
  const typeConfig = {
    image: {
      accept: 'image/*',
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      icon: Image
    },
    video: {
      accept: 'video/*',
      types: ['video/mp4', 'video/webm', 'video/ogg'],
      maxSize: 100 * 1024 * 1024, // 100MB
      icon: Video
    },
    audio: {
      accept: 'audio/*',
      types: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
      maxSize: 50 * 1024 * 1024, // 50MB
      icon: Music
    },
    document: {
      accept: '.pdf,.doc,.docx',
      types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      maxSize: 10 * 1024 * 1024, // 10MB
      icon: File
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  // التحقق من صحة الملف
  const validateFile = (file: File): string | null => {
    // التحقق من النوع
    const allowedMimeTypes = allowedTypes.length > 0 ? allowedTypes : config.types;
    if (!allowedMimeTypes.includes(file.type)) {
      return `نوع الملف غير مدعوم. الأنواع المسموحة: ${allowedMimeTypes.join(', ')}`;
    }

    // التحقق من الحجم
    const maxFileSize = maxSize || config.maxSize;
    if (file.size > maxFileSize) {
      return `حجم الملف كبير جداً. الحد الأقصى: ${formatFileSize(maxFileSize)}`;
    }

    return null;
  };

  // تنسيق حجم الملف
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // إنشاء معاينة للملف
  const createPreview = useCallback((file: File) => {
    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (type === 'video') {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  }, [type]);

  // التعامل مع اختيار الملف
  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    createPreview(selectedFile);
  };

  // التعامل مع السحب والإفلات
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  // رفع الملف
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt_text', altText);
      formData.append('caption', caption);
      formData.append('is_public', isPublic.toString());

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في رفع الملف');
      }

      const data = await response.json();
      onUploaded({
        ...data.data.file,
        type: type,
        alt_text: altText,
        caption: caption
      });

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  // إزالة الملف
  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setAltText('');
    setCaption('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Icon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">
              رفع {type === 'image' ? 'صورة' : 
                   type === 'video' ? 'فيديو' : 
                   type === 'audio' ? 'ملف صوتي' : 'مستند'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="p-6">
          {!file ? (
            /* منطقة اختيار الملف */
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                اسحب الملف هنا أو انقر للاختيار
              </p>
              <p className="text-sm text-gray-500 mb-4">
                الحد الأقصى: {formatFileSize(config.maxSize)}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4 inline ml-2" />
                اختر ملف
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={config.accept}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            /* معاينة الملف المحدد */
            <div className="space-y-4">
              {/* معاينة الملف */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700">معاينة الملف</h3>
                  <button
                    onClick={handleRemoveFile}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {preview && type === 'image' && (
                  <img
                    src={preview}
                    alt="معاينة"
                    className="max-w-full max-h-64 object-contain rounded-lg mx-auto"
                  />
                )}
                
                {preview && type === 'video' && (
                  <video
                    src={preview}
                    controls
                    className="max-w-full max-h-64 rounded-lg mx-auto"
                  />
                )}
                
                <div className="mt-3 text-sm text-gray-600">
                  <p>الاسم: {file.name}</p>
                  <p>الحجم: {formatFileSize(file.size)}</p>
                  <p>النوع: {file.type}</p>
                </div>
              </div>

              {/* معلومات إضافية */}
              <div className="space-y-4">
                {type === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      النص البديل (Alt Text)
                    </label>
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="وصف مختصر للصورة"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التعليق (اختياري)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="تعليق أو وصف للملف"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mr-2 rtl:ml-2"
                  />
                  <label htmlFor="is_public" className="text-sm text-gray-700">
                    جعل الملف عام (يمكن الوصول إليه من الرابط المباشر)
                  </label>
                </div>
              </div>

              {/* شريط التقدم */}
              {progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>جاري الرفع...</span>
                    <span>{progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* رسائل الخطأ */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 rtl:space-x-reverse">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* أزرار التحكم */}
        <div className="flex justify-end space-x-3 rtl:space-x-reverse p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'جاري الرفع...' : 'رفع الملف'}
          </button>
        </div>
      </div>
    </div>
  );
} 