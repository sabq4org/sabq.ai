'use client';

import { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Video, CheckCircle, Upload } from 'lucide-react';
import MediaGrid from './MediaGrid';
import MediaUpload from './MediaUpload';
import SmartSuggestions from './SmartSuggestions';

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
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: MediaFile[]) => void;
  allowMultiple?: boolean;
  articleTitle?: string;
  articleId?: string;
  mediaType?: 'image' | 'video' | 'all';
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelectMedia,
  allowMultiple = false,
  articleTitle,
  articleId,
  mediaType = 'all'
}: MediaLibraryModalProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);

  // تحميل الوسائط
  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (mediaType !== 'all') {
        params.append('media_type', mediaType);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/media?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMediaFiles(data.data);
        setFilteredMedia(data.data);
      }
    } catch (error) {
      console.error('فشل في تحميل الوسائط:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // البحث الذكي بناءً على عنوان المقال
  const performSmartSearch = async () => {
    if (!articleTitle) return;

    try {
      // محاكاة البحث الذكي
      const response = await fetch('/api/media/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          articleTitle,
          articleId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFilteredMedia(data.suggestions || []);
        setSmartSuggestions(data.keywords || []);
      }
    } catch (error) {
      console.error('فشل في البحث الذكي:', error);
      // fallback للبحث العادي
      loadMedia();
    }
  };

  // فلترة محلية
  const filterMedia = () => {
    let filtered = [...mediaFiles];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.title?.toLowerCase().includes(query) ||
        file.description?.toLowerCase().includes(query) ||
        file.original_name.toLowerCase().includes(query) ||
        file.tags.some(tag => tag.toLowerCase().includes(query)) ||
        file.ai_entities?.some(entity => entity.toLowerCase().includes(query))
      );
    }

    if (mediaType !== 'all') {
      filtered = filtered.filter(file => file.media_type === mediaType);
    }

    setFilteredMedia(filtered);
  };

  // تحديث البحث
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // اختيار وسائط
  const handleMediaSelection = (fileIds: string[]) => {
    if (allowMultiple) {
      setSelectedFiles(fileIds);
    } else {
      setSelectedFiles(fileIds.slice(-1)); // آخر عنصر فقط
    }
  };

  // تأكيد الاختيار
  const confirmSelection = () => {
    const selectedMedia = mediaFiles.filter(file => selectedFiles.includes(file.id));
    onSelectMedia(selectedMedia);
    onClose();
  };

  // إلغاء التحديد
  const clearSelection = () => {
    setSelectedFiles([]);
  };

  // التأثيرات
  useEffect(() => {
    if (isOpen) {
      if (articleTitle) {
        performSmartSearch();
      } else {
        loadMedia();
      }
    }
  }, [isOpen, articleTitle]);

  useEffect(() => {
    filterMedia();
  }, [searchQuery, mediaFiles, mediaType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              اختيار وسائط للمقال
            </h2>
            <p className="text-gray-600 mt-1">
              {articleTitle && (
                <>
                  المقال: {articleTitle.slice(0, 60)}
                  {articleTitle.length > 60 && '...'}
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* شريط البحث والفلاتر */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="البحث في الوسائط..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* فلتر نوع الوسائط */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                className={`px-3 py-2 text-sm rounded ${mediaType === 'all' ? 'bg-white shadow' : ''}`}
                onClick={() => loadMedia()}
              >
                الكل
              </button>
              <button
                className={`px-3 py-2 text-sm rounded flex items-center gap-1 ${mediaType === 'image' ? 'bg-white shadow' : ''}`}
              >
                <ImageIcon className="w-4 h-4" />
                صور
              </button>
              <button
                className={`px-3 py-2 text-sm rounded flex items-center gap-1 ${mediaType === 'video' ? 'bg-white shadow' : ''}`}
              >
                <Video className="w-4 h-4" />
                فيديو
              </button>
            </div>

            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Upload className="w-4 h-4" />
              رفع جديد
            </button>
          </div>

          {/* الاقتراحات الذكية */}
          {articleTitle && (
            <SmartSuggestions
              onSuggestionClick={handleSearchChange}
              currentSearch={searchQuery}
              articleTitle={articleTitle}
            />
          )}
        </div>

        {/* المحتوى الرئيسي */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">جارٍ تحميل الوسائط...</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              {/* رسالة البحث الذكي */}
              {articleTitle && smartSuggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">تم العثور على وسائط مقترحة</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    بناءً على تحليل عنوان المقال، هذه هي الوسائط الأكثر صلة
                  </p>
                </div>
              )}

              <MediaGrid
                files={filteredMedia}
                viewMode="grid"
                selectedFiles={selectedFiles}
                onSelectionChange={handleMediaSelection}
                onFileUpdate={loadMedia}
              />
            </div>
          )}
        </div>

        {/* شريط الحالة والإجراءات */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedFiles.length > 0 ? (
                <>تم تحديد {selectedFiles.length} ملف</>
              ) : (
                'لم يتم تحديد أي ملف'
              )}
            </span>
            
            {!allowMultiple && selectedFiles.length > 1 && (
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                سيتم اختيار آخر ملف محدد فقط
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedFiles.length > 0 && (
              <button
                onClick={clearSelection}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                إلغاء التحديد
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
            
            <button
              onClick={confirmSelection}
              disabled={selectedFiles.length === 0}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              تأكيد الاختيار ({selectedFiles.length})
            </button>
          </div>
        </div>
      </div>

      {/* نافذة رفع الملفات */}
      {showUpload && (
        <MediaUpload
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            loadMedia();
          }}
          articleId={articleId}
        />
      )}
    </div>
  );
}
