'use client';

import { useState } from 'react';
import { 
  Image as ImageIcon, Play, FileText, Download, 
  Trash2, Eye, Tag,
  Star, Copy
} from 'lucide-react';

interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  media_type: 'image' | 'video' | 'audio' | 'document';
  width?: number;
  height?: number;
  duration?: number;
  title?: string;
  description?: string;
  alt_text?: string;
  caption?: string;
  credit?: string;
  tags: string[];
  classification?: string;
  source_type?: string;
  uploaded_by: string;
  article_ids?: string[];
  usage_count: number;
  ai_entities?: string[];
  ai_analysis?: any;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

interface MediaGridProps {
  files: MediaFile[];
  viewMode: 'grid' | 'list';
  selectedFiles: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onFileUpdate: () => void;
}

export default function MediaGrid({ 
  files, 
  viewMode, 
  selectedFiles, 
  onSelectionChange, 
  onFileUpdate 
}: MediaGridProps) {
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  // تبديل تحديد ملف
  const toggleFileSelection = (fileId: string) => {
    if (selectedFiles.includes(fileId)) {
      onSelectionChange(selectedFiles.filter(id => id !== fileId));
    } else {
      onSelectionChange([...selectedFiles, fileId]);
    }
  };

  // تحديد جميع الملفات
  const selectAllFiles = () => {
    if (selectedFiles.length === files.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(files.map(f => f.id));
    }
  };

  // تنسيق حجم الملف
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // الحصول على أيقونة نوع الملف
  const getFileIcon = (file: MediaFile) => {
    switch (file.media_type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
        return <Play className="w-5 h-5" />;
      case 'audio':
        return <Play className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // الحصول على معاينة الملف
  const getFilePreview = (file: MediaFile) => {
    if (file.media_type === 'image') {
      return (
        <img
          src={file.file_url}
          alt={file.alt_text || file.title || file.original_name}
          className="w-full h-full object-cover"
        />
      );
    } else if (file.media_type === 'video') {
      return (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
          <Play className="w-12 h-12 text-white opacity-80" />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {file.duration ? `${Math.floor(file.duration / 60)}:${(file.duration % 60).toString().padStart(2, '0')}` : 'فيديو'}
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          {getFileIcon(file)}
        </div>
      );
    }
  };

  // حذف ملف
  const deleteFile = async (fileId: string) => {
    if (confirm('هل تريد حذف هذا الملف؟')) {
      try {
        const response = await fetch('/api/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [fileId] })
        });

        if (response.ok) {
          onFileUpdate();
        }
      } catch (error) {
        console.error('فشل في حذف الملف:', error);
      }
    }
  };

  // نسخ رابط الملف
  const copyFileUrl = (file: MediaFile) => {
    navigator.clipboard.writeText(file.file_url);
    // يمكن إضافة toast notification هنا
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد ملفات</h3>
        <p className="text-gray-600">لم يتم العثور على ملفات تطابق معايير البحث</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden" dir="rtl">
        {/* رأس الجدول */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedFiles.length === files.length}
              onChange={selectAllFiles}
              className="ml-4"
            />
            <div className="grid grid-cols-12 gap-4 flex-1 text-sm font-medium text-gray-700">
              <div className="col-span-4">الملف</div>
              <div className="col-span-2">النوع</div>
              <div className="col-span-2">الحجم</div>
              <div className="col-span-2">آخر استخدام</div>
              <div className="col-span-1">الاستخدام</div>
              <div className="col-span-1">الإجراءات</div>
            </div>
          </div>
        </div>

        {/* صفوف الجدول */}
        <div className="divide-y divide-gray-200">
          {files.map((file) => (
            <div
              key={file.id}
              className={`px-6 py-4 hover:bg-gray-50 ${selectedFiles.includes(file.id) ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                  className="ml-4"
                />
                
                <div className="grid grid-cols-12 gap-4 flex-1 items-center">
                  {/* معلومات الملف */}
                  <div className="col-span-4 flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden ml-3 flex-shrink-0">
                      {getFilePreview(file)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 truncate">
                        {file.title || file.original_name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {file.description}
                      </div>
                      {file.tags.length > 0 && (
                        <div className="flex items-center mt-1">
                          <Tag className="w-3 h-3 text-gray-400 ml-1" />
                          <span className="text-xs text-gray-500">
                            {file.tags.slice(0, 2).join(', ')}
                            {file.tags.length > 2 && '...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* النوع */}
                  <div className="col-span-2">
                    <div className="flex items-center text-sm text-gray-600">
                      {getFileIcon(file)}
                      <span className="mr-2">{file.media_type}</span>
                    </div>
                  </div>

                  {/* الحجم */}
                  <div className="col-span-2 text-sm text-gray-600">
                    {formatFileSize(file.file_size)}
                  </div>

                  {/* آخر استخدام */}
                  <div className="col-span-2 text-sm text-gray-600">
                    {file.last_used_at ? formatDate(file.last_used_at) : 'لم يُستخدم'}
                  </div>

                  {/* عدد مرات الاستخدام */}
                  <div className="col-span-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      file.usage_count > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {file.usage_count}
                    </span>
                  </div>

                  {/* الإجراءات */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="معاينة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyFileUrl(file)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="نسخ الرابط"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // عرض الشبكة
  return (
    <div dir="rtl">
      {/* خيارات سريعة */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={selectedFiles.length === files.length}
              onChange={selectAllFiles}
              className="ml-2"
            />
            تحديد الكل ({files.length})
          </label>
          {selectedFiles.length > 0 && (
            <span className="text-sm text-blue-600">
              تم تحديد {selectedFiles.length} ملف
            </span>
          )}
        </div>
      </div>

      {/* شبكة الملفات */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className={`relative bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-lg group ${
              selectedFiles.includes(file.id) 
                ? 'border-blue-500 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onMouseEnter={() => setHoveredFile(file.id)}
            onMouseLeave={() => setHoveredFile(null)}
          >
            {/* Checkbox */}
            <div className="absolute top-2 right-2 z-10">
              <input
                type="checkbox"
                checked={selectedFiles.includes(file.id)}
                onChange={() => toggleFileSelection(file.id)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            {/* معاينة الملف */}
            <div className="aspect-square rounded-t-lg overflow-hidden bg-gray-100">
              {getFilePreview(file)}
            </div>

            {/* معلومات الملف */}
            <div className="p-3">
              <div className="font-medium text-gray-900 text-sm truncate mb-1">
                {file.title || file.original_name}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{formatFileSize(file.file_size)}</span>
                <span>{formatDate(file.created_at)}</span>
              </div>

              {/* الوسوم */}
              {file.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {file.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {file.tags.length > 2 && (
                    <span className="text-xs text-gray-400">+{file.tags.length - 2}</span>
                  )}
                </div>
              )}

              {/* المعلومات الإضافية */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {file.usage_count > 0 && (
                    <span className="flex items-center text-xs text-green-600">
                      <Eye className="w-3 h-3 ml-1" />
                      {file.usage_count}
                    </span>
                  )}
                  {file.ai_entities && file.ai_entities.length > 0 && (
                    <span className="flex items-center text-xs text-purple-600" title="تم تحليله بالذكاء الاصطناعي">
                      <Star className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* قائمة الإجراءات */}
                {hoveredFile === file.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="معاينة"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => copyFileUrl(file)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="نسخ الرابط"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="حذف"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة المعاينة */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">
                {previewFile.title || previewFile.original_name}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              {previewFile.media_type === 'image' ? (
                <img
                  src={previewFile.file_url}
                  alt={previewFile.alt_text || previewFile.title}
                  className="max-w-full max-h-96 mx-auto"
                />
              ) : previewFile.media_type === 'video' ? (
                <video
                  src={previewFile.file_url}
                  controls
                  className="max-w-full max-h-96 mx-auto"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">معاينة غير متاحة لهذا النوع من الملفات</p>
                  <a
                    href={previewFile.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Download className="w-4 h-4" />
                    تحميل الملف
                  </a>
                </div>
              )}
              
              {/* معلومات تفصيلية */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">الحجم:</span>
                  <span className="mr-2">{formatFileSize(previewFile.file_size)}</span>
                </div>
                <div>
                  <span className="text-gray-600">النوع:</span>
                  <span className="mr-2">{previewFile.mime_type}</span>
                </div>
                {previewFile.width && previewFile.height && (
                  <div>
                    <span className="text-gray-600">الأبعاد:</span>
                    <span className="mr-2">{previewFile.width}×{previewFile.height}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">تاريخ الرفع:</span>
                  <span className="mr-2">{formatDate(previewFile.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 