'use client';

import React, { useState } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import FeaturedImageUpload from '@/components/FeaturedImageUpload';

export default function TestImageUploadPage() {
  const [uploadedImage1, setUploadedImage1] = useState('');
  const [uploadedImage2, setUploadedImage2] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

  const testDirectUpload = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'featured');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        
        setTestResults(prev => [...prev, {
          test: 'Direct API Upload',
          success: result.success,
          data: result,
          timestamp: new Date().toLocaleTimeString()
        }]);

        if (result.success) {
          setUploadedImage2(result.data.url);
        }
      } catch (error) {
        setTestResults(prev => [...prev, {
          test: 'Direct API Upload',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    };

    fileInput.click();
  };

  const clearTests = () => {
    setTestResults([]);
    setUploadedImage1('');
    setUploadedImage2('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Upload className="w-8 h-8 text-blue-600" />
            اختبار رفع الصور
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* اختبار مكون FeaturedImageUpload */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                مكون FeaturedImageUpload
              </h2>
              <FeaturedImageUpload
                value={uploadedImage1}
                onChange={setUploadedImage1}
                darkMode={false}
              />
              {uploadedImage1 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">
                    <strong>رابط الصورة:</strong> {uploadedImage1}
                  </p>
                </div>
              )}
            </div>

            {/* اختبار مباشر لـ API */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                اختبار API مباشر
              </h2>
              <button
                onClick={testDirectUpload}
                className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                اختبار رفع مباشر
              </button>
              {uploadedImage2 && (
                <div className="space-y-2">
                  <img 
                    src={uploadedImage2} 
                    alt="صورة مرفوعة" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">
                      <strong>رابط الصورة:</strong> {uploadedImage2}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* نتائج الاختبارات */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">نتائج الاختبارات</h2>
              <button
                onClick={clearTests}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                مسح النتائج
              </button>
            </div>
            
            <div className="space-y-3">
              {testResults.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                  لا توجد نتائج اختبار بعد
                </div>
              ) : (
                testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        {result.test} - {result.timestamp}
                      </span>
                    </div>
                    
                    <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                      {JSON.stringify(result.success ? result.data : result.error, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">معلومات مهمة</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• يتم حفظ الصور في مجلد <code>public/uploads/featured/</code></li>
                  <li>• الحد الأقصى لحجم الصورة: 5MB</li>
                  <li>• الأنواع المدعومة: JPG, PNG, GIF, WebP, AVIF, SVG</li>
                  <li>• الخادم يعمل على المنفذ: 3004</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 