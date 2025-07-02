'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  Upload, X, Video, FileText, 
  AlertCircle, CheckCircle, Brain
} from 'lucide-react';

interface MediaUploadProps {
  onClose: () => void;
  onSuccess: () => void;
  articleId?: string; // ربط بمقال محدد
}

interface UploadFile {
  file: File;
  id: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  metadata: {
    title: string;
    description: string;
    alt_text: string;
    tags: string[];
    classification: string;
    source_type: string;
    credit: string;
  };
}

export default function MediaUpload({ onClose, onSuccess, articleId }: MediaUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState<string[]>([]);

  // قائمة التصنيفات المتاحة
  const classifications = [
    'شخصيات', 'مباني', 'فعاليات', 'شعارات', 'طبيعة',
    'نقل ومواصلات', 'تقنية', 'رياضة', 'ثقافة', 'أخرى'
  ];

  // قائمة مصادر الصور
  const sourcesTypes = [
    'داخلي', 'وكالة أنباء', 'موقع رسمي', 'شبكات اجتماعية', 
    'مصور متعاون', 'أرشيف', 'مصدر خارجي'
  ];

  // إنشاء معاينة للملف
  const createFilePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
    });
  }, []);

  // إضافة ملفات للرفع
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `file-${Date.now()}-${i}`;
      const preview = await createFilePreview(file);
      
      newFiles.push({
        file,
        id,
        preview,
        progress: 0,
        status: 'pending',
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''), // اسم بدون امتداد
          description: '',
          alt_text: '',
          tags: [],
          classification: '',
          source_type: 'داخلي',
          credit: ''
        }
      });
    }
    
    setUploadFiles(prev => [...prev, ...newFiles]);
    
    // تحليل AI تلقائي للصور
    for (const uploadFile of newFiles) {
      if (uploadFile.file.type.startsWith('image/')) {
        analyzeImageWithAI(uploadFile.id);
      }
    }
  }, [createFilePreview]);

  // تحليل الصورة بالذكاء الاصطناعي
  const analyzeImageWithAI = async (fileId: string) => {
    setAiAnalyzing(prev => [...prev, fileId]);
    
    try {
      // محاكاة تحليل AI
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // نتائج وهمية للتحليل
      const aiResults = {
        entities: ['الملك سلمان', 'الرياض', 'القصر الملكي'],
        classification: 'شخصيات',
        suggestedTags: ['ملكي', 'رسمي', 'قيادة'],
        suggestedAltText: 'صورة رسمية لخادم الحرمين الشريفين',
        suggestedDescription: 'صورة رسمية من القصر الملكي'
      };
      
      setUploadFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          return {
            ...file,
            metadata: {
              ...file.metadata,
              classification: aiResults.classification,
              tags: aiResults.suggestedTags,
              alt_text: aiResults.suggestedAltText,
              description: aiResults.suggestedDescription
            }
          };
        }
        return file;
      }));
      
    } catch (error) {
      console.error('فشل في تحليل الصورة:', error);
    } finally {
      setAiAnalyzing(prev => prev.filter(id => id !== fileId));
    }
  };

  // تحديث metadata للملف
  const updateFileMetadata = (fileId: string, metadata: Partial<UploadFile['metadata']>) => {
    setUploadFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        return {
          ...file,
          metadata: { ...file.metadata, ...metadata }
        };
      }
      return file;
    }));
  };

  // حذف ملف من القائمة
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // رفع الملفات
  const handleUploadFiles = async () => {
    setIsUploading(true);
    
    for (const uploadFile of uploadFiles) {
      if (uploadFile.status !== 'pending') continue;
      
      try {
        // تحديث حالة الرفع
        setUploadFiles(prev => prev.map(file => 
          file.id === uploadFile.id 
            ? { ...file, status: 'uploading', progress: 0 }
            : file
        ));

        // محاكاة تقدم الرفع
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadFiles(prev => prev.map(file => 
            file.id === uploadFile.id 
              ? { ...file, progress }
              : file
          ));
        }

        // إنشاء FormData للرفع
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append('title', uploadFile.metadata.title);
        formData.append('description', uploadFile.metadata.description);
        formData.append('alt_text', uploadFile.metadata.alt_text);
        formData.append('tags', JSON.stringify(uploadFile.metadata.tags));
        formData.append('classification', uploadFile.metadata.classification);
        formData.append('source_type', uploadFile.metadata.source_type);
        formData.append('credit', uploadFile.metadata.credit);
        
        if (articleId) {
          formData.append('article_id', articleId);
        }

        // رفع الملف (محاكاة)
        const response = await fetch('/api/media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: uploadFile.file.name,
            mime_type: uploadFile.file.type,
            file_size: uploadFile.file.size,
            title: uploadFile.metadata.title,
            description: uploadFile.metadata.description,
            alt_text: uploadFile.metadata.alt_text,
            tags: uploadFile.metadata.tags,
            classification: uploadFile.metadata.classification,
            source_type: uploadFile.metadata.source_type,
            credit: uploadFile.metadata.credit
          })
        });

        if (response.ok) {
          setUploadFiles(prev => prev.map(file => 
            file.id === uploadFile.id 
              ? { ...file, status: 'success', progress: 100 }
              : file
          ));
        } else {
          throw new Error('فشل في رفع الملف');
        }
        
      } catch (error) {
        setUploadFiles(prev => prev.map(file => 
          file.id === uploadFile.id 
            ? { 
                ...file, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'خطأ غير معروف'
              }
            : file
        ));
      }
    }
    
    setIsUploading(false);
    
    // إغلاق النافذة وتحديث القائمة
    if (uploadFiles.every(file => file.status === 'success')) {
      onSuccess();
      onClose();
    }
  };

  // معالجة السحب والإفلات
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  // معالجة اختيار الملفات
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">رفع ملفات وسائط جديدة</h2>
            <p className="text-gray-600 mt-1">اسحب وأفلت الملفات أو اختر من جهازك</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* منطقة السحب والإفلات */}
          {uploadFiles.length === 0 && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                اسحب وأفلت ملفاتك هنا
              </h3>
              <p className="text-gray-600 mb-4">
                أو انقر لاختيار الملفات من جهازك
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                اختيار ملفات
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-4">
                الأنواع المدعومة: JPEG, PNG, MP4, PDF, Word
              </p>
            </div>
          )}

          {/* قائمة الملفات */}
          {uploadFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  الملفات المحددة ({uploadFiles.length})
                </h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  إضافة المزيد
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* معاينة الملف */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {uploadFile.preview ? (
                        <img 
                          src={uploadFile.preview} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : uploadFile.file.type.startsWith('video/') ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-gray-400" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* معلومات الملف */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {uploadFile.file.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          {aiAnalyzing.includes(uploadFile.id) && (
                            <div className="flex items-center text-purple-600 text-xs">
                              <Brain className="w-4 h-4 ml-1 animate-pulse" />
                              تحليل AI...
                            </div>
                          )}
                          {uploadFile.status === 'success' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {uploadFile.status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <button
                            onClick={() => removeFile(uploadFile.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* شريط التقدم */}
                      {uploadFile.status === 'uploading' && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadFile.progress}%` }}
                          ></div>
                        </div>
                      )}

                      {/* رسالة الخطأ */}
                      {uploadFile.status === 'error' && (
                        <div className="text-red-600 text-sm mb-3">
                          {uploadFile.error}
                        </div>
                      )}

                      {/* الحقول */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            العنوان
                          </label>
                          <input
                            type="text"
                            value={uploadFile.metadata.title}
                            onChange={(e) => updateFileMetadata(uploadFile.id, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            التصنيف
                          </label>
                          <select
                            value={uploadFile.metadata.classification}
                            onChange={(e) => updateFileMetadata(uploadFile.id, { classification: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">اختر التصنيف</option>
                            {classifications.map(classification => (
                              <option key={classification} value={classification}>
                                {classification}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            الوصف
                          </label>
                          <textarea
                            value={uploadFile.metadata.description}
                            onChange={(e) => updateFileMetadata(uploadFile.id, { description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            المصدر
                          </label>
                          <select
                            value={uploadFile.metadata.source_type}
                            onChange={(e) => updateFileMetadata(uploadFile.id, { source_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {sourcesTypes.map(source => (
                              <option key={source} value={source}>
                                {source}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            الائتمان/المصور
                          </label>
                          <input
                            type="text"
                            value={uploadFile.metadata.credit}
                            onChange={(e) => updateFileMetadata(uploadFile.id, { credit: e.target.value })}
                            placeholder="اسم المصور أو المصدر"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* أزرار الإجراءات */}
        {uploadFiles.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {uploadFiles.filter(f => f.status === 'success').length} من {uploadFiles.length} تم رفعها
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isUploading}
              >
                إلغاء
              </button>
                             <button
                 onClick={handleUploadFiles}
                 disabled={isUploading || uploadFiles.every(f => f.status === 'success')}
                 className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                {isUploading ? 'جاري الرفع...' : 'رفع الملفات'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
