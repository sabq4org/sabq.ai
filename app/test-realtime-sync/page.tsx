'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync';
import toast, { Toaster } from 'react-hot-toast';

// تحميل المحرر ديناميكياً لتجنب مشاكل SSR
const RealtimeEditor = dynamic(
  () => import('@/components/ArticleEditor/RealtimeEditor'),
  { ssr: false }
);

export default function TestRealtimeSyncPage() {
  const [userId] = useState(() => {
    // توليد معرف مستخدم فريد لكل تبويب
    const stored = localStorage.getItem('testUserId');
    if (stored) return stored;
    
    const newId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('testUserId', newId);
    return newId;
  });
  
  const [userName] = useState(() => {
    const stored = localStorage.getItem('userName');
    if (stored) return stored;
    
    const names = ['أحمد', 'محمد', 'سارة', 'فاطمة', 'عبدالله', 'نورا'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    localStorage.setItem('userName', randomName);
    return randomName;
  });
  
  const [interactions, setInteractions] = useState({
    likes: 0,
    views: 0,
    shares: 0
  });
  
  // التزامن للتفاعلات
  const { broadcast: broadcastInteraction } = useLocalStorageSync({
    key: 'test-article-interactions',
    userId,
    onUpdate: (event) => {
      if (event.type === 'interaction-update') {
        setInteractions(event.data.interactions);
        toast(`${event.data.userName} ${getActionText(event.data.action)}`, {
          icon: getActionIcon(event.data.action)
        });
      }
    }
  });
  
  const handleInteraction = (action: 'like' | 'view' | 'share') => {
    const newInteractions = {
      ...interactions,
      [action === 'like' ? 'likes' : action === 'view' ? 'views' : 'shares']: 
        interactions[action === 'like' ? 'likes' : action === 'view' ? 'views' : 'shares'] + 1
    };
    
    setInteractions(newInteractions);
    
    broadcastInteraction('interaction-update', {
      interactions: newInteractions,
      action,
      userName
    });
  };
  
  const getActionText = (action: string) => {
    switch (action) {
      case 'like': return 'أعجب بالمقال';
      case 'view': return 'شاهد المقال';
      case 'share': return 'شارك المقال';
      default: return 'تفاعل مع المقال';
    }
  };
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'like': return '❤️';
      case 'view': return '👁️';
      case 'share': return '🔗';
      default: return '✨';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Toaster position="top-left" />
      
      <div className="max-w-4xl mx-auto">
        {/* رأس الصفحة */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            اختبار التزامن الفوري 🔄
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">معرف المستخدم</p>
              <p className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate">
                {userId}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">اسم المستخدم</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{userName}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">نوع المتصفح</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                 navigator.userAgent.includes('Safari') ? 'Safari' : 'آخر'}
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              💡 افتح هذه الصفحة في متصفحات متعددة (Chrome و Safari) أو في تبويبات مختلفة لترى التزامن الفوري
            </p>
          </div>
        </div>
        
        {/* التفاعلات */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            التفاعلات المتزامنة
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleInteraction('like')}
              className="group relative overflow-hidden bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl p-6 hover:scale-105 transition-transform"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-2">❤️</div>
                <div className="text-2xl font-bold">{interactions.likes}</div>
                <div className="text-sm opacity-90">إعجاب</div>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>
            
            <button
              onClick={() => handleInteraction('view')}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl p-6 hover:scale-105 transition-transform"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-2">👁️</div>
                <div className="text-2xl font-bold">{interactions.views}</div>
                <div className="text-sm opacity-90">مشاهدة</div>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>
            
            <button
              onClick={() => handleInteraction('share')}
              className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6 hover:scale-105 transition-transform"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-2">🔗</div>
                <div className="text-2xl font-bold">{interactions.shares}</div>
                <div className="text-sm opacity-90">مشاركة</div>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>
          </div>
        </div>
        
        {/* المحرر */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            محرر النصوص المتزامن
          </h2>
          
          <RealtimeEditor
            articleId="test-article-123"
            userId={userId}
            initialContent="<p>ابدأ الكتابة هنا وشاهد التحديثات تظهر في المتصفحات الأخرى فوراً! ✨</p>"
            onSave={async (content) => {
              // محاكاة حفظ في قاعدة البيانات
              console.log('Saving content:', content);
              await new Promise(resolve => setTimeout(resolve, 500));
            }}
          />
        </div>
        
        {/* تعليمات */}
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">
            📋 تعليمات الاختبار:
          </h3>
          <ol className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>1. افتح هذه الصفحة في Chrome</li>
            <li>2. افتح نفس الصفحة في Safari أو تبويب آخر</li>
            <li>3. ابدأ الكتابة في المحرر وشاهد التحديثات الفورية</li>
            <li>4. جرب الضغط على أزرار التفاعل وشاهد الأرقام تتحدث</li>
            <li>5. لاحظ الإشعارات التي تظهر عند كل تحديث</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 