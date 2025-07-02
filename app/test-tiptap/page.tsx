'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const TiptapEditor = dynamic(() => import('@/components/Editor/TiptapEditor'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse bg-gray-200 h-64 rounded-xl flex items-center justify-center">
      <p className="text-gray-500">جاري تحميل المحرر...</p>
    </div>
  )
});

export default function TestTiptapPage() {
  const [content, setContent] = useState('');
  const [savedHtml, setSavedHtml] = useState('');
  const [savedJson, setSavedJson] = useState<any>(null);

  const handleChange = (html: string, json: any) => {
    setContent(html);
    setSavedHtml(html);
    setSavedJson(json);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">صفحة اختبار محرر TipTap</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">المحرر:</h2>
          <TiptapEditor 
            content={content}
            onChange={handleChange}
            placeholder="ابدأ الكتابة هنا... جرب الأزرار في شريط الأدوات!"
          />
        </div>

        {savedHtml && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">HTML المحفوظ:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {savedHtml}
            </pre>
          </div>
        )}

        {savedJson && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">JSON المحفوظ:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(savedJson, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 