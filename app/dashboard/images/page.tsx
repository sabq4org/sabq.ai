'use client';

import React, { useState, useEffect } from 'react';
import { 
  Image, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Upload, 
  Trash2,
  Eye,
  Download,
  Settings,
  FileImage
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface ImageIssue {
  id: string;
  title: string;
  featuredImage: {
    original: string | null;
    exists: boolean;
    fixed: boolean;
    newUrl: string | null;
  };
  socialImage: {
    original: string | null;
    exists: boolean;
    fixed: boolean;
    newUrl: string | null;
  };
}

interface FixSummary {
  totalArticles: number;
  articlesWithMissingImages: number;
  fixedImages: number;
  results: ImageIssue[];
}

export default function ImagesManagementPage() {
  const { darkMode } = useDarkModeContext();
  const [issues, setIssues] = useState<ImageIssue[]>([]);
  const [summary, setSummary] = useState<FixSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // فحص الصور المفقودة
  const scanForMissingImages = async () => {
    try {
      setScanning(true);
      const response = await fetch('/api/articles/fix-images');
      const data = await response.json();
      
      if (data.success) {
        setIssues(data.data);
        setSummary(data.summary);
      } else {
        console.error('فشل في فحص الصور:', data.error);
      }
    } catch (error) {
      console.error('خطأ في فحص الصور:', error);
    } finally {
      setScanning(false);
    }
  };

  // تحديث صورة مقال
  const updateArticleImage = async (articleId: string, imageType: 'featured' | 'social', newUrl: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/articles/fix-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          imageType,
          newImageUrl: newUrl
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // تحديث القائمة المحلية
        setIssues(prev => prev.map(issue => 
          issue.id === articleId 
            ? {
                ...issue,
                [imageType === 'featured' ? 'featuredImage' : 'socialImage']: {
                  ...issue[imageType === 'featured' ? 'featuredImage' : 'socialImage'],
                  original: newUrl,
                  exists: true,
                  fixed: false,
                  newUrl: null
                }
              }
            : issue
        ));
        
        // إعادة فحص الصور
        await scanForMissingImages();
      } else {
        console.error('فشل في تحديث الصورة:', data.error);
      }
    } catch (error) {
      console.error('خطأ في تحديث الصورة:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanForMissingImages();
  }, []);

  const getStatusIcon = (exists: boolean, fixed: boolean) => {
    if (fixed) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (exists) return <CheckCircle className="w-5 h-5 text-blue-500" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = (exists: boolean, fixed: boolean) => {
    if (fixed) return 'تم الإصلاح';
    if (exists) return 'موجودة';
    return 'مفقودة';
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Image className="w-8 h-8" />
                إدارة الصور
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                فحص وإصلاح الصور المفقودة في المقالات
              </p>
            </div>
            
            <button
              onClick={scanForMissingImages}
              disabled={scanning}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                scanning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'جاري الفحص...' : 'فحص الصور'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-lg border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    إجمالي المقالات
                  </p>
                  <p className="text-2xl font-bold">{summary.totalArticles}</p>
                </div>
                <FileImage className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className={`p-6 rounded-lg border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    مقالات بصور مفقودة
                  </p>
                  <p className="text-2xl font-bold text-red-500">{summary.articlesWithMissingImages}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className={`p-6 rounded-lg border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    صور تم إصلاحها
                  </p>
                  <p className="text-2xl font-bold text-green-500">{summary.fixedImages}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className={`rounded-lg border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">المقالات مع مشاكل الصور</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {issues.map((issue) => (
              <div key={issue.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{issue.title}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Featured Image */}
                      <div className={`p-4 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">صورة المقال الرئيسية</h4>
                          {getStatusIcon(issue.featuredImage.exists, issue.featuredImage.fixed)}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-sm px-2 py-1 rounded ${
                            issue.featuredImage.exists 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {getStatusText(issue.featuredImage.exists, issue.featuredImage.fixed)}
                          </span>
                        </div>

                        {issue.featuredImage.original && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.open(issue.featuredImage.original!, '_blank')}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4" />
                              عرض الصورة
                            </button>
                          </div>
                        )}

                        {!issue.featuredImage.exists && (
                          <button
                            onClick={() => updateArticleImage(issue.id, 'featured', 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80')}
                            disabled={loading}
                            className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Upload className="w-4 h-4" />
                            استخدام صورة افتراضية
                          </button>
                        )}
                      </div>

                      {/* Social Image */}
                      <div className={`p-4 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">صورة التواصل الاجتماعي</h4>
                          {getStatusIcon(issue.socialImage.exists, issue.socialImage.fixed)}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-sm px-2 py-1 rounded ${
                            issue.socialImage.exists 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {getStatusText(issue.socialImage.exists, issue.socialImage.fixed)}
                          </span>
                        </div>

                        {issue.socialImage.original && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.open(issue.socialImage.original!, '_blank')}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4" />
                              عرض الصورة
                            </button>
                          </div>
                        )}

                        {!issue.socialImage.exists && (
                          <button
                            onClick={() => updateArticleImage(issue.id, 'social', 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80')}
                            disabled={loading}
                            className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Upload className="w-4 h-4" />
                            استخدام صورة افتراضية
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {issues.length === 0 && (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد مشاكل في الصور</h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                جميع الصور في المقالات تعمل بشكل صحيح
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 