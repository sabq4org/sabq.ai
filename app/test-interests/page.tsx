'use client';

import { useState, useEffect } from 'react';
import { Heart, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestInterestsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userInterests, setUserInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // جلب التصنيفات
    fetchCategories();
    
    // جلب معرف المستخدم من localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user.id);
      fetchUserInterests(user.id);
    } else {
      setUserId('test-user-' + Date.now());
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?sortBy=displayOrder');
      const data = await response.json();
      if (data.success && data.categories) {
        setCategories(data.categories.slice(0, 6)); // أول 6 تصنيفات
      }
    } catch (error) {
      console.error('خطأ في جلب التصنيفات:', error);
    }
  };

  const fetchUserInterests = async (uid: string) => {
    try {
      const response = await fetch(`/api/user/interests?userId=${uid}`);
      const data = await response.json();
      if (data.success) {
        setUserInterests(data.preferences || []);
        setSelectedIds(data.categoryIds || []);
      }
    } catch (error) {
      console.error('خطأ في جلب الاهتمامات:', error);
    }
  };

  const handleToggle = (categoryId: string) => {
    setSelectedIds(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      alert('اختر تصنيفاً واحداً على الأقل');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          categoryIds: selectedIds,
          source: 'manual'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('تم حفظ الاهتمامات بنجاح! 🎉');
        
        // تحديث localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          user.interests = selectedIds;
          user.preferences = selectedIds;
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.setItem('user', JSON.stringify({
            id: userId,
            name: 'مستخدم تجريبي',
            email: 'test@example.com',
            interests: selectedIds,
            preferences: selectedIds
          }));
        }
        
        // إعادة جلب الاهتمامات
        fetchUserInterests(userId);
      } else {
        alert('خطأ: ' + data.error);
      }
    } catch (error) {
      console.error('خطأ في حفظ الاهتمامات:', error);
      alert('حدث خطأ في حفظ الاهتمامات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            اختبار نظام الاهتمامات
          </h1>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">معرف المستخدم: <code className="bg-gray-100 px-2 py-1 rounded">{userId}</code></p>
            <p className="text-gray-600">الاهتمامات المحفوظة: {userInterests.length}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {categories.map((category) => {
              const isSelected = selectedIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => handleToggle(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon || '📁'}</span>
                      <div className="text-right">
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <p className="text-xs text-gray-500">{category.id}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleSave}
              disabled={selectedIds.length === 0 || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جارٍ الحفظ...
                </>
              ) : (
                `حفظ الاهتمامات (${selectedIds.length})`
              )}
            </button>
            
            <button
              onClick={() => window.location.href = '/profile'}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              الذهاب للملف الشخصي
            </button>
          </div>

          {userInterests.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">الاهتمامات المحفوظة:</h3>
              <div className="space-y-2">
                {userInterests.map((interest, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>التصنيف: {interest.category_id}</span>
                    <span className="text-gray-500">• المصدر: {interest.source}</span>
                    <span className="text-gray-500">• تاريخ الحفظ: {new Date(interest.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 