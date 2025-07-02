'use client';

import React, { useState, useEffect } from 'react';
import { Eye, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function TestHeaderPage() {
  const [headerTemplate, setHeaderTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoCount, setLogoCount] = useState(0);

  useEffect(() => {
    fetchHeaderTemplate();
    
    // فحص عدد اللوقوهات في الصفحة كل ثانية
    const interval = setInterval(() => {
      checkLogoCount();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchHeaderTemplate = async () => {
    try {
      const response = await fetch('/api/templates/active-header');
      if (response.ok) {
        const template = await response.json();
        setHeaderTemplate(template);
      }
    } catch (error) {
      console.error('Error fetching header template:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLogoCount = () => {
    // فحص عدد الصور في الهيدر
    const header = document.querySelector('header');
    if (header) {
      const logoImages = header.querySelectorAll('img');
      const logoElements = header.querySelectorAll('[alt*="سبق"], [alt*="شعار"], [alt*="logo"]');
      const sabqElements = header.querySelectorAll('*:contains("سبق")');
      
      setLogoCount(logoImages.length + sabqElements.length);
    }
  };

  const getLogoUrl = () => {
    if (!headerTemplate) return null;
    
    if (headerTemplate.logo_url) {
      return headerTemplate.logo_url;
    }
    
    if (headerTemplate.content?.logo?.url && !headerTemplate.logo_url) {
      return headerTemplate.content.logo.url;
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Eye className="w-8 h-8 text-blue-600" />
            اختبار الهيدر واللوقو
          </h1>

          {/* حالة اللوقو */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* معلومات القالب */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">معلومات القالب النشط</h2>
              
              {loading ? (
                <div className="p-4 bg-gray-100 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              ) : headerTemplate ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="space-y-2 text-sm">
                    <div><strong>اسم القالب:</strong> {headerTemplate.name}</div>
                    <div><strong>نشط:</strong> {headerTemplate.is_active ? '✅ نعم' : '❌ لا'}</div>
                    <div><strong>logo_url:</strong> {headerTemplate.logo_url || 'غير محدد'}</div>
                    <div><strong>content.logo.url:</strong> {headerTemplate.content?.logo?.url || 'غير محدد'}</div>
                    <div><strong>الرابط المستخدم:</strong> {getLogoUrl() || 'لا يوجد'}</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-700">❌ فشل تحميل القالب</p>
                </div>
              )}
            </div>

            {/* فحص اللوقو */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">فحص اللوقو في الهيدر</h2>
              
              <div className={`p-4 rounded-lg border ${
                logoCount <= 1 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {logoCount <= 1 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {logoCount <= 1 ? 'اللوقو يظهر بشكل صحيح' : 'مشكلة: لوقو مكرر!'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  عدد عناصر اللوقو المكتشفة: <strong>{logoCount}</strong>
                </div>
              </div>

              <button
                onClick={checkLogoCount}
                className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة فحص
              </button>
            </div>
          </div>

          {/* معاينة اللوقو */}
          {getLogoUrl() && (
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-4">معاينة الشعار المستخدم</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={getLogoUrl()!} 
                  alt="معاينة الشعار"
                  className="max-h-16 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50"%3E%3Crect width="100" height="50" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="12"%3EError%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="text-sm text-blue-800">
                  <div><strong>الرابط:</strong> {getLogoUrl()}</div>
                  <div><strong>النص البديل:</strong> {headerTemplate?.logo_alt || 'غير محدد'}</div>
                </div>
              </div>
            </div>
          )}

          {/* نصائح الإصلاح */}
          <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-3">نصائح الإصلاح</h3>
            <ul className="text-sm text-yellow-800 space-y-2">
              <li>• تأكد من وجود لوقو واحد فقط في القالب النشط</li>
              <li>• تجنب تكرار logo_url و content.logo.url</li>
              <li>• استخدم صفحة إدارة القوالب لتحديث الشعار</li>
              <li>• احذف القوالب غير المستخدمة لتجنب التداخل</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 