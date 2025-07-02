'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  is_active: boolean;
}

export default function PreferencesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب الاهتمامات المحفوظة للمستخدم
  const fetchUserInterests = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const userId = user.id;
        
        if (userId) {
          // جلب التصنيفات المحفوظة من قاعدة البيانات
          const response = await fetch(`/api/user/saved-categories?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.categoryIds && data.categoryIds.length > 0) {
              setSelectedCategoryIds(data.categoryIds);
              console.log('تم تحميل الاهتمامات المحفوظة:', data.categoryIds, 'من:', data.source);
            } else {
              // إذا لم نجد في قاعدة البيانات، نحاول من localStorage
              if (user.interests && Array.isArray(user.interests)) {
                setSelectedCategoryIds(user.interests);
                console.log('تم تحميل الاهتمامات من localStorage:', user.interests);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل الاهتمامات:', error);
    }
  };

  // جلب التصنيفات من قاعدة البيانات
  const fetchCategories = async () => {
    setLoadingCategories(true);
    setError(null);
    
    try {
      const response = await fetch('/api/categories?sortBy=displayOrder');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // للتشخيص
      
      if (data.success && data.categories && Array.isArray(data.categories)) {
        const activeCategories = data.categories.filter((cat: any) => cat.is_active);
        setCategories(activeCategories);
        
        if (activeCategories.length === 0) {
          setError('لا توجد تصنيفات متاحة حالياً');
        }
      } else if (Array.isArray(data)) {
        // في حال كانت البيانات مصفوفة مباشرة
        const activeCategories = data.filter((cat: any) => cat.is_active || cat.isActive);
        setCategories(activeCategories);
      } else {
        throw new Error('صيغة البيانات غير صحيحة');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('حدث خطأ في تحميل التصنيفات. يرجى المحاولة مرة أخرى.');
      toast.error('فشل تحميل التصنيفات');
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    // تحميل التصنيفات والاهتمامات المحفوظة
    fetchCategories();
    fetchUserInterests();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async () => {
    if (selectedCategoryIds.length < 1) {
      toast.error('اختر اهتماماً واحداً على الأقل');
      return;
    }
    
    setLoading(true);
    
    try {
      // حفظ الاهتمامات في localStorage
      const userData = localStorage.getItem('user');
      let userId = 'guest-' + Date.now();
      
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id || userId;
      } else {
        // إنشاء مستخدم ضيف إذا لم يكن موجود
        const guestUser = {
          id: userId,
          name: 'ضيف',
          email: null,
          interests: selectedCategoryIds
        };
        localStorage.setItem('user', JSON.stringify(guestUser));
      }
      
      // حفظ في قاعدة البيانات عبر API
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          categoryIds: selectedCategoryIds,
          source: 'manual'
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشل حفظ التفضيلات');
      }
      
      // تحديث localStorage بالاهتمامات
      const currentUserData = localStorage.getItem('user');
      if (currentUserData) {
        const user = JSON.parse(currentUserData);
        user.interests = selectedCategoryIds;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      toast.success('تم حفظ اهتماماتك بنجاح! 🎉');
      
      // الانتقال للصفحة التالية بعد ثانية
      setTimeout(() => {
        router.push('/welcome/feed');
      }, 1000);
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('حدث خطأ في حفظ الاهتمامات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // حالة التحميل
  if (loadingCategories) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التصنيفات...</p>
        </div>
      </div>
    );
  }

  // حالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              تخطي
            </button>
            <button
              onClick={fetchCategories}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // حالة عدم وجود تصنيفات
  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">لا توجد تصنيفات متاحة</h2>
          <p className="text-gray-600 mb-6">نعمل على إضافة تصنيفات جديدة قريباً</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            المتابعة كزائر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="relative z-10 max-w-5xl mx-auto pt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg mb-6">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">مرحباً بك في رحلتك الذكية!</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            اختر التصنيفات التي تهمك لنقدم لك محتوى مخصصاً يناسب اهتماماتك
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-8 border">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">اختر اهتماماتك</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {categories.map((category) => {
              const isSelected = selectedCategoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    isSelected 
                      ? 'border-blue-500 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={isSelected ? { borderColor: category.color || '#3B82F6' } : {}}
                >
                  {isSelected && (
                    <div className="absolute inset-0 opacity-10 rounded-2xl" style={{ backgroundColor: category.color }}></div>
                  )}
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: category.color || '#3B82F6' }}>
                      <span className="text-3xl">{category.icon || '📁'}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{category.name || category.name_ar}</h3>
                    {category.description && (
                      <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2">{category.description}</p>
                    )}
                    
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-6 h-6" style={{ color: category.color || '#3B82F6' }} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center mb-6">
            <p className="text-sm text-gray-500">
              {selectedCategoryIds.length === 0 
                ? 'لم تختر أي تصنيف بعد' 
                : `اخترت ${selectedCategoryIds.length} من ${categories.length} تصنيف`}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              تخطي الآن
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={selectedCategoryIds.length === 0 || loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جارٍ الحفظ...
                </>
              ) : (
                `حفظ الاهتمامات (${selectedCategoryIds.length})`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 